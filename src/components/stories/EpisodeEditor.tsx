import { useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { RichTextEditor } from '../newsletter/RichTextEditor';
import { MediaPicker } from './MediaPicker';
import { countWords, readingMinutes } from '../../lib/stories';
import type { Episode, EpisodeDraft, Story } from '../../types/stories';
import { ArrowLeft, ImageIcon, Loader2, X } from 'lucide-react';

interface EpisodeEditorProps {
  story: Story;
  episode: Episode | null;
  nextNumber: number;
  onCancel: () => void;
  onSave: (draft: EpisodeDraft) => Promise<boolean>;
}

/** ISO → valor aceite por <input type="datetime-local">, em hora local. */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

/**
 * Editor de um episódio.
 *
 * O estado arranca das props e nunca é ressincronizado — quem chama passa
 * uma `key` por episódio, para o React remontar em vez de sincronizar.
 */
export function EpisodeEditor({
  story,
  episode,
  nextNumber,
  onCancel,
  onSave,
}: EpisodeEditorProps) {
  const [number, setNumber] = useState(episode?.number ?? nextNumber);
  const [title, setTitle] = useState(episode?.title ?? '');
  const [content, setContent] = useState(episode?.content ?? '');
  const [excerpt, setExcerpt] = useState(episode?.excerpt ?? '');
  const [cliffhanger, setCliffhanger] = useState(episode?.cliffhanger ?? '');
  const [coverUrl, setCoverUrl] = useState(episode?.cover_url ?? '');
  const [isPublished, setIsPublished] = useState(episode?.is_published ?? false);
  const [publishAt, setPublishAt] = useState(
    toLocalInput(episode?.published_at ?? null)
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const words = useMemo(() => countWords(content), [content]);
  const minutes = useMemo(() => readingMinutes(content), [content]);

  const scheduled =
    isPublished && publishAt && new Date(publishAt) > new Date();

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const ok = await onSave({
      story_id: story.id,
      number,
      title: title.trim(),
      content,
      excerpt: excerpt.trim(),
      cliffhanger: cliffhanger.trim(),
      cover_url: coverUrl,
      is_published: isPublished,
      published_at: isPublished
        ? fromLocalInput(publishAt) || new Date().toISOString()
        : fromLocalInput(publishAt),
    });
    setSaving(false);
    if (ok) onCancel();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Voltar
          </Button>
          <div>
            <h2 className="font-display text-lg font-bold text-charcoal leading-tight">
              {episode ? `Editar episódio ${episode.number}` : 'Novo episódio'}
            </h2>
            <p className="text-xs text-muted-foreground">{story.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {words} palavras · {minutes} min de leitura
          </span>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
        {/* Coluna do texto */}
        <div className="space-y-4">
          <div className="grid grid-cols-[90px_1fr] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ep-number">Nº</Label>
              <Input
                id="ep-number"
                type="number"
                min={1}
                value={number}
                onChange={(e) => setNumber(Number(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ep-title">Título do episódio</Label>
              <Input
                id="ep-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="O que ficou por dizer"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Texto</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Escreva o episódio aqui…"
            />
          </div>
        </div>

        {/* Coluna das definições */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ep-cliffhanger">Gancho final</Label>
            <Textarea
              id="ep-cliffhanger"
              value={cliffhanger}
              onChange={(e) => setCliffhanger(e.target.value)}
              rows={3}
              maxLength={400}
              placeholder="A frase que deixa o leitor a querer o próximo."
            />
            <p className="text-xs text-muted-foreground">
              Entra no post do Facebook e no fim da página.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ep-excerpt">Resumo</Label>
            <Textarea
              id="ep-excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              maxLength={400}
              placeholder="Uma ou duas frases para a partilha e para o Google."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Imagem</Label>
            {coverUrl ? (
              <div className="relative">
                <img
                  src={coverUrl}
                  alt="Imagem do episódio"
                  className="w-full aspect-video object-cover rounded-lg border border-beige-medium"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setCoverUrl('')}
                  className="absolute top-1 right-1 bg-cream/90 hover:bg-cream"
                  aria-label="Remover imagem"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setPickerOpen(true)}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Escolher da Biblioteca
              </Button>
            )}
          </div>

          <div className="rounded-lg border border-beige-medium p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="ep-published" className="cursor-pointer">
                Publicar
              </Label>
              <Switch
                id="ep-published"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
            </div>

            {isPublished && (
              <div className="space-y-1.5">
                <Label htmlFor="ep-date">Data e hora</Label>
                <Input
                  id="ep-date"
                  type="datetime-local"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {scheduled
                    ? 'Agendado — aparece no site sozinho à hora marcada.'
                    : 'Vazio ou no passado: fica visível assim que guardar.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={setCoverUrl}
      />
    </div>
  );
}
