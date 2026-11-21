import { useCallback, useEffect, useState } from 'react';
import { authHeaders } from '../lib/auth';
import type { GscRow } from '../lib/pecasAnalytics';

export type GscDays = 7 | 28 | 90;

export interface GscReport {
  siteUrl: string;
  days: number;
  startDate: string;
  endDate: string;
  prevStartDate: string;
  prevEndDate: string;
  totals: GscRow | null;
  prevTotals: GscRow | null;
  queries: GscRow[];
  pages: GscRow[];
  pageQueries: GscRow[];
}

export type GscState =
  | { status: 'loading' }
  | { status: 'not-connected' }
  | { status: 'unavailable' }
  | { status: 'error'; message: string }
  | { status: 'ready'; report: GscReport };

async function fetchReport(days: GscDays): Promise<GscState> {
  try {
    const response = await fetch(`/api/gsc?days=${days}`, {
      headers: { ...(await authHeaders()), Accept: 'application/json' },
    });
    // In `npm run dev` the route falls through to index.html: not an error for the user.
    if (!(response.headers.get('Content-Type') ?? '').includes('application/json')) {
      return { status: 'unavailable' };
    }
    const body = (await response.json()) as Partial<GscReport> & { configured?: boolean; error?: string };
    if (body.configured === false) return { status: 'not-connected' };
    if (!response.ok || body.error) return { status: 'error', message: body.error || `Erro ${response.status}` };
    return { status: 'ready', report: body as GscReport };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : 'Sem ligação' };
  }
}

export function useSearchConsole(days: GscDays) {
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<{ key: string; state: GscState } | null>(null);
  const key = `${days}:${nonce}`;

  useEffect(() => {
    let alive = true;
    fetchReport(days).then((state) => {
      if (alive) setResult({ key, state });
    });
    return () => {
      alive = false;
    };
  }, [days, key]);

  const state: GscState = result?.key === key ? result.state : { status: 'loading' };
  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  return { state, refresh };
}
