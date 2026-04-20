import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Schedule, ScheduleWithEvent, DayOfWeek } from '../types';

export function useSchedule() {
  const [schedules, setSchedules] = useState<ScheduleWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('schedule')
        .select(`
          *,
          event:events(*)
        `)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('time', { ascending: true });

      if (fetchError) throw fetchError;
      setSchedules(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar programação');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const addToSchedule = async (
    eventId: string,
    dayOfWeek: DayOfWeek,
    time: string,
    endTime?: string | null,
    isAllDay?: boolean
  ): Promise<Schedule | null> => {
    try {
      // Validate: only 1 all-day event per day
      if (isAllDay) {
        const existingAllDay = schedules.find(
          (s) => s.day_of_week === dayOfWeek && s.is_all_day
        );
        if (existingAllDay) {
          setError(`Já existe um evento de dia inteiro neste dia (${existingAllDay.event?.name ?? 'evento'}). Apenas 1 é permitido.`);
          return null;
        }
      }

      const insertData: Record<string, unknown> = {
        event_id: eventId,
        day_of_week: dayOfWeek,
        time: isAllDay ? '00:00' : time,
        is_all_day: isAllDay ?? false,
      };
      if (endTime) {
        insertData.end_time = endTime;
      }

      const { data, error: insertError } = await supabase
        .from('schedule')
        .insert(insertData)
        .select(`
          *,
          event:events(*)
        `)
        .single();

      if (insertError) throw insertError;

      setSchedules((prev) => [...prev, data].sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
        return a.time.localeCompare(b.time);
      }));
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar à programação';
      if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        setError('Este evento já está programado para este dia e horário');
      } else {
        setError(errorMessage);
      }
      return null;
    }
  };

  const removeFromSchedule = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('schedule')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setSchedules((prev) => prev.filter((s) => s.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover da programação');
      return false;
    }
  };

  const updateScheduleTime = async (
    id: string,
    newTime: string
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('schedule')
        .update({ time: newTime })
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchSchedules();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar horário');
      return false;
    }
  };

  const getScheduleByDay = (dayOfWeek: DayOfWeek): ScheduleWithEvent[] => {
    return schedules.filter((s) => s.day_of_week === dayOfWeek);
  };

  return {
    schedules,
    loading,
    error,
    fetchSchedules,
    addToSchedule,
    removeFromSchedule,
    updateScheduleTime,
    getScheduleByDay,
    clearError: () => setError(null),
  };
}
