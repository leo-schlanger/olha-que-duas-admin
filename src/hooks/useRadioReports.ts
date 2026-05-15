import { useState, useEffect, useCallback } from 'react';
import type { AzuraChartsResponse, AzuraBestWorstResponse, AzuraBestWorstSong, AzuraMostPlayed } from '../types/radio';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export type ReportPeriod = 'today' | 'week' | 'month';

export interface RadioChartPoint {
  time: string;
  listeners: number;
}

export interface RadioReportsData {
  chartData: RadioChartPoint[];
  bestSongs: AzuraBestWorstSong[];
  worstSongs: AzuraBestWorstSong[];
  mostPlayed: AzuraMostPlayed[];
  hourlyAvg: Array<{ hour: string; listeners: number }>;
  tlh: number;
}

const emptyReports: RadioReportsData = {
  chartData: [],
  bestSongs: [],
  worstSongs: [],
  mostPlayed: [],
  hourlyAvg: [],
  tlh: 0,
};

function getPeriodRange(period: ReportPeriod): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString();

  let start: Date;
  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  return { start: start.toISOString(), end };
}

export function useRadioReports(period: ReportPeriod = 'week') {
  const [data, setData] = useState<RadioReportsData>(emptyReports);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFromProxy = useCallback(async (endpoint: string, params?: Record<string, string>) => {
    const queryParams = new URLSearchParams({ endpoint, ...params });
    const url = `${SUPABASE_URL}/functions/v1/azuracast-proxy?${queryParams.toString()}`;

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

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { start, end } = getPeriodRange(period);

    try {
      const [chartRaw, bestWorstRaw] = await Promise.allSettled([
        fetchFromProxy('reports/charts', { start, end }),
        fetchFromProxy('reports/best-worst', { start, end }),
      ]);

      // Process chart data - actual format: { daily: { metrics: [{ data: [{x, y}] }] }, hourly: { all: { labels, metrics: [{ data: [] }] } } }
      let chartData: RadioChartPoint[] = [];
      let hourlyAvg: Array<{ hour: string; listeners: number }> = [];
      let tlh = 0;

      if (chartRaw.status === 'fulfilled') {
        const charts = chartRaw.value as AzuraChartsResponse;

        // Daily chart data
        if (charts?.daily?.metrics?.[0]?.data) {
          chartData = charts.daily.metrics[0].data.map((p) => ({
            time: new Date(p.x).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
            listeners: Math.round(p.y),
          }));

          // TLH from daily: each data point is avg listeners for that day
          // Use same formula as useRadioStats for consistency: avg_listeners * 24h
          // But cap at actual hours in period to avoid inflation
          const totalDays = charts.daily.metrics[0].data.length;
          const avgListeners = charts.daily.metrics[0].data.reduce((sum, p) => sum + p.y, 0) / Math.max(totalDays, 1);
          tlh = parseFloat((avgListeners * totalDays * 24).toFixed(1));
        }

        // Hourly average data
        if (charts?.hourly?.all?.labels && charts?.hourly?.all?.metrics?.[0]?.data) {
          hourlyAvg = charts.hourly.all.labels.map((label, i) => ({
            hour: label,
            listeners: Math.round(charts.hourly.all.metrics[0].data[i] || 0),
          }));
        }
      }

      // Process best/worst - actual format: { bestAndWorst: { best, worst }, mostPlayed }
      let bestSongs: AzuraBestWorstSong[] = [];
      let worstSongs: AzuraBestWorstSong[] = [];
      let mostPlayed: AzuraMostPlayed[] = [];

      if (bestWorstRaw.status === 'fulfilled') {
        const bw = bestWorstRaw.value as AzuraBestWorstResponse;
        bestSongs = bw?.bestAndWorst?.best || [];
        worstSongs = bw?.bestAndWorst?.worst || [];
        mostPlayed = bw?.mostPlayed || [];
      }

      setData({ chartData, bestSongs, worstSongs, mostPlayed, hourlyAvg, tlh });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar relatórios';
      setError(message);
      console.error('Radio reports error:', err);
    } finally {
      setLoading(false);
    }
  }, [period, fetchFromProxy]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { data, loading, error, refresh: fetchReports };
}
