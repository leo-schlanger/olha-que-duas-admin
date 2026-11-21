import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { InsightsExtra } from './insights';

// Retention and summary extras (supabase/audiencia-sem-robos.sql).
export function useAudienceInsights(daysBack: number, refreshKey: number) {
  const [state, setState] = useState<{ key: string; data: InsightsExtra | null; error: string | null } | null>(null);
  const key = `${daysBack}:${refreshKey}`;

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('radio_audience_insights', { days_back: daysBack });
    // PGRST202 = function not deployed yet: the cards just stay hidden
    if (error && error.code !== 'PGRST202') console.error('Audience insights error:', error);
    const row = Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined) : undefined;
    if (!row) return { data: null, error: error && error.code !== 'PGRST202' ? error.message : null };
    const num = (k: string) => Number(row[k] ?? 0);
    return {
      error: null,
      data: {
        sessions_under_5: num('sessions_under_5'),
        sessions_5_15: num('sessions_5_15'),
        sessions_15_60: num('sessions_15_60'),
        sessions_over_60: num('sessions_over_60'),
        returning_listeners: num('returning_listeners'),
        multi_day_listeners: num('multi_day_listeners'),
        peak_snapshots: num('peak_snapshots'),
        history_start: (row.history_start as string | null) ?? null,
        prev_complete: row.prev_complete === true,
      },
    };
  }, [daysBack]);

  useEffect(() => {
    let cancelled = false;
    load().then((r) => {
      if (!cancelled) setState({ key, ...r });
    });
    return () => {
      cancelled = true;
    };
  }, [load, key]);

  const ready = state?.key === key;
  return { insights: ready ? state.data : null, insightsLoading: !ready, insightsError: ready ? state.error : null };
}
