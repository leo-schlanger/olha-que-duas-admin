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

export interface ContentBlock {
  id: string;
  content: string;
}

export interface NewsletterCampaign {
  subject: string;
  blocks: ContentBlock[];
  testEmail?: string;
}
