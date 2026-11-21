import { CalendarRange } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { countLabel, weekLabel } from '../../lib/pecasAnalytics';
import type { WeekStat } from '../../hooks/usePiecesAnalytics';
import { ChangeBadge, EmptyState, ErrorState, Hint, SkeletonRows } from './shared';

interface Point {
  label: string;
  pageviews: number;
  top: string;
}

function WeekTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Point }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-charcoal text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-[240px]">
      <p className="font-medium">{p.label}</p>
      <p>{countLabel(p.pageviews, 'leitura', 'leituras')}</p>
      {p.top && <p className="opacity-80 mt-1">Mais lida: {p.top}</p>}
    </div>
  );
}

export function WeeklyTrend({
  weeks,
  loading,
  error,
  onRetry,
}: {
  weeks: WeekStat[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const data: Point[] = weeks.map((w) => ({ label: weekLabel(w), pageviews: w.pageviews, top: w.top?.title ?? '' }));
  const last = weeks[weeks.length - 1];
  const prev = weeks[weeks.length - 2];
  return (
    <Card className="bg-cream border-beige-medium min-w-0">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
            <CalendarRange className="w-4 h-4 text-vermelho" />
            Leituras de peças, semana a semana
          </CardTitle>
          {last && prev && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              Última semana <ChangeBadge current={last.pageviews} previous={prev.pageviews} />
            </span>
          )}
        </div>
        <Hint>Cada barra são 7 dias seguidos; a última acaba hoje. Não muda com o filtro do período.</Hint>
      </CardHeader>
      <CardContent>
        {loading && weeks.length === 0 ? (
          <SkeletonRows rows={5} />
        ) : error ? (
          <ErrorState onRetry={onRetry}>{error}</ErrorState>
        ) : data.every((d) => d.pageviews === 0) ? (
          <EmptyState>Ainda não há leituras nestas semanas.</EmptyState>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#7a6f63' }}
                tickLine={false}
                axisLine={{ stroke: '#e5ddd0' }}
                tickFormatter={(v: string) => v.split('–')[1] ?? v}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11, fill: '#7a6f63' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<WeekTooltip />} cursor={{ fill: 'rgba(196,48,43,0.08)' }} />
              <Bar dataKey="pageviews" fill="#C4302B" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
