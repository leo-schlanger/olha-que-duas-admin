import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Métricas de audiência calculadas no Supabase (supabase/analytics-v2.sql).
// Ouvinte = ligação (IP + user-agent) com pelo menos 1 minuto no período.

export type ListenerSource = 'app_android' | 'browser' | 'mytuner' | 'ios' | 'outras_apps' | 'bot';

export interface AudienceOverview {
  period_start: string;
  period_end: string;
  listeners: number;
  sessions: number;
  short_connections: number;
  listening_hours: number;
  avg_session_minutes: number | null;
  median_session_minutes: number | null;
  top3_share: number | null;
  avg_concurrent: number | null;
  peak_concurrent: number | null;
  peak_at: string | null;
  pct_time_with_listeners: number | null;
  snapshot_coverage: number | null;
  prev_listeners: number;
  prev_sessions: number;
  prev_listening_hours: number;
  prev_avg_concurrent: number | null;
}

export interface AudienceSeriesPoint {
  bucket_start: string;
  bucket_label: string;
  listeners: number;
  sessions: number;
  listening_hours: number;
  avg_concurrent: number | null;
  peak_concurrent: number | null;
}

export interface AudienceBySource {
  source: ListenerSource;
  listeners: number;
  sessions: number;
  short_connections: number;
  listening_hours: number;
  avg_session_minutes: number | null;
  hours_share: number;
}

export interface AudienceByCountry {
  country: string;
  listeners: number;
  listening_hours: number;
}

export interface HeatmapCell {
  day_of_week: number;
  hour_of_day: number;
  avg_listeners: number;
}

export interface ProgramPerformance {
  program: string;
  kind: 'grelha' | 'evento';
  schedule_label: string;
  occurrences: number;
  avg_listeners: number | null;
  peak_listeners: number;
  listeners: number;
  listening_hours: number;
  hours_per_occurrence: number;
}

export interface TopListener {
  listener_hash: string;
  source: ListenerSource;
  ip_masked: string | null;
  city: string | null;
  country: string | null;
  listening_hours: number;
  sessions: number;
  active_days: number;
  hours_share: number;
  last_seen: string;
}

export interface AudienceData {
  overview: AudienceOverview | null;
  series: AudienceSeriesPoint[];
  bySource: AudienceBySource[];
  byCountry: AudienceByCountry[];
  heatmap: HeatmapCell[];
  programs: ProgramPerformance[];
  topListeners: TopListener[];
}

const emptyData: AudienceData = {
  overview: null,
  series: [],
  bySource: [],
  byCountry: [],
  heatmap: [],
  programs: [],
  topListeners: [],
};

// O PostgREST devolve NUMERIC como string: converter as colunas numéricas.
const NUMERIC_KEYS = new Set([
  'listeners', 'sessions', 'short_connections', 'listening_hours', 'avg_session_minutes',
  'median_session_minutes', 'top3_share', 'avg_concurrent', 'peak_concurrent',
  'pct_time_with_listeners', 'snapshot_coverage', 'prev_listeners', 'prev_sessions',
  'prev_listening_hours', 'prev_avg_concurrent', 'hours_share', 'day_of_week', 'hour_of_day',
  'avg_listeners', 'occurrences', 'peak_listeners', 'hours_per_occurrence', 'active_days',
]);

function normalizeRow<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = NUMERIC_KEYS.has(key) && value != null ? Number(value) : value;
  }
  return out as T;
}

async function loadAudience(daysBack: number): Promise<{ data: AudienceData; error: string | null }> {
  const [overviewRes, seriesRes, sourceRes, countryRes, heatmapRes, programsRes, topRes] = await Promise.all([
    supabase.rpc('radio_audience_overview', { days_back: daysBack }),
    supabase.rpc('radio_audience_series', { days_back: daysBack }),
    supabase.rpc('radio_audience_by_source', { days_back: daysBack }),
    supabase.rpc('radio_audience_by_country', { days_back: daysBack }),
    supabase.rpc('radio_listener_heatmap', { days_back: daysBack }),
    supabase.rpc('radio_program_performance', { days_back: daysBack }),
    supabase.rpc('radio_top_listeners', { days_back: daysBack, max_rows: 10 }),
  ]);

  const firstError = [overviewRes, seriesRes, sourceRes, countryRes, heatmapRes, programsRes, topRes].find((r) => r.error)?.error;
  if (firstError) console.error('Audience stats error:', firstError);

  const rows = (res: { data: unknown }) => (Array.isArray(res.data) ? (res.data as Record<string, unknown>[]) : []);
  const overviewRow = rows(overviewRes)[0];

  return {
    error: firstError ? `Erro ao carregar audiência: ${firstError.message}` : null,
    data: {
      overview: overviewRow ? normalizeRow<AudienceOverview>(overviewRow) : null,
      series: rows(seriesRes).map((r) => normalizeRow<AudienceSeriesPoint>(r)),
      bySource: rows(sourceRes).map((r) => normalizeRow<AudienceBySource>(r)),
      byCountry: rows(countryRes).map((r) => normalizeRow<AudienceByCountry>(r)),
      heatmap: rows(heatmapRes).map((r) => normalizeRow<HeatmapCell>(r)),
      programs: rows(programsRes).map((r) => normalizeRow<ProgramPerformance>(r)),
      topListeners: rows(topRes).map((r) => normalizeRow<TopListener>(r)),
    },
  };
}

export function useAudienceStats(daysBack: number) {
  const [refreshCount, setRefreshCount] = useState(0);
  const [result, setResult] = useState<{ key: string; data: AudienceData; error: string | null } | null>(null);
  const requestKey = `${daysBack}:${refreshCount}`;

  useEffect(() => {
    let cancelled = false;
    loadAudience(daysBack).then((loaded) => {
      if (!cancelled) setResult({ key: `${daysBack}:${refreshCount}`, ...loaded });
    });
    return () => {
      cancelled = true;
    };
  }, [daysBack, refreshCount]);

  const refresh = useCallback(() => setRefreshCount((n) => n + 1), []);

  return {
    // Mantém os dados anteriores visíveis enquanto o novo período carrega
    data: result?.data ?? emptyData,
    loading: result?.key !== requestKey,
    error: result?.key === requestKey ? result.error : null,
    refresh,
  };
}
