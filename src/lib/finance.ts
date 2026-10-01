// Cálculos das finanças (resumo, distribuição) e exportação para Excel.
// Datas sempre "YYYY-MM-DD" em hora de Lisboa.
import type {
  FinCategory,
  FinClient,
  FinFrequency,
  FinMember,
  FinPayout,
  FinRecurrence,
  FinTransaction,
} from '../types/finance';
import { lisbonToday } from './scheduleDates';

export const FREQUENCY_LABEL: Record<FinFrequency, string> = {
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
};

export const PAYMENT_METHODS = ['MB WAY', 'Transferência', 'Numerário', 'Cartão', 'Débito direto', 'PayPal', 'Outro'];

const eur = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
export const formatEUR = (value: number) => eur.format(value);

/** Converte "12,50" ou "12.50" em número; NaN se inválido. */
export const parseAmount = (value: string) => Number(value.replace(/\s/g, '').replace(',', '.'));

/** "YYYY-MM-DD" → "30/09/2026". */
export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  const [y, m, d] = date.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// -------------------------------------------------------------
// Período
// -------------------------------------------------------------
export interface Period {
  /** 'month' → "YYYY-MM"; 'year' → "YYYY" */
  type: 'month' | 'year';
  value: string;
}

export function currentPeriod(): Period {
  return { type: 'month', value: lisbonToday().slice(0, 7) };
}

