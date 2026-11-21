import { Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { PiecesData } from '../../hooks/usePiecesAnalytics';
import { Bar, ChangeBadge, EmptyState, ErrorState, Hint, SkeletonRows } from './shared';
import { fmt } from './format';

export function ProgramsReads({
  programs,
  loading,
  error,
  onRetry,
}: {
  programs: PiecesData['programs'];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const max = programs.length ? Math.max(...programs.map((p) => p.pageviews)) : 0;
  return (
    <Card className="bg-cream border-beige-medium min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
          <Layers className="w-4 h-4 text-vermelho" />
          Leituras por programa
        </CardTitle>
        <Hint>Soma das leituras de todas as peças de cada programa.</Hint>
      </CardHeader>
      <CardContent>
        {loading && programs.length === 0 ? (
          <SkeletonRows rows={5} />
        ) : error ? (
          <ErrorState onRetry={onRetry}>{error}</ErrorState>
        ) : programs.length === 0 ? (
          <EmptyState>Ainda não há leituras neste período.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {programs.map((p) => (
              <li key={p.programSlug} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 text-charcoal font-medium break-words">
                    {p.programTitle}
                    <span className="text-xs text-muted-foreground font-normal">
                      {' '}· {p.pieces} {p.pieces === 1 ? 'peça' : 'peças'}
                    </span>
                  </span>
                  <span className="flex items-baseline gap-2 whitespace-nowrap">
                    <span className="tabular-nums text-charcoal">{fmt(p.pageviews)}</span>
                    <ChangeBadge current={p.pageviews} previous={p.prevPageviews} />
                  </span>
                </div>
                <Bar value={p.pageviews} max={max} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
