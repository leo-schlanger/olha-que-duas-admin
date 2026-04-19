import { useState, useEffect, useCallback, useRef } from 'react';
import type { Subscriber, SubscribersResponse, NewsletterCampaign, Campaign, CampaignsResponse, SubscriberGroup, GroupsResponse } from '../types';

export function useNewsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [groups, setGroups] = useState<SubscriberGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [sending, setSending] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [movingSubscribers, setMovingSubscribers] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingCampaigns = useRef(false);

  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const headers = {
    'Authorization': `Bearer ${anonKey}`,
  };

  const jsonHeaders = {
    ...headers,
    'Content-Type': 'application/json',
  };

  // ===== GROUPS =====

  const fetchGroups = useCallback(async () => {
    setLoadingGroups(true);
    setError(null);
    try {
      const response = await fetch(
        `${baseUrl}/functions/v1/brevo-lists`,
        { headers }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar grupos');
      }

      const result: GroupsResponse = await response.json();
      setGroups(result.groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar grupos');
    } finally {
      setLoadingGroups(false);
    }
  }, [baseUrl, anonKey]);

  const createGroup = async (name: string): Promise<boolean> => {
    setSavingGroup(true);
    setError(null);
    try {
      const response = await fetch(
        `${baseUrl}/functions/v1/brevo-lists`,
        {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({ name }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar grupo');
      }

      await fetchGroups();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar grupo');
      return false;
    } finally {
      setSavingGroup(false);
    }
  };

  const updateGroup = async (id: number, name: string): Promise<boolean> => {
    setSavingGroup(true);
    setError(null);
    try {
      const response = await fetch(
        `${baseUrl}/functions/v1/brevo-lists`,
        {
          method: 'PUT',
          headers: jsonHeaders,
          body: JSON.stringify({ id, name }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao renomear grupo');
      }

      await fetchGroups();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao renomear grupo');
      return false;
    } finally {
      setSavingGroup(false);
    }
  };

  const deleteGroup = async (id: number): Promise<boolean> => {
    setSavingGroup(true);
    setError(null);
    try {
      const response = await fetch(
        `${baseUrl}/functions/v1/brevo-lists?id=${id}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao remover grupo');
      }

      await fetchGroups();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover grupo');
      return false;
    } finally {
      setSavingGroup(false);
    }
  };

  // ===== SUBSCRIBERS =====

  const fetchSubscribers = useCallback(async (limit = 50, offset = 0, listId?: number) => {
    setLoading(true);
    setError(null);
    try {
      let url = `${baseUrl}/functions/v1/brevo-subscribers?limit=${limit}&offset=${offset}`;
      if (listId) {
        url += `&listId=${listId}`;
      }

      const response = await fetch(url, { headers });

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
  }, [baseUrl, anonKey]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const sendNewsletter = async (campaign: NewsletterCampaign): Promise<boolean> => {
    setSending(true);
    setError(null);
    try {
      const response = await fetch(
        `${baseUrl}/functions/v1/brevo-send`,
        {
          method: 'POST',
          headers: jsonHeaders,
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

  const addSubscriber = async (email: string, nome?: string, listId?: number): Promise<boolean> => {
    setAdding(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { email, nome };
      if (listId) {
        body.listId = listId;
      }

      const response = await fetch(
        `${baseUrl}/functions/v1/brevo-subscribe`,
        {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify(body),
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
        `${baseUrl}/functions/v1/brevo-unsubscribe`,
        {
          method: 'POST',
          headers: jsonHeaders,
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

  const moveSubscribers = async (
    emails: string[],
    fromListId: number,
    toListId: number
  ): Promise<boolean> => {
    setMovingSubscribers(true);
    setError(null);
    try {
      const response = await fetch(
        `${baseUrl}/functions/v1/brevo-move-subscriber?action=move`,
        {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({ emails, fromListId, toListId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao mover subscritores');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao mover subscritores');
      return false;
    } finally {
      setMovingSubscribers(false);
    }
  };

  const removeFromGroup = async (emails: string[], listId: number): Promise<boolean> => {
    setMovingSubscribers(true);
    setError(null);
    try {
      const response = await fetch(
        `${baseUrl}/functions/v1/brevo-move-subscriber?action=remove-from-list`,
        {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({ emails, listId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao remover do grupo');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover do grupo');
      return false;
    } finally {
      setMovingSubscribers(false);
    }
  };

  // ===== CAMPAIGNS =====

  const fetchCampaigns = useCallback(async (limit = 20, offset = 0) => {
    // Prevent multiple concurrent fetches
    if (isFetchingCampaigns.current) return;
    isFetchingCampaigns.current = true;

    setLoadingCampaigns(true);
    setError(null);
    try {
      const response = await fetch(
        `${baseUrl}/functions/v1/brevo-campaigns?limit=${limit}&offset=${offset}`,
        { headers }
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
  }, [baseUrl, anonKey]);

  return {
    subscribers,
    totalSubscribers,
    campaigns,
    totalCampaigns,
    groups,
    loading,
    loadingCampaigns,
    loadingGroups,
    sending,
    adding,
    removing,
    movingSubscribers,
    savingGroup,
    error,
    fetchSubscribers,
    fetchCampaigns,
    fetchGroups,
    sendNewsletter,
    sendTestEmail,
    addSubscriber,
    removeSubscriber,
    moveSubscribers,
    removeFromGroup,
    createGroup,
    updateGroup,
    deleteGroup,
  };
}
