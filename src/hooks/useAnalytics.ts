import { useState, useEffect, useCallback } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Raw API response from Umami
interface UmamiStatsResponse {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
  comparison?: {
    pageviews: number;
    visitors: number;
    visits: number;
    bounces: number;
    totaltime: number;
  };
}

export interface AnalyticsStats {
  pageviews: { value: number; prev: number };
  visitors: { value: number; prev: number };
  visits: { value: number; prev: number };
  bounces: { value: number; prev: number };
  totalTime: { value: number; prev: number };
}

function transformStats(raw: UmamiStatsResponse): AnalyticsStats {
  return {
    pageviews: { value: raw.pageviews || 0, prev: raw.comparison?.pageviews || 0 },
    visitors: { value: raw.visitors || 0, prev: raw.comparison?.visitors || 0 },
    visits: { value: raw.visits || 0, prev: raw.comparison?.visits || 0 },
    bounces: { value: raw.bounces || 0, prev: raw.comparison?.bounces || 0 },
    totalTime: { value: raw.totaltime || 0, prev: raw.comparison?.totaltime || 0 },
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
  pages: MetricData[];
  countries: MetricData[];
  browsers: MetricData[];
  devices: MetricData[];
  referrers: MetricData[];
}

type TimeRange = '24h' | '7d' | '30d' | '90d';

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

export function useAnalytics(timeRange: TimeRange = '7d') {
  const [data, setData] = useState<AnalyticsData>({
    stats: null,
    pageviews: [],
    pages: [],
    countries: [],
    browsers: [],
    devices: [],
    referrers: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFromProxy = useCallback(async (endpoint: string, params: string) => {
    const url = `${SUPABASE_URL}/functions/v1/umami-proxy?endpoint=${endpoint}&${params}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }
    return response.json();
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { startAt, endAt } = getTimeRange(timeRange);
    const baseParams = `startAt=${startAt}&endAt=${endAt}`;

    try {
      const [stats, pageviews, pages, countries, browsers, devices, referrers] = await Promise.all([
        fetchFromProxy('stats', baseParams),
        fetchFromProxy('pageviews', `${baseParams}&unit=day`),
        fetchFromProxy('metrics', `${baseParams}&type=url&limit=10`),
        fetchFromProxy('metrics', `${baseParams}&type=country&limit=10`),
        fetchFromProxy('metrics', `${baseParams}&type=browser&limit=5`),
        fetchFromProxy('metrics', `${baseParams}&type=device&limit=5`),
        fetchFromProxy('metrics', `${baseParams}&type=referrer&limit=10`),
      ]);

      setData({
        stats: transformStats(stats),
        pageviews: pageviews.pageviews || [],
        pages,
        countries,
        browsers,
        devices,
        referrers,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar analytics');
    } finally {
      setLoading(false);
    }
  }, [timeRange, fetchFromProxy]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refresh: fetchAnalytics,
  };
}
