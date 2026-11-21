import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';
import { countLabel, mergeGscPages, piecePathOf, prettySlug, queriesByPiece, type GscRow } from '../../lib/pecasAnalytics';
import { useSearchConsole, type GscDays } from '../../hooks/useSearchConsole';
import { ChangeBadge, EmptyState, ErrorState, Hint, SkeletonRows } from './shared';
import { fmt } from './format';

const DAY_OPTIONS: GscDays[] = [7, 28, 90];

const pct = (v: number) => `${(v * 100).toLocaleString('pt-PT', { maximumFractionDigits: 1 })}%`;
function pathOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

const pos = (v: number) => v.toLocaleString('pt-PT', { maximumFractionDigits: 1 });

function day(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function Tile({ label, help, value, change }: { label: string; help: string; value: string; change?: ReactNode }) {
  return (
    <div className="rounded-lg border border-beige-medium bg-beige-light/60 p-3 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-charcoal tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground leading-snug">{help}</p>
      {change}
    </div>
  );
}

function NotConnected() {
  return (
    <div className="space-y-2 text-sm text-charcoal">
      <p className="font-medium">Ainda não ligado.</p>
      <p className="text-muted-foreground">
        Quando estiver ligado, aqui aparece o que as pessoas escrevem no Google antes de chegar ao site, e quais
        as peças que o Google mostra mais. Para ligar (feito uma vez, pelo Leo):
      </p>
      <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
        <li>Criar uma conta de serviço no Google Cloud com a «Google Search Console API» ativa.</li>
        <li>No Search Console, adicionar o e-mail dessa conta como utilizador (acesso restrito).</li>
        <li>Na Vercel (projeto do admin), pôr GSC_SERVICE_ACCOUNT_JSON e GSC_SITE_URL e publicar de novo.</li>
      </ol>
    </div>
  );
}

function PieceQueries({ queries }: { queries: GscRow[] }) {
  if (queries.length === 0) return <p className="text-xs text-muted-foreground">Sem pesquisas registadas.</p>;
  return (
    <ul className="space-y-1">
      {queries.map((q) => (
        <li key={q.keys[0]} className="flex justify-between gap-3 text-xs">
          <span className="min-w-0 break-words text-charcoal">«{q.keys[0]}»</span>
          <span className="text-muted-foreground tabular-nums whitespace-nowrap">
            {countLabel(q.clicks, 'clique', 'cliques')} · {countLabel(q.impressions, 'vez', 'vezes')}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function SearchConsoleCard({
  titleOf,
  knownSlugs,
}: {
  titleOf: (slug: string) => string | undefined;
  knownSlugs: string[];
}) {
  const [days, setDays] = useState<GscDays>(28);
  const [open, setOpen] = useState<string | null>(null);
  const { state, refresh } = useSearchConsole(days);

  const report = state.status === 'ready' ? state.report : null;
  const pieces = useMemo(() => (report ? mergeGscPages(report.pages, knownSlugs) : []), [report, knownSlugs]);
  const pieceQueries = useMemo(() => (report ? queriesByPiece(report.pageQueries, 5, knownSlugs) : new Map()), [report, knownSlugs]);
  const otherPages = useMemo(
    () => (report ? report.pages.filter((p) => !piecePathOf(p.keys[0] ?? '')).slice(0, 5) : []),
    [report],
  );

  return (
    <Card className="bg-cream border-beige-medium min-w-0">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
            <Search className="w-4 h-4 text-vermelho" />
            Pesquisas no Google
          </CardTitle>
          {state.status !== 'not-connected' && state.status !== 'unavailable' && (
            <div className="flex bg-beige-light border border-beige-medium rounded-lg p-1" role="group" aria-label="Período do Google">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  aria-pressed={days === d}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-md',
                    days === d ? 'bg-vermelho text-white' : 'text-muted-foreground hover:text-charcoal',
                  )}
                >
                  {d} dias
                </button>
              ))}
            </div>
          )}
        </div>
        <Hint>
          Dados do Google Search Console. Chegam com 2 a 3 dias de atraso
          {report ? `: aqui vão de ${day(report.startDate)} a ${day(report.endDate)}` : ''}.
        </Hint>
      </CardHeader>
      <CardContent className="space-y-5">
        {state.status === 'loading' ? (
          <SkeletonRows rows={5} />
        ) : state.status === 'not-connected' ? (
          <NotConnected />
        ) : state.status === 'unavailable' ? (
          <EmptyState>Esta parte só funciona no painel publicado (admin.olhaqueduas.com).</EmptyState>
        ) : state.status === 'error' ? (
          <ErrorState onRetry={refresh}>Não foi possível ler o Google agora: {state.message.replace(/\.+$/, '')}.</ErrorState>
        ) : report && !report.totals ? (
          <EmptyState>O Google ainda não tem números para este período.</EmptyState>
        ) : report ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Tile
                label="Cliques"
                help="pessoas que clicaram no site"
                value={fmt(report.totals!.clicks)}
                change={<ChangeBadge current={report.totals!.clicks} previous={report.prevTotals?.clicks ?? 0} />}
              />
              <Tile
                label="Vezes que apareceu"
                help="impressões nos resultados"
                value={fmt(report.totals!.impressions)}
                change={<ChangeBadge current={report.totals!.impressions} previous={report.prevTotals?.impressions ?? 0} />}
              />
              <Tile label="Taxa de cliques" help="de cada 100 que viram, quantos clicaram (CTR)" value={pct(report.totals!.ctr)} />
              <Tile label="Posição média" help="1 = primeiro resultado; menor é melhor" value={pos(report.totals!.position)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="min-w-0 space-y-2">
                <h4 className="text-sm font-semibold text-charcoal">O que as pessoas pesquisaram</h4>
                {report.queries.length === 0 ? (
                  <EmptyState>Sem pesquisas neste período.</EmptyState>
                ) : (
                  <ul className="divide-y divide-beige-medium">
                    {report.queries.slice(0, 15).map((q) => (
                      <li key={q.keys[0]} className="flex flex-col sm:flex-row sm:justify-between gap-x-3 gap-y-0.5 py-1.5 text-sm">
                        <span className="min-w-0 break-words text-charcoal">«{q.keys[0]}»</span>
                        <span className="text-xs text-muted-foreground tabular-nums sm:whitespace-nowrap sm:text-right">
                          {countLabel(q.clicks, 'clique', 'cliques')} · {countLabel(q.impressions, 'vez', 'vezes')} · posição {pos(q.position)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="min-w-0 space-y-2">
                <h4 className="text-sm font-semibold text-charcoal">Peças no Google</h4>
                {pieces.length === 0 ? (
                  <EmptyState>Nenhuma peça apareceu no Google neste período.</EmptyState>
                ) : (
                  <ul className="divide-y divide-beige-medium">
                    {pieces.slice(0, 15).map((p) => (
                      <li key={p.slug}>
                        <button
                          type="button"
                          onClick={() => setOpen(open === p.slug ? null : p.slug)}
                          aria-expanded={open === p.slug}
                          className="w-full grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 py-1.5 text-left text-sm"
                        >
                          <span className="min-w-0 break-words text-charcoal">{titleOf(p.slug) ?? prettySlug(p.slug)}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                            {countLabel(p.clicks, 'clique', 'cliques')} · {pct(p.ctr)} · pos. {pos(p.position)}
                            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open === p.slug && 'rotate-180')} aria-hidden="true" />
                          </span>
                        </button>
                        {open === p.slug && (
                          <div className="pb-2 pl-2">
                            <PieceQueries queries={pieceQueries.get(p.slug) ?? []} />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {otherPages.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Outras páginas com mais cliques:{' '}
                    {otherPages.map((p) => `${pathOf(p.keys[0])} (${fmt(p.clicks)})`).join(', ')}.
                  </p>
                )}
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
