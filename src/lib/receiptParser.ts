// Leitura de comprovativos bancários (PDF com texto, ex.: Millennium BCP /
// MB WAY) e ligação ao lançamento previsto correspondente.
import type { FinClient, FinTransaction } from '../types/finance';

export interface ParsedReceipt {
  /** "YYYY-MM-DD" */
  date: string | null;
  amount: number | null;
  /** Quem pagou / a quem se pagou, tal como vem no comprovativo. */
  counterpart: string | null;
  method: string | null;
  /** Descrição do movimento, se existir. */
  description: string | null;
  text: string;
}

/** Extrai o texto de todas as páginas do PDF (pdf.js carregado só aqui). */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    pages.push(content.items.map((it) => ('str' in it ? it.str : '')).join(' '));
  }
  return pages.join('\n').replace(/[ \t]+/g, ' ');
}

const toIso = (d: string, m: string, y: string) => `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;

/** "1.234,56" / "1 234,56" / "75,00" → número. */
const parseEuro = (s: string) => Number(s.replace(/[\s.]/g, '').replace(',', '.'));

export function parseReceiptText(text: string): ParsedReceipt {
  const flat = text.replace(/\s+/g, ' ');

  // Data do movimento: "Data 30-09-2026" tem prioridade sobre a data de impressão.
  let date: string | null = null;
  const labelled = flat.match(/\bData(?: (?:do movimento|da opera[çc][ãa]o|valor))?:? (\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/i);
  const any = flat.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/);
  const isoAny = flat.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (labelled) date = toIso(labelled[1], labelled[2], labelled[3]);
  else if (any) date = toIso(any[1], any[2], any[3]);
  else if (isoAny) date = `${isoAny[1]}-${isoAny[2]}-${isoAny[3]}`;

  // Valor: junto a "Montante"/"Valor"/"Importância", senão o primeiro "xx,yy EUR|€".
  let amount: number | null = null;
  const NUM = '(\\d{1,3}(?:[ .]\\d{3})*,\\d{2})';
  const amountLabelled = flat.match(new RegExp(`(?:Montante|Valor|Import[âa]ncia)[^0-9]{0,25}${NUM}`, 'i'));
  const amountCurrency =
    flat.match(new RegExp(`${NUM} ?(?:EUR|€)`, 'i')) ?? flat.match(new RegExp(`(?:EUR|€) ?${NUM}`, 'i'));
  const rawAmount = amountLabelled?.[1] ?? amountCurrency?.[1];
  if (rawAmount) amount = parseEuro(rawAmount);

  // Contraparte: "MB WAY DE NOME", "TRF DE NOME", "TRANSFERENCIA DE NOME"...
  const STOP = '(?= Montante| Valor| Data| Conta| IBAN| Para | Dados|$)';
  const counterpartMatch =
    flat.match(new RegExp(`MB ?WAY (?:DE|P/|PARA) ([A-ZÀ-Ýa-zà-ý' .-]{3,60}?)${STOP}`)) ??
    flat.match(new RegExp(`(?:TRF|TRANSF(?:ER[ÊE]NCIA)?|TRANSFERENCIA) (?:DE|P/|PARA) ([A-ZÀ-Ýa-zà-ý' .-]{3,60}?)${STOP}`, 'i')) ??
    flat.match(new RegExp(`Ordenante:? ([A-ZÀ-Ýa-zà-ý' .-]{3,60}?)${STOP}`, 'i'));
  const counterpart = counterpartMatch ? counterpartMatch[1].trim().replace(/\s+/g, ' ') : null;

  const descMatch = flat.match(/Descri[çc][ãa]o do Movimento ([^]{3,80}?)(?= Montante| Valor|$)/i);
  const method = /MB ?WAY/i.test(flat)
    ? 'MB WAY'
    : /\bTRF\b|TRANSFER/i.test(flat)
      ? 'Transferência'
      : null;

  return {
    date,
    amount: amount !== null && Number.isFinite(amount) && amount > 0 ? amount : null,
    counterpart,
    method,
    description: descMatch ? descMatch[1].trim() : null,
    text,
  };
}

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();

/** O cliente cujo nome aparece (todas as palavras) na contraparte do comprovativo. */
export function matchClient(counterpart: string | null, clients: FinClient[]): FinClient | null {
  if (!counterpart) return null;
  const who = normalize(counterpart);
  const scored = clients
    .map((c) => {
      const words = normalize(c.name).split(' ').filter((w) => w.length > 1);
      const hits = words.filter((w) => who.split(' ').includes(w)).length;
      return { c, score: words.length ? hits / words.length : 0 };
    })
    .filter((x) => x.score >= 0.99 || (x.score >= 0.5 && x.c.name.split(' ').length > 1))
    .sort((a, b) => b.score - a.score);
  return scored[0]?.c ?? null;
}

const dayDiff = (a: string, b: string) =>
  Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000);

export interface ReceiptMatch {
  /** Previstos pendentes que batem com o comprovativo, do mais provável ao menos. */
  candidates: FinTransaction[];
  /** Lançamentos já pagos que parecem ser este mesmo comprovativo. */
  duplicates: FinTransaction[];
}

export function findMatches(
  receipt: Pick<ParsedReceipt, 'date' | 'amount'>,
  client: FinClient | null,
  transactions: FinTransaction[]
): ReceiptMatch {
  if (receipt.amount === null) return { candidates: [], duplicates: [] };
  const sameAmount = (t: FinTransaction) => Math.abs(t.amount - receipt.amount!) < 0.005;
  const sameClient = (t: FinTransaction) => !client || !t.client_id || t.client_id === client.id;
  const near = (t: FinTransaction, days: number) =>
    !receipt.date || Math.abs(dayDiff(t.tx_date, receipt.date)) <= days;

  const candidates = transactions
    .filter((t) => t.status === 'pending' && sameAmount(t) && sameClient(t) && near(t, 10))
    .sort((a, b) => {
      // Primeiro o do cliente certo, depois o mais próximo da data do comprovativo.
      const ca = client && a.client_id === client.id ? 0 : 1;
      const cb = client && b.client_id === client.id ? 0 : 1;
      if (ca !== cb) return ca - cb;
      if (!receipt.date) return a.tx_date.localeCompare(b.tx_date);
      return Math.abs(dayDiff(a.tx_date, receipt.date)) - Math.abs(dayDiff(b.tx_date, receipt.date));
    });

  const duplicates = transactions.filter(
    (t) =>
      t.status === 'paid' &&
      sameAmount(t) &&
      sameClient(t) &&
      !!receipt.date &&
      (t.paid_at === receipt.date || t.tx_date === receipt.date)
  );

  return { candidates, duplicates };
}
