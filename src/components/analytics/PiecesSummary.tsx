import { Card, CardContent } from '../ui/card';
import { summaryLines, type RangeKey, type SourceStat } from '../../lib/pecasAnalytics';
import type { PiecesData } from '../../hooks/usePiecesAnalytics';
import { SkeletonRows } from './shared';

function mainSource(sources: SourceStat[]): SourceStat | null {
  return sources.reduce<SourceStat | null>((best, s) => (!best || s.visits > best.visits ? s : best), null);
}

/** Plain-language summary at the top of the page, always about the chosen period. */
export function PiecesSummary({
  data,
  timeRange,
  loading,
}: {
  data: PiecesData;
  timeRange: RangeKey;
  loading: boolean;
}) {
  // Old numbers stay hidden while another period loads: the sentences name the period.
  const ready = !loading && data.range === timeRange;
  const lines = ready
    ? summaryLines({
        timeRange,
        totalReads: data.totalReads,
        prevTotalReads: data.prevTotalReads,
        top: data.pieces[0] ?? null,
        topProgram: data.programs[0] ?? null,
        mainSource: mainSource(data.sources),
      })
    : [];

  return (
    <Card className="bg-cream border-beige-medium min-w-0">
      <CardContent className="p-5 space-y-2">
        <h3 className="font-display text-lg font-semibold text-charcoal">Resumo</h3>
        {!ready ? (
          loading ? (
            <SkeletonRows rows={3} />
          ) : (
            <p className="text-sm text-muted-foreground">Ainda não há números para este período.</p>
          )
        ) : data.totalReads === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não há leituras de peças neste período.</p>
        ) : (
          <ul className="space-y-1.5 text-sm text-charcoal">
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
