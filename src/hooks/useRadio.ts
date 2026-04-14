import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RadioNowPlaying, ListenerInfo, ListenersByCountry, RadioData } from '../types/radio';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SNAPSHOT_INTERVAL = 5 * 60 * 1000; // Save snapshot every 5 minutes

const POLLING_INTERVAL = 30000; // 30 seconds

export function useRadio() {
  const [data, setData] = useState<RadioData>({
    nowPlaying: null,
    history: [],
    listeners: [],
    listenersByCountry: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastSnapshotRef = useRef<number>(0);

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

  const aggregateListenersByCountry = (listeners: ListenerInfo[]): ListenersByCountry[] => {
    const countryMap = new Map<string, number>();

    listeners.forEach((listener) => {
      const country = listener.location?.country || 'Unknown';
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });

    return Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
  };

  const fetchRadioData = useCallback(async () => {
    setError(null);

    try {
      // Fetch now playing data (includes history and basic listener count)
      const nowPlaying: RadioNowPlaying = await fetchFromProxy('nowplaying');

      // Try to fetch detailed listeners (may fail if no admin access)
      let listeners: ListenerInfo[] = [];
      let listenersByCountry: ListenersByCountry[] = [];

      try {
        listeners = await fetchFromProxy('listeners');
        listenersByCountry = aggregateListenersByCountry(listeners);
      } catch (listenerError) {
        // Listeners endpoint might require admin privileges
        console.warn('Could not fetch detailed listeners:', listenerError);
      }

      setData({
        nowPlaying,
        history: nowPlaying.song_history || [],
        listeners,
        listenersByCountry,
      });

      // Save snapshot to DB every 5 minutes
      const now = Date.now();
      if (now - lastSnapshotRef.current >= SNAPSHOT_INTERVAL) {
        lastSnapshotRef.current = now;
        const avgTime = listeners.length > 0
          ? Math.round(listeners.reduce((s, l) => s + (l.connected_time || 0), 0) / listeners.length)
          : 0;
        supabase.from('radio_listener_snapshots').insert({
          listeners_current: nowPlaying.listeners?.current ?? 0,
          listeners_unique: nowPlaying.listeners?.unique ?? 0,
          listeners_total: nowPlaying.listeners?.total ?? 0,
          avg_listening_time: avgTime,
          is_online: nowPlaying.is_online ?? false,
          is_live: nowPlaying.live?.is_live ?? false,
        }).then(({ error: snapErr }) => {
          if (snapErr) console.warn('Failed to save listener snapshot:', snapErr);
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados da rádio';
      setError(message);
      console.error('Radio fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFromProxy]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchRadioData();
  }, [fetchRadioData]);

  // Initial fetch and polling setup
  useEffect(() => {
    fetchRadioData();

    // Set up polling
    intervalRef.current = window.setInterval(fetchRadioData, POLLING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchRadioData]);

  return {
    ...data,
    loading,
    error,
    refresh,
  };
}
