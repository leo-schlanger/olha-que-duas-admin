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

  const fetchCampaigns = useCallback(async (limit = 20, offset = 0, status = 'sent') => {
    // Prevent multiple concurrent fetches
    if (isFetchingCampaigns.current) return;
    isFetchingCampaigns.current = true;

    setLoadingCampaigns(true);
    setError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brevo-campaigns?limit=${limit}&offset=${offset}&status=${status}`,
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
    error,
    fetchSubscribers,
    fetchCampaigns,
    sendNewsletter,
    sendTestEmail,
  };
}
