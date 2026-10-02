// Relatório financeiro em Excel (exceljs, carregado só quando se exporta).
//
// Três folhas, pensadas para quem não é da área financeira:
//   Resumo      — frases simples, a conta do mês passo a passo, quanto cabe a
//                 cada um, o que vem a seguir e os acordos/fixos (cabe numa página);
//   Extrato     — só o que já foi pago, como no banco: Entrou / Saiu / Saldo;
//   Por receber e pagar — o que ainda não aconteceu ou está em atraso.
import type { Worksheet, Workbook, Cell, Fill, Borders } from 'exceljs';
import {
  computeDistribution,
  computeSummary,
  formatDate,
  formatEUR,
  inPeriod,
  isOverdue,
  nextDue,
  occurrenceDate,
  sharesComplete,
  periodLabel,
  periodRange,
  repeatLabel,
  type FinanceData,
  type Period,
} from './finance';
import { addDays, lisbonToday } from './scheduleDates';
import type { FinTransaction } from '../types/finance';

// ---- Identidade visual -------------------------------------------------------
const BRAND = 'FFC0392B'; // vermelho Olha que Duas
const BRAND_DARK = 'FF962D22';
const INK = 'FF3F3A33';
const MUTED = 'FF7A7268';
const ZEBRA = 'FFF8F4EE';
const SOFT = 'FFF3ECE2';
const LINE = 'FFE3DACD';
const GREEN = 'FF15803D';
const RED = 'FFB91C1C';
const FONT = 'Calibri';

const EUR = '#,##0.00 "€";[Red]-#,##0.00 "€";0.00 "€"';
const EUR_SIGNED = '+#,##0.00 "€";[Red]-#,##0.00 "€";"—"';
const PCT = '0.00%;[Red]-0.00%;0.00%';
const DATE = 'dd/mm/yyyy';

const fill = (argb: string): Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const thin = { style: 'thin' as const, color: { argb: LINE } };
const boxBorder: Partial<Borders> = { top: thin, bottom: thin, left: thin, right: thin };

