import { useState } from 'react';
import { AlertTriangle, FileSearch, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Field, FormDialog, NativeSelect } from './shared';
import { formatDate, formatEUR, parseAmount } from '../../lib/finance';
import { extractPdfText, findMatches, matchClient, parseReceiptText } from '../../lib/receiptParser';
import { lisbonToday } from '../../lib/scheduleDates';
import type { FinanceApi } from '../../hooks/useFinance';
import type { FinKind } from '../../types/finance';

/**
 * Importa um comprovativo bancário: lê valor, data e contraparte do PDF,
 * sugere o lançamento previsto correspondente e marca-o como pago com o
 * comprovativo anexado (ou cria um lançamento novo).
 */
export function ImportReceiptDialog({ api, onClose }: { api: FinanceApi; onClose: () => void }) {
  const { data } = api;
  const [file, setFile] = useState<File | null>(null);
  const [reading, setReading] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [date, setDate] = useState(lisbonToday());
  const [amount, setAmount] = useState('');
  const [counterpart, setCounterpart] = useState('');
  const [method, setMethod] = useState('');
  const [kind, setKind] = useState<FinKind>('income');
  const [clientId, setClientId] = useState('');
  // id de um previsto, ou 'new' para criar um lançamento novo
  const [target, setTarget] = useState('new');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = parseAmount(amount);
  const client = data.clients.find((c) => c.id === clientId) ?? null;
  const { candidates, duplicates } = findMatches(
    { date: date || null, amount: Number.isFinite(value) ? value : null },
    client,
    data.transactions.filter((t) => t.kind === kind)
  );

  const read = async (f: File) => {
    setFile(f);
    setError(null);
    if (f.type !== 'application/pdf') {
      setParsed(true);
      return;
    }
    setReading(true);
    try {
      const r = parseReceiptText(await extractPdfText(f));
      if (r.date) setDate(r.date);
      if (r.amount) setAmount(r.amount.toFixed(2).replace('.', ','));
      setCounterpart(r.counterpart ?? '');
      setMethod(r.method ?? '');
      const c = matchClient(r.counterpart, data.clients);
      setClientId(c?.id ?? '');
      const m = findMatches(r, c, data.transactions.filter((t) => t.kind === 'income'));
      // Se parece já registado, não sugere marcar outro previsto por cima.
      setTarget(m.duplicates.length === 0 && m.candidates[0] ? m.candidates[0].id : 'new');
      if (!r.amount || !r.date) setError('Não consegui ler tudo do PDF — confirme os campos abaixo.');
    } catch {
      setError('Não foi possível ler o PDF. Preencha os campos manualmente.');
    } finally {
      setReading(false);
      setParsed(true);
    }
  };

  const submit = async () => {
    if (!file) return setError('Escolha o comprovativo');
    if (!Number.isFinite(value) || value <= 0) return setError('Valor inválido');
    if (!date) return setError('Indique a data');
    setSaving(true);
    const path = await api.uploadReceipt(file, date);
    if (!path) {
      setSaving(false);
      return setError('Falha ao enviar o comprovativo');
    }
    const note = `Comprovativo ${method || ''} de ${formatDate(date)}${counterpart ? ` — ${counterpart}` : ''}`.replace('  ', ' ');
    const existing = data.transactions.find((t) => t.id === target);
    const ok = existing
      ? await api.save('fin_transactions', {
          id: existing.id,
          status: 'paid',
          paid_at: date,
          receipt_path: path,
          method: method || existing.method,
          notes: existing.notes ? `${existing.notes}\n${note}` : note,
        })
      : await api.save('fin_transactions', {
          kind,
          tx_date: date,
          paid_at: date,
          status: 'paid',
          amount: Math.round(value * 100) / 100,
          description: counterpart ? `${kind === 'income' ? 'Pagamento' : 'Pagamento a'} ${counterpart}` : 'Movimento importado',
          client_id: clientId || null,
          method: method || null,
          receipt_path: path,
          notes: note,
        });
    setSaving(false);
    if (ok) onClose();
    else {
      await api.removeReceipt(path);
      setError('Não foi possível guardar');
    }
  };

  return (
    <FormDialog open onOpenChange={(o) => !o && onClose()} title="Importar comprovativo" saving={saving} error={error} onSubmit={submit} wide>
      <Field label="Comprovativo (PDF do banco ou imagem)" hint="PDFs com texto (ex.: Millennium, MB WAY) são lidos automaticamente.">
        <Input type="file" accept="application/pdf,image/*" onChange={(e) => e.target.files?.[0] && read(e.target.files[0])} />
      </Field>

      {reading && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> A ler o comprovativo...
        </p>
      )}

      {parsed && !reading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tipo">
              <NativeSelect value={kind} onChange={(e) => { setKind(e.target.value as FinKind); setTarget('new'); }}>
                <option value="income">Recebimento (receita)</option>
                <option value="expense">Pagamento (despesa)</option>
              </NativeSelect>
            </Field>
            <Field label="Data do movimento" htmlFor="imp-date" required>
              <Input id="imp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Valor (€)" htmlFor="imp-amount" required>
              <Input id="imp-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label="De / para (no comprovativo)" htmlFor="imp-who">
              <Input id="imp-who" value={counterpart} onChange={(e) => setCounterpart(e.target.value)} />
            </Field>
            <Field label="Cliente">
              <NativeSelect value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">—</option>
                {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Método">
              <Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="MB WAY" />
            </Field>
          </div>

          {duplicates.length > 0 && (
            <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Parece que este comprovativo <strong>já foi registado</strong>:{' '}
                {duplicates.map((d) => `${d.description} (${formatDate(d.tx_date)}, ${formatEUR(d.amount)})`).join('; ')}.
                Confirme antes de guardar.
              </span>
            </div>
          )}

          <Field label="O que fazer com este comprovativo">
            <div className="space-y-2">
              {candidates.map((t) => (
                <label key={t.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-beige-medium cursor-pointer has-[:checked]:border-vermelho has-[:checked]:bg-vermelho/5">
                  <input type="radio" name="imp-target" checked={target === t.id} onChange={() => setTarget(t.id)} />
                  <span className="text-sm">
                    Marcar como pago o previsto <strong>{t.description}</strong> de {formatDate(t.tx_date)} ({formatEUR(t.amount)})
                  </span>
                </label>
              ))}
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-beige-medium cursor-pointer has-[:checked]:border-vermelho has-[:checked]:bg-vermelho/5">
                <input type="radio" name="imp-target" checked={target === 'new'} onChange={() => setTarget('new')} />
                <span className="text-sm">
                  <FileSearch className="h-4 w-4 inline mr-1" />
                  Criar um lançamento novo (já pago)
                </span>
              </label>
            </div>
          </Field>
        </>
      )}
    </FormDialog>
  );
}
