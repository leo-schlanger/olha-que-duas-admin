import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface RadioPeriodStats {
  avgListeners: number;
  maxListeners: number;
  peakUniqueListeners: number;
  avgListeningTime: number; // seconds
  tlh: number; // Total Listening Hours
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
  recentSnapshots: RadioHistoryPoint[];
}

const emptyStats: RadioPeriodStats = {
  avgListeners: 0,
  maxListeners: 0,
  peakUniqueListeners: 0,
  avgListeningTime: 0,
  tlh: 0,
  snapshotCount: 0,
};

export function useRadioStats() {
  const [stats, setStats] = useState<RadioStatsData>({
    today: emptyStats,
    week: emptyStats,
    month: emptyStats,
    history: [],
    recentSnapshots: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

    try {
      // Try materialized views first (faster), fallback to raw snapshots
      const [dailyRes, hourlyRes, todayRes, recentRes] = await Promise.allSettled([
        supabase.rpc('get_daily_stats', { days_back: 30 }),
        supabase.rpc('get_hourly_stats', { hours_back: 168 }), // 7 days
        // Today's data must come from raw snapshots (not yet in materialized views)
        supabase
          .from('radio_listener_snapshots')
          .select('listeners_current, listeners_unique, avg_listening_time')
          .gte('recorded_at', startOfDay)
          .order('recorded_at', { ascending: true }),
        // Recent snapshots for real-time chart (last 2 hours)
        supabase
          .from('radio_listener_snapshots')
          .select('listeners_current, recorded_at')
          .gte('recorded_at', twoHoursAgo)
          .order('recorded_at', { ascending: true }),
      ]);

      const SNAPSHOT_INTERVAL_HOURS = 5 / 60;

      // --- Today (raw snapshots) ---
      let today = emptyStats;
      if (todayRes.status === 'fulfilled' && todayRes.value.data && todayRes.value.data.length > 0) {
        const items = todayRes.value.data;
        const totalCurrent = items.reduce((s: number, i: Record<string, number | null>) => s + (i.listeners_current || 0), 0);
        const validTimeItems = items.filter((i: Record<string, number | null>) => i.avg_listening_time != null && (i.avg_listening_time as number) > 0);

        today = {
          avgListeners: Math.round(totalCurrent / items.length),
          maxListeners: Math.max(...items.map((i: Record<string, number>) => i.listeners_current || 0)),
          peakUniqueListeners: Math.max(...items.map((i: Record<string, number>) => i.listeners_unique || 0)),
          avgListeningTime: validTimeItems.length > 0
            ? Math.round(validTimeItems.reduce((s: number, i: Record<string, number>) => s + (i.avg_listening_time || 0), 0) / validTimeItems.length)
            : 0,
          tlh: parseFloat((totalCurrent * SNAPSHOT_INTERVAL_HOURS).toFixed(1)),
          snapshotCount: items.length,
        };
      }

      // --- Week & Month (from materialized views or fallback) ---
      let week = emptyStats;
      let month = emptyStats;

      if (dailyRes.status === 'fulfilled' && dailyRes.value.data && dailyRes.value.data.length > 0) {
        const dailyData = dailyRes.value.data as Array<{
          day: string;
          avg_listeners: number;
          peak_listeners: number;
          peak_unique: number;
          avg_listen_time: number;
          tlh: number;
        }>;

        const now7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekData = dailyData.filter((d) => new Date(d.day) >= now7d);

        const calcFromDaily = (items: typeof dailyData): RadioPeriodStats => {
          if (items.length === 0) return emptyStats;
          const totalAvg = items.reduce((s, i) => s + (i.avg_listeners || 0), 0);
          const validTime = items.filter((i) => i.avg_listen_time != null && i.avg_listen_time > 0);
          return {
            avgListeners: Math.round(totalAvg / items.length),
            maxListeners: Math.max(...items.map((i) => i.peak_listeners || 0)),
            peakUniqueListeners: Math.max(...items.map((i) => i.peak_unique || 0)),
            avgListeningTime: validTime.length > 0
              ? Math.round(validTime.reduce((s, i) => s + i.avg_listen_time, 0) / validTime.length)
              : 0,
            tlh: parseFloat(items.reduce((s, i) => s + (i.tlh || 0), 0).toFixed(1)),
            snapshotCount: items.length,
          };
        };

        week = calcFromDaily(weekData);
        month = calcFromDaily(dailyData);
      } else {
        // Fallback: fetch raw snapshots (original behavior)
        const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: snapshots } = await supabase
          .from('radio_listener_snapshots')
          .select('listeners_current, listeners_unique, avg_listening_time, recorded_at')
          .gte('recorded_at', startOfMonth)
          .order('recorded_at', { ascending: true });

        if (snapshots && snapshots.length > 0) {
          const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

          const calcStats = (items: typeof snapshots): RadioPeriodStats => {
            if (items.length === 0) return emptyStats;
            const totalCurrent = items.reduce((s, i) => s + i.listeners_current, 0);
            const validTimeItems = items.filter((i) => i.avg_listening_time != null && i.avg_listening_time > 0);
            return {
              avgListeners: Math.round(totalCurrent / items.length),
              maxListeners: Math.max(...items.map((i) => i.listeners_current)),
              peakUniqueListeners: Math.max(...items.map((i) => i.listeners_unique)),
              avgListeningTime: validTimeItems.length > 0
                ? Math.round(validTimeItems.reduce((s, i) => s + i.avg_listening_time, 0) / validTimeItems.length)
                : 0,
              tlh: parseFloat((totalCurrent * SNAPSHOT_INTERVAL_HOURS).toFixed(1)),
              snapshotCount: items.length,
            };
          };

          const weekSnaps = snapshots.filter((s) => s.recorded_at >= startOfWeek);
          week = calcStats(weekSnaps);
          month = calcStats(snapshots);
        }
      }

      // --- History (from materialized hourly views or fallback) ---
      let history: RadioHistoryPoint[] = [];
      if (hourlyRes.status === 'fulfilled' && hourlyRes.value.data && hourlyRes.value.data.length > 0) {
        history = hourlyRes.value.data.map((h: { hour: string; avg_listeners: number }) => ({
          time: new Date(h.hour).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }) +
            ' ' + new Date(h.hour).getHours().toString().padStart(2, '0') + 'h',
          listeners: h.avg_listeners,
        }));
      }

      // --- Recent snapshots (always from raw data) ---
      let recentSnapshots: RadioHistoryPoint[] = [];
      if (recentRes.status === 'fulfilled' && recentRes.value.data) {
        recentSnapshots = recentRes.value.data.map((s: { recorded_at: string; listeners_current: number }) => ({
          time: new Date(s.recorded_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
          listeners: s.listeners_current,
        }));
      }

      setStats({ today, week, month, history, recentSnapshots });
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
