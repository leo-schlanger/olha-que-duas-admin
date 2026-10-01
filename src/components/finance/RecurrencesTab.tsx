import { useState } from 'react';
import { Pencil, Plus, Repeat, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { EmptyState, Field, FormDialog, KindBadge, NativeSelect } from './shared';
import {
  FREQUENCY_LABEL,
  PAYMENT_METHODS,
  formatDate,
  formatEUR,
  monthlyEquivalent,
  nextOccurrence,
  parseAmount,
} from '../../lib/finance';
import { lisbonToday } from '../../lib/scheduleDates';
import type { FinanceApi } from '../../hooks/useFinance';
import type { FinFrequency, FinKind, FinRecurrence } from '../../types/finance';

export function RecurrencesTab({ api }: { api: FinanceApi }) {
  const { data } = api;
  const [editing, setEditing] = useState<FinRecurrence | null>(null);
  const [open, setOpen] = useState(false);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Previsão mensal: <span className="text-green-700 font-medium">{formatEUR(monthlyIn)}</span> de receitas ·{' '}
          <span className="text-red-600 font-medium">{formatEUR(monthlyOut)}</span> de custos fixos. Os lançamentos
          previstos são criados automaticamente 7 dias antes.
        </p>
        <Button
          className="bg-vermelho hover:bg-vermelho-dark text-white"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Nova recorrência
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          {data.recurrences.length === 0 ? (
            <EmptyState>
              Registe aqui clientes que pagam com regularidade e custos fixos (servidores, ferramentas, marketing).
            </EmptyState>
          ) : (
            <div className="divide-y divide-beige-medium">
              {data.recurrences.map((r) => (
                <div key={r.id} className={`flex flex-wrap items-center gap-3 py-3 ${r.is_active ? '' : 'opacity-50'}`}>
                  <Repeat className="h-4 w-4 text-muted-foreground shrink-0" />
                  <KindBadge kind={r.kind} />
                  <div className="flex-1 min-w-[180px]">
                    <p className="font-medium text-charcoal text-sm">{r.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {[
                        FREQUENCY_LABEL[r.frequency],
                        clientName(r.client_id),
                        r.is_active ? `próxima ${formatDate(nextOccurrence(r))}` : 'pausada',
                        r.end_date && `até ${formatDate(r.end_date)}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <span className="tabular-nums font-medium">{formatEUR(r.amount)}</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(r); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-8 w-8 ${confirmDelete === r.id ? 'text-white bg-red-600 hover:bg-red-700' : 'text-red-600'}`}
                    title={confirmDelete === r.id ? 'Clique de novo para apagar (os lançamentos já criados ficam)' : 'Apagar'}
                    onClick={() => handleDelete(r.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {open && <RecurrenceDialog api={api} recurrence={editing} onClose={() => setOpen(false)} />}
    </div>
  );
}

function RecurrenceDialog({
  api,
  recurrence,
  onClose,
}: {
  api: FinanceApi;
  recurrence: FinRecurrence | null;
  onClose: () => void;
}) {
  const { data } = api;
  const [kind, setKind] = useState<FinKind>(recurrence?.kind ?? 'income');
  const [description, setDescription] = useState(recurrence?.description ?? '');
  const [amount, setAmount] = useState(recurrence ? String(recurrence.amount).replace('.', ',') : '');
  const [frequency, setFrequency] = useState<FinFrequency>(recurrence?.frequency ?? 'weekly');
  const [startDate, setStartDate] = useState(recurrence?.start_date ?? lisbonToday());
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

  return (
    <FormDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={recurrence ? 'Editar recorrência' : 'Nova recorrência'}
      saving={saving}
      error={error}
      onSubmit={submit}
      wide
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Tipo">
          <NativeSelect value={kind} onChange={(e) => { setKind(e.target.value as FinKind); setCategoryId(''); }}>
            <option value="income">Receita (cliente)</option>
            <option value="expense">Despesa (custo fixo)</option>
          </NativeSelect>
        </Field>
        <Field label="Frequência">
          <NativeSelect value={frequency} onChange={(e) => setFrequency(e.target.value as FinFrequency)}>
            {Object.entries(FREQUENCY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Descrição" htmlFor="rec-desc" required className="sm:col-span-2">
          <Input id="rec-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Patrocínio semanal" />
        </Field>
        <Field label="Valor (€)" htmlFor="rec-amount" required>
          <Input id="rec-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="75,00" />
        </Field>
        <Field label="Método">
          <NativeSelect value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="">—</option>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </NativeSelect>
        </Field>
        <Field
          label="Primeira data"
          htmlFor="rec-start"
          required
          hint={scheduleChanged ? 'Mudar a data ou a frequência recria os previstos pendentes.' : 'As seguintes repetem a partir desta.'}
        >
          <Input id="rec-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </Field>
        <Field label="Termina em (opcional)" htmlFor="rec-end">
          <Input id="rec-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
        <Field label="Cliente">
          <NativeSelect value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">—</option>
            {data.clients.filter((c) => c.is_active || c.id === clientId).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Categoria">
          <NativeSelect value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">—</option>
            {data.categories.filter((c) => c.kind === kind && (c.is_active || c.id === categoryId)).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </NativeSelect>
        </Field>
        <div className="flex items-center gap-3 sm:col-span-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} id="rec-active" />
          <label htmlFor="rec-active" className="text-sm text-charcoal">Ativa (desligue para pausar sem apagar)</label>
        </div>
      </div>
    </FormDialog>
  );
}
