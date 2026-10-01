import { useState } from 'react';
import { AlertTriangle, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { EmptyState, Field, FormDialog, NativeSelect } from './shared';
import { computeDistribution, parseAmount, formatDate, formatEUR, inPeriod, periodLabel, type Period } from '../../lib/finance';
import { lisbonToday } from '../../lib/scheduleDates';
import type { FinanceApi } from '../../hooks/useFinance';
import type { FinMember } from '../../types/finance';

export function TeamTab({ api, period }: { api: FinanceApi; period: Period }) {
  const { data } = api;
  const dist = computeDistribution(data.transactions, data.members, data.payouts, data.reservePercent, period);
  const [memberDialog, setMemberDialog] = useState<{ member: FinMember | null } | null>(null);
  const [payoutFor, setPayoutFor] = useState<{ member: FinMember; suggested: number } | null>(null);
  const [reserve, setReserve] = useState(String(data.reservePercent));
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const memberName = (id: string) => data.members.find((m) => m.id === id)?.name ?? '—';
  const payouts = data.payouts.filter((p) => inPeriod(p.period, period));

  const handleDelete = async (table: 'fin_members' | 'fin_payouts', id: string) => {
    if (confirmDelete === id) {
      await api.remove(table, id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const reserveValue = parseAmount(reserve);
  const reserveValid = Number.isFinite(reserveValue) && reserveValue >= 0 && reserveValue <= 100;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Resultado ({periodLabel(period)})</p>
            <p className={`text-2xl font-bold tabular-nums ${dist.result >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatEUR(dist.result)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-2">
            <p className="text-sm text-muted-foreground">Reserva para caixa / impostos</p>
            <div className="flex items-center gap-2">
              <Input className="w-24" inputMode="decimal" value={reserve} onChange={(e) => setReserve(e.target.value)} />
              <span className="text-sm">%</span>
              <Button
                size="sm"
                variant="outline"
                disabled={!reserveValid || reserveValue === data.reservePercent}
                onClick={() => api.saveReserve(reserveValue)}
              >
                Guardar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Fica de fora: {formatEUR(dist.reserve)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">A distribuir</p>
            <p className="text-2xl font-bold tabular-nums text-charcoal">{formatEUR(dist.distributable)}</p>
            <p className="text-xs text-muted-foreground mt-1">Só meses com resultado positivo</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Equipa e percentagens</CardTitle>
          <Button size="sm" className="bg-vermelho hover:bg-vermelho-dark text-white" onClick={() => setMemberDialog({ member: null })}>
            <Plus className="h-4 w-4 mr-1" /> Membro
          </Button>
        </CardHeader>
        <CardContent>
          {data.members.length > 0 && dist.totalPercent !== 100 && (
            <div className="mb-3 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4" /> As percentagens dos membros ativos somam {dist.totalPercent}% — deviam somar 100%.
            </div>
          )}
          {data.members.length === 0 ? (
            <EmptyState>Adicione os membros da equipa e a percentagem de cada um</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-beige-medium">
                    <th className="py-2 pr-3 font-medium">Membro</th>
                    <th className="py-2 pr-3 font-medium text-right">%</th>
                    <th className="py-2 pr-3 font-medium text-right">A receber</th>
                    <th className="py-2 pr-3 font-medium text-right">Já pago</th>
                    <th className="py-2 pr-3 font-medium text-right">Saldo</th>
                    <th className="py-2 w-40" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige-medium">
                  {data.members.map((m) => {
                    const share = dist.shares.find((s) => s.member.id === m.id);
                    return (
                      <tr key={m.id} className={m.is_active ? '' : 'opacity-50'}>
                        <td className="py-2.5 pr-3 font-medium text-charcoal">{m.name}</td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">{m.share_percent}%</td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">{share ? formatEUR(share.due) : '—'}</td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">{share ? formatEUR(share.paid) : '—'}</td>
                        <td className={`py-2.5 pr-3 text-right tabular-nums font-medium ${share && share.balance > 0 ? 'text-vermelho' : ''}`}>
                          {share ? formatEUR(share.balance) : '—'}
                        </td>
                        <td className="py-2.5 text-right whitespace-nowrap">
                          {m.is_active && (
                            <Button size="sm" variant="outline" className="h-8" onClick={() => setPayoutFor({ member: m, suggested: Math.max(share?.balance ?? 0, 0) })}>
                              <Wallet className="h-4 w-4 mr-1" /> Pagar
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setMemberDialog({ member: m })}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className={`h-8 w-8 ${confirmDelete === m.id ? 'text-white bg-red-600 hover:bg-red-700' : 'text-red-600'}`}
                            title={confirmDelete === m.id ? 'Clique de novo — apaga também os pagamentos registados' : 'Apagar'}
                            onClick={() => handleDelete('fin_members', m.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pagamentos à equipa ({periodLabel(period)})</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <EmptyState>Sem pagamentos registados neste período</EmptyState>
          ) : (
            <div className="divide-y divide-beige-medium">
              {payouts.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                  <span className="w-24 tabular-nums text-muted-foreground">{formatDate(p.paid_at)}</span>
                  <span className="flex-1 font-medium text-charcoal">
                    {memberName(p.member_id)}
                    <span className="font-normal text-muted-foreground"> · referente a {periodLabel({ type: 'month', value: p.period.slice(0, 7) })}{p.notes ? ` · ${p.notes}` : ''}</span>
                  </span>
                  <span className="tabular-nums font-medium">{formatEUR(p.amount)}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-8 w-8 ${confirmDelete === p.id ? 'text-white bg-red-600 hover:bg-red-700' : 'text-red-600'}`}
                    onClick={() => handleDelete('fin_payouts', p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {memberDialog && <MemberDialog api={api} member={memberDialog.member} onClose={() => setMemberDialog(null)} />}
      {payoutFor && (
        <PayoutDialog api={api} period={period} member={payoutFor.member} suggested={payoutFor.suggested} onClose={() => setPayoutFor(null)} />
      )}
    </div>
  );
}

function MemberDialog({ api, member, onClose }: { api: FinanceApi; member: FinMember | null; onClose: () => void }) {
  const [name, setName] = useState(member?.name ?? '');
  const [email, setEmail] = useState(member?.email ?? '');
  const [share, setShare] = useState(member ? String(member.share_percent).replace('.', ',') : '');
  const [isActive, setIsActive] = useState(member?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const pct = parseAmount(share || '0');
    if (!name.trim()) return setError('Indique o nome');
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return setError('Percentagem entre 0 e 100');
    setSaving(true);
    const ok = await api.save('fin_members', {
      id: member?.id,
      name: name.trim(),
      email: email.trim() || null,
      share_percent: pct,
      is_active: isActive,
    });
    setSaving(false);
    if (ok) onClose();
    else setError('Não foi possível guardar');
  };

  return (
    <FormDialog open onOpenChange={(o) => !o && onClose()} title={member ? 'Editar membro' : 'Novo membro'} saving={saving} error={error} onSubmit={submit}>
      <Field label="Nome" htmlFor="mem-name" required>
        <Input id="mem-name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Percentagem" htmlFor="mem-share" required hint="Do valor a distribuir">
          <Input id="mem-share" inputMode="decimal" value={share} onChange={(e) => setShare(e.target.value)} placeholder="50" />
        </Field>
        <Field label="Email" htmlFor="mem-email">
          <Input id="mem-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={isActive} onCheckedChange={setIsActive} id="mem-active" />
        <label htmlFor="mem-active" className="text-sm text-charcoal">Participa na distribuição</label>
      </div>
    </FormDialog>
  );
}

function PayoutDialog({
  api,
  period,
  member,
  suggested,
  onClose,
}: {
  api: FinanceApi;
  period: Period;
  member: FinMember;
  suggested: number;
  onClose: () => void;
}) {
  const months = period.type === 'month'
    ? [period.value]
    : Array.from({ length: 12 }, (_, i) => `${period.value}-${String(i + 1).padStart(2, '0')}`);
  const today = lisbonToday();
  const [month, setMonth] = useState(months.includes(today.slice(0, 7)) ? today.slice(0, 7) : months[0]);
  const [amount, setAmount] = useState(suggested > 0 ? suggested.toFixed(2).replace('.', ',') : '');
  const [paidAt, setPaidAt] = useState(today);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const value = parseAmount(amount);
    if (!Number.isFinite(value) || value <= 0) return setError('Valor inválido');
    setSaving(true);
    const ok = await api.save('fin_payouts', {
      member_id: member.id,
      period: `${month}-01`,
      amount: Math.round(value * 100) / 100,
      paid_at: paidAt,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (ok) onClose();
    else setError('Não foi possível guardar');
  };

  return (
    <FormDialog open onOpenChange={(o) => !o && onClose()} title={`Pagamento a ${member.name}`} saving={saving} error={error} onSubmit={submit}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Referente ao mês">
          <NativeSelect value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => (
              <option key={m} value={m}>{periodLabel({ type: 'month', value: m })}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Pago em" htmlFor="pay-date">
          <Input id="pay-date" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
        </Field>
      </div>
      <Field label="Valor (€)" htmlFor="pay-amount" required hint={suggested > 0 ? `Saldo em dívida no período: ${formatEUR(suggested)}` : undefined}>
        <Input id="pay-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <Field label="Notas" htmlFor="pay-notes">
        <Input id="pay-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: MB WAY" />
      </Field>
    </FormDialog>
  );
}
