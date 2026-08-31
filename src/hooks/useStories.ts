import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { readingMinutes, slugify } from '../lib/stories';
import type { Story, Episode, StoryDraft, EpisodeDraft } from '../types/stories';

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setStories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar histórias');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const createStory = async (
    draft: Omit<StoryDraft, 'slug'> & { slug?: string }
  ): Promise<Story | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('stories')
        .insert({ ...draft, slug: draft.slug || slugify(draft.title) })
        .select()
        .single();

      if (insertError) throw insertError;
      setStories((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar história');
      return null;
    }
  };

  const updateStory = async (
    id: string,
    updates: Partial<StoryDraft>
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('stories')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchStories();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar história');
      return false;
    }
  };

  const deleteStory = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('stories')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setStories((prev) => prev.filter((s) => s.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao apagar história');
      return false;
    }
  };

  return {
    stories,
    loading,
    error,
    fetchStories,
    createStory,
    updateStory,
    deleteStory,
  };
}

export function useEpisodes(storyId: string | null) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEpisodes = useCallback(async () => {
    if (!storyId) {
      setEpisodes([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('story_episodes')
        .select('*')
        .eq('story_id', storyId)
        .order('number', { ascending: true });

      if (fetchError) throw fetchError;
      setEpisodes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar episódios');
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  /** O próximo número livre — evita colidir com o UNIQUE(story_id, number). */
  const nextNumber = episodes.reduce((max, ep) => Math.max(max, ep.number), 0) + 1;

  const createEpisode = async (draft: EpisodeDraft): Promise<Episode | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('story_episodes')
        .insert({ ...draft, reading_minutes: readingMinutes(draft.content) })
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchEpisodes();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar episódio');
      return null;
    }
  };

  const updateEpisode = async (
    id: string,
    updates: Partial<EpisodeDraft>
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('story_episodes')
        .update({
          ...updates,
          ...(updates.content !== undefined && {
            reading_minutes: readingMinutes(updates.content),
          }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchEpisodes();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar episódio');
      return false;
    }
  };

  const deleteEpisode = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('story_episodes')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setEpisodes((prev) => prev.filter((e) => e.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao apagar episódio');
      return false;
    }
  };

  return {
    episodes,
    loading,
    error,
    nextNumber,
    fetchEpisodes,
    createEpisode,
    updateEpisode,
    deleteEpisode,
  };
}
