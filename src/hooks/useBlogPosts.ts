import { useState, useEffect, useCallback } from 'react';
import type { BlogPost } from '../types';

// This fetches posts from the main Olha que Duas website
// The blog data comes from Supabase (same project)
import { supabase } from '../lib/supabase';

export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch published posts from the blog table
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select('id, title, summary, image_url, slug, category, published_at')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;

      setPosts(data || []);
    } catch (err) {
      // If table doesn't exist or other error, provide mock data for development
      console.warn('Could not fetch posts:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar posts');
      // Set empty array - the component will handle the empty state
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    error,
    fetchPosts,
  };
}
