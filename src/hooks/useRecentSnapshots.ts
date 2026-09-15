import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SnapshotPoint {
  time: string;
  listeners: number;
}

const REFRESH_INTERVAL = 5 * 60 * 1000;

async function loadRecentSnapshots(): Promise<SnapshotPoint[] | null> {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('radio_listener_snapshots')
    .select('listeners_current, recorded_at')
    .gte('recorded_at', twoHoursAgo)
    .order('recorded_at', { ascending: true });

  if (error) {
    console.error('Error fetching recent snapshots:', error);
    return null;
  }

  return (data ?? []).map((s) => ({
    time: new Date(s.recorded_at).toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Lisbon',
    }),
    listeners: s.listeners_current,
  }));
}

// Ouvintes simultâneos das últimas 2 horas (fotografias de 5 em 5 min).
export function useRecentSnapshots() {
  const [snapshots, setSnapshots] = useState<SnapshotPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      loadRecentSnapshots().then((points) => {
        if (!cancelled && points) setSnapshots(points);
      });

    load();
    const interval = window.setInterval(load, REFRESH_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return snapshots;
}
