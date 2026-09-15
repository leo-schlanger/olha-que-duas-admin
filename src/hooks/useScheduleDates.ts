import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { addDays, lisbonToday } from '../lib/scheduleDates';
import type { ScheduleDateWithEvent } from '../types';

// Mostra as emissões dos últimos 30 dias (para confirmar o que passou) e
// todas as futuras.
const PAST_DAYS = 30;

export function useScheduleDates() {
  const [dates, setDates] = useState<ScheduleDateWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('schedule_dates')
        .select('*, event:events(*)')
        .gte('event_date', addDays(lisbonToday(), -PAST_DAYS))
        .order('event_date', { ascending: true })
        .order('time', { ascending: true });

      if (fetchError) throw fetchError;
      setDates((data || []) as ScheduleDateWithEvent[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar eventos com data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  const addDate = async (
    eventId: string,
    eventDate: string,
    time: string,
    endTime?: string | null,
    isAllDay?: boolean
  ): Promise<boolean> => {
    try {
      if (isAllDay && dates.some((d) => d.event_date === eventDate && d.is_all_day && d.is_active)) {
        setError('Já existe um evento de dia inteiro nesta data. Apenas 1 é permitido.');
        return false;
      }

      const { error: insertError } = await supabase.from('schedule_dates').insert({
        event_id: eventId,
        event_date: eventDate,
        time: isAllDay ? '00:00' : time,
        end_time: isAllDay ? null : endTime ?? null,
        is_all_day: isAllDay ?? false,
      });

      if (insertError) throw insertError;
      await fetchDates();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar evento com data';
      setError(
        message.includes('duplicate') || message.includes('unique')
          ? 'Este evento já está marcado para esta data e hora'
          : message
      );
      return false;
    }
  };

  const removeDate = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase.from('schedule_dates').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setDates((prev) => prev.filter((d) => d.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover evento com data');
      return false;
    }
  };

  return { dates, loading, error, addDate, removeDate, clearError: () => setError(null) };
}
