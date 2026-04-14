import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface RadioPeriodStats {
  avgListeners: number;
  maxListeners: number;
  totalUnique: number;
  avgListeningTime: number; // seconds
  snapshotCount: number;
}

export interface RadioHistoryPoint {
  time: string;
  listeners: number;
}

export interface RadioStatsData {
  today: RadioPeriodStats;
  week: RadioPeriodStats;
  month: RadioPeriodStats;
  history: RadioHistoryPoint[];
}

const emptyStats: RadioPeriodStats = {
  avgListeners: 0,
  maxListeners: 0,
  totalUnique: 0,
  avgListeningTime: 0,
  snapshotCount: 0,
};

export function useRadioStats() {
  const [stats, setStats] = useState<RadioStatsData>({
    today: emptyStats,
    week: emptyStats,
    month: emptyStats,
    history: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    try {
      // Fetch all snapshots from the last 30 days
      const { data: snapshots } = await supabase
        .from('radio_listener_snapshots')
        .select('*')
        .gte('recorded_at', startOfMonth)
        .order('recorded_at', { ascending: true });

      if (!snapshots || snapshots.length === 0) {
        setStats({ today: emptyStats, week: emptyStats, month: emptyStats, history: [] });
        setLoading(false);
        return;
      }

      const calcStats = (items: typeof snapshots): RadioPeriodStats => {
        if (items.length === 0) return emptyStats;
        const totalCurrent = items.reduce((s, i) => s + i.listeners_current, 0);
        const maxCurrent = Math.max(...items.map((i) => i.listeners_current));
        const maxUnique = Math.max(...items.map((i) => i.listeners_unique));
        const totalTime = items.reduce((s, i) => s + (i.avg_listening_time || 0), 0);
        return {
          avgListeners: Math.round(totalCurrent / items.length),
          maxListeners: maxCurrent,
          totalUnique: maxUnique,
          avgListeningTime: Math.round(totalTime / items.length),
          snapshotCount: items.length,
        };
      };

      const todaySnapshots = snapshots.filter((s) => s.recorded_at >= startOfDay);
      const weekSnapshots = snapshots.filter((s) => s.recorded_at >= startOfWeek);

      // Build hourly history for chart (last 7 days, grouped by hour)
      const hourlyMap = new Map<string, { total: number; count: number }>();
      const last7d = snapshots.filter((s) => s.recorded_at >= startOfWeek);
      for (const snap of last7d) {
        const date = new Date(snap.recorded_at);
        const key = `${date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} ${date.getHours().toString().padStart(2, '0')}h`;
        const entry = hourlyMap.get(key) || { total: 0, count: 0 };
        entry.total += snap.listeners_current;
        entry.count += 1;
        hourlyMap.set(key, entry);
      }

      const history: RadioHistoryPoint[] = Array.from(hourlyMap.entries()).map(([time, val]) => ({
        time,
        listeners: Math.round(val.total / val.count),
      }));

      setStats({
        today: calcStats(todaySnapshots),
        week: calcStats(weekSnapshots),
        month: calcStats(snapshots),
        history,
      });
    } catch (err) {
      console.error('Error fetching radio stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refresh: fetchStats };
}
