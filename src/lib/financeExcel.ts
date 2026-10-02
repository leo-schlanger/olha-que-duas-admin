// Relatório financeiro em Excel (exceljs, carregado só quando se exporta).
//
// Livro de caixa numa só folha, como pedido pela gerência: só o dinheiro que
// realmente entrou e saiu (incluindo a divisão pela equipa), por ordem de data,
// com o saldo linha a linha. Previsões e contas por fazer ficam de fora; o que
// ainda está por receber aparece à parte, no fim, só como lembrete.
import type { Worksheet, Workbook, Cell, Fill, Borders } from 'exceljs';
import {
  formatDate,
  isOverdue,
  periodLabel,
  periodRange,
  type FinanceData,
  type Period,
} from './finance';
import { addDays, lisbonToday } from './scheduleDates';

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
type ColType = 'text' | 'eur' | 'date';

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

function styleHeaderCell(c: Cell) {
  c.font = { name: FONT, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  c.fill = fill(BRAND);
  c.alignment = { vertical: 'middle', wrapText: true };
  c.border = boxBorder;
}

// ---- Relatório ---------------------------------------------------------------
/** Uma linha do livro de caixa: dinheiro que entrou ou saiu de facto. */
interface CashLine {
  date: string;
  what: string;
  in: number | null;
  out: number | null;
}

/** Constrói o relatório e devolve o ficheiro .xlsx (usado no browser e no envio mensal). */
export async function buildFinanceWorkbook(data: FinanceData, period: Period): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import('exceljs');
  const wb: Workbook = new ExcelJS.Workbook();
  wb.creator = 'Olha que Duas — Painel Admin';
  wb.created = new Date();

  const label = period.type === 'year' ? period.value : cap(periodLabel(period));
  const { from, to } = periodRange(period);
  const today = lisbonToday();
  const clientName = (id: string | null) => data.clients.find((c) => c.id === id)?.name ?? '';
  const memberName = (id: string) => data.members.find((m) => m.id === id)?.name ?? 'membro';
  const whatOf = (description: string, clientId: string | null) => {
    const c = clientName(clientId);
    return c && !description.includes(c) ? `${description} — ${c}` : description;
  };

  // Todo o dinheiro que mexeu: movimentos pagos + transferências à equipa.
  const lines: CashLine[] = [
    ...data.transactions
      .filter((t) => t.status === 'paid')
      .map((t) => ({
        date: t.tx_date,
        what: whatOf(t.description, t.client_id),
        in: t.kind === 'income' ? t.amount : null,
        out: t.kind === 'expense' ? t.amount : null,
      })),
    ...data.payouts.map((p) => ({
      date: p.paid_at,
      what: `Divisão pela equipa — ${memberName(p.member_id)}`,
      in: null,
      out: p.amount,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date) || (a.in ? -1 : 1));
  const before = lines.filter((l) => l.date < from);
  const opening = Math.round(before.reduce((s, l) => s + (l.in ?? 0) - (l.out ?? 0), 0) * 100) / 100;
  const rows = lines.filter((l) => l.date >= from && l.date <= to);
  const totalIn = rows.reduce((s, l) => s + (l.in ?? 0), 0);
  const totalOut = rows.reduce((s, l) => s + (l.out ?? 0), 0);

  const ws = wb.addWorksheet('Caixa', { properties: { tabColor: { argb: BRAND } } });
  setupSheet(ws, [13, 46, 15, 15, 15], false, `Livro de caixa — ${label}`);
  let r = titleBlock(ws, 5, `Olha que Duas — Caixa de ${label}`,
    `${formatDate(from)} a ${formatDate(to)}  ·  Gerado em ${formatDate(today)}`);

  // --- Três números grandes
  const big: [string, number, string][] = [
    ['Entrou', totalIn, GREEN],
    ['Saiu', totalOut, RED],
    ['Ficou em caixa', opening + totalIn - totalOut, INK],
  ];
  const labelsRow = ws.getRow(r);
  const valuesRow = ws.getRow(r + 1);
  big.forEach(([name, value, color], i) => {
    const col = i + 3; // C, D, E — por cima das colunas Entrou / Saiu / Saldo
    const l = labelsRow.getCell(col);
    l.value = name;
    l.font = { name: FONT, size: 10, bold: true, color: { argb: MUTED } };
    l.alignment = alignFor('eur');
    const v = valuesRow.getCell(col);
    v.value = Math.round(value * 100) / 100;
    v.numFmt = EUR;
    v.font = { name: FONT, size: 14, bold: true, color: { argb: color } };
    v.alignment = alignFor('eur');
    v.fill = fill(SOFT);
    v.border = boxBorder;
  });
  valuesRow.height = 26;
  r += 3;

  // --- O livro de caixa
  const header = r;
  ['Data', 'O quê', 'Entrou', 'Saiu', 'Saldo'].forEach((h, i) => {
    const c = ws.getRow(r).getCell(i + 1);
    c.value = h;
    styleHeaderCell(c);
    c.alignment = { ...alignFor(i === 0 ? 'date' : i === 1 ? 'text' : 'eur') };
  });
  ws.getRow(r).height = 22;
  r += 1;

  const put = (cells: (string | number | Date | null | { formula: string })[], opts: { muted?: boolean; zebra?: boolean } = {}) => {
    const row = ws.getRow(r);
    cells.forEach((value, i) => {
      const c = row.getCell(i + 1);
      c.value = value;
      c.border = boxBorder;
      c.alignment = alignFor(i === 0 ? 'date' : i === 1 ? 'text' : 'eur', i === 1);
      c.font = { name: FONT, size: 11, italic: opts.muted, color: { argb: opts.muted ? MUTED : i === 2 ? GREEN : i === 3 ? RED : INK } };
      if (i === 0) c.numFmt = DATE;
      if (i >= 2) c.numFmt = EUR;
      if (opts.zebra) c.fill = fill(ZEBRA);
    });
    row.getCell(5).font = { name: FONT, size: 11, bold: true, color: { argb: INK } };
    row.height = 20;
    return r++;
  };

  // Saldo que vinha de trás (só aparece se houver).
  let prev: number | null = null;
  if (opening !== 0) prev = put([xlDate(from), 'Saldo que vinha do período anterior', null, null, opening], { muted: true });
  rows.forEach((l, idx) => {
    const saldo = prev === null ? `N(C${r})-N(D${r})` : `E${prev}+N(C${r})-N(D${r})`;
    prev = put([xlDate(l.date), l.what, l.in, l.out, { formula: saldo }], { zebra: idx % 2 === 1 });
  });
  if (rows.length === 0) {
    ws.mergeCells(`A${r}:E${r}`);
    const c = ws.getCell(`A${r}`);
    c.value = 'Não entrou nem saiu dinheiro neste período.';
    c.font = { name: FONT, size: 11, italic: true, color: { argb: MUTED } };
    r += 1;
  }

  // Totais (por fórmula, para conferir).
  if (rows.length) {
    const first = header + 1;
    const last = r - 1;
    const row = ws.getRow(r);
    row.getCell(2).value = 'Total';
    row.getCell(3).value = { formula: `SUM(C${first}:C${last})` };
    row.getCell(4).value = { formula: `SUM(D${first}:D${last})` };
    row.getCell(5).value = { formula: `E${last}` };
    for (let i = 1; i <= 5; i++) {
      const c = row.getCell(i);
      c.font = { name: FONT, size: 11, bold: true, color: { argb: INK } };
      c.fill = fill(SOFT);
      c.border = { top: { style: 'medium', color: { argb: INK } }, bottom: thin, left: thin, right: thin };
      c.alignment = alignFor(i <= 2 ? 'text' : 'eur');
      if (i >= 3) c.numFmt = EUR;
    }
    row.height = 22;
    r += 1;
  }
  ws.views = [{ state: 'frozen', ySplit: header, showGridLines: false }];
  r += 1;

  // --- Quanto recebeu cada um (das transferências deste período)
  const paidByMember = data.members
    .map((m) => ({
      name: m.name,
      total: data.payouts
        .filter((p) => p.member_id === m.id && p.paid_at >= from && p.paid_at <= to)
        .reduce((s, p) => s + p.amount, 0),
    }))
    .filter((x) => x.total > 0);
  if (paidByMember.length) {
    r = sectionTitle(ws, r, 5, 'Divisão pela equipa neste período');
    paidByMember.forEach((x) => {
      const row = ws.getRow(r);
      ws.mergeCells(`A${r}:B${r}`);
      row.getCell(1).value = x.name;
      row.getCell(1).font = { name: FONT, size: 11, color: { argb: INK } };
      row.getCell(1).alignment = alignFor('text');
      row.getCell(4).value = x.total;
      row.getCell(4).numFmt = EUR;
      row.getCell(4).font = { name: FONT, size: 11, color: { argb: INK } };
      row.getCell(4).alignment = alignFor('eur');
      r += 1;
    });
    r += 1;
  }

  // --- Lembrete: o que ainda está por receber (não conta no caixa)
  const toReceive = data.transactions
    .filter((t) => t.kind === 'income' && t.status === 'pending' && t.tx_date <= addDays(today, 31))
    .sort((a, b) => a.tx_date.localeCompare(b.tx_date));
  if (toReceive.length) {
    r = sectionTitle(ws, r, 5, 'Ainda por receber (não conta no caixa)');
    toReceive.forEach((t) => {
      const row = ws.getRow(r);
      row.getCell(1).value = xlDate(t.tx_date);
      row.getCell(1).numFmt = DATE;
      row.getCell(1).alignment = alignFor('date');
      row.getCell(2).value = whatOf(t.description, t.client_id) + (isOverdue(t) ? ' (em atraso)' : '');
      row.getCell(3).value = t.amount;
      row.getCell(3).numFmt = EUR;
      row.getCell(3).alignment = alignFor('eur');
      for (const i of [1, 2, 3]) {
        row.getCell(i).font = { name: FONT, size: 10, italic: true, color: { argb: isOverdue(t) ? RED : MUTED } };
      }
      r += 1;
    });
  }

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
