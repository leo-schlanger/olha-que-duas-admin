import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fetchUmami, parseShareConfig, type ShareConfig, type TimeRange } from './useAnalytics';
import {
  DAY_MS,
  groupByProgram,
  groupSources,
  mergePieces,
  rollingWeeks,
  sumRows,
  toPathRows,
  toVisitRows,
  type PieceStat,
  type PostRef,
  type ProgramRef,
  type ProgramStat,
  type SourceStat,
  type WeekWindow,
} from '../lib/pecasAnalytics';

const RANGE_MS: Record<TimeRange, number> = {
  '24h': DAY_MS,
  '7d': 7 * DAY_MS,
  '30d': 30 * DAY_MS,
  '90d': 90 * DAY_MS,
};

export const WEEKS_SHOWN = 8;

export interface PieceWithChange extends PieceStat {
  prevPageviews: number;
}

export interface WeekStat extends WeekWindow {
  pageviews: number;
  top: PieceStat | null;
}

export interface PiecesData {
  pieces: PieceWithChange[];
  programs: (ProgramStat & { prevPageviews: number })[];
  sources: SourceStat[];
  totalReads: number;
  prevTotalReads: number;
}

const emptyPieces: PiecesData = { pieces: [], programs: [], sources: [], totalReads: 0, prevTotalReads: 0 };

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : '';
  if (/invalid endpoint/i.test(msg)) {
    return 'O painel ainda está a atualizar. Tente de novo daqui a um minuto.';
  }
  return 'Não foi possível ler as estatísticas das peças agora. Carregue em «Atualizar» daqui a pouco.';
}

async function loadCatalog(): Promise<{ posts: PostRef[]; programs: ProgramRef[] }> {
  const [posts, programs] = await Promise.all([
    supabase.from('vinagre_posts').select('slug,title,program_id'),
    supabase.from('exclusive_programs').select('id,slug,title'),
  ]);
  // Titles are a nicety: without them the slug is shown, never an error.
  return {
    posts: (posts.data as PostRef[] | null) ?? [],
    programs: (programs.data as ProgramRef[] | null) ?? [],
  };
}

function range(startAt: number, endAt: number): string {
  return `startAt=${Math.round(startAt)}&endAt=${Math.round(endAt)}`;
}

async function pathRows(share: ShareConfig, startAt: number, endAt: number) {
  return toPathRows(await fetchUmami('metrics/expanded', `${range(startAt, endAt)}&type=path&limit=1000`, share));
}

export function usePiecesAnalytics(timeRange: TimeRange) {
  const [data, setData] = useState<PiecesData>(emptyPieces);
  const [weeks, setWeeks] = useState<WeekStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeksLoading, setWeeksLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weeksError, setWeeksError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostRef[]>([]);
  const catalogRef = useRef<Promise<{ posts: PostRef[]; programs: ProgramRef[] }> | null>(null);
  const periodRef = useRef<{ startAt: number; endAt: number } | null>(null);

  const catalog = useCallback(() => {
    if (!catalogRef.current) {
      catalogRef.current = loadCatalog();
      catalogRef.current.then((c) => setPosts(c.posts));
    }
    return catalogRef.current;
  }, []);

  const loadPeriod = useCallback(async () => {
    const share = parseShareConfig();
    if (!share) return;
    setLoading(true);
    setError(null);
    const endAt = Date.now();
    const startAt = endAt - RANGE_MS[timeRange];
    const prevStart = startAt - RANGE_MS[timeRange];
    periodRef.current = { startAt, endAt };
    try {
      const [cat, cur, prev, refs, channels] = await Promise.all([
        catalog(),
        pathRows(share, startAt, endAt),
        pathRows(share, prevStart, startAt),
        fetchUmami('metrics/expanded', `${range(startAt, endAt)}&type=referrer&limit=200`, share),
        fetchUmami('metrics/expanded', `${range(startAt, endAt)}&type=channel&limit=50`, share),
      ]);
      const pieces = mergePieces(cur, cat.posts, cat.programs);
      const prevPieces = mergePieces(prev, cat.posts, cat.programs);
      const prevBySlug = new Map(prevPieces.map((p) => [p.slug, p.pageviews]));
      const prevPrograms = new Map(groupByProgram(prevPieces).map((p) => [p.programSlug, p.pageviews]));
      setData({
        pieces: pieces.map((p) => ({ ...p, prevPageviews: prevBySlug.get(p.slug) ?? 0 })),
        programs: groupByProgram(pieces).map((p) => ({ ...p, prevPageviews: prevPrograms.get(p.programSlug) ?? 0 })),
        sources: groupSources(toVisitRows(refs), toVisitRows(channels)),
        totalReads: pieces.reduce((s, p) => s + p.pageviews, 0),
        prevTotalReads: prevPieces.reduce((s, p) => s + p.pageviews, 0),
      });
    } catch (err) {
      setData(emptyPieces);
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [timeRange, catalog]);

  const loadWeeks = useCallback(async () => {
    const share = parseShareConfig();
    if (!share) return;
    setWeeksLoading(true);
    setWeeksError(null);
    try {
      const windows = rollingWeeks(Date.now(), WEEKS_SHOWN);
      const [cat, ...rows] = await Promise.all([
        catalog(),
        ...windows.map((w) => pathRows(share, w.startAt, w.endAt)),
      ]);
      setWeeks(windows.map((w, i) => {
        const pieces = mergePieces(rows[i], cat.posts, cat.programs);
        return { ...w, pageviews: pieces.reduce((s, p) => s + p.pageviews, 0), top: pieces[0] ?? null };
      }));
    } catch (err) {
      setWeeks([]);
      setWeeksError(friendlyError(err));
    } finally {
      setWeeksLoading(false);
    }
  }, [catalog]);

  /** Origins of one piece: one filtered call per address, then summed. */
  const loadPieceSources = useCallback(async (piece: PieceStat): Promise<SourceStat[]> => {
    const share = parseShareConfig();
    const period = periodRef.current;
    if (!share || !period) return [];
    const base = range(period.startAt, period.endAt);
    const perPath = await Promise.all(piece.paths.map(async (path) => {
      const filter = `path=${encodeURIComponent(path)}`;
      const [refs, channels] = await Promise.all([
        fetchUmami('metrics/expanded', `${base}&type=referrer&limit=100&${filter}`, share),
        fetchUmami('metrics/expanded', `${base}&type=channel&limit=50&${filter}`, share),
      ]);
      return { refs: toVisitRows(refs), channels: toVisitRows(channels) };
    }));
    return groupSources(sumRows(perPath.map((p) => p.refs)), sumRows(perPath.map((p) => p.channels)));
  }, []);

  useEffect(() => {
    loadPeriod();
  }, [loadPeriod]);

  useEffect(() => {
    loadWeeks();
  }, [loadWeeks]);

  const refresh = useCallback(() => {
    catalogRef.current = null;
    loadPeriod();
    loadWeeks();
  }, [loadPeriod, loadWeeks]);

  return { data, weeks, posts, loading, weeksLoading, error, weeksError, refresh, loadPieceSources };
}
