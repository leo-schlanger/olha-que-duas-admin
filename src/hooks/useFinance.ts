import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  FinCategory,
  FinClient,
  FinMember,
  FinPayout,
  FinRecurrence,
  FinTransaction,
} from '../types/finance';
import { equalShare, type FinanceData } from '../lib/finance';
import { lisbonToday } from '../lib/scheduleDates';
import type { FinActivity } from '../lib/financeActivity';

const RECEIPTS_BUCKET = 'finance-receipts';

type FinTable =
  | 'fin_categories'
  | 'fin_clients'
  | 'fin_recurrences'
  | 'fin_transactions'
  | 'fin_members'
  | 'fin_payouts';

// O PostgREST pode devolver NUMERIC como texto; normaliza para número.
const num = <T extends object>(rows: T[] | null, keys: (keyof T)[]): T[] =>
  (rows ?? []).map((r) => {
    const copy = { ...r };
    for (const k of keys) copy[k] = Number(copy[k]) as T[keyof T];
    return copy;
  });

const EMPTY: FinanceData = {
  transactions: [],
  categories: [],
  clients: [],
  recurrences: [],
  members: [],
  payouts: [],
  reservePercent: 0,
};

export interface ReportSettings {
  enabled: boolean;
  /** Vazio = emails dos membros ativos da equipa. */
  recipients: string[];
  lastPeriod: string | null;
  lastSentAt: string | null;
}

export interface NewMovementInput {
  clientId: string | null;
  /** Cria este cliente e usa-o em tudo o que for registado. */
  newClientName: string | null;
  /** Movimento pontual (sem client_id; vem de clientId/newClientName). */
  transaction: Omit<FinTransaction, 'id' | 'client_id' | 'recurrence_id'> | null;
  recurrence: Omit<FinRecurrence, 'id' | 'generated_count' | 'client_id'> | null;
  /** A primeira ocorrência da repetição já foi paga/recebida. */
  firstPaid: boolean;
  /** Pagamento inicial (entrada / sinal) de um acordo com cliente. */
  deposit: { amount: number; date: string; paid: boolean; description: string } | null;
}

