import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { DailyScheduleSlot } from '../types';

const ICONS_BUCKET = 'schedule-icons';

// Upload do ícone/foto do bloco para o storage (mesmo fluxo dos eventos)
async function uploadIcon(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `icons/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(ICONS_BUCKET)
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from(ICONS_BUCKET)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export function useDailySchedule() {
  const [slots, setSlots] = useState<DailyScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('daily_schedule')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      setSlots(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar programação diária');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const addSlot = async (slot: {
    period: string;
    period_label: string;
    time_range: string;
    slot_time: string;
    slot_name: string;
    genres?: string;
    sort_order: number;
  }, iconFile?: File | null): Promise<DailyScheduleSlot | null> => {
    try {
      const icon_url = iconFile ? await uploadIcon(iconFile) : '';
      const { data, error: insertError } = await supabase
        .from('daily_schedule')
        .insert({ ...slot, icon_url })
        .select()
        .single();

      if (insertError) throw insertError;

      setSlots((prev) => [...prev, data].sort((a, b) => {
        const periodOrder = ['manha', 'tarde', 'noite', 'madrugada'];
        const pDiff = periodOrder.indexOf(a.period) - periodOrder.indexOf(b.period);
        if (pDiff !== 0) return pDiff;
        return a.sort_order - b.sort_order;
      }));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar slot');
      return null;
    }
  };

  const updateSlot = async (
    id: string,
    updates: Partial<Pick<DailyScheduleSlot, 'slot_time' | 'slot_name' | 'genres' | 'icon_url' | 'sort_order'>>,
    newIconFile?: File | null
  ): Promise<boolean> => {
    try {
      const iconUrl = newIconFile ? await uploadIcon(newIconFile) : undefined;
      const { error: updateError } = await supabase
        .from('daily_schedule')
        .update({ ...updates, ...(iconUrl !== undefined && { icon_url: iconUrl }) })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchSlots();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar slot');
      return false;
    }
  };

  const removeSlot = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('daily_schedule')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setSlots((prev) => prev.filter((s) => s.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover slot');
      return false;
    }
  };

  const toggleActive = async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('daily_schedule')
        .update({ is_active: isActive })
        .eq('id', id);

      if (updateError) throw updateError;
      setSlots((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: isActive } : s))
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar estado');
      return false;
    }
  };

  const getSlotsByPeriod = (period: string): DailyScheduleSlot[] => {
    return slots.filter((s) => s.period === period);
  };

  return {
    slots,
    loading,
    error,
    fetchSlots,
    addSlot,
    updateSlot,
    removeSlot,
    toggleActive,
    getSlotsByPeriod,
    clearError: () => setError(null),
  };
}
