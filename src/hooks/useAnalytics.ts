import { useState, useEffect, useCallback } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SHARE_URL = import.meta.env.VITE_UMAMI_SHARE_URL as string | undefined;
const REGION_OVERRIDE = import.meta.env.VITE_UMAMI_REGION as string | undefined;
const SHARE_TOKEN_TTL_MS = 50 * 60 * 1000;

interface UmamiStatsResponse {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
}

export interface AnalyticsStats {
  pageviews: { value: number; prev: number };
  visitors: { value: number; prev: number };
  visits: { value: number; prev: number };
  bounces: { value: number; prev: number };
  totalTime: { value: number; prev: number };
  bounceRate: { value: number; prev: number };
}

function asCount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value && typeof value === 'object' && 'value' in value) {
    const inner = (value as { value: unknown }).value;
    if (typeof inner === 'number' && Number.isFinite(inner)) return inner;
  }
  return 0;
}

function transformStats(current: UmamiStatsResponse, previous: UmamiStatsResponse): AnalyticsStats {
  const curVisits = asCount(current.visits);
  const prevVisits = asCount(previous.visits);
  const curBounces = asCount(current.bounces);
  const prevBounces = asCount(previous.bounces);
  const curBounceRate = curVisits > 0 ? (curBounces / curVisits) * 100 : 0;
  const prevBounceRate = prevVisits > 0 ? (prevBounces / prevVisits) * 100 : 0;

  return {
    pageviews: { value: asCount(current.pageviews), prev: asCount(previous.pageviews) },
    visitors: { value: asCount(current.visitors), prev: asCount(previous.visitors) },
    visits: { value: curVisits, prev: prevVisits },
    bounces: { value: curBounces, prev: prevBounces },
    totalTime: { value: asCount(current.totaltime), prev: asCount(previous.totaltime) },
    bounceRate: { value: curBounceRate, prev: prevBounceRate },
  };
}

export interface PageviewData {
  x: string;
  y: number;
}

export interface MetricData {
  x: string;
  y: number;
}

export interface AnalyticsData {
  stats: AnalyticsStats | null;
  pageviews: PageviewData[];
  sessions: PageviewData[];
  pages: MetricData[];
  countries: MetricData[];
  browsers: MetricData[];
  devices: MetricData[];
  os: MetricData[];
  referrers: MetricData[];
}

export type TimeRange = '24h' | '7d' | '30d' | '90d';

export interface ShareConfig {
  shareId: string;
  region: string;
  origin: string;
  shareUrl: string;
  apiBase: string;
}

export function parseShareConfig(shareUrl = SHARE_URL, regionOverride = REGION_OVERRIDE): ShareConfig | null {
  if (!shareUrl?.trim()) return null;

  try {
    const url = new URL(shareUrl.trim());
    const parts = url.pathname.split('/').filter(Boolean);
    const shareIdx = parts.indexOf('share');
    const shareId = shareIdx >= 0 ? parts[shareIdx + 1] : '';
    if (!shareId) return null;

    const regionFromPath = parts[0] === 'analytics' && parts[1] ? parts[1] : 'eu';
    const region = (regionOverride || regionFromPath).toLowerCase();
    const origin = url.origin;
    const isCloud = /(?:^|\.)umami\.is$/i.test(url.hostname);

    return {
      shareId,
      region,
      origin,
      shareUrl: shareUrl.trim(),
      apiBase: isCloud ? `${origin}/analytics/${region}/api` : `${origin}/api`,
    };
  } catch {
    return null;
  }
}

const getTimeRange = (range: TimeRange): { startAt: number; endAt: number } => {
  const now = Date.now();
  const ranges: Record<TimeRange, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
  };
  return {
    startAt: now - ranges[range],
    endAt: now,
  };
};

interface ShareSession {
  websiteId: string;
  token: string;
  expiresAt: number;
}

let cachedSession: ShareSession | null = null;

function normalizeMetrics(payload: unknown): MetricData[] {
  const rows = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)
      ? (payload as { data: unknown[] }).data
      : [];

  return rows
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const item = row as { x?: unknown; y?: unknown; name?: unknown; value?: unknown };
      const x = String(item.x ?? item.name ?? '');
      const y = asCount(item.y ?? item.value);
      if (!x) return null;
      return { x, y };
    })
    .filter((row): row is MetricData => row !== null);
}

function fillSeries(
  points: PageviewData[],
  startAt: number,
  endAt: number,
  unit: 'hour' | 'day',
): PageviewData[] {
  const step = unit === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const start = unit === 'day'
    ? Date.UTC(
        new Date(startAt).getUTCFullYear(),
        new Date(startAt).getUTCMonth(),
        new Date(startAt).getUTCDate(),
      )
    : Math.floor(startAt / step) * step;

  const byKey = new Map<string, number>();
  for (const point of points) {
    const ts = Date.parse(point.x);
    if (Number.isNaN(ts)) continue;
    const key = new Date(unit === 'day'
      ? Date.UTC(new Date(ts).getUTCFullYear(), new Date(ts).getUTCMonth(), new Date(ts).getUTCDate())
      : Math.floor(ts / step) * step
    ).toISOString();
    byKey.set(key, (byKey.get(key) ?? 0) + point.y);
  }

  const filled: PageviewData[] = [];
  for (let ts = start; ts <= endAt; ts += step) {
    const x = new Date(ts).toISOString();
    filled.push({ x, y: byKey.get(x) ?? 0 });
  }
  return filled;
}

