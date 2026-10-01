// Transforma as linhas de fin_activity em frases legíveis para o histórico.
import { FREQUENCY_LABEL, formatDate, formatEUR, type FinanceData } from './finance';
import type { FinFrequency } from '../types/finance';

export interface FinActivity {
  id: number;
  at: string;
  user_email: string | null;
  table_name: string;
  action: 'insert' | 'update' | 'delete';
  row_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
}

export interface ActivityLine {
  who: string;
  /** Frase principal, ex.: "marcou como recebido «Pagamento semanal» (75,00 €)" */
  text: string;
  /** Campos alterados, ex.: ["Valor: 30,00 € → 26,00 €"] */
  changes: string[];
  tone: 'create' | 'update' | 'delete' | 'paid';
}

type Row = Record<string, unknown>;

const FIELD_LABEL: Record<string, string> = {
  amount: 'Valor',
  tx_date: 'Data',
  status: 'Estado',
  description: 'Descrição',
  paid_at: 'Pago em',
  category_id: 'Categoria',
  client_id: 'Cliente',
  member_id: 'Membro',
  method: 'Método',
  invoice_ref: 'Fatura / recibo',
  receipt_path: 'Comprovativo',
  notes: 'Notas',
  share_percent: 'Percentagem',
  reserve_percent: 'Reserva',
  name: 'Nome',
  nif: 'NIF',
  email: 'Email',
  phone: 'Telefone',
  start_date: 'Primeira data',
  end_date: 'Termina em',
  frequency: 'Frequência',
  is_active: 'Ativo',
  kind: 'Tipo',
  color: 'Cor',
  period: 'Referente a',
};

// Campos técnicos que não interessam a quem lê o histórico.
const HIDDEN = new Set(['id', 'created_at', 'updated_at', 'generated_count', 'recurrence_id']);

export function describeActivity(a: FinActivity, data: FinanceData): ActivityLine {
  const row = (a.new_data ?? a.old_data ?? {}) as Row;
  const who = a.user_email ? a.user_email.split('@')[0] : 'Automático';

  const catName = (id: unknown) => data.categories.find((c) => c.id === id)?.name ?? '—';
  const clientName = (id: unknown) => data.clients.find((c) => c.id === id)?.name ?? '—';
  const memberName = (id: unknown) => data.members.find((m) => m.id === id)?.name ?? 'membro removido';

  const fmt = (key: string, v: unknown): string => {
    if (v === null || v === undefined || v === '') return '—';
    switch (key) {
      case 'amount':
        return formatEUR(Number(v));
      case 'share_percent':
      case 'reserve_percent':
        return `${Number(v)}%`;
      case 'tx_date':
      case 'paid_at':
      case 'start_date':
      case 'end_date':
      case 'period':
        return formatDate(String(v));
      case 'status':
        return v === 'paid' ? 'Pago' : 'Pendente';
      case 'kind':
        return v === 'income' ? 'Receita' : 'Despesa';
      case 'category_id':
        return catName(v);
      case 'client_id':
        return clientName(v);
      case 'member_id':
        return memberName(v);
      case 'frequency':
        return FREQUENCY_LABEL[v as FinFrequency] ?? String(v);
      case 'is_active':
        return v ? 'Sim' : 'Não';
      case 'receipt_path':
        return 'anexado';
      default:
        return String(v);
    }
  };

  const what = (): string => {
    switch (a.table_name) {
      case 'fin_transactions':
        return `o lançamento «${row.description}» (${formatEUR(Number(row.amount))}, ${formatDate(String(row.tx_date))})`;
      case 'fin_recurrences':
        return `a recorrência «${row.description}» (${formatEUR(Number(row.amount))})`;
      case 'fin_clients':
        return `o cliente «${row.name}»`;
      case 'fin_members':
        return `o membro «${row.name}» (${Number(row.share_percent)}%)`;
      case 'fin_payouts':
        return `o pagamento de ${formatEUR(Number(row.amount))} a ${memberName(row.member_id)}`;
      case 'fin_categories':
        return `a categoria «${row.name}»`;
      case 'fin_settings':
        return 'as definições';
      default:
        return a.table_name;
    }
  };

  if (a.action === 'insert') {
    const auto = !a.user_email && a.table_name === 'fin_transactions';
    return {
      who,
      text: auto
        ? `gerou o previsto «${row.description}» (${formatEUR(Number(row.amount))}, ${formatDate(String(row.tx_date))})`
        : `${a.table_name === 'fin_payouts' ? 'registou' : 'criou'} ${what()}`,
      changes: [],
      tone: 'create',
    };
  }
  if (a.action === 'delete') {
    return { who, text: `apagou ${what()}`, changes: [], tone: 'delete' };
  }

  const before = (a.old_data ?? {}) as Row;
  const after = (a.new_data ?? {}) as Row;
  const changes: string[] = [];
  for (const key of Object.keys(after)) {
    if (HIDDEN.has(key)) continue;
    if (JSON.stringify(before[key]) === JSON.stringify(after[key])) continue;
    if (key === 'receipt_path') {
      changes.push(after[key] ? 'Comprovativo anexado' : 'Comprovativo removido');
      continue;
    }
    changes.push(`${FIELD_LABEL[key] ?? key}: ${fmt(key, before[key])} → ${fmt(key, after[key])}`);
  }

  if (a.table_name === 'fin_transactions' && before.status !== after.status) {
    const income = after.kind === 'income';
    const paid = after.status === 'paid';
    return {
      who,
      text: `${paid ? `marcou como ${income ? 'recebido' : 'pago'}` : 'voltou a pôr como pendente'} ${what()}`,
      changes: changes.filter((c) => !c.startsWith('Estado') && !c.startsWith('Pago em')),
      tone: paid ? 'paid' : 'update',
    };
  }
  return { who, text: `alterou ${what()}`, changes, tone: 'update' };
}
