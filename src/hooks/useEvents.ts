import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Event } from '../types';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setEvents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (
    name: string,
    description: string | null,
    iconFile: File
  ): Promise<Event | null> => {
    try {
      // Upload icon to storage
      const fileExt = iconFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `icons/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-icons')
        .upload(filePath, iconFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('event-icons')
        .getPublicUrl(filePath);

      // Create event record
      const { data, error: insertError } = await supabase
        .from('events')
        .insert({
          name,
          description,
          icon_url: urlData.publicUrl,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setEvents((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar evento');
      return null;
    }
  };

  const updateEvent = async (
    id: string,
    updates: Partial<Pick<Event, 'name' | 'description' | 'is_active'>>,
    newIconFile?: File
  ): Promise<boolean> => {
    try {
      let iconUrl: string | undefined;

      if (newIconFile) {
        // Upload new icon
        const fileExt = newIconFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `icons/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-icons')
          .upload(filePath, newIconFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('event-icons')
          .getPublicUrl(filePath);

        iconUrl = urlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from('events')
        .update({
          ...updates,
          ...(iconUrl && { icon_url: iconUrl }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchEvents();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar evento');
      return false;
    }
  };

  const toggleEventActive = async (id: string, isActive: boolean): Promise<boolean> => {
    return updateEvent(id, { is_active: isActive });
  };

  const deleteEvent = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setEvents((prev) => prev.filter((e) => e.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir evento');
      return false;
    }
  };

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    toggleEventActive,
    deleteEvent,
  };
}
