import { Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { roundedShares, type RetentionReading } from './insights';

const BAR_COLORS = ['#e7cfa0', '#D4A843', '#d9713a', '#C4302B'];

// How long people stay: session length buckets + plain sentences.
export function RetentionCard({ reading }: { reading: RetentionReading }) {
  const shares = roundedShares(reading.buckets.map((b) => b.count));
  return (
    <Card className="bg-cream border-beige-medium">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base font-semibold text-charcoal">
          <Timer className="w-4 h-4 text-vermelho" />
          Quanto tempo ficam a ouvir
          <span className="ml-auto text-xs text-muted-foreground font-normal">escutas de pelo menos 1 minuto</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reading.total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Ainda não há escutas de pelo menos 1 minuto neste período</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2.5">
              {reading.buckets.map((b, i) => {
                const share = b.count / reading.total;
                const pct = shares[i];
                return (
                  <div key={b.label} className="grid grid-cols-[7.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm">
                    <span className="min-w-0 text-charcoal">{b.label}</span>
                    <div className="min-w-0 h-3 bg-beige-medium rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(share * 100, b.count > 0 ? 2 : 0)}%`, backgroundColor: BAR_COLORS[i] }}
                      />
                    </div>
                    <span className="min-w-0 text-right text-xs text-muted-foreground tabular-nums">
                      {b.count} · {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
            <ul className="space-y-1 text-sm text-charcoal list-disc pl-5 marker:text-vermelho">
              {reading.sentences.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
