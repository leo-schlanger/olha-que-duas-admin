import { useState } from 'react';
import { Info } from 'lucide-react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Choice, Field, FormDialog, NativeSelect } from './shared';
import { PAYMENT_METHODS, formatDate, formatEUR, parseAmount, repeatLabel } from '../../lib/finance';
import { lisbonToday } from '../../lib/scheduleDates';
import type { FinanceApi } from '../../hooks/useFinance';
import type { FinFrequency, FinKind } from '../../types/finance';

type Repeat = 'once' | FinFrequency;
type YesNo = 'yes' | 'no';

const NEW_CLIENT = '__new__';

/**
 * "Entrou dinheiro" / "Saiu dinheiro": um só formulário para movimentos
 * pontuais e repetidos (com entrada inicial opcional), em linguagem simples.
 * Por baixo cria lançamentos e recorrências; quem usa não precisa de saber.
 */
export function NewMovementDialog({
  api,
  defaultKind,
  defaultRepeat = 'once',
  onClose,
}: {
  api: FinanceApi;
  defaultKind: FinKind;
  defaultRepeat?: Repeat;
  onClose: () => void;
}) {
  const { data } = api;
  const today = lisbonToday();
  const [kind, setKind] = useState<FinKind>(defaultKind);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [clientId, setClientId] = useState('');
  const [newClient, setNewClient] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [repeat, setRepeat] = useState<Repeat>(defaultRepeat);
  const [date, setDate] = useState(today);
  const [paid, setPaid] = useState<YesNo>('yes');
  const [hasEnd, setHasEnd] = useState<YesNo>('no');
  const [endDate, setEndDate] = useState('');
  const [hasDeposit, setHasDeposit] = useState<YesNo>('no');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDate, setDepositDate] = useState(today);
  const [depositPaid, setDepositPaid] = useState<YesNo>('yes');
  const [method, setMethod] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const income = kind === 'income';
  const recurring = repeat !== 'once';
  const value = parseAmount(amount);
  const deposit = parseAmount(depositAmount);
  const withDeposit = income && recurring && hasDeposit === 'yes';
  // A pergunta "já foi pago?" só faz sentido se a data já chegou.
  const askPaid = date <= today;
  const paidWord = income ? 'recebido' : 'pago';
  const clientLabel = clientId === NEW_CLIENT ? newClient.trim() : data.clients.find((c) => c.id === clientId)?.name;

  const categories = data.categories.filter((c) => c.kind === kind && c.is_active);
  const clients = data.clients.filter((c) => c.is_active);

  // Resumo em frases do que vai ficar registado.
  const summary: string[] = [];
  if (withDeposit && Number.isFinite(deposit) && deposit > 0) {
    summary.push(`Entrada de ${formatEUR(deposit)} em ${formatDate(depositDate)} — ${depositPaid === 'yes' ? 'já recebida' : 'por receber'}.`);
  }
  if (Number.isFinite(value) && value > 0) {
    if (recurring) {
      summary.push(
        `${formatEUR(value)} ${repeatLabel(repeat as FinFrequency, date)}, a começar em ${formatDate(date)}` +
          `${hasEnd === 'yes' && endDate ? ` e até ${formatDate(endDate)}` : ' (sem data de fim)'}.`
      );
      if (askPaid) summary.push(`O primeiro (${formatDate(date)}) ${paid === 'yes' ? `já foi ${paidWord}` : `ainda não foi ${paidWord}`}.`);
      summary.push(`Cada ${income ? 'recebimento' : 'pagamento'} aparece como "Previsto" uns dias antes; basta confirmar quando acontecer.`);
    } else {
      summary.push(`${formatEUR(value)} em ${formatDate(date)} — ${askPaid && paid === 'yes' ? `já ${paidWord}` : `ainda por ${income ? 'receber' : 'pagar'}`}.`);
    }
  }

  const submit = async () => {
    if (!description.trim()) return setError('Escreva o que é (ex.: "Patrocínio semanal").');
    if (!Number.isFinite(value) || value <= 0) return setError('Indique o valor.');
    if (clientId === NEW_CLIENT && !newClient.trim()) return setError('Escreva o nome do cliente novo.');
    if (recurring && hasEnd === 'yes' && (!endDate || endDate < date)) return setError('A data de fim tem de ser depois do início.');
    if (withDeposit && (!Number.isFinite(deposit) || deposit <= 0)) return setError('Indique o valor da entrada.');
    setError(null);
    setSaving(true);

    const round = (n: number) => Math.round(n * 100) / 100;
    const isPaid = askPaid && paid === 'yes';
    let receiptPath: string | null = null;
    if (file && !recurring) {
      receiptPath = await api.uploadReceipt(file, date);
      if (!receiptPath) {
        setSaving(false);
        return setError('Falha ao enviar o comprovativo');
      }
    }

    const ok = await api.createMovement({
      clientId: clientId && clientId !== NEW_CLIENT ? clientId : null,
      newClientName: clientId === NEW_CLIENT ? newClient.trim() : null,
      transaction: recurring
        ? null
        : {
            kind,
            tx_date: date,
            amount: round(value),
            description: description.trim(),
            status: isPaid ? 'paid' : 'pending',
            paid_at: isPaid ? date : null,
            method: method || null,
            invoice_ref: invoiceRef.trim() || null,
            receipt_path: receiptPath,
            notes: notes.trim() || null,
            category_id: categoryId || null,
          },
      recurrence: recurring
        ? {
            kind,
            description: description.trim(),
            amount: round(value),
            frequency: repeat as FinFrequency,
            start_date: date,
            end_date: hasEnd === 'yes' ? endDate : null,
            category_id: categoryId || null,
            method: method || null,
            is_active: true,
          }
        : null,
      firstPaid: recurring && isPaid,
      deposit: withDeposit
        ? {
            amount: round(deposit),
            date: depositDate,
            paid: depositPaid === 'yes' && depositDate <= today,
            description: `Entrada${clientLabel ? ` — ${clientLabel}` : ''}`,
          }
        : null,
    });
    setSaving(false);
    if (ok) onClose();
    else {
      if (receiptPath) await api.removeReceipt(receiptPath);
      setError('Não foi possível guardar. Tente de novo.');
    }
  };

  return (
    <FormDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={income ? 'Entrou dinheiro' : 'Saiu dinheiro'}
      saving={saving}
      error={error}
      onSubmit={submit}
      wide
    >
      <Choice
        value={kind}
        onChange={(k) => {
          setKind(k);
          setCategoryId('');
        }}
        options={[
          { value: 'income', label: '+ Entrada (receita)', tone: 'pos' },
          { value: 'expense', label: '− Saída (despesa)', tone: 'neg' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="O que é?" htmlFor="mv-desc" required className="sm:col-span-2">
          <Input
            id="mv-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={income ? 'Ex.: Patrocínio semanal' : 'Ex.: Servidor Hetzner'}
          />
        </Field>
        <Field label="Valor (€)" htmlFor="mv-amount" required>
          <Input id="mv-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="150,00" />
        </Field>
        <Field label={income ? 'De que cliente?' : 'Cliente associado (opcional)'}>
          <NativeSelect value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">—</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            <option value={NEW_CLIENT}>+ Cliente novo…</option>
          </NativeSelect>
        </Field>
        {clientId === NEW_CLIENT && (
          <Field label="Nome do cliente novo" htmlFor="mv-newclient" required className="sm:col-span-2">
            <Input id="mv-newclient" value={newClient} onChange={(e) => setNewClient(e.target.value)} placeholder="Ex.: Paula Pereira" />
          </Field>
        )}
      </div>

      <Field label="Com que frequência?">
        <Choice
          value={repeat}
          onChange={setRepeat}
          className="grid-cols-2 sm:grid-cols-4"
          options={[
            { value: 'once', label: 'Só uma vez' },
            { value: 'weekly', label: 'Toda semana' },
            { value: 'monthly', label: 'Todo mês' },
            { value: 'yearly', label: 'Todo ano' },
          ]}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label={recurring ? 'Primeira vez' : 'Data'}
          htmlFor="mv-date"
          required
          hint={recurring ? `Repete ${repeatLabel(repeat as FinFrequency, date)}.` : undefined}
        >
          <Input id="mv-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        {askPaid ? (
          <Field label={recurring ? `A primeira já foi ${income ? 'recebida' : 'paga'}?` : `Já foi ${paidWord}?`}>
            <Choice
              value={paid}
              onChange={setPaid}
              options={[
                { value: 'yes', label: 'Sim' },
                { value: 'no', label: 'Ainda não' },
              ]}
            />
          </Field>
        ) : (
          <p className="text-sm text-muted-foreground self-end pb-2">
            Data futura: fica como <strong>Previsto</strong> até confirmar.
          </p>
        )}
        {recurring && (
          <>
            <Field label="Até quando?">
              <Choice
                value={hasEnd}
                onChange={setHasEnd}
                options={[
                  { value: 'no', label: 'Sem fim' },
                  { value: 'yes', label: 'Até uma data' },
                ]}
              />
            </Field>
            {hasEnd === 'yes' && (
              <Field label="Última vez" htmlFor="mv-end">
                <Input id="mv-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Field>
            )}
          </>
        )}
      </div>

      {income && recurring && (
        <div className="rounded-lg border border-beige-medium bg-white/60 p-3 space-y-3">
          <Field label="Houve um pagamento de entrada (sinal)?" hint="Ex.: pagou 75 € de entrada e depois 150 € por semana.">
            <Choice
              value={hasDeposit}
              onChange={setHasDeposit}
              options={[
                { value: 'no', label: 'Não' },
                { value: 'yes', label: 'Sim' },
              ]}
            />
          </Field>
          {hasDeposit === 'yes' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Valor da entrada (€)" htmlFor="mv-dep-amount" required>
                <Input id="mv-dep-amount" inputMode="decimal" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="75,00" />
              </Field>
              <Field label="Data da entrada" htmlFor="mv-dep-date">
                <Input id="mv-dep-date" type="date" value={depositDate} onChange={(e) => setDepositDate(e.target.value)} />
              </Field>
              <Field label="Já recebida?">
                <Choice
                  value={depositPaid}
                  onChange={setDepositPaid}
                  options={[
                    { value: 'yes', label: 'Sim' },
                    { value: 'no', label: 'Não' },
                  ]}
                />
              </Field>
            </div>
          )}
        </div>
      )}

      <details className="rounded-lg border border-beige-medium px-3 py-2 [&_summary]:cursor-pointer">
        <summary className="text-sm font-medium text-charcoal">Mais detalhes (opcional): categoria, método, fatura, notas</summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          <Field label="Categoria">
            <NativeSelect value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Como foi pago?">
            <NativeSelect value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="">—</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </NativeSelect>
          </Field>
          {!recurring && (
            <>
              <Field label="Nº fatura / recibo" htmlFor="mv-invoice">
                <Input id="mv-invoice" value={invoiceRef} onChange={(e) => setInvoiceRef(e.target.value)} placeholder="FR 2026/12" />
              </Field>
              <Field label="Comprovativo (PDF ou imagem)">
                <Input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </Field>
              <Field label="Notas" htmlFor="mv-notes" className="sm:col-span-2">
                <Textarea id="mv-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
            </>
          )}
        </div>
      </details>

      {summary.length > 0 && (
        <div className="flex gap-2 rounded-lg bg-sky-50 border border-sky-200 p-3 text-sm text-sky-900">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">Vai ficar registado{clientLabel ? ` para ${clientLabel}` : ''}:</p>
            {summary.map((s) => (
              <p key={s}>{s}</p>
            ))}
          </div>
        </div>
      )}
    </FormDialog>
  );
}
