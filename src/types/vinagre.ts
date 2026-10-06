export interface VinagrePost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_url: string;
  og_image_url: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VinagreDraft {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_url: string;
  og_image_url: string;
  is_published: boolean;
  published_at: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function str(row: Record<string, unknown>, key: string): string | null {
  const value = row[key];
  return typeof value === 'string' ? value : null;
}

export function parseVinagrePost(value: unknown): VinagrePost | null {
  if (!isRecord(value)) return null;
  const id = str(value, 'id');
  const slug = str(value, 'slug');
  const title = str(value, 'title');
  const content = str(value, 'content');
  const createdAt = str(value, 'created_at');
  const updatedAt = str(value, 'updated_at');
  if (!id || !slug || !title || content === null || !createdAt || !updatedAt) return null;
  if (typeof value.is_published !== 'boolean') return null;
  const published = value.published_at;
  const excerpt = value.excerpt;
  const cover = value.cover_url;
  const ogImage = value.og_image_url;
  return {
    id,
    slug,
    title,
    content,
    created_at: createdAt,
    updated_at: updatedAt,
    is_published: value.is_published,
    published_at: typeof published === 'string' ? published : null,
    excerpt: typeof excerpt === 'string' ? excerpt : '',
    cover_url: typeof cover === 'string' ? cover : '',
    og_image_url: typeof ogImage === 'string' ? ogImage : '',
  };
}
