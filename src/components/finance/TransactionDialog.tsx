import { useState } from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Paperclip, X } from 'lucide-react';
import { Field, FormDialog, NativeSelect } from './shared';
import { PAYMENT_METHODS, parseAmount } from '../../lib/finance';
import { lisbonToday } from '../../lib/scheduleDates';
import type { FinanceApi } from '../../hooks/useFinance';
import type { FinKind, FinStatus, FinTransaction } from '../../types/finance';

interface Props {
  api: FinanceApi;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Lançamento a editar; sem ele cria um novo do tipo `defaultKind`. */
  transaction?: FinTransaction | null;
  defaultKind?: FinKind;
}

export function TransactionDialog(props: Props) {
  // Remonta o formulário sempre que abre, para partir dos valores certos.
  if (!props.open) return null;
  return <TransactionForm key={props.transaction?.id ?? 'new'} {...props} />;
}

function TransactionForm({ api, open, onOpenChange, transaction, defaultKind = 'income' }: Props) {
  const { data } = api;
  const [kind, setKind] = useState<FinKind>(transaction?.kind ?? defaultKind);
  const [txDate, setTxDate] = useState(transaction?.tx_date ?? lisbonToday());
  const [amount, setAmount] = useState(transaction ? String(transaction.amount).replace('.', ',') : '');
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [status, setStatus] = useState<FinStatus>(transaction?.status ?? 'paid');
  const [method, setMethod] = useState(transaction?.method ?? '');
  const [clientId, setClientId] = useState(transaction?.client_id ?? '');
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? '');
  const [invoiceRef, setInvoiceRef] = useState(transaction?.invoice_ref ?? '');
  const [notes, setNotes] = useState(transaction?.notes ?? '');
  const [receiptPath, setReceiptPath] = useState(transaction?.receipt_path ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = data.categories.filter((c) => c.kind === kind && (c.is_active || c.id === categoryId));
  const clients = data.clients.filter((c) => c.is_active || c.id === clientId);

  const submit = async () => {
    const value = parseAmount(amount);
    if (!description.trim()) return setError('Indique uma descrição');
    if (!Number.isFinite(value) || value <= 0) return setError('Valor inválido');
    setError(null);
    setSaving(true);

    let path = receiptPath;
    if (file) {
      const uploaded = await api.uploadReceipt(file, txDate);
      if (!uploaded) {
        setSaving(false);
        return setError('Falha ao enviar o comprovativo');
      }
      if (transaction?.receipt_path) await api.removeReceipt(transaction.receipt_path);
      path = uploaded;
    } else if (transaction?.receipt_path && !receiptPath) {
      await api.removeReceipt(transaction.receipt_path);
    }

    const ok = await api.save('fin_transactions', {
      id: transaction?.id,
      kind,
      tx_date: txDate,
      amount: Math.round(value * 100) / 100,
      description: description.trim(),
      status,
      paid_at: status === 'paid' ? transaction?.paid_at ?? lisbonToday() : null,
      method: method || null,
      client_id: clientId || null,
      category_id: categoryId || null,
      invoice_ref: invoiceRef.trim() || null,
      notes: notes.trim() || null,
      receipt_path: path,
    });
    setSaving(false);
    if (ok) onOpenChange(false);
    else setError('Não foi possível guardar o lançamento');
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={transaction ? 'Editar lançamento' : kind === 'income' ? 'Nova receita' : 'Nova despesa'}
      saving={saving}
      error={error}
      onSubmit={submit}
      wide
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Tipo">
          <NativeSelect
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as FinKind);
              setCategoryId('');
            }}
          >
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
          </NativeSelect>
        </Field>
        <Field label="Estado">
          <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as FinStatus)}>
            <option value="paid">{kind === 'income' ? 'Recebido' : 'Pago'}</option>
            <option value="pending">Pendente</option>
          </NativeSelect>
        </Field>
        <Field label="Descrição" htmlFor="fin-desc" required className="sm:col-span-2">
          <Input
            id="fin-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={kind === 'income' ? 'Ex.: Patrocínio semanal' : 'Ex.: Servidor Hetzner'}
          />
        </Field>
        <Field label="Data" htmlFor="fin-date" required>
          <Input id="fin-date" type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} required />
        </Field>
        <Field label="Valor (€)" htmlFor="fin-amount" required>
          <Input
            id="fin-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="75,00"
          />
        </Field>
        <Field label={kind === 'income' ? 'Cliente' : 'Cliente associado (opcional)'}>
          <NativeSelect value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">—</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Categoria">
          <NativeSelect value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Método de pagamento">
          <NativeSelect value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="">—</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Nº fatura / recibo" htmlFor="fin-invoice" hint="Do Portal das Finanças ou do programa de faturação">
          <Input id="fin-invoice" value={invoiceRef} onChange={(e) => setInvoiceRef(e.target.value)} placeholder="FR 2026/12" />
        </Field>
        <Field label="Comprovativo / fatura (PDF ou imagem)" className="sm:col-span-2">
          {receiptPath && !file ? (
            <div className="flex items-center gap-2 text-sm">
              <Button type="button" variant="outline" size="sm" onClick={() => api.openReceipt(receiptPath)}>
                <Paperclip className="h-4 w-4 mr-1" /> Ver anexo
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setReceiptPath(null)}>
                <X className="h-4 w-4 mr-1" /> Remover
              </Button>
            </div>
          ) : (
            <Input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          )}
        </Field>
        <Field label="Notas" htmlFor="fin-notes" className="sm:col-span-2">
          <Textarea id="fin-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
    </FormDialog>
  );
}
