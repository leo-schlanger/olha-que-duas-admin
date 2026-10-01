import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { EmptyState, StatusBadge } from './shared';
import {
  computeDistribution,
  computeSummary,
  formatDate,
  formatEUR,
  inPeriod,
  isOverdue,
  type CategoryTotal,
  type Period,
} from '../../lib/finance';
import { addDays, lisbonToday } from '../../lib/scheduleDates';
import type { FinanceApi } from '../../hooks/useFinance';
import type { FinTransaction } from '../../types/finance';

const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function Kpi({ label, value, tone, hint }: { label: string; value: number; tone?: 'pos' | 'neg'; hint?: string }) {
  const color = tone === 'pos' ? 'text-green-700' : tone === 'neg' ? 'text-red-600' : 'text-charcoal';
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold mt-1 tabular-nums ${color}`}>{formatEUR(value)}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function CategoryBars({ title, rows }: { title: string; rows: CategoryTotal[] }) {
  const max = Math.max(...rows.map((r) => r.total), 1);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 && <EmptyState>Sem movimentos pagos no período</EmptyState>}
        {rows.map((r) => (
          <div key={r.id ?? 'none'}>
            <div className="flex justify-between text-sm">
              <span className="text-charcoal">{r.name}</span>
              <span className="tabular-nums font-medium">{formatEUR(r.total)}</span>
            </div>
            <div className="h-2 bg-beige rounded-full mt-1 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(r.total / max) * 100}%`, background: r.color }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function FinanceOverview({
  api,
  period,
  onEdit,
}: {
  api: FinanceApi;
  period: Period;
  onEdit: (tx: FinTransaction) => void;
}) {
  const { data } = api;
  const summary = computeSummary(data.transactions, data.categories, data.clients, period);
  const dist = computeDistribution(data.transactions, data.members, data.payouts, data.reservePercent, period);
  const clientName = (id: string | null) => data.clients.find((c) => c.id === id)?.name;

  // Pendentes: tudo o que está em atraso + o que vence nos próximos 14 dias.
  const today = lisbonToday();
  const horizon = addDays(today, 14);
  const pending = data.transactions
    .filter((t) => t.status === 'pending' && (isOverdue(t) || t.tx_date <= horizon))
    .sort((a, b) => a.tx_date.localeCompare(b.tx_date));


  // Gráfico mensal do ano do período selecionado.
  const year = period.value.slice(0, 4);
  const monthly = MONTH_SHORT.map((label, i) => {
    const p: Period = { type: 'month', value: `${year}-${String(i + 1).padStart(2, '0')}` };
    const paid = data.transactions.filter((t) => t.status === 'paid' && inPeriod(t.tx_date, p));
    const sum = (k: string) => paid.filter((t) => t.kind === k).reduce((s, t) => s + t.amount, 0);
    return { label, Receitas: sum('income'), Despesas: sum('expense') };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Recebido" value={summary.income} tone="pos" hint={summary.pendingIncome ? `+ ${formatEUR(summary.pendingIncome)} pendente` : undefined} />
        <Kpi label="Despesas pagas" value={summary.expense} tone="neg" hint={summary.pendingExpense ? `+ ${formatEUR(summary.pendingExpense)} pendente` : undefined} />
        <Kpi label="Resultado" value={summary.result} tone={summary.result >= 0 ? 'pos' : 'neg'} />
        <Kpi label="A distribuir" value={dist.distributable} hint={`Reserva ${data.reservePercent}%: ${formatEUR(dist.reserve)}`} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-vermelho" /> A receber e a pagar (atrasados + próximos 14 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <EmptyState>
              <CheckCircle2 className="h-5 w-5 inline mr-1 text-green-600" /> Nada pendente
            </EmptyState>
          ) : (
            <div className="divide-y divide-beige-medium">
              {pending.map((t) => (
                <div key={t.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  {isOverdue(t) && <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />}
                  <span className="text-sm tabular-nums w-24 text-muted-foreground">{formatDate(t.tx_date)}</span>
                  <button type="button" className="flex-1 min-w-[160px] text-left text-sm hover:underline" onClick={() => onEdit(t)}>
                    <span className="font-medium text-charcoal">{t.description}</span>
                    {clientName(t.client_id) && <span className="text-muted-foreground"> · {clientName(t.client_id)}</span>}
                  </button>
                  <StatusBadge tx={t} />
                  <span className={`tabular-nums font-medium w-24 text-right ${t.kind === 'income' ? 'text-green-700' : 'text-red-600'}`}>
                    {t.kind === 'income' ? '+' : '−'} {formatEUR(t.amount)}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => api.markPaid(t)}>
                    {t.kind === 'income' ? 'Recebido' : 'Pago'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Receitas e despesas pagas em {year}</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7dfd3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={60} tickFormatter={(v) => `${v} €`} />
              <Tooltip formatter={(v) => formatEUR(Number(v))} />
              <Legend />
              <Bar dataKey="Receitas" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesas" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <CategoryBars title="Receitas por categoria" rows={summary.incomeByCategory} />
        <CategoryBars title="Despesas por categoria" rows={summary.expenseByCategory} />
        <CategoryBars
          title="Receitas por cliente"
          rows={summary.incomeByClient.map((c) => ({ ...c, color: '#c0392b' }))}
        />
      </div>
    </div>
  );
}
