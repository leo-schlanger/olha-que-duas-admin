import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// --- Types ---

export interface DauMauPoint {
  day: string;
  dau: number;
  mau: number;
  ratio: number;
}

export interface CohortRow {
  cohort_week: string;
  week_number: number;
  cohort_size: number;
  retained: number;
  retention_rate: number;
}

export interface NewVsReturningPoint {
  day: string;
  new_listeners: number;
  returning_listeners: number;
  total_listeners: number;
}

export interface HeatmapCell {
  day_of_week: number;
  hour_of_day: number;
  avg_listeners: number;
}

export interface RetentionOverview {
  total_unique_listeners: number;
  listeners_today: number;
  listeners_this_week: number;
  listeners_this_month: number;
  new_today: number;
  returning_today: number;
  avg_sessions_per_listener: number;
  avg_session_duration_seconds: number;
  churn_rate_30d: number;
  dau_mau_ratio: number;
}

export interface CountryListeners {
  country: string;
  unique_listeners: number;
  total_sessions: number;
  avg_duration_seconds: number;
}

export interface ProgramPerformance {
  slot_name: string;
  period_label: string;
  slot_time: string;
  avg_listeners: number;
  peak_listeners: number;
  sample_count: number;
}

export interface RetentionData {
  overview: RetentionOverview | null;
  dauMau: DauMauPoint[];
  cohort: CohortRow[];
  newVsReturning: NewVsReturningPoint[];
  heatmap: HeatmapCell[];
  countriesDetailed: CountryListeners[];
  programPerformance: ProgramPerformance[];
}

const emptyOverview: RetentionOverview = {
  total_unique_listeners: 0,
  listeners_today: 0,
  listeners_this_week: 0,
  listeners_this_month: 0,
  new_today: 0,
  returning_today: 0,
  avg_sessions_per_listener: 0,
  avg_session_duration_seconds: 0,
  churn_rate_30d: 0,
  dau_mau_ratio: 0,
};

// --- Hook ---

export function useRetentionStats(daysBack: number = 30) {
  const [data, setData] = useState<RetentionData>({
    overview: null,
    dauMau: [],
    cohort: [],
    newVsReturning: [],
    heatmap: [],
    countriesDetailed: [],
    programPerformance: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRetention = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        overviewRes,
        dauMauRes,
        cohortRes,
        newRetRes,
        heatmapRes,
        countriesRes,
        programRes,
      ] = await Promise.allSettled([
        supabase.rpc('get_retention_overview'),
        supabase.rpc('get_dau_mau_trend', { days_back: daysBack }),
        supabase.rpc('get_cohort_retention', { weeks_back: 8 }),
        supabase.rpc('get_new_vs_returning', { days_back: daysBack }),
        supabase.rpc('get_listener_heatmap', { days_back: daysBack }),
        supabase.rpc('get_listeners_by_country', { days_back: daysBack }),
        supabase.rpc('get_program_performance', { days_back: daysBack }),
      ]);

      const overview =
        overviewRes.status === 'fulfilled' && overviewRes.value.data?.[0]
          ? overviewRes.value.data[0]
          : emptyOverview;

      const dauMau: DauMauPoint[] =
        dauMauRes.status === 'fulfilled' && dauMauRes.value.data
          ? dauMauRes.value.data.map((r: Record<string, unknown>) => ({
              day: new Date(r.day as string).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
              dau: Number(r.dau) || 0,
              mau: Number(r.mau) || 0,
              ratio: Number(r.ratio) || 0,
            }))
          : [];

      const cohort: CohortRow[] =
        cohortRes.status === 'fulfilled' && cohortRes.value.data
          ? cohortRes.value.data.map((r: Record<string, unknown>) => ({
              cohort_week: new Date(r.cohort_week as string).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
              week_number: Number(r.week_number),
              cohort_size: Number(r.cohort_size),
              retained: Number(r.retained),
              retention_rate: Number(r.retention_rate),
            }))
          : [];

      const newVsReturning: NewVsReturningPoint[] =
        newRetRes.status === 'fulfilled' && newRetRes.value.data
          ? newRetRes.value.data.map((r: Record<string, unknown>) => ({
              day: new Date(r.day as string).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
              new_listeners: Number(r.new_listeners) || 0,
              returning_listeners: Number(r.returning_listeners) || 0,
              total_listeners: Number(r.total_listeners) || 0,
            }))
          : [];

      const heatmap: HeatmapCell[] =
        heatmapRes.status === 'fulfilled' && heatmapRes.value.data
          ? heatmapRes.value.data.map((r: Record<string, unknown>) => ({
              day_of_week: Number(r.day_of_week),
              hour_of_day: Number(r.hour_of_day),
              avg_listeners: Number(r.avg_listeners) || 0,
            }))
          : [];

      const countriesDetailed: CountryListeners[] =
        countriesRes.status === 'fulfilled' && countriesRes.value.data
          ? countriesRes.value.data.map((r: Record<string, unknown>) => ({
              country: r.country as string,
              unique_listeners: Number(r.unique_listeners) || 0,
              total_sessions: Number(r.total_sessions) || 0,
              avg_duration_seconds: Number(r.avg_duration_seconds) || 0,
            }))
          : [];

      const programPerformance: ProgramPerformance[] =
        programRes.status === 'fulfilled' && programRes.value.data
          ? programRes.value.data.map((r: Record<string, unknown>) => ({
              slot_name: r.slot_name as string,
              period_label: r.period_label as string,
              slot_time: r.slot_time as string,
              avg_listeners: Number(r.avg_listeners) || 0,
              peak_listeners: Number(r.peak_listeners) || 0,
              sample_count: Number(r.sample_count) || 0,
            }))
          : [];

      setData({
        overview,
        dauMau,
        cohort,
        newVsReturning,
        heatmap,
        countriesDetailed,
        programPerformance,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados de retenção';
      setError(message);
      console.error('Retention stats error:', err);
    } finally {
      setLoading(false);
    }
  }, [daysBack]);

  useEffect(() => {
    fetchRetention();
  }, [fetchRetention]);

  return { data, loading, error, refresh: fetchRetention };
}
