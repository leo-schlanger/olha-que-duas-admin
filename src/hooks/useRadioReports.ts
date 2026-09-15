import { useState, useEffect, useCallback } from 'react';
import type { AzuraBestWorstResponse, AzuraBestWorstSong, AzuraMostPlayed } from '../types/radio';
import { authHeaders } from '../lib/auth';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export type ReportPeriod = 'today' | 'week' | 'month';

// Relatórios de músicas do AzuraCast. As métricas de audiência (horas
// ouvidas, ouvintes por dia/hora) vêm do Supabase no separador Audiência.
export interface RadioReportsData {
  bestSongs: AzuraBestWorstSong[];
  worstSongs: AzuraBestWorstSong[];
  mostPlayed: AzuraMostPlayed[];
}

const emptyReports: RadioReportsData = {
  bestSongs: [],
  worstSongs: [],
  mostPlayed: [],
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

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { start, end } = getPeriodRange(period);

    try {
      const queryParams = new URLSearchParams({ endpoint: 'reports/best-worst', start, end });
      const response = await fetch(`${SUPABASE_URL}/functions/v1/azuracast-proxy?${queryParams.toString()}`, {
        headers: { ...(await authHeaders()), Accept: 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      const bw = (await response.json()) as AzuraBestWorstResponse;
      setData({
        bestSongs: bw?.bestAndWorst?.best || [],
        worstSongs: bw?.bestAndWorst?.worst || [],
        mostPlayed: bw?.mostPlayed || [],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar relatórios';
      setError(message);
      console.error('Radio reports error:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { data, loading, error, refresh: fetchReports };
}
