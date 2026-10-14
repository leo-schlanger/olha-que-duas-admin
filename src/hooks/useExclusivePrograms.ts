import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  parseExclusiveProgram,
  type ExclusiveProgram,
  type ExclusiveProgramDraft,
} from '../types/exclusivo';

export function useExclusivePrograms() {
  const [programs, setPrograms] = useState<ExclusiveProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('exclusive_programs')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('title', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setPrograms(
      (data ?? [])
        .map(parseExclusiveProgram)
        .filter((program): program is ExclusiveProgram => program !== null),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchPrograms();
  }, [fetchPrograms]);

  const saveProgram = async (
    draft: ExclusiveProgramDraft,
    id?: string,
  ): Promise<string | null> => {
    setError(null);
    const { data: postClash } = await supabase
      .from('vinagre_posts')
      .select('id')
      .eq('slug', draft.slug)
      .limit(1);
    if (postClash && postClash.length > 0) {
      const message = 'Este endereço já é uma notícia. Escolhe outro.';
      setError(message);
      return message;
    }

    const payload = { ...draft, updated_at: new Date().toISOString() };
    const query = id
      ? supabase.from('exclusive_programs').update(payload).eq('id', id)
      : supabase.from('exclusive_programs').insert(payload);
    const { error: saveError } = await query;
    if (saveError) {
      const message =
        saveError.code === '23505'
          ? 'Já existe um programa com este endereço.'
          : saveError.message;
      setError(message);
      return message;
    }
    await fetchPrograms();
    return null;
  };

  const deleteProgram = async (id: string): Promise<boolean> => {
    setError(null);
    const { error: deleteError } = await supabase
      .from('exclusive_programs')
      .delete()
      .eq('id', id);
    if (deleteError) {
      const message = deleteError.code === '23503'
        ? 'Apaga primeiro as notícias deste programa.'
        : deleteError.message;
      setError(message);
      return false;
    }
    setPrograms((current) => current.filter((program) => program.id !== id));
    return true;
  };

  return { programs, loading, error, saveProgram, deleteProgram };
}
