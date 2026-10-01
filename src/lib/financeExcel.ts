// Relatório financeiro em Excel (exceljs, carregado só quando se exporta).
//
// Folhas: Resumo · Receitas · Despesas · Por receber e pagar · Distribuição ·
// Clientes · Recorrentes. Pensado para ser lido por quem não usa o painel:
// tudo em português, valores explicados, totais por fórmula e pronto a imprimir.
import type { Worksheet, Workbook, Cell, Fill, Borders } from 'exceljs';
import {
  FREQUENCY_LABEL,
  computeDistribution,
  computeSummary,
  formatDate,
  inPeriod,
  isOverdue,
  monthlyEquivalent,
  nextOccurrence,
  periodLabel,
  periodRange,
  shiftPeriod,
  type FinanceData,
  type Period,
} from './finance';
import { lisbonToday } from './scheduleDates';
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

const EUR = '#,##0.00 "€";[Red]-#,##0.00 "€";"—"';
const EUR_SIGNED = '+#,##0.00 "€";[Red]-#,##0.00 "€";"—"';
const PCT = '0.0%;[Red]-0.0%;"—"';
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
        : 'Vence hoje';

const statusColor = (t: FinTransaction) =>
  t.status === 'paid' ? GREEN : isOverdue(t) ? RED : undefined;