export function periodRange(p: Period): { from: string; to: string } {
  if (p.type === 'year') return { from: `${p.value}-01-01`, to: `${p.value}-12-31` };
  const [y, m] = p.value.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${p.value}-01`, to: `${p.value}-${String(last).padStart(2, '0')}` };
}

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto',
  'setembro', 'outubro', 'novembro', 'dezembro'];

export function periodLabel(p: Period): string {
  if (p.type === 'year') return `Ano ${p.value}`;
  const [y, m] = p.value.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Meses ("YYYY-MM") cobertos pelo período. */
export function periodMonths(p: Period): string[] {
  if (p.type === 'month') return [p.value];
  return Array.from({ length: 12 }, (_, i) => `${p.value}-${String(i + 1).padStart(2, '0')}`);
}

export const inPeriod = (date: string, p: Period) => {
  const { from, to } = periodRange(p);
  return date >= from && date <= to;
};

export const isOverdue = (t: FinTransaction, today = lisbonToday()) =>
  t.status === 'pending' && t.tx_date < today;

// -------------------------------------------------------------
// Recorrências
// -------------------------------------------------------------
/** Data da n-ésima ocorrência (igual à função SQL: start + n * período). */
export function occurrenceDate(start: string, frequency: FinFrequency, n: number): string {
  const [y, m, d] = start.split('-').map(Number);
  let date: Date;
  if (frequency === 'weekly') {
    date = new Date(Date.UTC(y, m - 1, d + 7 * n));
  } else {
    const months = frequency === 'monthly' ? n : 12 * n;
    const targetMonth = m - 1 + months;
    const lastDay = new Date(Date.UTC(y, targetMonth + 1, 0)).getUTCDate();
    date = new Date(Date.UTC(y, targetMonth, Math.min(d, lastDay)));
  }
  return date.toISOString().slice(0, 10);
}

export const nextOccurrence = (r: FinRecurrence) =>
  occurrenceDate(r.start_date, r.frequency, r.generated_count);

/** Valor médio por mês de uma recorrência. */
export function monthlyEquivalent(r: FinRecurrence): number {
  if (r.frequency === 'weekly') return (r.amount * 52) / 12;
  if (r.frequency === 'yearly') return r.amount / 12;
  return r.amount;
}

// -------------------------------------------------------------
// Resumo e distribuição
// -------------------------------------------------------------
export interface CategoryTotal {
  id: string | null;
  name: string;
  color: string;
  total: number;
}

export interface Summary {
  income: number;
  expense: number;
  result: number;
  pendingIncome: number;
  pendingExpense: number;
  overdueIncome: number;
  incomeByCategory: CategoryTotal[];
  expenseByCategory: CategoryTotal[];
  incomeByClient: { id: string | null; name: string; total: number }[];
}

function groupByCategory(txs: FinTransaction[], categories: FinCategory[]): CategoryTotal[] {
  const map = new Map<string | null, number>();
  for (const t of txs) map.set(t.category_id, (map.get(t.category_id) ?? 0) + t.amount);
  return [...map.entries()]
    .map(([id, total]) => {
      const c = categories.find((x) => x.id === id);
      return { id, name: c?.name ?? 'Sem categoria', color: c?.color ?? '#9ca3af', total: round2(total) };
    })
    .sort((a, b) => b.total - a.total);
}

/** Só conta o que está pago; os pendentes aparecem à parte. */
export function computeSummary(
  txs: FinTransaction[],
  categories: FinCategory[],
  clients: FinClient[],
  period: Period
): Summary {
  const inP = txs.filter((t) => inPeriod(t.tx_date, period));
  const paid = inP.filter((t) => t.status === 'paid');
  const pending = inP.filter((t) => t.status === 'pending');
  const sum = (list: FinTransaction[]) => round2(list.reduce((s, t) => s + t.amount, 0));

  const paidIncome = paid.filter((t) => t.kind === 'income');
  const paidExpense = paid.filter((t) => t.kind === 'expense');
  const income = sum(paidIncome);
  const expense = sum(paidExpense);

  const clientMap = new Map<string | null, number>();
  for (const t of paidIncome) clientMap.set(t.client_id, (clientMap.get(t.client_id) ?? 0) + t.amount);

  return {
    income,
    expense,
    result: round2(income - expense),
    pendingIncome: sum(pending.filter((t) => t.kind === 'income')),
    pendingExpense: sum(pending.filter((t) => t.kind === 'expense')),
    overdueIncome: sum(txs.filter((t) => t.kind === 'income' && isOverdue(t))),
    incomeByCategory: groupByCategory(paidIncome, categories),
    expenseByCategory: groupByCategory(paidExpense, categories),
    incomeByClient: [...clientMap.entries()]
      .map(([id, total]) => ({
        id,
        name: clients.find((c) => c.id === id)?.name ?? 'Sem cliente',
        total: round2(total),
      }))
      .sort((a, b) => b.total - a.total),
  };
}

/** Percentagens que somam 100% com arredondamento (ex.: 3 × 33,33%). */
export const sharesComplete = (totalPercent: number) => Math.abs(totalPercent - 100) <= 0.1;

export interface MemberShare {
  member: FinMember;
  due: number;
  paid: number;
  balance: number;
}

export interface Distribution {
  result: number;
  reserve: number;
  distributable: number;
  totalPercent: number;
  shares: MemberShare[];
}

/**
 * Resultado (pago) − reserva = valor a distribuir, dividido pelas percentagens.
 * Só se distribui resultado positivo. Num ano, é a soma mês a mês (um mês
 * negativo não "come" o lucro dos outros meses já distribuídos).
 */
export function computeDistribution(
  txs: FinTransaction[],
  members: FinMember[],
  payouts: FinPayout[],
  reservePercent: number,
  period: Period
): Distribution {
  const active = members.filter((m) => m.is_active);
  const totalPercent = round2(active.reduce((s, m) => s + m.share_percent, 0));
  let result = 0;
  let reserve = 0;
  let distributable = 0;

  for (const month of periodMonths(period)) {
    const p: Period = { type: 'month', value: month };
    const paid = txs.filter((t) => t.status === 'paid' && inPeriod(t.tx_date, p));
    const r = paid.reduce((s, t) => s + (t.kind === 'income' ? t.amount : -t.amount), 0);
    result += r;
    if (r > 0) {
      const res = (r * reservePercent) / 100;
      reserve += res;
      distributable += r - res;
    }
  }

  const periodPayouts = payouts.filter((p) => inPeriod(p.period, period));
  // Com 3 × 33,33% (= 99,99%) divide pelo total, para não sobrar um cêntimo.
  const base = sharesComplete(totalPercent) ? totalPercent : 100;
  const shares = active.map((member) => {
    const due = round2((distributable * member.share_percent) / base);
    const paid = round2(
      periodPayouts.filter((p) => p.member_id === member.id).reduce((s, p) => s + p.amount, 0)
    );
    return { member, due, paid, balance: round2(due - paid) };
  });

  return {
    result: round2(result),
    reserve: round2(reserve),
    distributable: round2(distributable),
    totalPercent,
    shares,
  };
}

// -------------------------------------------------------------
// Excel
// -------------------------------------------------------------
export interface FinanceData {
  transactions: FinTransaction[];
  categories: FinCategory[];
  clients: FinClient[];
  recurrences: FinRecurrence[];
  members: FinMember[];
  payouts: FinPayout[];
  reservePercent: number;
}

const EUR_FMT = '#,##0.00 "€"';
const HEADER_FILL = 'FFC0392B';

export async function exportFinanceExcel(data: FinanceData, period: Period): Promise<void> {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Olha que Duas — Painel Admin';
  wb.created = new Date();

  const catName = (id: string | null) => data.categories.find((c) => c.id === id)?.name ?? '';
  const clientName = (id: string | null) => data.clients.find((c) => c.id === id)?.name ?? '';
  const summary = computeSummary(data.transactions, data.categories, data.clients, period);
  const dist = computeDistribution(data.transactions, data.members, data.payouts, data.reservePercent, period);
  const inP = data.transactions
    .filter((t) => inPeriod(t.tx_date, period))
    .sort((a, b) => a.tx_date.localeCompare(b.tx_date));

  const styleHeader = (ws: import('exceljs').Worksheet) => {
    const row = ws.getRow(1);
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
    ws.views = [{ state: 'frozen', ySplit: 1 }];
  };

  // --- Resumo
  const ws = wb.addWorksheet('Resumo');
  ws.columns = [{ width: 34 }, { width: 18 }];
  ws.addRow([`Olha que Duas — Resumo financeiro (${periodLabel(period)})`]).font = { bold: true, size: 14 };
  ws.addRow([`Gerado em ${formatDate(lisbonToday())}`]).font = { italic: true, color: { argb: 'FF6B7280' } };
  ws.addRow([]);
  const kpis: [string, number][] = [
    ['Receitas recebidas', summary.income],
    ['Despesas pagas', summary.expense],
    ['Resultado', summary.result],
    [`Reserva (${data.reservePercent}%)`, dist.reserve],
    ['A distribuir pela equipa', dist.distributable],
    ['Receitas pendentes no período', summary.pendingIncome],
    ['Despesas pendentes no período', summary.pendingExpense],
    ['Receitas em atraso (total)', summary.overdueIncome],
  ];
  for (const [label, value] of kpis) {
    const r = ws.addRow([label, value]);
    r.getCell(2).numFmt = EUR_FMT;
    if (label === 'Resultado') r.font = { bold: true };
  }
  const section = (title: string, rows: { name: string; total: number }[]) => {
    ws.addRow([]);
    ws.addRow([title]).font = { bold: true };
    for (const c of rows) ws.addRow([c.name, c.total]).getCell(2).numFmt = EUR_FMT;
    if (rows.length === 0) ws.addRow(['—']);
  };
  section('Receitas por categoria', summary.incomeByCategory);
  section('Despesas por categoria', summary.expenseByCategory);
  section('Receitas por cliente', summary.incomeByClient);

  // --- Receitas / Despesas
  const txSheet = (name: string, kind: 'income' | 'expense') => {
    const s = wb.addWorksheet(name);
    s.columns = [
      { header: 'Data', key: 'date', width: 12 },
      { header: 'Descrição', key: 'desc', width: 36 },
      { header: kind === 'income' ? 'Cliente' : 'Fornecedor / cliente', key: 'client', width: 24 },
      { header: 'Categoria', key: 'cat', width: 24 },
      { header: 'Estado', key: 'status', width: 11 },
      { header: 'Método', key: 'method', width: 14 },
      { header: 'Fatura / recibo', key: 'invoice', width: 18 },
      { header: 'Valor', key: 'amount', width: 14, style: { numFmt: EUR_FMT } },
      { header: 'Notas', key: 'notes', width: 30 },
    ];
    const list = inP.filter((t) => t.kind === kind);
    for (const t of list) {
      s.addRow({
        date: formatDate(t.tx_date),
        desc: t.description,
        client: clientName(t.client_id),
        cat: catName(t.category_id),
        status: t.status === 'paid' ? 'Pago' : isOverdue(t) ? 'Em atraso' : 'Pendente',
        method: t.method ?? '',
        invoice: t.invoice_ref ?? '',
        amount: t.amount,
        notes: t.notes ?? '',
      });
    }
    if (list.length > 0) {
      const last = list.length + 1;
      const total = s.addRow({ desc: 'Total pago', amount: { formula: `SUMIF(E2:E${last},"Pago",H2:H${last})` } });
      total.font = { bold: true };
    }
    styleHeader(s);
  };
  txSheet('Receitas', 'income');
  txSheet('Despesas', 'expense');

  // --- Clientes
  const cs = wb.addWorksheet('Clientes');
  cs.columns = [
    { header: 'Nome', key: 'name', width: 28 },
    { header: 'NIF', key: 'nif', width: 14 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Telefone', key: 'phone', width: 16 },
    { header: 'Ativo', key: 'active', width: 8 },
    { header: 'Recebido no período', key: 'period', width: 20, style: { numFmt: EUR_FMT } },
    { header: 'Recorrente / mês', key: 'monthly', width: 18, style: { numFmt: EUR_FMT } },
    { header: 'Notas', key: 'notes', width: 30 },
  ];
  for (const c of data.clients) {
    cs.addRow({
      name: c.name,
      nif: c.nif ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      active: c.is_active ? 'Sim' : 'Não',
      period: summary.incomeByClient.find((x) => x.id === c.id)?.total ?? 0,
      monthly: round2(
        data.recurrences
          .filter((r) => r.is_active && r.kind === 'income' && r.client_id === c.id)
          .reduce((s, r) => s + monthlyEquivalent(r), 0)
      ),
      notes: c.notes ?? '',
    });
  }
  styleHeader(cs);

  // --- Recorrentes
  const rs = wb.addWorksheet('Recorrentes');
  rs.columns = [
    { header: 'Tipo', key: 'kind', width: 10 },
    { header: 'Descrição', key: 'desc', width: 34 },
    { header: 'Cliente', key: 'client', width: 22 },
    { header: 'Categoria', key: 'cat', width: 24 },
    { header: 'Frequência', key: 'freq', width: 12 },
    { header: 'Valor', key: 'amount', width: 12, style: { numFmt: EUR_FMT } },
    { header: 'Equivalente / mês', key: 'monthly', width: 18, style: { numFmt: EUR_FMT } },
    { header: 'Próxima', key: 'next', width: 12 },
    { header: 'Ativo', key: 'active', width: 8 },
  ];
  for (const r of data.recurrences) {
    rs.addRow({
      kind: r.kind === 'income' ? 'Receita' : 'Despesa',
      desc: r.description,
      client: clientName(r.client_id),
      cat: catName(r.category_id),
      freq: FREQUENCY_LABEL[r.frequency],
      amount: r.amount,
      monthly: round2(monthlyEquivalent(r)),
      next: formatDate(nextOccurrence(r)),
      active: r.is_active ? 'Sim' : 'Não',
    });
  }
  styleHeader(rs);

  // --- Distribuição
  const ds = wb.addWorksheet('Distribuição');
  ds.columns = [
    { header: 'Membro', key: 'name', width: 26 },
    { header: '%', key: 'pct', width: 8 },
    { header: 'Valor a receber', key: 'due', width: 16, style: { numFmt: EUR_FMT } },
    { header: 'Já pago', key: 'paid', width: 14, style: { numFmt: EUR_FMT } },
    { header: 'Saldo', key: 'balance', width: 14, style: { numFmt: EUR_FMT } },
  ];
  for (const s of dist.shares) {
    ds.addRow({ name: s.member.name, pct: s.member.share_percent, due: s.due, paid: s.paid, balance: s.balance });
  }
  styleHeader(ds);
  ds.addRow([]);
  for (const [label, value] of [
    ['Resultado do período', dist.result],
    [`Reserva (${data.reservePercent}%)`, dist.reserve],
    ['Total a distribuir', dist.distributable],
  ] as [string, number][]) {
    const r = ds.addRow([label, null, value]);
    r.getCell(3).numFmt = EUR_FMT;
    r.font = { bold: true };
  }
  if (!sharesComplete(dist.totalPercent)) {
    ds.addRow([`Atenção: as percentagens somam ${dist.totalPercent}% (deviam somar 100%).`]).font = {
      color: { argb: 'FFDC2626' },
    };
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `financas-olhaqueduas-${period.value}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
