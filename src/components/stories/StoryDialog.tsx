import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { MediaPicker } from './MediaPicker';
import { slugify } from '../../lib/stories';
import { GENRES, STORY_STATUS_LABELS } from '../../types/stories';
import type { Story, StoryDraft, StoryStatus } from '../../types/stories';
import { ImageIcon, Loader2, X } from 'lucide-react';

interface StoryDialogProps {
  open: boolean;
  story: Story | null;
  onClose: () => void;
  onSave: (draft: StoryDraft) => Promise<boolean>;
}

const EMPTY: StoryDraft = {
  slug: '',
  title: '',
  tagline: '',
  synopsis: '',
  cover_url: '',
  genre: '',
  tags: [],
  status: 'em_curso',
  planned_episodes: 10,
  is_published: false,
  published_at: null,
};

function toDraft(story: Story | null): StoryDraft {
  if (!story) return EMPTY;
  const { id, total_views, created_at, updated_at, ...rest } = story;
  void id;
  void total_views;
  void created_at;
  void updated_at;
  return rest;
}

export function StoryDialog({ open, story, onClose, onSave }: StoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {story ? 'Editar história' : 'Nova história'}
          </DialogTitle>
        </DialogHeader>
        {/* O formulário arranca dos valores da história e é remontado
            quando ela muda — evita sincronizar estado num efeito. */}
        <StoryForm
          key={story?.id ?? 'nova'}
          story={story}
          onClose={onClose}
          onSave={onSave}
        />
      </DialogContent>
    </Dialog>
  );
}

function StoryForm({
  story,
  onClose,
  onSave,
}: Omit<StoryDialogProps, 'open'>) {
  const [draft, setDraft] = useState<StoryDraft>(() => toDraft(story));
  const [slugTouched, setSlugTouched] = useState(story !== null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof StoryDraft>(key: K, value: StoryDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const handleTitle = (title: string) => {
    setDraft((d) => ({
      ...d,
      title,
      slug: slugTouched ? d.slug : slugify(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim() || !draft.slug.trim()) return;
    setSaving(true);
    const ok = await onSave({
      ...draft,
      published_at:
        draft.is_published && !draft.published_at
          ? new Date().toISOString()
          : draft.published_at,
    });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="story-title">Título</Label>
              <Input
                id="story-title"
                value={draft.title}
                onChange={(e) => handleTitle(e.target.value)}
                placeholder="A Casa da Rua de Baixo"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="story-slug">Endereço no site</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  /historias/
                </span>
                <Input
                  id="story-slug"
                  value={draft.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set('slug', slugify(e.target.value));
                  }}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Não mude depois de publicar — quebra os links já partilhados.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="story-tagline">Frase de gancho</Label>
              <Input
                id="story-tagline"
                value={draft.tagline}
                onChange={(e) => set('tagline', e.target.value)}
                placeholder="Ninguém entrava. Até àquela terça-feira."
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                Aparece no catálogo e é o que faz clicar. Uma linha, sem spoiler.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="story-synopsis">Sinopse</Label>
              <Textarea
                id="story-synopsis"
                value={draft.synopsis}
                onChange={(e) => set('synopsis', e.target.value)}
                rows={4}
                placeholder="Dois ou três parágrafos que situam a história sem revelar o enredo."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="story-genre">Género</Label>
                <select
                  id="story-genre"
                  value={draft.genre}
                  onChange={(e) => set('genre', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">—</option>
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="story-status">Estado</Label>
                <select
                  id="story-status"
                  value={draft.status}
                  onChange={(e) => set('status', e.target.value as StoryStatus)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {(
                    Object.keys(STORY_STATUS_LABELS) as StoryStatus[]
                  ).map((s) => (
                    <option key={s} value={s}>
                      {STORY_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="story-planned">Episódios previstos</Label>
                <Input
                  id="story-planned"
                  type="number"
                  min={0}
                  max={200}
                  value={draft.planned_episodes}
                  onChange={(e) =>
                    set('planned_episodes', Number(e.target.value) || 0)
                  }
                />
                <p className="text-xs text-muted-foreground">0 = não anunciar</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Capa</Label>
              {draft.cover_url ? (
                <div className="relative w-full max-w-xs">
                  <img
                    src={draft.cover_url}
                    alt="Capa da história"
                    className="w-full aspect-video object-cover rounded-lg border border-beige-medium"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => set('cover_url', '')}
                    className="absolute top-1 right-1 bg-cream/90 hover:bg-cream"
                    aria-label="Remover capa"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPickerOpen(true)}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Escolher da Biblioteca
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-beige-medium px-4 py-3">
              <div>
                <Label htmlFor="story-published" className="cursor-pointer">
                  Visível no site
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  A história só aparece no catálogo quando estiver ligada.
                </p>
              </div>
              <Switch
                id="story-published"
                checked={draft.is_published}
                onCheckedChange={(v) => set('is_published', v)}
              />
            </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {story ? 'Guardar' : 'Criar história'}
          </Button>
        </DialogFooter>
      </form>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => set('cover_url', url)}
      />
    </>
  );
}
