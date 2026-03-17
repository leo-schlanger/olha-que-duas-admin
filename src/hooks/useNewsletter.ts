import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Subscriber, SubscribersResponse, NewsletterCampaign } from '../types';

export function useNewsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscribers = useCallback(async (limit = 50, offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brevo-subscribers?limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar subscritores');
      }

      const result: SubscribersResponse = await response.json();

      setSubscribers(result.subscribers);
      setTotalSubscribers(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar subscritores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const sendNewsletter = async (campaign: NewsletterCampaign): Promise<boolean> => {
    setSending(true);
    setError(null);
    try {
      const { error: sendError } = await supabase.functions.invoke('brevo-send', {
        body: campaign,
      });

      if (sendError) throw sendError;

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar newsletter');
      return false;
    } finally {
      setSending(false);
    }
  };

  const sendTestEmail = async (
    campaign: Omit<NewsletterCampaign, 'testEmail'>,
    testEmail: string
  ): Promise<boolean> => {
    return sendNewsletter({ ...campaign, testEmail });
  };

  return {
    subscribers,
    totalSubscribers,
    loading,
    sending,
    error,
    fetchSubscribers,
    sendNewsletter,
    sendTestEmail,
  };
}
