import { useState } from 'react';
import { Paperclip, Pencil, Search, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { EmptyState, KindBadge, NativeSelect, StatusBadge } from './shared';
import { formatDate, formatEUR, inPeriod, isOverdue, type Period } from '../../lib/finance';
import type { FinanceApi } from '../../hooks/useFinance';
import type { FinTransaction } from '../../types/finance';

export function TransactionsTab({
  api,
  period,
  onEdit,
}: {
  api: FinanceApi;
  period: Period;
  onEdit: (tx: FinTransaction) => void;
}) {
  const { data } = api;
  const [kind, setKind] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const clientName = (id: string | null) => data.clients.find((c) => c.id === id)?.name ?? '';
  const category = (id: string | null) => data.categories.find((c) => c.id === id);
  const q = search.trim().toLowerCase();

  const rows = data.transactions.filter((t) => {
    if (!inPeriod(t.tx_date, period)) return false;
    if (kind && t.kind !== kind) return false;
    if (status === 'overdue' ? !isOverdue(t) : status && t.status !== status) return false;
    if (!q) return true;
    return [t.description, clientName(t.client_id), t.invoice_ref, t.notes, category(t.category_id)?.name]
      .some((v) => v?.toLowerCase().includes(q));
  });

  const total = rows
    .filter((t) => t.status === 'paid')
    .reduce((s, t) => s + (t.kind === 'income' ? t.amount : -t.amount), 0);

  const handleDelete = async (id: string) => {
    if (confirmDelete === id) {
      await api.remove('fin_transactions', id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Procurar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <NativeSelect value={kind} onChange={(e) => setKind(e.target.value)} className="w-40">
            <option value="">Receitas e despesas</option>
            <option value="income">Só receitas</option>
            <option value="expense">Só despesas</option>
          </NativeSelect>
          <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
            <option value="">Todos os estados</option>
            <option value="paid">Pagos</option>
            <option value="pending">Pendentes</option>
            <option value="overdue">Em atraso</option>
          </NativeSelect>
        </div>

        {rows.length === 0 ? (
          <EmptyState>Sem lançamentos neste período</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-beige-medium">
                  <th className="py-2 pr-3 font-medium">Data</th>
                  <th className="py-2 pr-3 font-medium">Descrição</th>
                  <th className="py-2 pr-3 font-medium">Categoria</th>
                  <th className="py-2 pr-3 font-medium">Estado</th>
                  <th className="py-2 pr-3 font-medium text-right">Valor</th>
                  <th className="py-2 w-28" />
                </tr>
              </thead>
              <tbody className="divide-y divide-beige-medium">
                {rows.map((t) => {
                  const cat = category(t.category_id);
                  return (
                    <tr key={t.id} className="hover:bg-beige-light/60">
                      <td className="py-2.5 pr-3 tabular-nums whitespace-nowrap">{formatDate(t.tx_date)}</td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <KindBadge kind={t.kind} />
                          <span className="font-medium text-charcoal">{t.description}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {[clientName(t.client_id), t.method, t.invoice_ref && `Fatura ${t.invoice_ref}`]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        {cat && (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                            {cat.name}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        <StatusBadge tx={t} />
                      </td>
                      <td className={`py-2.5 pr-3 text-right tabular-nums font-medium whitespace-nowrap ${t.kind === 'income' ? 'text-green-700' : 'text-red-600'}`}>
                        {t.kind === 'income' ? '+' : '−'} {formatEUR(t.amount)}
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        {t.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-green-700"
                            onClick={() => api.markPaid(t)}
                          >
                            ✓
                          </Button>
                        )}
                        {t.receipt_path && (
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Ver comprovativo" onClick={() => api.openReceipt(t.receipt_path!)}>
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="Editar" onClick={() => onEdit(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className={`h-8 w-8 ${confirmDelete === t.id ? 'text-white bg-red-600 hover:bg-red-700' : 'text-red-600'}`}
                          title={confirmDelete === t.id ? 'Clique de novo para apagar' : 'Apagar'}
                          onClick={() => handleDelete(t.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-beige-medium">
                  <td colSpan={4} className="py-2.5 font-medium">Saldo pago dos lançamentos filtrados</td>
                  <td className={`py-2.5 pr-3 text-right tabular-nums font-bold ${total >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {formatEUR(total)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