async function readJson(response: Response): Promise<unknown> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorPayload = payload as { error?: string | { message?: string } };
    const message = typeof errorPayload.error === 'string'
      ? errorPayload.error
      : errorPayload.error?.message || `API Error: ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

async function fetchViaProxy(endpoint: string, params: string, share: ShareConfig): Promise<unknown> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase não configurado');
  }

  const url = `${SUPABASE_URL}/functions/v1/umami-proxy?endpoint=${endpoint}&shareId=${encodeURIComponent(share.shareId)}&region=${encodeURIComponent(share.region)}&${params}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
    },
  });
  return readJson(response);
}

async function getShareSession(share: ShareConfig): Promise<ShareSession> {
  if (cachedSession && cachedSession.expiresAt > Date.now()) {
    return cachedSession;
  }

  const response = await fetch(`${share.apiBase}/share/${share.shareId}`, {
    headers: { Accept: 'application/json' },
  });
  const payload = await readJson(response) as { websiteId?: string; token?: string };
  if (!payload.websiteId || !payload.token) {
    throw new Error('Share URL do Umami inválida ou expirada');
  }

  cachedSession = {
    websiteId: payload.websiteId,
    token: payload.token,
    expiresAt: Date.now() + SHARE_TOKEN_TTL_MS,
  };
  return cachedSession;
}

async function fetchViaShareApi(endpoint: string, params: string, share: ShareConfig): Promise<unknown> {
  const session = await getShareSession(share);
  const url = `${share.apiBase}/websites/${session.websiteId}/${endpoint}?${params}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'x-umami-share-token': session.token,
      'x-umami-share-context': '1',
    },
  });

  if (response.status === 401) {
    cachedSession = null;
    const retrySession = await getShareSession(share);
    const retry = await fetch(`${share.apiBase}/websites/${retrySession.websiteId}/${endpoint}?${params}`, {
      headers: {
        Accept: 'application/json',
        'x-umami-share-token': retrySession.token,
        'x-umami-share-context': '1',
      },
    });
    return readJson(retry);
  }

  return readJson(response);
}

async function fetchUmami(endpoint: string, params: string, share: ShareConfig): Promise<unknown> {
  try {
    return await fetchViaShareApi(endpoint, params, share);
  } catch (shareError) {
    try {
      return await fetchViaProxy(endpoint, params, share);
    } catch {
      throw shareError instanceof Error ? shareError : new Error('Erro ao carregar analytics');
    }
  }
}

const emptyData: AnalyticsData = {
  stats: null,
  pageviews: [],
  sessions: [],
  pages: [],
  countries: [],
  browsers: [],
  devices: [],
  os: [],
  referrers: [],
};

export function useAnalytics(timeRange: TimeRange = '7d') {
  const [data, setData] = useState<AnalyticsData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const shareConfig = parseShareConfig();

  const fetchAnalytics = useCallback(async () => {
    const share = parseShareConfig();
    if (!share) {
      setData(emptyData);
      setError('Defina VITE_UMAMI_SHARE_URL com a Share URL pública do Umami.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { startAt, endAt } = getTimeRange(timeRange);
    const periodLength = endAt - startAt;
    const prevStartAt = startAt - periodLength;
    const prevEndAt = startAt;
    const unit = timeRange === '24h' ? 'hour' : 'day';
    const baseParams = `startAt=${startAt}&endAt=${endAt}`;
    const prevParams = `startAt=${prevStartAt}&endAt=${prevEndAt}`;

    try {
      const [stats, prevStats, pageviewsData, pages, countries, browsers, devices, os, referrers] = await Promise.all([
        fetchUmami('stats', baseParams, share),
        fetchUmami('stats', prevParams, share),
        fetchUmami('pageviews', `${baseParams}&unit=${unit}`, share),
        fetchUmami('metrics', `${baseParams}&type=path&limit=10`, share),
        fetchUmami('metrics', `${baseParams}&type=country&limit=10`, share),
        fetchUmami('metrics', `${baseParams}&type=browser&limit=5`, share),
        fetchUmami('metrics', `${baseParams}&type=device&limit=5`, share),
        fetchUmami('metrics', `${baseParams}&type=os&limit=5`, share),
        fetchUmami('metrics', `${baseParams}&type=referrer&limit=10`, share),
      ]);

      const series = (pageviewsData && typeof pageviewsData === 'object')
        ? pageviewsData as { pageviews?: PageviewData[]; sessions?: PageviewData[] }
        : {};

      setData({
        stats: transformStats(stats as UmamiStatsResponse, prevStats as UmamiStatsResponse),
        pageviews: fillSeries(series.pageviews || [], startAt, endAt, unit),
        sessions: fillSeries(series.sessions || [], startAt, endAt, unit),
        pages: normalizeMetrics(pages),
        countries: normalizeMetrics(countries),
        browsers: normalizeMetrics(browsers),
        devices: normalizeMetrics(devices),
        os: normalizeMetrics(os),
        referrers: normalizeMetrics(referrers),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar analytics');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refresh: fetchAnalytics,
    shareUrl: shareConfig?.shareUrl,
    configured: Boolean(shareConfig),
  };
}
