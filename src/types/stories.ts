export type StoryStatus = 'em_curso' | 'concluida' | 'pausada';

export interface Story {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  synopsis: string;
  cover_url: string;
  genre: string;
  tags: string[];
  status: StoryStatus;
  planned_episodes: number;
  total_views: number;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: string;
  story_id: string;
  number: number;
  title: string;
  content: string;
  excerpt: string;
  cliffhanger: string;
  cover_url: string;
  reading_minutes: number;
  views: number;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type StoryDraft = Omit<
  Story,
  'id' | 'total_views' | 'created_at' | 'updated_at'
>;

export type EpisodeDraft = Omit<
  Episode,
  'id' | 'views' | 'reading_minutes' | 'created_at' | 'updated_at'
>;

export const STORY_STATUS_LABELS: Record<StoryStatus, string> = {
  em_curso: 'Em curso',
  concluida: 'Concluída',
  pausada: 'Pausada',
};

export const GENRES = [
  'Drama',
  'Romance',
  'Mistério',
  'Suspense',
  'Comédia',
  'Crónica',
] as const;

/** Estado de publicação derivado — o que o admin mostra na lista. */
export type PublishState = 'rascunho' | 'agendado' | 'publicado';

export function publishState(item: {
  is_published: boolean;
  published_at: string | null;
}): PublishState {
  if (!item.is_published) return 'rascunho';
  if (item.published_at && new Date(item.published_at) > new Date()) {
    return 'agendado';
  }
  return 'publicado';
}
