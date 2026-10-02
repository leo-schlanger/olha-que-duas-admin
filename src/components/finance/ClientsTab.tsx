import { useState } from 'react';
import { Mail, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { EmptyState, Field, FormDialog } from './shared';
import { amountInMonth, formatEUR, isOverdue } from '../../lib/finance';
import { lisbonToday } from '../../lib/scheduleDates';
import type { FinanceApi } from '../../hooks/useFinance';
import type { FinClient } from '../../types/finance';

export function ClientsTab({ api }: { api: FinanceApi }) {
  const { data } = api;
  const [editing, setEditing] = useState<FinClient | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const stats = (id: string) => {
    const paid = data.transactions.filter((t) => t.client_id === id && t.kind === 'income' && t.status === 'paid');
    return {
      total: paid.reduce((s, t) => s + t.amount, 0),
      count: paid.length,
      monthly: data.recurrences
        .filter((r) => r.is_active && r.kind === 'income' && r.client_id === id)
        .reduce((s, r) => s + amountInMonth(r, lisbonToday().slice(0, 7)), 0),
      overdue: data.transactions.filter((t) => t.client_id === id && isOverdue(t)).length,
    };
  };

  const handleDelete = async (id: string) => {
    if (confirmDelete === id) {
      await api.remove('fin_clients', id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="bg-vermelho hover:bg-vermelho-dark text-white" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Novo cliente
        </Button>
      </div>

      {data.clients.length === 0 ? (
        <Card><CardContent><EmptyState>Ainda não há clientes registados</EmptyState></CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.clients.map((c) => {
            const s = stats(c.id);
            return (
              <Card key={c.id} className={c.is_active ? '' : 'opacity-60'}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display font-bold text-lg text-charcoal">{c.name}</p>
                      {c.nif && <p className="text-xs text-muted-foreground">NIF {c.nif}</p>}
                    </div>
                    <div className="flex">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(c); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className={`h-8 w-8 ${confirmDelete === c.id ? 'text-white bg-red-600 hover:bg-red-700' : 'text-red-600'}`}
                        title={confirmDelete === c.id ? 'Clique de novo para apagar (os lançamentos ficam sem cliente)' : 'Apagar'}
                        onClick={() => handleDelete(c.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {c.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{c.email}</p>}
                    {c.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{c.phone}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-beige-medium text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Total recebido</p>
                      <p className="font-medium tabular-nums">{formatEUR(s.total)} <span className="text-xs text-muted-foreground">({s.count})</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Previsto este mês</p>
                      <p className="font-medium tabular-nums">{formatEUR(s.monthly)}</p>
                    </div>
                  </div>
                  {s.overdue > 0 && (
                    <p className="text-xs font-medium text-red-600">{s.overdue} pagamento(s) em atraso</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {open && <ClientDialog api={api} client={editing} onClose={() => setOpen(false)} />}
    </div>
  );
}

function ClientDialog({ api, client, onClose }: { api: FinanceApi; client: FinClient | null; onClose: () => void }) {
  const [name, setName] = useState(client?.name ?? '');
  const [nif, setNif] = useState(client?.nif ?? '');
  const [email, setEmail] = useState(client?.email ?? '');
  const [phone, setPhone] = useState(client?.phone ?? '');
  const [notes, setNotes] = useState(client?.notes ?? '');
  const [isActive, setIsActive] = useState(client?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) return setError('Indique o nome');
    setSaving(true);
    const ok = await api.save('fin_clients', {
      id: client?.id,
      name: name.trim(),
      nif: nif.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      notes: notes.trim() || null,
      is_active: isActive,
    });
    setSaving(false);
    if (ok) onClose();
    else setError('Não foi possível guardar');
  };

  return (
    <FormDialog open onOpenChange={(o) => !o && onClose()} title={client ? 'Editar cliente' : 'Novo cliente'} saving={saving} error={error} onSubmit={submit}>
      <Field label="Nome" htmlFor="cli-name" required>
        <Input id="cli-name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="NIF" htmlFor="cli-nif">
          <Input id="cli-nif" value={nif} onChange={(e) => setNif(e.target.value)} inputMode="numeric" />
        </Field>
        <Field label="Telefone" htmlFor="cli-phone">
          <Input id="cli-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>
      <Field label="Email" htmlFor="cli-email">
        <Input id="cli-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Notas" htmlFor="cli-notes">
        <Textarea id="cli-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="O que foi contratado, condições, contacto..." />
      </Field>
      <div className="flex items-center gap-3">
        <Switch checked={isActive} onCheckedChange={setIsActive} id="cli-active" />
        <label htmlFor="cli-active" className="text-sm text-charcoal">Cliente ativo</label>
      </div>
    </FormDialog>
  );
}