/** "YYYY-MM-DD" → Date (UTC) para o Excel guardar como data real. */
const xlDate = (iso: string | null | undefined) => {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const colLetter = (n: number) => {
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

// ---- Blocos reutilizáveis ----------------------------------------------------
type ColType = 'text' | 'eur' | 'eurSigned' | 'date' | 'pct' | 'int';

interface Column<T> {
  header: string;
  width: number;
  type?: ColType;
  value: (row: T) => string | number | Date | null;
  /** Soma no fim da tabela (fórmula SUBTOTAL, respeita os filtros). */
  total?: boolean;
  /** Cor do texto por linha (ex.: estado em atraso a vermelho). */
  color?: (row: T) => string | undefined;
}

const NUMFMT: Partial<Record<ColType, string>> = {
  eur: EUR,
  eurSigned: EUR_SIGNED,
  date: DATE,
  pct: PCT,
  int: '0',
};

function setupSheet(ws: Worksheet, widths: number[], landscape: boolean, title: string) {
  ws.columns = widths.map((width) => ({ width }));
  ws.properties.defaultRowHeight = 18;
  ws.views = [{ showGridLines: false }];
  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: landscape ? 'landscape' : 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
  };
  ws.headerFooter.oddFooter = `&L&8Olha que Duas — ${title}&R&8Página &P de &N`;
}

/** Faixa de título da folha (linhas 1–3). Devolve a próxima linha livre. */
function titleBlock(ws: Worksheet, lastCol: number, title: string, subtitle: string): number {
  const end = colLetter(lastCol);
  ws.mergeCells(`A1:${end}1`);
  const t = ws.getCell('A1');
  t.value = title;
  t.font = { name: FONT, size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  t.fill = fill(BRAND);
  t.alignment = { vertical: 'middle', indent: 1 };
  ws.getRow(1).height = 32;

  ws.mergeCells(`A2:${end}2`);
  const s = ws.getCell('A2');
  s.value = subtitle;
  s.font = { name: FONT, size: 10, italic: true, color: { argb: 'FFFFFFFF' } };
  s.fill = fill(BRAND_DARK);
  s.alignment = { vertical: 'middle', indent: 1 };
  ws.getRow(2).height = 20;
  return 4;
}

/** Título de secção (texto a vermelho com linha por baixo). */
function sectionTitle(ws: Worksheet, row: number, lastCol: number, text: string, note?: string): number {
  const end = colLetter(lastCol);
  ws.mergeCells(`A${row}:${end}${row}`);
  const c = ws.getCell(`A${row}`);
  c.value = text.toUpperCase();
  c.font = { name: FONT, size: 11, bold: true, color: { argb: BRAND } };
  c.border = { bottom: { style: 'medium', color: { argb: BRAND } } };
  ws.getRow(row).height = 22;
  if (note) {
    ws.mergeCells(`A${row + 1}:${end}${row + 1}`);
    const n = ws.getCell(`A${row + 1}`);
    n.value = note;
    n.font = { name: FONT, size: 9, italic: true, color: { argb: MUTED } };
    n.alignment = { wrapText: true, vertical: 'top' };
    ws.getRow(row + 1).height = 28;
    return row + 2;
  }
  return row + 1;
}

/** Alinhamento por tipo: texto à esquerda, datas ao centro, números à direita (com margem). */
function alignFor(type: ColType | undefined, wrap = false): Partial<Cell['alignment']> {
  if (type === 'date') return { horizontal: 'center', vertical: 'middle' };
  if (type && type !== 'text') return { horizontal: 'right', vertical: 'middle', indent: 1 };
  return { horizontal: 'left', vertical: 'middle', indent: 1, wrapText: wrap };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const eurText = (n: number) => formatEUR(n).replace(/\u00a0/g, ' ');

function styleHeaderCell(c: Cell) {
  c.font = { name: FONT, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  c.fill = fill(BRAND);
  c.alignment = { vertical: 'middle', wrapText: true };
  c.border = boxBorder;
}

/**
 * Tabela com cabeçalho, linhas alternadas e linha de totais.
 * Devolve a linha seguinte à tabela.
 */
function table<T>(
  ws: Worksheet,
  startRow: number,
  columns: Column<T>[],
  rows: T[],
  opts: { totalLabel?: string; emptyText?: string; filter?: boolean } = {}
): number {
  const header = ws.getRow(startRow);
  columns.forEach((col, i) => {
    const c = header.getCell(i + 1);
    c.value = col.header;
    styleHeaderCell(c);
    c.alignment = { ...alignFor(col.type), wrapText: true };
  });
  header.height = 22;

  if (rows.length === 0) {
    const r = startRow + 1;
    ws.mergeCells(`A${r}:${colLetter(columns.length)}${r}`);
    const c = ws.getCell(`A${r}`);
    c.value = opts.emptyText ?? 'Sem registos neste período.';
    c.font = { name: FONT, size: 10, italic: true, color: { argb: MUTED } };
    c.border = boxBorder;
    return r + 2;
  }

  rows.forEach((row, idx) => {
    const r = ws.getRow(startRow + 1 + idx);
    columns.forEach((col, i) => {
      const c = r.getCell(i + 1);
      c.value = col.value(row);
      c.font = { name: FONT, size: 10, color: { argb: col.color?.(row) ?? INK } };
      c.border = boxBorder;
      c.alignment = alignFor(col.type, true);
      if (idx % 2 === 1) c.fill = fill(ZEBRA);
      const fmt = col.type ? NUMFMT[col.type] : undefined;
      if (fmt) c.numFmt = fmt;
    });
  });

  const first = startRow + 1;
  const last = startRow + rows.length;
  let next = last + 1;

  if (columns.some((c) => c.total)) {
    const tr = ws.getRow(next);
    columns.forEach((col, i) => {
      const c = tr.getCell(i + 1);
      const L = colLetter(i + 1);
      if (i === 0) c.value = opts.totalLabel ?? 'Total';
      else if (col.total) c.value = { formula: `SUBTOTAL(9,${L}${first}:${L}${last})` };
      c.alignment = i === 0 ? alignFor('text') : alignFor(col.type);
      c.font = { name: FONT, size: 10, bold: true, color: { argb: INK } };
      c.fill = fill(SOFT);
      c.border = { top: { style: 'medium', color: { argb: INK } }, bottom: thin, left: thin, right: thin };
      const fmt = col.type ? NUMFMT[col.type] : undefined;
      if (fmt && col.total) c.numFmt = fmt;
    });
    tr.height = 20;
    next += 1;
  }

  if (opts.filter) {
    ws.autoFilter = { from: { row: startRow, column: 1 }, to: { row: last, column: columns.length } };
    ws.views = [{ state: 'frozen', ySplit: startRow, showGridLines: false }];
  }
  return next + 1;
}

// ---- Relatório ---------------------------------------------------------------
const statusLabel = (t: FinTransaction) =>
  t.status === 'paid'
    ? 'Pago'
    : isOverdue(t)
      ? 'Em atraso'
      : t.tx_date > lisbonToday()
        ? 'Previsto'
        : 'Hoje';

const statusColor = (t: FinTransaction) =>
  t.status === 'paid' ? GREEN : isOverdue(t) ? RED : undefined;

/** Constrói o relatório e devolve o ficheiro .xlsx (usado no browser e no envio mensal). */
export async function buildFinanceWorkbook(data: FinanceData, period: Period): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import('exceljs');
  const wb: Workbook = new ExcelJS.Workbook();
  wb.creator = 'Olha que Duas — Painel Admin';
  wb.created = new Date();

  const label = cap(periodLabel(period));
  const { from, to } = periodRange(period);
  const today = lisbonToday();
  const subtitle = `${label} (${formatDate(from)} a ${formatDate(to)})  ·  Gerado em ${formatDate(today)}`;

  const catName = (id: string | null) => data.categories.find((c) => c.id === id)?.name ?? '';
  const clientName = (id: string | null) => data.clients.find((c) => c.id === id)?.name ?? '';
  const whatOf = (description: string, clientId: string | null) => {
    const c = clientName(clientId);
    return c && !description.includes(c) ? `${description} — ${c}` : description;
  };
  const summary = computeSummary(data.transactions, data.categories, data.clients, period);
  const dist = computeDistribution(data.transactions, data.members, data.payouts, data.reservePercent, period);
  const paidInPeriod = data.transactions
    .filter((t) => t.status === 'paid' && inPeriod(t.tx_date, period))
    .sort((a, b) => a.tx_date.localeCompare(b.tx_date) || (a.kind === 'income' ? -1 : 1));

  // =========================== RESUMO ===========================
  const ws = wb.addWorksheet('Resumo', { properties: { tabColor: { argb: BRAND } } });
  setupSheet(ws, [40, 18, 18, 18, 30], false, `Relatório financeiro — ${label}`);
  let r = titleBlock(ws, 5, 'Olha que Duas — Relatório Financeiro', subtitle);

  /** Linha de texto ocupando a largura toda. */
  const line = (text: string, opts: { size?: number; bold?: boolean; color?: string; bg?: string; height?: number } = {}) => {
    ws.mergeCells(`A${r}:E${r}`);
    const c = ws.getCell(`A${r}`);
    c.value = text;
    c.font = { name: FONT, size: opts.size ?? 11, bold: opts.bold, color: { argb: opts.color ?? INK } };
    c.alignment = { wrapText: true, vertical: 'middle', indent: 1 };
    if (opts.bg) c.fill = fill(opts.bg);
    ws.getRow(r).height = opts.height ?? 22;
    r += 1;
  };

  // --- Em poucas palavras
  const overdueAll = data.transactions.filter((t) => t.kind === 'income' && isOverdue(t));
  const overdueSum = overdueAll.reduce((a, t) => a + t.amount, 0);
  r = sectionTitle(ws, r, 5, 'Em poucas palavras');
  line(
    `Em ${period.type === 'month' ? periodLabel(period).replace(' ', ' de ') : `${period.value}`} entraram ${eurText(summary.income)} e saíram ${eurText(summary.expense)}. ` +
      (summary.result >= 0 ? `Sobraram ${eurText(summary.result)}.` : `Faltaram ${eurText(-summary.result)} (prejuízo).`),
    { size: 12, bold: true, bg: SOFT, height: 28 }
  );
  line(
    dist.distributable > 0 && dist.shares.length
      ? `Para dividir pela equipa: ${eurText(dist.distributable)}.`
      : 'Neste período não há nada para dividir pela equipa.',
    { size: 12, bg: SOFT, height: 26 }
  );
  line(
    overdueAll.length
      ? `Atenção: ${overdueAll.length} pagamento(s) de clientes em atraso, no total de ${eurText(overdueSum)}.`
      : 'Nenhum pagamento de cliente em atraso.',
    { size: 12, bg: SOFT, color: overdueAll.length ? RED : INK, height: 26 }
  );
  r += 1;

  // --- A conta, passo a passo (com fórmulas, para se poder conferir)
  r = sectionTitle(ws, r, 5, 'A conta do período, passo a passo',
    'Só entra na conta o que já foi pago ou recebido. O que ainda está previsto aparece mais abaixo.');
  const step = (name: string, value: number | { formula: string }, note: string, opts: { strong?: boolean; color?: string } = {}) => {
    const row = ws.getRow(r);
    row.getCell(1).value = name;
    row.getCell(2).value = value;
    ws.mergeCells(`C${r}:E${r}`);
    row.getCell(3).value = note;
    for (let i = 1; i <= 5; i++) {
      const c = row.getCell(i);
      c.border = boxBorder;
      if (opts.strong) c.fill = fill(SOFT);
    }
    row.getCell(1).font = { name: FONT, size: 11, bold: opts.strong, color: { argb: INK } };
    row.getCell(1).alignment = alignFor('text');
    row.getCell(2).font = { name: FONT, size: opts.strong ? 12 : 11, bold: opts.strong, color: { argb: opts.color ?? INK } };
    row.getCell(2).numFmt = EUR;
    row.getCell(2).alignment = alignFor('eur');
    row.getCell(3).font = { name: FONT, size: 9, color: { argb: MUTED } };
    row.getCell(3).alignment = alignFor('text', true);
    row.height = 22;
    return r++;
  };
  const rIn = step('Entrou', summary.income, 'Tudo o que foi recebido (ver folha Extrato).', { color: GREEN });
  const rOut = step('−  Saiu', summary.expense, 'Tudo o que foi pago (ver folha Extrato).', { color: RED });
  step(summary.result >= 0 ? '=  Sobrou' : '=  Faltou', { formula: `B${rIn}-B${rOut}` }, 'Entrou menos saiu.', {
    strong: true, color: summary.result >= 0 ? GREEN : RED,
  });
  if (data.reservePercent > 0) {
    step(`−  Guardado para impostos (${data.reservePercent}%)`, dist.reserve, 'Fica na conta antes de dividir.');
  }
  const rDiv = step('=  Para dividir pela equipa', dist.distributable,
    period.type === 'year'
      ? 'Soma da divisão de cada mês; os meses com prejuízo não descontam os outros.'
      : summary.result > 0 ? 'Este valor é dividido pelas partes de cada membro.' : 'Mês com prejuízo: não há divisão.',
    { strong: true });
  r += 1;

  // --- Quanto cabe a cada um
  const n = dist.shares.length;
  const complete = sharesComplete(dist.totalPercent);
  const allEqual = n > 0 && dist.shares.every((x) => x.member.share_percent === dist.shares[0].member.share_percent);
  r = sectionTitle(ws, r, 5, 'Quanto cabe a cada um',
    allEqual && n > 1
      ? `Partes iguais: ${eurText(dist.distributable)} ÷ ${n} pessoas = ${eurText(dist.distributable / n)} cada` +
          (dist.shares.some((x) => x.due !== dist.shares[0].due)
            ? '. Como a divisão não dá certa ao cêntimo, o último fica com o cêntimo de diferença para o total bater certo.'
            : '.')
      : 'Cada um recebe a sua parte do valor para dividir. "Falta pagar" é o que ainda não foi transferido.');
  const tableStart = r;
  r = table(ws, r, [
    { header: 'Membro', width: 0, value: (x) => x.member.name },
    // Parte normalizada: 3 × 33,33% aparece como 33,33% e o total dá 100%.
    { header: 'Parte', width: 0, type: 'pct', total: true,
      value: (x) => (complete ? x.member.share_percent / dist.totalPercent : x.member.share_percent / 100) },
    { header: 'Cabe-lhe', width: 0, type: 'eur', total: true, value: (x) => x.due },
    { header: 'Já recebeu', width: 0, type: 'eur', total: true, value: (x) => x.paid },
    { header: 'Falta pagar', width: 0, type: 'eur', total: true, value: (x) => x.balance,
      color: (x) => (x.balance > 0 ? RED : GREEN) },
  ], dist.shares, { emptyText: 'Sem membros registados no separador Equipa.' });
  if (n > 0) {
    // Conferir: o total de "Cabe-lhe" tem de ser igual ao valor para dividir.
    ws.getCell(`C${tableStart + n + 1}`).note = `Deve ser igual a "Para dividir" (célula B${rDiv}).`;
  }

  // --- O que vem a seguir (próximos 30 dias + atrasos)
  const horizon = addDays(today, 30);
  type Next = { date: string; what: string; amount: number; kind: 'income' | 'expense'; late: boolean };
  const upcoming: Next[] = data.transactions
    .filter((t) => t.status === 'pending' && t.tx_date <= horizon)
    .map((t) => ({ date: t.tx_date, what: whatOf(t.description, t.client_id), amount: t.amount, kind: t.kind, late: isOverdue(t) }));
  for (const rc of data.recurrences.filter((x) => x.is_active)) {
    for (let i = rc.generated_count; i < rc.generated_count + 60; i++) {
      const d = occurrenceDate(rc.start_date, rc.frequency, i);
      if (d > horizon || (rc.end_date && d > rc.end_date)) break;
      upcoming.push({ date: d, what: whatOf(rc.description, rc.client_id), amount: rc.amount, kind: rc.kind, late: false });
    }
  }
  upcoming.sort((a, b) => a.date.localeCompare(b.date));
  r = sectionTitle(ws, r, 5, `O que vem a seguir (até ${formatDate(horizon)})`,
    'Ainda não entra na conta acima. Quando acontecer, confirma-se no painel e passa para o Extrato.');
  r = table(ws, r, [
    { header: 'O quê', width: 0, value: (x) => x.what },
    { header: 'Data', width: 0, type: 'date', value: (x) => xlDate(x.date) },
    { header: 'Vai entrar', width: 0, type: 'eur', total: true, value: (x) => (x.kind === 'income' ? x.amount : null), color: () => GREEN },
    { header: 'Vai sair', width: 0, type: 'eur', total: true, value: (x) => (x.kind === 'expense' ? x.amount : null), color: () => RED },
    { header: 'Situação', width: 0, value: (x) => (x.late ? 'Em atraso' : 'Previsto'), color: (x) => (x.late ? RED : MUTED) },
  ], upcoming, { emptyText: 'Nada previsto para os próximos 30 dias.' });

  // --- Acordos e custos fixos
  const activeRec = data.recurrences.filter((x) => x.is_active);
  r = sectionTitle(ws, r, 5, 'Acordos e custos fixos em vigor');
  r = table(ws, r, [
    { header: 'O quê', width: 0, value: (x) => whatOf(x.description, x.client_id) },
    { header: 'Valor', width: 0, type: 'eur', value: (x) => x.amount, color: (x) => (x.kind === 'income' ? GREEN : RED) },
    { header: 'Entra / sai', width: 0, value: (x) => (x.kind === 'income' ? 'Entra' : 'Sai'), color: (x) => (x.kind === 'income' ? GREEN : RED) },
    { header: 'Próxima', width: 0, type: 'date', value: (x) => xlDate(nextDue(x, data.transactions)) },
    { header: 'Quando', width: 0, value: (x) => cap(repeatLabel(x.frequency, x.start_date)) },
  ], activeRec, { emptyText: 'Sem acordos nem custos fixos.' });

  line('Valores em euros. Comprovativos e faturas estão no painel admin (Finanças), em cada movimento.', { size: 9, color: MUTED, height: 18 });

  // =========================== EXTRATO ===========================
  {
    const s = wb.addWorksheet('Extrato', { properties: { tabColor: { argb: GREEN } } });
    const cols: Column<FinTransaction>[] = [
      { header: 'Data', width: 12, type: 'date', value: (t) => xlDate(t.tx_date) },
      { header: 'O quê', width: 38, value: (t) => whatOf(t.description, t.client_id) },
      { header: 'Entrou', width: 14, type: 'eur', total: true, value: (t) => (t.kind === 'income' ? t.amount : null), color: () => GREEN },
      { header: 'Saiu', width: 14, type: 'eur', total: true, value: (t) => (t.kind === 'expense' ? t.amount : null), color: () => RED },
      { header: 'Saldo do mês', width: 14, type: 'eur', value: () => null },
      { header: 'Categoria', width: 24, value: (t) => catName(t.category_id) },
      { header: 'Como', width: 13, value: (t) => t.method ?? '' },
      { header: 'Fatura / recibo', width: 16, value: (t) => t.invoice_ref ?? '' },
    ];
    setupSheet(s, cols.map((c) => c.width), true, `Extrato — ${label}`);
    let row = titleBlock(s, cols.length, `Extrato — ${label}`,
      `${subtitle}  ·  Só o que já foi pago ou recebido. "Saldo do mês" soma linha a linha, como no banco.`);
    const header = row;
    row = table(s, row, cols, paidInPeriod, { totalLabel: 'Total do período', emptyText: 'Nada pago nem recebido neste período.' });
    if (paidInPeriod.length) {
      const first = header + 1;
      const last = header + paidInPeriod.length;
      for (let i = first; i <= last; i++) {
        const c = s.getCell(`E${i}`);
        c.value = { formula: i === first ? `N(C${i})-N(D${i})` : `E${i - 1}+N(C${i})-N(D${i})` };
        c.font = { name: FONT, size: 10, bold: true, color: { argb: INK } };
      }
      const total = s.getCell(`E${last + 1}`);
      total.value = { formula: `E${last}` };
      total.numFmt = EUR;
      total.font = { name: FONT, size: 11, bold: true, color: { argb: summary.result >= 0 ? GREEN : RED } };
    }
    s.views = [{ state: 'frozen', ySplit: header, showGridLines: false }];
  }

  // ======================= POR RECEBER E PAGAR =======================
  {
    const s = wb.addWorksheet('Por receber e pagar', { properties: { tabColor: { argb: 'FFD97706' } } });
    const pending = data.transactions
      .filter((t) => t.status === 'pending')
      .sort((a, b) => a.tx_date.localeCompare(b.tx_date));
    const daysLate = (t: FinTransaction) =>
      Math.max(0, Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${t.tx_date}T00:00:00Z`)) / 86_400_000));
    const cols: Column<FinTransaction>[] = [
      { header: 'Data', width: 12, type: 'date', value: (t) => xlDate(t.tx_date) },
      { header: 'O quê', width: 40, value: (t) => whatOf(t.description, t.client_id) },
      { header: 'A receber', width: 14, type: 'eur', total: true, value: (t) => (t.kind === 'income' ? t.amount : null), color: () => GREEN },
      { header: 'A pagar', width: 14, type: 'eur', total: true, value: (t) => (t.kind === 'expense' ? t.amount : null), color: () => RED },
      { header: 'Situação', width: 14, value: statusLabel, color: statusColor },
      { header: 'Dias em atraso', width: 14, type: 'int', value: (t) => (isOverdue(t) ? daysLate(t) : null) },
    ];
    setupSheet(s, cols.map((c) => c.width), true, 'Por receber e pagar');
    const row = titleBlock(s, cols.length, 'Por receber e pagar',
      `Situação em ${formatDate(today)}: tudo o que ainda não foi pago ou recebido, de qualquer mês.`);
    table(s, row, cols, pending, { totalLabel: 'Total', emptyText: 'Nada pendente. Tudo em dia.' });
  }

  // Abre no Resumo
  wb.views = [{ x: 0, y: 0, width: 20000, height: 12000, firstSheet: 0, activeTab: 0, visibility: 'visible' }];

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

export const reportFileName = (period: Period) => `Olha que Duas - Relatorio financeiro ${period.value}.xlsx`;

/** Gera o relatório e descarrega-o no browser. */
export async function exportFinanceExcel(data: FinanceData, period: Period): Promise<void> {
  const buffer = await buildFinanceWorkbook(data, period);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = reportFileName(period);
  a.click();
  URL.revokeObjectURL(url);
}
