import { useState, useEffect, useCallback, useRef } from 'react';
import type { Subscriber, SubscribersResponse, NewsletterCampaign, Campaign, CampaignsResponse } from '../types';

export function useNewsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [sending, setSending] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isFetchingCampaigns = useRef(false);

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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brevo-send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(campaign),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar newsletter');
      }

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

  const addSubscriber = async (email: string, nome?: string): Promise<boolean> => {
    setAdding(true);
    setError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brevo-subscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email, nome }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao adicionar subscritor');
      }

      // Refresh the list
      await fetchSubscribers();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar subscritor');
      return false;
    } finally {
      setAdding(false);
    }
  };

  const removeSubscriber = async (email: string): Promise<boolean> => {
    setRemoving(email);
    setError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brevo-unsubscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao remover subscritor');
      }

      // Update local state immediately
      setSubscribers((prev) => prev.filter((s) => s.email !== email));
      setTotalSubscribers((prev) => prev - 1);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover subscritor');
      return false;
    } finally {
      setRemoving(null);
    }
  };

  const fetchCampaigns = useCallback(async (limit = 20, offset = 0) => {
    // Prevent multiple concurrent fetches
    if (isFetchingCampaigns.current) return;
    isFetchingCampaigns.current = true;

    setLoadingCampaigns(true);
    setError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brevo-campaigns?limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar campanhas');
      }

      const result: CampaignsResponse = await response.json();

      setCampaigns(result.campaigns);
      setTotalCampaigns(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar campanhas');
    } finally {
      setLoadingCampaigns(false);
      isFetchingCampaigns.current = false;
    }
  }, []);

  return {
    subscribers,
    totalSubscribers,
    campaigns,
    totalCampaigns,
    loading,
    loadingCampaigns,
    sending,
    adding,
    removing,
    error,
    fetchSubscribers,
    fetchCampaigns,
    sendNewsletter,
    sendTestEmail,
    addSubscriber,
    removeSubscriber,
  };
}
