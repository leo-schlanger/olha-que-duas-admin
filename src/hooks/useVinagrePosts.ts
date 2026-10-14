import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { parseVinagrePost, type VinagreDraft, type VinagrePost } from '../types/vinagre';

export function useVinagrePosts(programId: string | null) {
  const [posts, setPosts] = useState<VinagrePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!programId) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('vinagre_posts')
      .select('*')
      .eq('program_id', programId)
      .order('published_at', { ascending: false, nullsFirst: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setPosts(
      (data ?? [])
        .map(parseVinagrePost)
        .filter((post): post is VinagrePost => post !== null),
    );
    setLoading(false);
  }, [programId]);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  const savePost = async (
    draft: VinagreDraft,
    id?: string,
  ): Promise<string | null> => {
    setError(null);
    const { data: programClash } = await supabase
      .from('exclusive_programs')
      .select('id')
      .eq('slug', draft.slug)
      .limit(1);
    if (programClash && programClash.length > 0) {
      const message = 'Este endereço já é um programa. Escolhe outro.';
      setError(message);
      return message;
    }
    const payload = {
      ...draft,
      updated_at: new Date().toISOString(),
    };
    const query = id
      ? supabase.from('vinagre_posts').update(payload).eq('id', id)
      : supabase.from('vinagre_posts').insert(payload);

    const { error: saveError } = await query;
    if (saveError) {
      const message =
        saveError.code === '23505'
          ? 'Já existe uma notícia com este endereço.'
          : saveError.message;
      setError(message);
      return message;
    }
    await fetchPosts();
    return null;
  };

  const deletePost = async (id: string): Promise<boolean> => {
    setError(null);
    const { error: deleteError } = await supabase
      .from('vinagre_posts')
      .delete()
      .eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return false;
    }
    setPosts((current) => current.filter((post) => post.id !== id));
    return true;
  };

  return { posts, loading, error, savePost, deletePost };
}
