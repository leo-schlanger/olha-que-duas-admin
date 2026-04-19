export interface Event {
  id: string;
  name: string;
  description: string | null;
  icon_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  event_id: string;
  day_of_week: number; // 0=Domingo, 1=Segunda... 6=Sábado
  time: string; // HH:mm format
  is_active: boolean;
  created_at: string;
  event?: Event;
}

export interface ScheduleWithEvent extends Schedule {
  event: Event;
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAYS_OF_WEEK: Record<DayOfWeek, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
};

export const DAYS_OF_WEEK_SHORT: Record<DayOfWeek, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
};

// Newsletter types
export interface Subscriber {
  id: number;
  email: string;
  nome: string;
  createdAt: string;
  isActive: boolean;
}

export interface SubscribersResponse {
  subscribers: Subscriber[];
  total: number;
  limit: number;
  offset: number;
}

export interface SubscriberGroup {
  id: number;
  name: string;
  totalSubscribers: number;
  totalBlacklisted: number;
  createdAt: string;
}

export interface GroupsResponse {
  groups: SubscriberGroup[];
  total: number;
}

export type BlockType = 'text' | 'image';

export interface TextBlock {
  id: string;
  type: 'text';
  content: string;
}

export interface ImageBlock {
  id: string;
  type: 'image';
  imageUrl: string;
  altText?: string;
  caption?: string;
}

export type ContentBlock = TextBlock | ImageBlock;

// Legacy support - deprecated, use ContentBlock instead
export interface LegacyContentBlock {
  id: string;
  content: string;
}

export interface NewsletterCampaign {
  subject: string;
  blocks: ContentBlock[];
  testEmail?: string;
  listIds?: number[];
}

// Campaign history types
export interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
}

export interface Campaign {
  id: number;
  name: string;
  subject: string;
  status: string;
  sentDate: string;
  createdAt: string;
  stats: CampaignStats | null;
}

export interface CampaignsResponse {
  campaigns: Campaign[];
  total: number;
  limit: number;
  offset: number;
}

// Daily Schedule types
export interface DailyScheduleSlot {
  id: string;
  period: string;
  period_label: string;
  time_range: string;
  slot_time: string;
  slot_name: string;
  genres: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export const PERIODS = [
  { key: 'manha', label: 'Manhã', range: '07H - 12H' },
  { key: 'tarde', label: 'Tarde', range: '12H - 18H' },
  { key: 'noite', label: 'Noite', range: '18H - 00H' },
  { key: 'madrugada', label: 'Madrugada', range: '00H - 07H' },
] as const;

// Radio types
export * from './radio';
