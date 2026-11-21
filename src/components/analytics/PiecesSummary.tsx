import { Card, CardContent } from '../ui/card';
import { formatChange, percentChange, type SourceStat } from '../../lib/pecasAnalytics';
import type { PiecesData, WeekStat } from '../../hooks/usePiecesAnalytics';
import { SkeletonRows } from './shared';
import { fmt } from './format';

function compareText(current: number, previous: number, against: string): string {
  const change = percentChange(current, previous);
  if (change === null) return `sem números ${against} para comparar`;
  const text = formatChange(current, previous);
  if (text === 'igual') return `o mesmo que ${against}`;
  return `${text} que ${against}`;
}

const SOURCE_PHRASE: Record<SourceStat['group'], string> = {
  Google: 'pelo Google',
  Instagram: 'pelo Instagram',
  Facebook: 'pelo Facebook',
  WhatsApp: 'pelo WhatsApp',
  Direto: 'de forma direta (link escrito, guardado ou partilhado)',
  Outros: 'por outros sites',
};

function mainSource(sources: SourceStat[]): SourceStat | null {
  return sources.reduce<SourceStat | null>((best, s) => (!best || s.visits > best.visits ? s : best), null);
}

/** Plain-language summary at the top of the page. */
export function PiecesSummary({
  weeks,
  weeksLoading,
  data,
  periodLabel,
  sameAsWeek,
  loading,
}: {
  weeks: WeekStat[];
  weeksLoading: boolean;
  data: PiecesData;
  periodLabel: string;
  /** The selected period is the same last-7-days window as the first line. */
  sameAsWeek: boolean;
  loading: boolean;
}) {
  const thisWeek = weeks[weeks.length - 1];
  const lastWeek = weeks[weeks.length - 2];
  const topProgram = data.programs[0];
  const source = mainSource(data.sources);

  const lines: string[] = [];
  if (thisWeek) {
    lines.push(
      `Últimos 7 dias: ${fmt(thisWeek.pageviews)} leituras de peças, ${compareText(thisWeek.pageviews, lastWeek?.pageviews ?? 0, 'nos 7 dias anteriores')}.`,
    );
    if (thisWeek.top) {
      lines.push(`A peça mais lida foi «${thisWeek.top.title}» (${fmt(thisWeek.top.pageviews)} leituras).`);
    }
  }
  if (!loading && data.totalReads > 0) {
    if (sameAsWeek) {
      // Same 7-day window as the first line: only add the program.
      if (topProgram) lines.push(`O programa mais lido foi ${topProgram.programTitle} (${fmt(topProgram.pageviews)} leituras).`);
    } else {
      let period = `${periodLabel}: ${fmt(data.totalReads)} leituras de peças`;
      if (topProgram) period += `; o programa mais lido foi ${topProgram.programTitle} (${fmt(topProgram.pageviews)})`;
      lines.push(`${period}.`);
    }
  }
  if (!loading && source) {
    lines.push(`A maior fatia das visitas ao site chegou ${SOURCE_PHRASE[source.group]} (${Math.round(source.share)}%).`);
  }

  return (
    <Card className="bg-cream border-beige-medium">
      <CardContent className="p-5 space-y-2">
        <h3 className="font-display text-lg font-semibold text-charcoal">Resumo</h3>
        {weeksLoading && loading ? (
          <SkeletonRows rows={3} />
        ) : lines.length === 0 ? (
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