export async function exportFinanceExcel(data: FinanceData, period: Period): Promise<void> {
  const { default: ExcelJS } = await import('exceljs');
  const wb: Workbook = new ExcelJS.Workbook();
  wb.creator = 'Olha que Duas — Painel Admin';
  wb.created = new Date();

  const label = cap(periodLabel(period));
  const prev = shiftPeriod(period, -1);
  const prevLabel = cap(periodLabel(prev));
  const { from, to } = periodRange(period);
  const today = lisbonToday();
  const subtitle = `Período: ${label} (${formatDate(from)} a ${formatDate(to)})  ·  Gerado em ${formatDate(today)}`;

  const catName = (id: string | null) => data.categories.find((c) => c.id === id)?.name ?? 'Sem categoria';
  const clientName = (id: string | null) => data.clients.find((c) => c.id === id)?.name ?? '';
  const summary = computeSummary(data.transactions, data.categories, data.clients, period);
  const prevSummary = computeSummary(data.transactions, data.categories, data.clients, prev);
  const dist = computeDistribution(data.transactions, data.members, data.payouts, data.reservePercent, period);
  const prevDist = computeDistribution(data.transactions, data.members, data.payouts, data.reservePercent, prev);
  const inP = data.transactions
    .filter((t) => inPeriod(t.tx_date, period))
    .sort((a, b) => a.tx_date.localeCompare(b.tx_date));

  // =========================== RESUMO ===========================
  const ws = wb.addWorksheet('Resumo', { properties: { tabColor: { argb: BRAND } } });
  setupSheet(ws, [38, 17, 17, 15, 52], false, `Relatório financeiro — ${label}`);
  let r = titleBlock(ws, 5, 'Olha que Duas — Relatório Financeiro', subtitle);

  // --- Indicadores principais
  r = sectionTitle(ws, r, 5, 'Indicadores do período',
    'Só contam os movimentos já pagos/recebidos. Os valores previstos que ainda não entraram aparecem mais abaixo, em "Situação dos pagamentos".');
  const kpiHeader = ws.getRow(r);
  ['Indicador', label, prevLabel, 'Variação', 'O que significa'].forEach((h, i) => {
    const c = kpiHeader.getCell(i + 1);
    c.value = h;
    styleHeaderCell(c);
    c.alignment = { ...alignFor(i >= 1 && i <= 3 ? 'eur' : 'text'), wrapText: true };
  });
  kpiHeader.height = 22;
  r += 1;
  const kpis: [string, number, number, string, boolean?][] = [
    ['Receitas recebidas', summary.income, prevSummary.income, 'Dinheiro que entrou de clientes e outras fontes.'],
    ['Despesas pagas', summary.expense, prevSummary.expense, 'Custos pagos: ferramentas, servidores, marketing, etc.'],
    ['Resultado', summary.result, prevSummary.result, 'Receitas recebidas menos despesas pagas.', true],
    [`Reserva (${data.reservePercent}%)`, dist.reserve, prevDist.reserve, 'Parte do resultado guardada para caixa e impostos.'],
    ['A distribuir pela equipa', dist.distributable, prevDist.distributable, 'Resultado depois da reserva, a dividir pelas percentagens.', true],
  ];
  kpis.forEach(([name, cur, before, explain, strong], idx) => {
    const row = ws.getRow(r);
    row.getCell(1).value = name;
    row.getCell(2).value = cur;
    row.getCell(3).value = before;
    row.getCell(4).value = before !== 0 ? { formula: `IF(C${r}=0,"",(B${r}-C${r})/ABS(C${r}))` } : null;
    row.getCell(5).value = explain;
    for (let i = 1; i <= 5; i++) {
      const c = row.getCell(i);
      c.border = boxBorder;
      c.font = { name: FONT, size: i === 5 ? 9 : 11, bold: !!strong && i <= 2, color: { argb: i === 5 ? MUTED : INK } };
      c.alignment = alignFor(i >= 2 && i <= 4 ? 'eur' : 'text', i === 5);
      if (idx % 2 === 1) c.fill = fill(ZEBRA);
    }
    row.getCell(2).numFmt = EUR;
    row.getCell(3).numFmt = EUR;
    row.getCell(4).numFmt = PCT;
    if (strong) row.getCell(2).font = { name: FONT, size: 12, bold: true, color: { argb: cur >= 0 ? GREEN : RED } };
    row.height = 24;
    r += 1;
  });
  r += 1;

  // --- Situação dos pagamentos
  r = sectionTitle(ws, r, 5, 'Situação dos pagamentos');
  const pendingRows: [string, number, string][] = [
    ['Receitas ainda por receber (no período)', summary.pendingIncome, 'Previstas para este período e ainda não marcadas como recebidas.'],
    ['Despesas ainda por pagar (no período)', summary.pendingExpense, 'Previstas para este período e ainda não pagas.'],
    ['Receitas em atraso (todas as datas)', summary.overdueIncome, 'Pagamentos de clientes cuja data já passou. Ver folha "Por receber e pagar".'],
  ];
  pendingRows.forEach(([name, value, explain], idx) => {
    const row = ws.getRow(r);
    row.getCell(1).value = name;
    row.getCell(2).value = value;
    ws.mergeCells(`C${r}:E${r}`);
    row.getCell(3).value = explain;
    for (const i of [1, 2, 3, 4, 5]) {
      const c = row.getCell(i);
      c.border = boxBorder;
      c.font = { name: FONT, size: i >= 3 ? 9 : 11, color: { argb: i >= 3 ? MUTED : INK } };
      c.alignment = alignFor(i === 2 ? 'eur' : 'text', i >= 3);
      if (idx % 2 === 1) c.fill = fill(ZEBRA);
    }
    row.getCell(2).numFmt = EUR;
    if (idx === 2 && value > 0) row.getCell(2).font = { name: FONT, size: 11, bold: true, color: { argb: RED } };
    row.height = 24;
    r += 1;
  });
  r += 1;

  // --- Distribuição
  r = sectionTitle(ws, r, 5, 'Distribuição pela equipa',
    'Valor a distribuir × percentagem de cada membro. "Saldo" é o que ainda falta pagar a cada um neste período.');
  r = table(ws, r, [
    { header: 'Membro', width: 0, value: (s) => s.member.name },
    { header: 'Percentagem', width: 0, type: 'pct', value: (s) => s.member.share_percent / 100 },
    { header: 'A receber', width: 0, type: 'eur', total: true, value: (s) => s.due },
    { header: 'Já pago', width: 0, type: 'eur', total: true, value: (s) => s.paid },
    { header: 'Saldo por pagar', width: 0, type: 'eur', total: true, value: (s) => s.balance,
      color: (s) => (s.balance > 0 ? RED : undefined) },
  ], dist.shares, { emptyText: 'Sem membros registados no separador Equipa.' });

  // --- Receitas / despesas por categoria e por cliente
  const share = (total: number, part: number) => (total ? part / total : 0);
  r = sectionTitle(ws, r, 5, 'Receitas por categoria');
  r = table(ws, r, [
    { header: 'Categoria', width: 0, value: (c) => c.name },
    { header: 'Valor', width: 0, type: 'eur', total: true, value: (c) => c.total },
    { header: '% do total', width: 0, type: 'pct', value: (c) => share(summary.income, c.total) },
  ], summary.incomeByCategory, { emptyText: 'Sem receitas recebidas neste período.' });

  r = sectionTitle(ws, r, 5, 'Despesas por categoria');
  r = table(ws, r, [
    { header: 'Categoria', width: 0, value: (c) => c.name },
    { header: 'Valor', width: 0, type: 'eur', total: true, value: (c) => c.total },
    { header: '% do total', width: 0, type: 'pct', value: (c) => share(summary.expense, c.total) },
  ], summary.expenseByCategory, { emptyText: 'Sem despesas pagas neste período.' });

  r = sectionTitle(ws, r, 5, 'Receitas por cliente');
  r = table(ws, r, [
    { header: 'Cliente', width: 0, value: (c) => c.name },
    { header: 'Valor', width: 0, type: 'eur', total: true, value: (c) => c.total },
    { header: '% do total', width: 0, type: 'pct', value: (c) => share(summary.income, c.total) },
  ], summary.incomeByClient, { emptyText: 'Sem receitas recebidas neste período.' });

  // --- Como ler
  r = sectionTitle(ws, r, 5, 'Como ler este relatório');
  const notes = [
    'Valores em euros. Um movimento conta no período pela sua data (data prevista ou data do movimento).',
    'Os indicadores só incluem o que está marcado como Pago. Previstos e atrasos estão na folha "Por receber e pagar".',
    `A reserva (${data.reservePercent}%) só é aplicada a meses com resultado positivo; meses com prejuízo não geram distribuição.`,
    'As folhas Receitas e Despesas têm filtros no cabeçalho; os totais por fórmula acompanham os filtros.',
    'Comprovativos e faturas estão guardados no painel admin (separador Finanças), em cada lançamento.',
  ];
  notes.forEach((n) => {
    ws.mergeCells(`A${r}:E${r}`);
    const c = ws.getCell(`A${r}`);
    c.value = `•  ${n}`;
    c.font = { name: FONT, size: 9, color: { argb: MUTED } };
    c.alignment = { wrapText: true, vertical: 'top' };
    ws.getRow(r).height = 18;
    r += 1;
  });

  // ======================= RECEITAS / DESPESAS =======================
  const movementSheet = (name: string, kind: 'income' | 'expense') => {
    const s = wb.addWorksheet(name, { properties: { tabColor: { argb: kind === 'income' ? GREEN : RED } } });
    const cols: Column<FinTransaction>[] = [
      { header: 'Data', width: 12, type: 'date', value: (t) => xlDate(t.tx_date) },
      { header: 'Descrição', width: 34, value: (t) => t.description },
      { header: kind === 'income' ? 'Cliente' : 'Cliente / fornecedor', width: 22, value: (t) => clientName(t.client_id) },
      { header: 'Categoria', width: 24, value: (t) => catName(t.category_id) },
      { header: 'Estado', width: 12, value: statusLabel, color: statusColor },
      { header: 'Pago em', width: 12, type: 'date', value: (t) => xlDate(t.paid_at) },
      { header: 'Método', width: 14, value: (t) => t.method ?? '' },
      { header: 'Fatura / recibo', width: 16, value: (t) => t.invoice_ref ?? '' },
      { header: 'Comprovativo', width: 15, value: (t) => (t.receipt_path ? 'Anexado' : '—') },
      { header: 'Valor', width: 14, type: 'eur', total: true, value: (t) => t.amount },
      { header: 'Notas', width: 36, value: (t) => t.notes ?? '' },
    ];
    setupSheet(s, cols.map((c) => c.width), true, `${name} — ${label}`);
    let row = titleBlock(s, cols.length, `${name} — ${label}`,
      `${subtitle}  ·  Inclui pagos e previstos; o total considera apenas as linhas visíveis (use os filtros).`);
    const list = inP.filter((t) => t.kind === kind);
    row = table(s, row, cols, list, { totalLabel: 'Total (linhas visíveis)', filter: true,
      emptyText: kind === 'income' ? 'Sem receitas neste período.' : 'Sem despesas neste período.' });
    if (list.length) {
      const paidTotal = list.filter((t) => t.status === 'paid').reduce((a, t) => a + t.amount, 0);
      const pendTotal = list.filter((t) => t.status === 'pending').reduce((a, t) => a + t.amount, 0);
      for (const [lbl, v] of [['Dos quais pagos', paidTotal], ['Dos quais por pagar / previstos', pendTotal]] as const) {
        const rr = s.getRow(row);
        rr.getCell(9).value = lbl;
        rr.getCell(9).font = { name: FONT, size: 10, italic: true, color: { argb: MUTED } };
        rr.getCell(9).alignment = { horizontal: 'right' };
        rr.getCell(10).value = v;
        rr.getCell(10).numFmt = EUR;
        rr.getCell(10).font = { name: FONT, size: 10, bold: true, color: { argb: INK } };
        row += 1;
      }
    }
  };
  movementSheet('Receitas', 'income');
  movementSheet('Despesas', 'expense');

  // ======================= POR RECEBER E PAGAR =======================
  {
    const s = wb.addWorksheet('Por receber e pagar', { properties: { tabColor: { argb: 'FFD97706' } } });
    const pending = data.transactions
      .filter((t) => t.status === 'pending')
      .sort((a, b) => a.tx_date.localeCompare(b.tx_date));
    const daysLate = (t: FinTransaction) =>
      Math.max(0, Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${t.tx_date}T00:00:00Z`)) / 86_400_000));
    const cols: Column<FinTransaction>[] = [
      { header: 'Data prevista', width: 13, type: 'date', value: (t) => xlDate(t.tx_date) },
      { header: 'Tipo', width: 11, value: (t) => (t.kind === 'income' ? 'A receber' : 'A pagar'),
        color: (t) => (t.kind === 'income' ? GREEN : RED) },
      { header: 'Descrição', width: 34, value: (t) => t.description },
      { header: 'Cliente', width: 22, value: (t) => clientName(t.client_id) },
      { header: 'Estado', width: 12, value: statusLabel, color: statusColor },
      { header: 'Dias de atraso', width: 13, type: 'int', value: (t) => (isOverdue(t) ? daysLate(t) : null) },
      { header: 'Valor', width: 14, type: 'eur', value: (t) => t.amount },
    ];
    setupSheet(s, cols.map((c) => c.width), true, 'Por receber e pagar');
    let row = titleBlock(s, cols.length, 'Por receber e pagar',
      `Situação em ${formatDate(today)} (todos os previstos ainda não pagos, de qualquer período).`);
    row = table(s, row, cols, pending, { filter: true, emptyText: 'Nada pendente. Tudo em dia.' });
    const totalIn = pending.filter((t) => t.kind === 'income').reduce((a, t) => a + t.amount, 0);
    const totalOut = pending.filter((t) => t.kind === 'expense').reduce((a, t) => a + t.amount, 0);
    for (const [lbl, v, color] of [
      ['Total a receber', totalIn, GREEN],
      ['Total a pagar', totalOut, RED],
    ] as const) {
      const rr = s.getRow(row);
      rr.getCell(6).value = lbl;
      rr.getCell(6).alignment = { horizontal: 'right' };
      rr.getCell(6).font = { name: FONT, size: 10, bold: true, color: { argb: INK } };
      rr.getCell(7).value = v;
      rr.getCell(7).numFmt = EUR;
      rr.getCell(7).font = { name: FONT, size: 11, bold: true, color: { argb: color } };
      row += 1;
    }
  }

  // ========================== DISTRIBUIÇÃO ==========================
  {
    const s = wb.addWorksheet('Distribuição');
    setupSheet(s, [30, 14, 16, 16, 16, 34], false, `Distribuição — ${label}`);
    let row = titleBlock(s, 6, `Distribuição pela equipa — ${label}`, subtitle);
    row = sectionTitle(s, row, 6, 'Cálculo');
    const calc: [string, number, string][] = [
      ['Resultado do período', dist.result, 'Receitas recebidas − despesas pagas'],
      [`Reserva (${data.reservePercent}%)`, -dist.reserve, 'Fica na conta para caixa / impostos'],
      ['Valor a distribuir', dist.distributable, 'Dividido pelas percentagens abaixo'],
    ];
    calc.forEach(([lbl, v, note], idx) => {
      const rr = s.getRow(row);
      rr.getCell(1).value = lbl;
      rr.getCell(2).value = v;
      s.mergeCells(`C${row}:F${row}`);
      rr.getCell(3).value = note;
      for (let i = 1; i <= 6; i++) {
        const c = rr.getCell(i);
        c.border = boxBorder;
        c.font = { name: FONT, size: i >= 3 ? 9 : 11, bold: idx === 2 && i <= 2, color: { argb: i >= 3 ? MUTED : INK } };
        c.alignment = alignFor(i === 2 ? 'eur' : 'text');
        if (idx === 2) c.fill = fill(SOFT);
      }
      rr.getCell(2).numFmt = EUR;
      rr.height = 22;
      row += 1;
    });
    row += 1;
    row = sectionTitle(s, row, 6, 'Por membro');
    row = table(s, row, [
      { header: 'Membro', width: 0, value: (x) => x.member.name },
      { header: 'Percentagem', width: 0, type: 'pct', value: (x) => x.member.share_percent / 100 },
      { header: 'A receber', width: 0, type: 'eur', total: true, value: (x) => x.due },
      { header: 'Já pago', width: 0, type: 'eur', total: true, value: (x) => x.paid },
      { header: 'Saldo por pagar', width: 0, type: 'eur', total: true, value: (x) => x.balance,
        color: (x) => (x.balance > 0 ? RED : undefined) },
      { header: 'Email', width: 0, value: (x) => x.member.email ?? '' },
    ], dist.shares, { emptyText: 'Sem membros registados.' });

    const payouts = data.payouts
      .filter((p) => inPeriod(p.period, period))
      .sort((a, b) => a.paid_at.localeCompare(b.paid_at));
    row = sectionTitle(s, row, 6, 'Pagamentos feitos à equipa');
    table(s, row, [
      { header: 'Membro', width: 0, value: (p) => data.members.find((m) => m.id === p.member_id)?.name ?? '' },
      { header: 'Pago em', width: 0, type: 'date', value: (p) => xlDate(p.paid_at) },
      { header: 'Referente a', width: 0, value: (p) => periodLabel({ type: 'month', value: p.period.slice(0, 7) }) },
      { header: 'Valor', width: 0, type: 'eur', total: true, value: (p) => p.amount },
      { header: 'Notas', width: 0, value: (p) => p.notes ?? '' },
    ], payouts, { emptyText: 'Ainda não foram registados pagamentos à equipa neste período.' });
  }

  // ============================ CLIENTES ============================
  {
    const s = wb.addWorksheet('Clientes');
    const cols = [
      { header: 'Cliente', width: 26, value: (c: (typeof data.clients)[number]) => c.name },
      { header: 'NIF', width: 13, value: (c: (typeof data.clients)[number]) => c.nif ?? '' },
      { header: 'Email', width: 28, value: (c: (typeof data.clients)[number]) => c.email ?? '' },
      { header: 'Telefone', width: 15, value: (c: (typeof data.clients)[number]) => c.phone ?? '' },
      { header: 'Ativo', width: 8, value: (c: (typeof data.clients)[number]) => (c.is_active ? 'Sim' : 'Não') },
      { header: `Recebido (${label})`, width: 25, type: 'eur' as ColType, total: true,
        value: (c: (typeof data.clients)[number]) => summary.incomeByClient.find((x) => x.id === c.id)?.total ?? 0 },
      { header: 'Recorrente / mês', width: 17, type: 'eur' as ColType, total: true,
        value: (c: (typeof data.clients)[number]) =>
          Math.round(data.recurrences
            .filter((rc) => rc.is_active && rc.kind === 'income' && rc.client_id === c.id)
            .reduce((a, rc) => a + monthlyEquivalent(rc), 0) * 100) / 100 },
      { header: 'Notas', width: 36, value: (c: (typeof data.clients)[number]) => c.notes ?? '' },
    ];
    setupSheet(s, cols.map((c) => c.width), true, 'Clientes');
    const row = titleBlock(s, cols.length, 'Clientes', subtitle);
    table(s, row, cols, data.clients, { filter: true, emptyText: 'Sem clientes registados.' });
  }

  // =========================== RECORRENTES ===========================
  {
    const s = wb.addWorksheet('Recorrentes');
    type R = (typeof data.recurrences)[number];
    const cols: Column<R>[] = [
      { header: 'Tipo', width: 10, value: (x) => (x.kind === 'income' ? 'Receita' : 'Despesa'),
        color: (x) => (x.kind === 'income' ? GREEN : RED) },
      { header: 'Descrição', width: 34, value: (x) => x.description },
      { header: 'Cliente', width: 22, value: (x) => clientName(x.client_id) },
      { header: 'Categoria', width: 24, value: (x) => catName(x.category_id) },
      { header: 'Frequência', width: 12, value: (x) => FREQUENCY_LABEL[x.frequency] },
      { header: 'Valor', width: 13, type: 'eur', value: (x) => x.amount },
      { header: 'Equivalente / mês', width: 17, type: 'eur', value: (x) => Math.round(monthlyEquivalent(x) * 100) / 100 },
      { header: 'Próxima data', width: 13, type: 'date', value: (x) => (x.is_active ? xlDate(nextOccurrence(x)) : null) },
      { header: 'Estado', width: 10, value: (x) => (x.is_active ? 'Ativa' : 'Pausada') },
    ];
    setupSheet(s, cols.map((c) => c.width), true, 'Recorrentes');
    let row = titleBlock(s, cols.length, 'Receitas e custos recorrentes',
      'Previsão mensal: semanal × 52 / 12; anual / 12. Os lançamentos previstos são criados automaticamente 7 dias antes.');
    row = table(s, row, cols, data.recurrences, { filter: true, emptyText: 'Sem recorrências registadas.' });
    const active = data.recurrences.filter((x) => x.is_active);
    const mIn = active.filter((x) => x.kind === 'income').reduce((a, x) => a + monthlyEquivalent(x), 0);
    const mOut = active.filter((x) => x.kind === 'expense').reduce((a, x) => a + monthlyEquivalent(x), 0);
    for (const [lbl, v] of [
      ['Receitas recorrentes / mês', mIn],
      ['Custos fixos / mês', -mOut],
      ['Saldo recorrente / mês', mIn - mOut],
    ] as const) {
      const rr = s.getRow(row);
      rr.getCell(6).value = lbl;
      rr.getCell(6).alignment = { horizontal: 'right' };
      rr.getCell(6).font = { name: FONT, size: 10, bold: true, color: { argb: INK } };
      rr.getCell(7).value = Math.round(v * 100) / 100;
      rr.getCell(7).numFmt = EUR_SIGNED;
      rr.getCell(7).font = { name: FONT, size: 11, bold: true, color: { argb: v >= 0 ? GREEN : RED } };
      row += 1;
    }
  }

  // Abre no Resumo
  wb.views = [{ x: 0, y: 0, width: 20000, height: 12000, firstSheet: 0, activeTab: 0, visibility: 'visible' }];

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Olha que Duas - Relatorio financeiro ${period.value}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
