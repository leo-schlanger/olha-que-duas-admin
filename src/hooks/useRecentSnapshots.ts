import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SnapshotPoint {
  time: string;
  listeners: number;
}

const REFRESH_INTERVAL = 5 * 60 * 1000;

async function loadRecentSnapshots(): Promise<SnapshotPoint[] | null> {
  const now = Date.now();
  // Bot connections (e.g. a server tied to the stream 24 h) are discounted,
  // same as the Audience tab (supabase/audiencia-sem-robos.sql).
  const { data, error } = await supabase.rpc('radio_human_snapshots', {
    p_start: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    p_end: new Date(now + 60 * 1000).toISOString(),
  });

  if (error) {
    console.error('Error fetching recent snapshots:', error);
    return null;
  }

  const rows = (Array.isArray(data) ? data : []) as Array<{ recorded_at: string; listeners: number }>;
  return [...rows]
    .sort((x, y) => x.recorded_at.localeCompare(y.recorded_at))
    .map((s) => ({
      time: new Date(s.recorded_at).toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Lisbon',
      }),
      listeners: Number(s.listeners),
    }));
}

// Ouvintes simultâneos das últimas 2 horas (fotografias de 5 em 5 min, sem robôs).
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