export function useFinance() {
  const [data, setData] = useState<FinanceData>(EMPTY);
  const [report, setReport] = useState<ReportSettings>({ enabled: true, recipients: [], lastPeriod: null, lastSentAt: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      // Cria os previstos das recorrências antes de ler (o pg_cron também o faz diariamente).
      const { error: genError } = await supabase.rpc('fin_generate_recurring', { horizon_days: 7 });
      if (genError) throw genError;

      const [tx, cat, cli, rec, mem, pay, set] = await Promise.all([
        supabase.from('fin_transactions').select('*').order('tx_date', { ascending: false }),
        supabase.from('fin_categories').select('*').order('name'),
        supabase.from('fin_clients').select('*').order('name'),
        supabase.from('fin_recurrences').select('*').order('created_at'),
        supabase.from('fin_members').select('*').order('created_at'),
        supabase.from('fin_payouts').select('*').order('paid_at', { ascending: false }),
        supabase.from('fin_settings').select('*').eq('id', 1).maybeSingle(),
      ]);
      const failed = [tx, cat, cli, rec, mem, pay, set].find((r) => r.error);
      if (failed?.error) throw failed.error;

      setData({
        transactions: num(tx.data as FinTransaction[], ['amount']),
        categories: (cat.data ?? []) as FinCategory[],
        clients: (cli.data ?? []) as FinClient[],
        recurrences: num(rec.data as FinRecurrence[], ['amount']),
        members: num(mem.data as FinMember[], ['share_percent']),
        payouts: num(pay.data as FinPayout[], ['amount']),
        reservePercent: Number(set.data?.reserve_percent ?? 0),
      });
      setReport({
        enabled: set.data?.report_enabled ?? true,
        recipients: set.data?.report_recipients ?? [],
        lastPeriod: set.data?.report_last_period ?? null,
        lastSentAt: set.data?.report_last_sent_at ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar as finanças');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /** Insere (sem id) ou atualiza (com id) uma linha e recarrega. */
  const save = async (table: FinTable, row: { id?: string } & Record<string, unknown>): Promise<boolean> => {
    try {
      const { id, ...fields } = row;
      const { error: saveError } = id
        ? await supabase.from(table).update(fields).eq('id', id)
        : await supabase.from(table).insert(fields);
      if (saveError) throw saveError;
      await fetchAll();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar');
      return false;
    }
  };

  const remove = async (table: FinTable, id: string): Promise<boolean> => {
    try {
      if (table === 'fin_transactions') {
        const path = data.transactions.find((t) => t.id === id)?.receipt_path;
        if (path) await supabase.storage.from(RECEIPTS_BUCKET).remove([path]);
      }
      const { error: deleteError } = await supabase.from(table).delete().eq('id', id);
      if (deleteError) throw deleteError;
      await fetchAll();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao apagar');
      return false;
    }
  };

  /**
   * Guarda uma recorrência. Se a data de início ou a frequência mudarem, os
   * previstos ainda pendentes são apagados e gerados de novo; se só mudar o
   * valor/descrição, os previstos futuros pendentes são atualizados.
   */
  const saveRecurrence = async (
    row: Omit<FinRecurrence, 'id' | 'generated_count'> & { id?: string }
  ): Promise<boolean> => {
    try {
      const old = row.id ? data.recurrences.find((r) => r.id === row.id) : undefined;
      const scheduleChanged =
        !!old && (old.start_date !== row.start_date || old.frequency !== row.frequency);

      if (old && scheduleChanged) {
        const { error: delError } = await supabase
          .from('fin_transactions')
          .delete()
          .eq('recurrence_id', old.id)
          .eq('status', 'pending');
        if (delError) throw delError;
      } else if (old) {
        const { error: updError } = await supabase
          .from('fin_transactions')
          .update({
            amount: row.amount,
            description: row.description,
            kind: row.kind,
            client_id: row.client_id,
            category_id: row.category_id,
            method: row.method,
          })
          .eq('recurrence_id', old.id)
          .eq('status', 'pending')
          .gte('tx_date', lisbonToday());
        if (updError) throw updError;
        if (row.end_date) {
          await supabase
            .from('fin_transactions')
            .delete()
            .eq('recurrence_id', old.id)
            .eq('status', 'pending')
            .gt('tx_date', row.end_date);
        }
      }

      const { id, ...fields } = row;
      const payload = scheduleChanged || !old ? { ...fields, generated_count: 0 } : fields;
      const { error: saveError } = id
        ? await supabase.from('fin_recurrences').update(payload).eq('id', id)
        : await supabase.from('fin_recurrences').insert(payload);
      if (saveError) throw saveError;
      await fetchAll();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar a recorrência');
      return false;
    }
  };

  /**
   * Registo "tudo de uma vez" do formulário Entrou/Saiu dinheiro: cria o
   * cliente novo (se indicado), o movimento pontual ou a repetição, a entrada
   * inicial (sinal) e, se já foi pago, o primeiro pagamento da repetição.
   */
  const createMovement = async (input: NewMovementInput): Promise<boolean> => {
    try {
      let clientId = input.clientId;
      if (input.newClientName) {
        const { data: created, error: cliError } = await supabase
          .from('fin_clients')
          .insert({ name: input.newClientName })
          .select('id')
          .single();
        if (cliError) throw cliError;
        clientId = created.id as string;
      }

      if (input.transaction) {
        const { error: txError } = await supabase
          .from('fin_transactions')
          .insert({ ...input.transaction, client_id: clientId });
        if (txError) throw txError;
      }

      if (input.recurrence) {
        const { data: rec, error: recError } = await supabase
          .from('fin_recurrences')
          .insert({ ...input.recurrence, client_id: clientId, generated_count: 0 })
          .select('id')
          .single();
        if (recError) throw recError;
        // O gerador ignora esta data (UNIQUE recurrence_id + tx_date) e segue para a seguinte.
        if (input.firstPaid) {
          const r = input.recurrence;
          const { error: firstError } = await supabase.from('fin_transactions').insert({
            kind: r.kind,
            tx_date: r.start_date,
            amount: r.amount,
            description: r.description,
            status: 'paid',
            paid_at: r.start_date,
            method: r.method,
            client_id: clientId,
            category_id: r.category_id,
            recurrence_id: rec.id,
          });
          if (firstError) throw firstError;
        }
      }

      if (input.deposit) {
        const d = input.deposit;
        const { error: depError } = await supabase.from('fin_transactions').insert({
          kind: 'income',
          tx_date: d.date,
          amount: d.amount,
          description: d.description,
          status: d.paid ? 'paid' : 'pending',
          paid_at: d.paid ? d.date : null,
          method: input.recurrence?.method ?? null,
          client_id: clientId,
          category_id: input.recurrence?.category_id ?? null,
        });
        if (depError) throw depError;
      }

      await fetchAll();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar');
      await fetchAll();
      return false;
    }
  };

  /**
   * Marca um lançamento pendente como pago hoje. Se a data prevista ainda não
   * chegou (ex.: o pagamento da próxima semana), pede confirmação primeiro.
   */
  const markPaid = async (tx: FinTransaction): Promise<boolean> => {
    const today = lisbonToday();
    if (tx.tx_date > today) {
      const [y, m, d] = tx.tx_date.split('-');
      const label = tx.kind === 'income' ? 'recebido' : 'pago';
      if (!window.confirm(`Este lançamento está previsto para ${d}/${m}/${y}, ainda não chegou essa data.\n\nConfirma que já foi ${label} hoje?`)) {
        return false;
      }
    }
    return save('fin_transactions', { id: tx.id, status: 'paid', paid_at: today });
  };

  /** Regista vários pagamentos à equipa de uma só vez (ex.: "Pagar todos"). */
  const insertPayouts = async (
    rows: { member_id: string; period: string; amount: number; paid_at: string; notes: string | null }[]
  ): Promise<boolean> => {
    const { error: insertError } = await supabase.from('fin_payouts').insert(rows);
    if (insertError) {
      setError(insertError.message);
      return false;
    }
    await fetchAll();
    return true;
  };

  /** Divide em partes iguais pelos membros ativos (ex.: 3 → 33,33% cada). */
  const setEqualShares = async (): Promise<boolean> => {
    const active = data.members.filter((m) => m.is_active);
    const pct = equalShare(active.length);
    for (const m of active) {
      const { error: updError } = await supabase.from('fin_members').update({ share_percent: pct }).eq('id', m.id);
      if (updError) {
        setError(updError.message);
        await fetchAll();
        return false;
      }
    }
    await fetchAll();
    return true;
  };

  /** Últimas alterações (histórico), da mais recente para a mais antiga. */
  // Memorizada: o separador Histórico usa-a num useEffect.
  const loadActivity = useCallback(async (limit = 200): Promise<FinActivity[]> => {
    const { data: rows, error: loadError } = await supabase
      .from('fin_activity')
      .select('*')
      .order('at', { ascending: false })
      .limit(limit);
    if (loadError) {
      setError(loadError.message);
      return [];
    }
    return (rows ?? []) as FinActivity[];
  }, []);

  const saveReportSettings = async (enabled: boolean, recipients: string[]): Promise<boolean> => {
    const { error: saveError } = await supabase
      .from('fin_settings')
      .update({ report_enabled: enabled, report_recipients: recipients.length ? recipients : null, updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (saveError) {
      setError(saveError.message);
      return false;
    }
    setReport((r) => ({ ...r, enabled, recipients }));
    return true;
  };

  /** Envia já o relatório do mês indicado ("YYYY-MM") aos destinatários definidos. */
  const sendReportNow = async (month: string): Promise<string | null> => {
    const { data: res, error: fnError } = await supabase.functions.invoke('finance-monthly-report', {
      body: { period: month },
    });
    if (fnError || !res?.ok) {
      let message = res?.error as string | undefined;
      if (!message && fnError && 'context' in fnError) {
        message = await (fnError.context as Response).json().then((b) => b.error).catch(() => undefined);
      }
      setError(`Relatório não enviado: ${message ?? fnError?.message ?? 'erro desconhecido'}`);
      return null;
    }
    await fetchAll();
    return (res.recipients as string[]).join(', ');
  };

  const saveReserve = async (reservePercent: number): Promise<boolean> => {
    const { error: saveError } = await supabase
      .from('fin_settings')
      .update({ reserve_percent: reservePercent, updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (saveError) {
      setError(saveError.message);
      return false;
    }
    setData((d) => ({ ...d, reservePercent }));
    return true;
  };

  /** Envia um comprovativo/fatura e devolve o caminho no bucket privado. */
  const uploadReceipt = async (file: File, date: string): Promise<string | null> => {
    const safe = file.name.normalize('NFD').replace(/[^\w.-]+/g, '_');
    const path = `${date.slice(0, 7)}/${crypto.randomUUID().slice(0, 8)}-${safe}`;
    const { error: uploadError } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .upload(path, file, { contentType: file.type || undefined });
    if (uploadError) {
      setError(uploadError.message);
      return null;
    }
    return path;
  };

  const removeReceipt = async (path: string) => {
    await supabase.storage.from(RECEIPTS_BUCKET).remove([path]);
  };

  /** Abre o comprovativo num separador (URL assinado, válido 5 min). */
  const openReceipt = async (path: string) => {
    const { data: signed, error: signError } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .createSignedUrl(path, 300);
    if (signError || !signed) {
      setError(signError?.message ?? 'Não foi possível abrir o comprovativo');
      return;
    }
    window.open(signed.signedUrl, '_blank', 'noopener');
  };

  return {
    data,
    report,
    saveReportSettings,
    sendReportNow,
    loading,
    error,
    clearError: () => setError(null),
    refresh: fetchAll,
    save,
    saveRecurrence,
    createMovement,
    markPaid,
    insertPayouts,
    setEqualShares,
    loadActivity,
    remove,
    saveReserve,
    uploadReceipt,
    removeReceipt,
    openReceipt,
  };
}

export type FinanceApi = ReturnType<typeof useFinance>;
