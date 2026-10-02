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

/** Mês/ano anterior ou seguinte. */
export function shiftPeriod(p: Period, delta: number): Period {
  if (p.type === 'year') return { type: 'year', value: String(Number(p.value) + delta) };
  const [y, m] = p.value.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return { type: 'month', value: d.toISOString().slice(0, 7) };
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

/** Próximo pagamento ainda por confirmar: o previsto mais antigo ou, se não houver, a próxima ocorrência. */
export function nextDue(r: FinRecurrence, txs: FinTransaction[]): string {
  const pending = txs
    .filter((t) => t.recurrence_id === r.id && t.status === 'pending')
    .map((t) => t.tx_date)
    .sort();
  return pending[0] ?? nextOccurrence(r);
}

export const WEEKDAY_PLURAL = ['domingos', 'segundas-feiras', 'terças-feiras', 'quartas-feiras', 'quintas-feiras',
  'sextas-feiras', 'sábados'];

/** Dia da semana (0 = domingo) de "YYYY-MM-DD", sem depender do fuso. */
const weekdayOfDate = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

/**
 * Quando se repete, em linguagem corrente: "todas as quintas-feiras",
 * "todos os meses, ao dia 26", "todos os anos, a 12/03".
 */
export function repeatLabel(frequency: FinFrequency, startDate: string): string {
  const [, m, d] = startDate.split('-');
  if (frequency === 'weekly') {
    const wd = weekdayOfDate(startDate);
    return `${wd === 0 || wd === 6 ? 'todos os' : 'todas as'} ${WEEKDAY_PLURAL[wd]}`;
  }
  if (frequency === 'monthly') return `todos os meses, ao dia ${Number(d)}`;
  return `todos os anos, a ${d}/${m}`;
}

/** Frase completa: "150,00 € todas as quintas-feiras, desde 08/10/2026". */
export function recurrenceSentence(r: Pick<FinRecurrence, 'amount' | 'frequency' | 'start_date' | 'end_date'>): string {
  const until = r.end_date ? ` até ${formatDate(r.end_date)}` : '';
  return `${formatEUR(r.amount)} ${repeatLabel(r.frequency, r.start_date)}, desde ${formatDate(r.start_date)}${until}`;
}

/**
 * Quanto uma repetição vale num mês ("YYYY-MM"), contando as datas reais do
 * calendário (ex.: 150 € às quintas = 4 ou 5 vezes, conforme o mês).
 */
export function amountInMonth(r: FinRecurrence, month: string): number {
  const { from, to } = periodRange({ type: 'month', value: month });
  let total = 0;
  for (let n = 0; n < 5000; n++) {
    const d = occurrenceDate(r.start_date, r.frequency, n);
    if (d > to || (r.end_date && d > r.end_date)) break;
    if (d >= from) total += r.amount;
  }
  return round2(total);
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

/** Partes iguais para `n` pessoas (ex.: 3 → 33,33%); a soma fica dentro da tolerância de sharesComplete. */
export const equalShare = (n: number) => (n > 0 ? Math.floor((10000 / n)) / 100 : 0);

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
  // Valores arredondados ao cêntimo; o resto do arredondamento (ex.: 29 € / 3)
  // vai para o último membro, para a soma bater certo com o valor a distribuir.
  const dues = active.map((m) => round2((distributable * m.share_percent) / (sharesComplete(totalPercent) ? totalPercent : 100)));
  if (sharesComplete(totalPercent) && dues.length > 0) {
    const diff = round2(round2(distributable) - dues.reduce((a, d) => a + d, 0));
    dues[dues.length - 1] = round2(dues[dues.length - 1] + diff);
  }
  // Com 3 × 33,33% (= 99,99%) divide pelo total, para não sobrar um cêntimo.
  const shares = active.map((member, i) => {
    const due = dues[i];
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
// Dados completos (painel e Excel — ver financeExcel.ts)
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

// -------------------------------------------------------------
// Previsão de caixa
// -------------------------------------------------------------
export interface ForecastMonth {
  /** "YYYY-MM" */
  month: string;
  income: number;
  expense: number;
  balance: number;
  /** Quanto disto ainda não foi recebido/pago (previstos + projeções). */
  pendingIncome: number;
  pendingExpense: number;
}

/**
 * Próximos `months` meses (a começar no atual): o que já está lançado (pago ou
 * previsto) mais as ocorrências futuras das recorrências que ainda não foram
 * geradas como lançamento.
 */
export function forecastMonths(data: FinanceData, months = 3, today = lisbonToday()): ForecastMonth[] {
  const start = { type: 'month', value: today.slice(0, 7) } as Period;
  return Array.from({ length: months }, (_, i) => {
    const p = shiftPeriod(start, i);
    const { from, to } = periodRange(p);
    let income = 0;
    let expense = 0;
    let pendingIncome = 0;
    let pendingExpense = 0;
    const add = (kind: string, amount: number, pending: boolean) => {
      if (kind === 'income') {
        income += amount;
        if (pending) pendingIncome += amount;
      } else {
        expense += amount;
        if (pending) pendingExpense += amount;
      }
    };

    for (const t of data.transactions) {
      if (t.tx_date >= from && t.tx_date <= to) add(t.kind, t.amount, t.status === 'pending');
    }
    for (const r of data.recurrences.filter((x) => x.is_active)) {
      // Ocorrências ainda não geradas: n >= generated_count.
      for (let n = r.generated_count; n < r.generated_count + 60; n++) {
        const d = occurrenceDate(r.start_date, r.frequency, n);
        if (d > to || (r.end_date && d > r.end_date)) break;
        if (d >= from) add(r.kind, r.amount, true);
      }
    }
    return {
      month: p.value,
      income: round2(income),
      expense: round2(expense),
      balance: round2(income - expense),
      pendingIncome: round2(pendingIncome),
      pendingExpense: round2(pendingExpense),
    };
  });
}
