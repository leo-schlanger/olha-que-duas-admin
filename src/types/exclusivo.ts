export interface ExclusiveProgram {
  id: string;
  slug: string;
  title: string;
  author: string;
  tagline: string;
  description: string;
  portrait_url: string;
  portrait_focus: string;
  cover_url: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExclusiveProgramDraft {
  slug: string;
  title: string;
  author: string;
  tagline: string;
  description: string;
  portrait_url: string;
  portrait_focus: string;
  cover_url: string;
  sort_order: number;
  is_published: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function str(row: Record<string, unknown>, key: string): string | null {
  const value = row[key];
  return typeof value === 'string' ? value : null;
}

export function parseExclusiveProgram(value: unknown): ExclusiveProgram | null {
  if (!isRecord(value)) return null;
  const id = str(value, 'id');
  const slug = str(value, 'slug');
  const title = str(value, 'title');
  const author = str(value, 'author');
  const createdAt = str(value, 'created_at');
  const updatedAt = str(value, 'updated_at');
  if (!id || !slug || !title || !author || !createdAt || !updatedAt) return null;
  if (typeof value.is_published !== 'boolean') return null;
  const sort = value.sort_order;
  return {
    id,
    slug,
    title,
    author,
    created_at: createdAt,
    updated_at: updatedAt,
    is_published: value.is_published,
    tagline: str(value, 'tagline') ?? '',
    description: str(value, 'description') ?? '',
    portrait_url: str(value, 'portrait_url') ?? '',
    portrait_focus: str(value, 'portrait_focus') ?? 'center',
    cover_url: str(value, 'cover_url') ?? '',
    sort_order: typeof sort === 'number' ? sort : 0,
  };
}
