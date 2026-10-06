import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { RichTextEditor } from '../components/newsletter/RichTextEditor';
import { useVinagrePosts } from '../hooks/useVinagrePosts';
import { supabase } from '../lib/supabase';
import { fromLocalInput, slugify, toLocalInput } from '../lib/vinagre';
import type { VinagrePost } from '../types/vinagre';
import { ArrowLeft, ExternalLink, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

const SITE = 'https://www.olhaqueduas.com/exclusivo';

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  published: boolean;
  publishedAt: string;
  slugTouched: boolean;
}

function emptyForm(): FormState {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return {
    title: '',
    slug: '',
    excerpt: '',
    content: '<p></p>',
    coverUrl: '',
    published: false,
    publishedAt: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`,
    slugTouched: false,
  };
}

function fromPost(post: VinagrePost): FormState {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content || '<p></p>',
    coverUrl: post.cover_url,
    published: post.is_published,
    publishedAt: toLocalInput(post.published_at),
    slugTouched: true,
  };
}

function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
}

export function Vinagre() {
  const { posts, loading, error, savePost, deletePost } = useVinagrePosts();
  const [editing, setEditing] = useState<VinagrePost | 'new' | null>(null);

  if (editing) {
    const current = editing === 'new' ? null : editing;
    return (
      <Editor
        post={current}
        onBack={() => setEditing(null)}
        onSave={async (draft) => {
          const message = await savePost(draft, current?.id);
          if (!message) setEditing(null);
          return message;
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-lg font-bold text-charcoal">
            Exclusivo Olha que Duas
          </h2>
          <p className="text-sm text-muted-foreground">
            Notícias da coluna do Eduardo Vinagre. O que publicares aparece no separador do site.
          </p>
        </div>
        <Button onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nova notícia
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          A carregar…
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Ainda não há notícias nesta coluna.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {post.cover_url ? (
                  <img
                    src={post.cover_url}
                    alt=""
                    className="h-36 w-full object-cover sm:h-auto sm:w-48"
                  />
                ) : (
                  <div className="h-36 w-full bg-beige-medium sm:h-auto sm:w-48" />
                )}
                <CardContent className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {post.is_published ? 'Publicada' : 'Rascunho'}
                        {post.published_at
                          ? ` · ${new Date(post.published_at).toLocaleString('pt-PT', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`
                          : ''}
                      </p>
                      <h3 className="font-display text-lg font-bold text-charcoal">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(post)}>
                      <Pencil className="h-4 w-4 mr-1.5" />
                      Editar
                    </Button>
                    {post.is_published && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`${SITE}/${post.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1.5" />
                          Ver no site
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (window.confirm(`Apagar "${post.title}"? Não há como voltar atrás.`)) {
                          void deletePost(post.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Apagar
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Editor({
  post,
  onBack,
  onSave,
}: {
  post: VinagrePost | null;
  onBack: () => void;
  onSave: (draft: {
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    cover_url: string;
    is_published: boolean;
    published_at: string | null;
  }) => Promise<string | null>;
}) {
  const [form, setForm] = useState<FormState>(() => (post ? fromPost(post) : emptyForm()));
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const setTitle = (title: string) => {
    setForm((current) => ({
      ...current,
      title,
      slug: current.slugTouched ? current.slug : slugify(title),
    }));
  };

  const submit = async () => {
    const title = form.title.trim();
    const slug = slugify(form.slug || title);
    if (!title) {
      setFormError('Escreve o título.');
      return;
    }
    if (!slug) {
      setFormError('O endereço da notícia ficou vazio.');
      return;
    }
    if (!plainText(form.content)) {
      setFormError('Escreve o texto da notícia.');
      return;
    }

    setSaving(true);
    setFormError(null);
    let coverUrl = form.coverUrl;

    if (file) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
      const path = `vinagre-${Date.now()}.${safeExt}`;
      const { error: uploadError } = await supabase.storage
        .from('media-library')
        .upload(path, file, { contentType: file.type || 'image/jpeg' });
      if (uploadError) {
        setFormError(uploadError.message);
        setSaving(false);
        return;
      }
      coverUrl = supabase.storage.from('media-library').getPublicUrl(path).data.publicUrl;
    }

    const publishedAt = fromLocalInput(form.publishedAt);
    const message = await onSave({
      title,
      slug,
      excerpt: form.excerpt.trim(),
      content: form.content,
      cover_url: coverUrl,
      is_published: form.published,
      published_at: form.published ? publishedAt ?? new Date().toISOString() : publishedAt,
    });
    setSaving(false);
    if (message) setFormError(message);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={() => void submit()} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Guardar
        </Button>
      </div>

      {formError && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {formError}
        </div>
      )}

      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="space-y-2">
            <Label htmlFor="vinagre-title">Título</Label>
            <Input
              id="vinagre-title"
              value={form.title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Título da notícia"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vinagre-slug">Endereço</Label>
            <Input
              id="vinagre-slug"
              value={form.slug}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  slug: event.target.value,
                  slugTouched: true,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">{SITE}/{slugify(form.slug || form.title) || '…'}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vinagre-excerpt">Resumo</Label>
            <Textarea
              id="vinagre-excerpt"
              value={form.excerpt}
              onChange={(event) =>
                setForm((current) => ({ ...current, excerpt: event.target.value }))
              }
              rows={3}
              maxLength={400}
              placeholder="A frase que aparece no cartão e na partilha"
            />
          </div>

          <div className="space-y-2">
            <Label>Texto</Label>
            <RichTextEditor
              content={form.content}
              onChange={(content) => setForm((current) => ({ ...current, content }))}
              placeholder="Escreve a notícia. Usa títulos e citações para partir o texto."
              minHeightClass="min-h-[320px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vinagre-cover">Foto</Label>
            {(preview || form.coverUrl) && (
              <img
                src={preview || form.coverUrl}
                alt=""
                className="max-h-64 w-full rounded-lg object-cover"
              />
            )}
            <Input
              id="vinagre-cover"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => {
                const next = event.target.files?.[0] ?? null;
                setFile(next);
                setPreview((current) => {
                  if (current) URL.revokeObjectURL(current);
                  return next ? URL.createObjectURL(next) : null;
                });
              }}
            />
          </div>

          <div className="flex flex-wrap items-end gap-6">
            <div className="flex items-center gap-3">
              <Switch
                id="vinagre-published"
                checked={form.published}
                onCheckedChange={(published) =>
                  setForm((current) => ({ ...current, published }))
                }
              />
              <Label htmlFor="vinagre-published">Publicar no site</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vinagre-date">Data</Label>
              <Input
                id="vinagre-date"
                type="datetime-local"
                value={form.publishedAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, publishedAt: event.target.value }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
