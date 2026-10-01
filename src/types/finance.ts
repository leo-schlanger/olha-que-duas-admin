export type FinKind = 'income' | 'expense';
export type FinFrequency = 'weekly' | 'monthly' | 'yearly';
export type FinStatus = 'pending' | 'paid';

export interface FinCategory {
  id: string;
  name: string;
  kind: FinKind;
  color: string;
  is_active: boolean;
}

export interface FinClient {
  id: string;
  name: string;
  nif: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FinRecurrence {
  id: string;
  kind: FinKind;
  description: string;
  amount: number;
  frequency: FinFrequency;
  start_date: string;
  end_date: string | null;
  generated_count: number;
  client_id: string | null;
  category_id: string | null;
  method: string | null;
  is_active: boolean;
}

export interface FinTransaction {
  id: string;
  kind: FinKind;
  tx_date: string;
  amount: number;
  description: string;
  status: FinStatus;
  paid_at: string | null;
  method: string | null;
  invoice_ref: string | null;
  receipt_path: string | null;
  notes: string | null;
  client_id: string | null;
  category_id: string | null;
  recurrence_id: string | null;
}

export interface FinMember {
  id: string;
  name: string;
  email: string | null;
  share_percent: number;
  is_active: boolean;
}

export interface FinPayout {
  id: string;
  member_id: string;
  period: string;
  amount: number;
  paid_at: string;
  notes: string | null;
}

export interface FinSettings {
  reserve_percent: number;
}
