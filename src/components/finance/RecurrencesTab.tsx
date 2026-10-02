import { useState } from 'react';
import { Pencil, Plus, Repeat, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Choice, EmptyState, Field, FormDialog, NativeSelect } from './shared';
import {
  PAYMENT_METHODS,
  formatDate,
  formatEUR,
  isOverdue,
  monthlyEquivalent,
  nextDue,
  parseAmount,
  recurrenceSentence,
  repeatLabel,
} from '../../lib/finance';
import type { FinanceApi } from '../../hooks/useFinance';
import type { FinFrequency, FinKind, FinRecurrence } from '../../types/finance';

export function RecurrencesTab({ api, onNew }: { api: FinanceApi; onNew: (kind: FinKind, repeat: boolean) => void }) {
  const { data } = api;
  const [editing, setEditing] = useState<FinRecurrence | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const active = data.recurrences.filter((r) => r.is_active);
  const monthlyIn = active.filter((r) => r.kind === 'income').reduce((s, r) => s + monthlyEquivalent(r), 0);
  const monthlyOut = active.filter((r) => r.kind === 'expense').reduce((s, r) => s + monthlyEquivalent(r), 0);
  const clientName = (id: string | null) => data.clients.find((c) => c.id === id)?.name;

  const handleDelete = async (id: string) => {
    if (confirmDelete === id) {
      await api.remove('fin_recurrences', id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  /** Como está o acordo: quanto já entrou/saiu, o que está em atraso. */
  const stats = (r: FinRecurrence) => {
    const txs = data.transactions.filter((t) => t.recurrence_id === r.id);
    const paid = txs.filter((t) => t.status === 'paid');
    const late = txs.filter((t) => isOverdue(t));
    return {
      paidTotal: paid.reduce((s, t) => s + t.amount, 0),
      paidCount: paid.length,
      lateTotal: late.reduce((s, t) => s + t.amount, 0),
      lateCount: late.length,
    };
  };

  const list = (kind: FinKind, title: string, empty: string) => {
    const rows = data.recurrences.filter((r) => r.kind === kind);
    const income = kind === 'income';
    return (
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0 gap-3 flex-wrap">
          <CardTitle className="text-base">{title}</CardTitle>
          <Button size="sm" variant="outline" className={income ? 'text-green-700' : 'text-red-600'} onClick={() => onNew(kind, true)}>
            <Plus className="h-4 w-4 mr-1" /> {income ? 'Novo acordo com cliente' : 'Novo custo fixo'}
          </Button>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState>{empty}</EmptyState>
          ) : (
            <div className="divide-y divide-beige-medium">
              {rows.map((r) => {
                const s = stats(r);
                return (
                  <div key={r.id} className={`flex flex-wrap items-start gap-3 py-3 ${r.is_active ? '' : 'opacity-50'}`}>
                    <Repeat className={`h-4 w-4 mt-1 shrink-0 ${income ? 'text-green-700' : 'text-red-600'}`} />
                    <div className="flex-1 min-w-[220px] space-y-0.5">
                      <p className="font-medium text-charcoal">
                        {r.description}
                        {clientName(r.client_id) && !r.description.includes(clientName(r.client_id)!) && <span className="font-normal text-muted-foreground"> · {clientName(r.client_id)}</span>}
                      </p>
                      <p className="text-sm text-charcoal">{recurrenceSentence(r)}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.is_active ? `Próxima: ${formatDate(nextDue(r, data.transactions))}` : 'Pausado'}
                        {` · ${income ? 'Já recebido' : 'Já pago'}: ${formatEUR(s.paidTotal)} (${s.paidCount}×)`}
                        {r.frequency !== 'monthly' && ` · ≈ ${formatEUR(monthlyEquivalent(r))}/mês`}
                      </p>
                      {s.lateCount > 0 && (
                        <p className="text-xs font-medium text-red-600">
                          {s.lateCount} em atraso ({formatEUR(s.lateTotal)})
                        </p>
                      )}
                    </div>
                    <span className={`tabular-nums font-semibold ${income ? 'text-green-700' : 'text-red-600'}`}>{formatEUR(r.amount)}</span>
                    <div className="flex">
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Alterar" onClick={() => setEditing(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className={`h-8 w-8 ${confirmDelete === r.id ? 'text-white bg-red-600 hover:bg-red-700' : 'text-red-600'}`}
                        title={confirmDelete === r.id ? 'Clique de novo para apagar (o que já foi pago fica no histórico)' : 'Apagar'}
                        onClick={() => handleDelete(r.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Entra todos os meses (≈)</p>
            <p className="text-2xl font-bold tabular-nums text-green-700">{formatEUR(monthlyIn)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Sai todos os meses (≈)</p>
            <p className="text-2xl font-bold tabular-nums text-red-600">{formatEUR(monthlyOut)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Sobra por mês (≈)</p>
            <p className={`text-2xl font-bold tabular-nums ${monthlyIn - monthlyOut >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {formatEUR(monthlyIn - monthlyOut)}
            </p>
          </CardContent>
        </Card>
      </div>
      <p className="text-sm text-muted-foreground">
        Aqui ficam os valores que se repetem. Cada pagamento aparece como <strong>Previsto</strong> uma semana antes, no
        Resumo; quando acontecer, basta carregar em <strong>Recebido</strong> ou <strong>Pago</strong>. Semanal conta
        como 52 semanas ÷ 12 meses.
      </p>

      {list('income', 'Acordos com clientes (entradas que se repetem)', 'Ainda não há acordos. Ex.: cliente que paga 150 € todas as quintas-feiras.')}
      {list('expense', 'Custos fixos (saídas que se repetem)', 'Ainda não há custos fixos. Ex.: servidor, ferramentas, assinaturas.')}

      {editing && <RecurrenceDialog api={api} recurrence={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function RecurrenceDialog({
  api,
  recurrence,
  onClose,
}: {
  api: FinanceApi;
  recurrence: FinRecurrence;
  onClose: () => void;
}) {
  const { data } = api;
  const kind: FinKind = recurrence.kind;
  const [description, setDescription] = useState(recurrence?.description ?? '');
  const [amount, setAmount] = useState(recurrence ? String(recurrence.amount).replace('.', ',') : '');
  const [frequency, setFrequency] = useState<FinFrequency>(recurrence?.frequency ?? 'weekly');
  const [startDate, setStartDate] = useState(recurrence.start_date);
  const [endDate, setEndDate] = useState(recurrence?.end_date ?? '');
  const [clientId, setClientId] = useState(recurrence?.client_id ?? '');
  const [categoryId, setCategoryId] = useState(recurrence?.category_id ?? '');
  const [method, setMethod] = useState(recurrence?.method ?? '');
  const [isActive, setIsActive] = useState(recurrence?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scheduleChanged =
    !!recurrence && (recurrence.start_date !== startDate || recurrence.frequency !== frequency);

  const submit = async () => {
    const value = parseAmount(amount);
    if (!description.trim()) return setError('Indique uma descrição');
    if (!Number.isFinite(value) || value <= 0) return setError('Valor inválido');
    if (endDate && endDate < startDate) return setError('A data de fim é anterior ao início');
    setSaving(true);
    const ok = await api.saveRecurrence({
      id: recurrence?.id,
      kind,
      description: description.trim(),
      amount: Math.round(value * 100) / 100,
      frequency,
      start_date: startDate,
      end_date: endDate || null,
      client_id: clientId || null,
      category_id: categoryId || null,
      method: method || null,
      is_active: isActive,
    });
    setSaving(false);
    if (ok) onClose();
    else setError('Não foi possível guardar');
  };

  const income = kind === 'income';
  return (
    <FormDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={income ? 'Alterar acordo com cliente' : 'Alterar custo fixo'}
      saving={saving}
      error={error}
      onSubmit={submit}
      wide
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="O que é?" htmlFor="rec-desc" required className="sm:col-span-2">
          <Input id="rec-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Valor (€)" htmlFor="rec-amount" required hint="Muda os previstos ainda não pagos; o que já foi pago fica igual.">
          <Input id="rec-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label={income ? 'Cliente' : 'Cliente associado (opcional)'}>
          <NativeSelect value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">—</option>
            {data.clients.filter((c) => c.is_active || c.id === clientId).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Com que frequência?" className="sm:col-span-2">
          <Choice
            value={frequency}
            onChange={setFrequency}
            options={[
              { value: 'weekly', label: 'Toda semana' },
              { value: 'monthly', label: 'Todo mês' },
              { value: 'yearly', label: 'Todo ano' },
            ]}
          />
        </Field>
        <Field
          label="A partir de"
          htmlFor="rec-start"
          required
          hint={
            scheduleChanged
              ? `Passa a repetir ${repeatLabel(frequency, startDate)}. Os previstos por pagar são refeitos; os pagos ficam.`
              : `Repete ${repeatLabel(frequency, startDate)}.`
          }
        >
          <Input id="rec-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </Field>
        <Field label="Última vez (opcional)" htmlFor="rec-end" hint="Deixe vazio se não tem fim.">
          <Input id="rec-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
        <Field label="Categoria">
          <NativeSelect value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">—</option>
            {data.categories.filter((c) => c.kind === kind && (c.is_active || c.id === categoryId)).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Como é pago?">
          <NativeSelect value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="">—</option>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </NativeSelect>
        </Field>
        <div className="flex items-center gap-3 sm:col-span-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} id="rec-active" />
          <label htmlFor="rec-active" className="text-sm text-charcoal">Ativo (desligue para pausar sem apagar)</label>
        </div>
      </div>
    </FormDialog>
  );
}
