import { useState, useEffect, useCallback } from 'react';

const UMAMI_API_URL = 'https://api.umami.is';
const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID;
const API_KEY = import.meta.env.VITE_UMAMI_API_KEY;

export interface AnalyticsStats {
  pageviews: { value: number; prev: number };
  visitors: { value: number; prev: number };
  visits: { value: number; prev: number };
  bounces: { value: number; prev: number };
  totalTime: { value: number; prev: number };
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

  const fetchWithAuth = useCallback(async (endpoint: string) => {
    const response = await fetch(`${UMAMI_API_URL}${endpoint}`, {
      headers: {
        'x-umami-api-key': API_KEY,
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
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
        fetchWithAuth(`/api/websites/${WEBSITE_ID}/stats?${baseParams}`),
        fetchWithAuth(`/api/websites/${WEBSITE_ID}/pageviews?${baseParams}&unit=day`),
        fetchWithAuth(`/api/websites/${WEBSITE_ID}/metrics?${baseParams}&type=url&limit=10`),
        fetchWithAuth(`/api/websites/${WEBSITE_ID}/metrics?${baseParams}&type=country&limit=10`),
        fetchWithAuth(`/api/websites/${WEBSITE_ID}/metrics?${baseParams}&type=browser&limit=5`),
        fetchWithAuth(`/api/websites/${WEBSITE_ID}/metrics?${baseParams}&type=device&limit=5`),
        fetchWithAuth(`/api/websites/${WEBSITE_ID}/metrics?${baseParams}&type=referrer&limit=10`),
      ]);

      setData({
        stats,
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
  }, [timeRange, fetchWithAuth]);

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
