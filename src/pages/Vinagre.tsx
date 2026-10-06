import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { RichTextEditor } from '../components/newsletter/RichTextEditor';
import { useVinagrePosts } from '../hooks/useVinagrePosts';
import { supabase } from '../lib/supabase';
import { fromLocalInput, publicMediaUrl, renderShareImage, slugify, toLocalInput } from '../lib/vinagre';
import type { VinagrePost } from '../types/vinagre';
import {
  ArrowLeft,
  ExternalLink,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

const SITE = 'https://www.olhaqueduas.com/exclusivo';

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  ogImageUrl: string;
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
    ogImageUrl: '',
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
    ogImageUrl: post.og_image_url,
    published: post.is_published,
    publishedAt: toLocalInput(post.published_at),
    slugTouched: true,
  };
}

function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function wordCount(html: string): number {
  const text = plainText(html);
  if (!text) return 0;
  return text.split(' ').length;
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif)$/i.test(file.name);
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CoverThumb({ url }: { url: string }) {
  const [broken, setBroken] = useState(false);
  const src = publicMediaUrl(url);
  if (!src || broken) {
    return (
      <div className="flex aspect-video w-full shrink-0 items-center justify-center bg-beige-medium px-3 text-center text-xs text-muted-foreground sm:aspect-auto sm:h-32 sm:w-56">
        Sem foto
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="aspect-video w-full shrink-0 object-cover sm:aspect-auto sm:h-32 sm:w-56"
      onError={() => setBroken(true)}
    />
  );
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
                <CoverThumb url={post.cover_url} />
                <CardContent className="flex flex-1 flex-col gap-3 p-4">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {post.is_published ? 'Publicada' : 'Rascunho'}
                      {post.published_at ? ` · ${formatWhen(post.published_at)}` : ''}
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
    og_image_url: string;
    is_published: boolean;
    published_at: string | null;
  }) => Promise<string | null>;
}) {
  const [form, setForm] = useState<FormState>(() => (post ? fromPost(post) : emptyForm()));
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [coverBroken, setCoverBroken] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    setCoverBroken(false);
  }, [preview, form.coverUrl]);

  const setTitle = (title: string) => {
    setForm((current) => ({
      ...current,
      title,
      slug: current.slugTouched ? current.slug : slugify(title),
    }));
  };

  const takeFile = (next: File | null) => {
    if (next && !isImageFile(next)) {
      setFormError('Escolhe uma imagem (JPG, PNG, WebP ou GIF).');
      return;
    }
    setFormError(null);
    setFile(next);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return next ? URL.createObjectURL(next) : null;
    });
  };

  const clearCover = () => {
    if (file) {
      takeFile(null);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    if (form.coverUrl && !window.confirm('Remover a foto desta notícia?')) return;
    setForm((current) => ({ ...current, coverUrl: '', ogImageUrl: '' }));
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
    let ogImageUrl = form.ogImageUrl;

    if (file) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
      const stamp = Date.now();
      const path = `vinagre-${stamp}.${safeExt}`;
      const { error: uploadError } = await supabase.storage
        .from('media-library')
        .upload(path, file, { contentType: file.type || 'image/jpeg' });
      if (uploadError) {
        setFormError(uploadError.message);
        setSaving(false);
        return;
      }
      coverUrl = supabase.storage.from('media-library').getPublicUrl(path).data.publicUrl;
      try {
        const share = await renderShareImage(file);
        const ogPath = `vinagre-og-${stamp}.jpg`;
        const { error: ogError } = await supabase.storage
          .from('media-library')
          .upload(ogPath, share, { contentType: 'image/jpeg' });
        if (ogError) {
          setFormError(ogError.message);
          setSaving(false);
          return;
        }
        ogImageUrl = supabase.storage.from('media-library').getPublicUrl(ogPath).data.publicUrl;
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Não foi possível preparar a imagem de partilha.');
        setSaving(false);
        return;
      }
    }

    if (!coverUrl) ogImageUrl = '';

    const publishedAt = fromLocalInput(form.publishedAt);
    const message = await onSave({
      title,
      slug,
      excerpt: form.excerpt.trim(),
      content: form.content,
      cover_url: publicMediaUrl(coverUrl),
      og_image_url: ogImageUrl ? publicMediaUrl(ogImageUrl) : '',
      is_published: form.published,
      published_at: form.published ? publishedAt ?? new Date().toISOString() : publishedAt,
    });
    setSaving(false);
    if (message) setFormError(message);
  };

  const slug = slugify(form.slug || form.title);
  const words = wordCount(form.content);
  const minutes = words === 0 ? 0 : Math.max(1, Math.round(words / 200));
  const shownCover = preview || publicMediaUrl(form.coverUrl);

  return (
    <div className="space-y-4">
      <div className="sticky top-14 z-30 flex flex-wrap items-center gap-3 rounded-lg border border-beige-medium bg-cream/95 px-3 py-2 shadow-sm backdrop-blur lg:top-0">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Notícias
        </Button>
        <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          {form.title.trim() || 'Nova notícia'}
          {words > 0 ? ` · ${words} palavras · ${minutes} min` : ''}
        </p>
        <Button type="button" onClick={() => void submit()} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Guardar
        </Button>
      </div>

      {formError && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {formError}
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="order-2 space-y-5 lg:order-1">
          <Card>
            <CardContent className="space-y-4 p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#7a5b16]">
                Exclusivo Olha que Duas
              </p>
              <div className="space-y-2">
                <Label htmlFor="vinagre-title" className="sr-only">Título</Label>
                <Textarea
                  id="vinagre-title"
                  value={form.title}
                  onChange={(event) => setTitle(event.target.value)}
                  rows={2}
                  placeholder="Título da notícia"
                  className="min-h-[4.5rem] resize-none border-0 bg-transparent px-0 font-display text-2xl font-bold leading-tight shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 md:text-3xl"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="vinagre-excerpt">Resumo</Label>
                  <span className="text-xs text-muted-foreground">{form.excerpt.length}/400</span>
                </div>
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
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label>Texto</Label>
            <RichTextEditor
              content={form.content}
              onChange={(content) => setForm((current) => ({ ...current, content }))}
              placeholder="Escreve a notícia. Título médio separa as partes. Citação destaca a frase."
              minHeightClass="min-h-[22rem] md:min-h-[34rem]"
              contentClassName="vinagre-compose"
            />
            <p className="text-xs text-muted-foreground">
              Título médio parte o texto. Citação põe a frase em destaque, como no site.
            </p>
          </div>
        </div>

        <aside className="order-1 space-y-4 lg:sticky lg:top-20 lg:order-2">
          <Card>
            <CardContent className="space-y-3 p-4">
              <Label htmlFor="vinagre-cover">Foto</Label>
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  takeFile(event.dataTransfer.files?.[0] ?? null);
                }}
                className={dragging ? 'rounded-lg ring-2 ring-vermelho' : ''}
              >
                {shownCover && !coverBroken ? (
                  <img
                    src={shownCover}
                    alt="Capa da notícia"
                    className="aspect-[16/9] w-full rounded-lg bg-black object-contain"
                    onError={() => setCoverBroken(true)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-beige-medium bg-beige-light px-4 text-center text-sm text-muted-foreground"
                  >
                    <ImagePlus className="h-5 w-5" />
                    {coverBroken ? 'Esta foto não abre. Escolhe o ficheiro outra vez.' : 'Escolher ou largar a foto'}
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {file
                  ? 'Foto nova. Carrega em Guardar para a publicar.'
                  : form.coverUrl
                    ? 'Foto guardada. No WhatsApp e no Facebook sai em formato largo, com a capa inteira.'
                    : 'Sem foto, o cartão no site e a partilha ficam sem imagem.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  {shownCover ? 'Trocar foto' : 'Escolher foto'}
                </Button>
                {shownCover && (
                  <Button type="button" variant="ghost" size="sm" onClick={clearCover}>
                    {file ? 'Cancelar foto nova' : 'Remover foto'}
                  </Button>
                )}
              </div>
              <input
                ref={fileRef}
                id="vinagre-cover"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(event) => {
                  takeFile(event.target.files?.[0] ?? null);
                  event.target.value = '';
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="vinagre-published">Publicar no site</Label>
                <Switch
                  id="vinagre-published"
                  checked={form.published}
                  onCheckedChange={(published) =>
                    setForm((current) => ({ ...current, published }))
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {form.published
                  ? 'Visível no separador Exclusivo Olha que Duas.'
                  : 'Desligado, a notícia fica em rascunho.'}
              </p>
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
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 p-4">
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
              <p className="break-all text-xs text-muted-foreground">
                {SITE}/{slug || '…'}
              </p>
              {form.published && slug && (
                <a
                  href={`${SITE}/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-vermelho underline"
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Abrir no site
                </a>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
