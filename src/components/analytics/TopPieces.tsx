import { useState } from 'react';
import { ChevronDown, Newspaper } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';
import type { PieceStat, SourceStat } from '../../lib/pecasAnalytics';
import type { PieceWithChange } from '../../hooks/usePiecesAnalytics';
import { ChangeBadge, EmptyState, ErrorState, Hint, SkeletonRows } from './shared';
import { fmt } from './format';
import { countLabel } from '../../lib/pecasAnalytics';
import { SourcesList } from './SourcesCard';

const PAGE = 10;

type SourcesState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; sources: SourceStat[] };

function PieceRow({
  piece,
  rank,
  loadSources,
}: {
  piece: PieceWithChange;
  rank: number;
  loadSources: (piece: PieceStat) => Promise<SourceStat[]>;
}) {
  const [open, setOpen] = useState(false);
  const [sources, setSources] = useState<SourcesState | null>(null);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && (!sources || sources.status === 'error')) {
      setSources({ status: 'loading' });
      loadSources(piece)
        .then((s) => setSources({ status: 'ready', sources: s }))
        .catch(() => setSources({ status: 'error' }));
    }
  };

  return (
    <li className="border-b border-beige-medium last:border-b-0">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full grid grid-cols-[1.5rem_minmax(0,1fr)] sm:grid-cols-[1.5rem_minmax(0,1fr)_auto] gap-x-3 gap-y-1 items-start py-3 text-left hover:bg-beige-light/60 rounded-md px-1"
      >
        <span className="text-sm text-muted-foreground tabular-nums pt-0.5">{rank}</span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-charcoal break-words">{piece.title}</span>
          <span className="block text-xs text-muted-foreground break-words">
            {piece.programTitle}
            {!piece.found && ' · peça já não existe com este endereço'}
          </span>
        </span>
        <span className="col-start-2 sm:col-start-auto flex flex-wrap items-baseline gap-x-3 sm:block sm:text-right">
          <span className="block text-sm font-semibold text-charcoal tabular-nums whitespace-nowrap">
            {fmt(piece.pageviews)}{' '}
            <span className="font-normal text-muted-foreground">{piece.pageviews === 1 ? 'leitura' : 'leituras'}</span>
          </span>
          <span className="flex items-center sm:justify-end gap-2">
            <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">{countLabel(piece.visitors, 'pessoa', 'pessoas')}</span>
            <ChangeBadge current={piece.pageviews} previous={piece.prevPageviews} />
            <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden="true" />
          </span>
        </span>
      </button>
      {open && (
        <div className="pl-8 pr-1 pb-4 space-y-2">
          <p className="text-xs font-medium text-charcoal">De onde vieram os leitores desta peça</p>
          {sources?.status === 'ready' ? (
            <SourcesList sources={sources.sources} empty="Sem origem registada para esta peça no período." />
          ) : sources?.status === 'error' ? (
            <ErrorState onRetry={toggle}>Não foi possível ler a origem agora.</ErrorState>
          ) : (
            <SkeletonRows rows={3} />
          )}
        </div>
      )}
    </li>
  );
}

export function TopPieces({
  pieces,
  loading,
  error,
  onRetry,
  loadSources,
}: {
  pieces: PieceWithChange[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  loadSources: (piece: PieceStat) => Promise<SourceStat[]>;
}) {
  const [shown, setShown] = useState(PAGE);
  return (
    <Card className="bg-cream border-beige-medium min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
          <Newspaper className="w-4 h-4 text-vermelho" />
          Peças mais lidas
        </CardTitle>
        <Hint>
          Leituras = vezes que a peça foi aberta. Pessoas = leitores diferentes. A seta compara com o período anterior
          do mesmo tamanho. Toque numa peça para ver de onde vieram os leitores.
        </Hint>
      </CardHeader>
      <CardContent>
        {loading && pieces.length === 0 ? (
          <SkeletonRows rows={6} />
        ) : error ? (
          <ErrorState onRetry={onRetry}>{error}</ErrorState>
        ) : pieces.length === 0 ? (
          <EmptyState>Ainda não há leituras de peças neste período.</EmptyState>
        ) : (
          <>
            <ol>
              {pieces.slice(0, shown).map((piece, i) => (
                <PieceRow key={piece.slug} piece={piece} rank={i + 1} loadSources={loadSources} />
              ))}
            </ol>
            {pieces.length > shown && (
              <button
                type="button"
                onClick={() => setShown((n) => n + PAGE * 2)}
                className="mt-3 text-sm text-vermelho underline underline-offset-2"
              >
                Ver mais peças ({pieces.length - shown} por mostrar)
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
