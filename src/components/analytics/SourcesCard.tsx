import { Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { SourceGroup, SourceStat } from '../../lib/pecasAnalytics';
import { Bar, EmptyState, ErrorState, Hint, SkeletonRows } from './shared';
import { fmt } from './format';

const LABELS: Record<SourceGroup, string> = {
  Google: 'Google (pesquisa)',
  Instagram: 'Instagram',
  Facebook: 'Facebook',
  WhatsApp: 'WhatsApp',
  Direto: 'Direto (link escrito, guardado ou partilhado)',
  Outros: 'Outros sites',
};

export function SourcesList({ sources, empty }: { sources: SourceStat[]; empty: string }) {
  if (sources.length === 0) return <EmptyState>{empty}</EmptyState>;
  const max = Math.max(...sources.map((s) => s.visits));
  return (
    <ul className="space-y-2.5">
      {sources.map((s) => (
        <li key={s.group} className="space-y-1" title={s.hosts.length ? s.hosts.join(', ') : undefined}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 text-charcoal font-medium break-words">{LABELS[s.group]}</span>
            <span className="text-muted-foreground tabular-nums whitespace-nowrap">
              {fmt(s.visits)} · {Math.round(s.share)}%
            </span>
          </div>
          <Bar value={s.visits} max={max} />
        </li>
      ))}
    </ul>
  );
}

export function SourcesCard({
  sources,
  loading,
  error,
  onRetry,
}: {
  sources: SourceStat[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const total = sources.reduce((s, x) => s + x.visits, 0);
  return (
    <Card className="bg-cream border-beige-medium min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
          <Share2 className="w-4 h-4 text-vermelho" />
          De onde vêm as visitas
        </CardTitle>
        <Hint>
          Visitas ao site inteiro no período{total > 0 ? ` (${fmt(total)} no total)` : ''}. Quem abre um link enviado
          pelo WhatsApp quase sempre aparece em «Direto», porque a app não diz de onde vem.
        </Hint>
      </CardHeader>
      <CardContent>
        {loading && sources.length === 0 ? (
          <SkeletonRows rows={5} />
        ) : error ? (
          <ErrorState onRetry={onRetry}>{error}</ErrorState>
        ) : (
          <SourcesList sources={sources} empty="Ainda não há visitas neste período." />
        )}
      </CardContent>
    </Card>
  );
}
