import { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { StoryDialog } from '../components/stories/StoryDialog';
import { EpisodeEditor } from '../components/stories/EpisodeEditor';
import { FacebookPostDialog } from '../components/stories/FacebookPostDialog';
import { useStories, useEpisodes } from '../hooks/useStories';
import { publishState, STORY_STATUS_LABELS } from '../types/stories';
import type { Episode, PublishState, Story } from '../types/stories';
import { storyUrl } from '../lib/stories';
import {
  ArrowLeft,
  BookOpen,
  Eye,
  ExternalLink,
  Facebook,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

const STATE_STYLES: Record<PublishState, string> = {
  rascunho: 'bg-beige-medium/60 text-charcoal/70',
  agendado: 'bg-amarelo/25 text-charcoal',
  publicado: 'bg-green-100 text-green-700',
};

const STATE_LABELS: Record<PublishState, string> = {
  rascunho: 'Rascunho',
  agendado: 'Agendado',
  publicado: 'Publicado',
};

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StateBadge({
  item,
}: {
  item: { is_published: boolean; published_at: string | null };
}) {
  const state = publishState(item);
  return (
    <span
      className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${STATE_STYLES[state]}`}
    >
      {STATE_LABELS[state]}
    </span>
  );
}

export function Stories() {
  const {
    stories,
    loading,
    error,
    createStory,
    updateStory,
    deleteStory,
  } = useStories();

  const [selected, setSelected] = useState<Story | null>(null);
  const [storyDialog, setStoryDialog] = useState<{
    open: boolean;
    story: Story | null;
  }>({ open: false, story: null });

  // A história selecionada vem sempre da lista, para refletir edições.
  const current = selected
    ? stories.find((s) => s.id === selected.id) ?? selected
    : null;

  if (current) {
    return (
      <StoryDetail
        story={current}
        onBack={() => setSelected(null)}
        onEdit={() => setStoryDialog({ open: true, story: current })}
        dialog={
          <StoryDialog
            open={storyDialog.open}
            story={storyDialog.story}
            onClose={() => setStoryDialog({ open: false, story: null })}
            onSave={async (draft) => {
              if (!storyDialog.story) return false;
              return updateStory(storyDialog.story.id, draft);
            }}
          />
        }
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
            Histórias
          </h2>
          <p className="text-sm text-muted-foreground">
            Um episódio por página — é isso que multiplica as visitas.
          </p>
        </div>
        <Button onClick={() => setStoryDialog({ open: true, story: null })}>
          <Plus className="h-4 w-4 mr-2" />
          Nova história
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          A carregar…
        </div>
      ) : stories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-beige-warm mb-3" />
            <p className="font-medium text-charcoal">Ainda não há histórias</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Crie a primeira, escreva os episódios e agende-os. O episódio 1 vai
              para o Facebook; os restantes trazem as pessoas ao site.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onOpen={() => setSelected(story)}
              onEdit={() => setStoryDialog({ open: true, story })}
              onDelete={async () => {
                if (
                  window.confirm(
                    `Apagar "${story.title}" e todos os seus episódios? Não há como voltar atrás.`
                  )
                ) {
                  await deleteStory(story.id);
                }
              }}
            />
          ))}
        </div>
      )}

      <StoryDialog
        open={storyDialog.open}
        story={storyDialog.story}
        onClose={() => setStoryDialog({ open: false, story: null })}
        onSave={async (draft) => {
          if (storyDialog.story) {
            return updateStory(storyDialog.story.id, draft);
          }
          return (await createStory(draft)) !== null;
        }}
      />
    </div>
  );
}

function StoryCard({
  story,
  onOpen,
  onEdit,
  onDelete,
}: {
  story: Story;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <button
        type="button"
        onClick={onOpen}
        className="text-left focus:outline-none focus:ring-2 focus:ring-vermelho"
      >
        {story.cover_url ? (
          <img
            src={story.cover_url}
            alt=""
            className="w-full aspect-video object-cover"
          />
        ) : (
          <div className="w-full aspect-video bg-beige flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-beige-warm" />
          </div>
        )}
      </button>

      <CardContent className="flex-1 flex flex-col gap-2 pt-4">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="font-display font-bold text-charcoal leading-tight text-left hover:text-vermelho transition-colors"
          >
            {story.title}
          </button>
          <StateBadge item={story} />
        </div>

        {story.tagline && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {story.tagline}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-2 tabular-nums">
          <span>{STORY_STATUS_LABELS[story.status]}</span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {story.total_views}
          </span>
        </div>

        <div className="flex items-center gap-1 pt-2 border-t border-beige-medium">
          <Button variant="ghost" size="sm" onClick={onOpen}>
            Episódios
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive ml-auto"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StoryDetail({
  story,
  onBack,
  onEdit,
  dialog,
}: {
  story: Story;
  onBack: () => void;
  onEdit: () => void;
  dialog: React.ReactNode;
}) {
  const {
    episodes,
    loading,
    error,
    nextNumber,
    createEpisode,
    updateEpisode,
    deleteEpisode,
  } = useEpisodes(story.id);

  const [editing, setEditing] = useState<{
    open: boolean;
    episode: Episode | null;
  }>({ open: false, episode: null });
  const [fbEpisode, setFbEpisode] = useState<Episode | null>(null);

  if (editing.open) {
    return (
      <EpisodeEditor
        key={editing.episode?.id ?? 'novo'}
        story={story}
        episode={editing.episode}
        nextNumber={nextNumber}
        onCancel={() => setEditing({ open: false, episode: null })}
        onSave={async (draft) => {
          if (editing.episode) {
            return updateEpisode(editing.episode.id, draft);
          }
          return (await createEpisode(draft)) !== null;
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

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Histórias
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-lg font-bold text-charcoal leading-tight">
                {story.title}
              </h2>
              <StateBadge item={story} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {episodes.length} episódio{episodes.length === 1 ? '' : 's'}
              {story.planned_episodes > 0 && ` de ${story.planned_episodes}`}
              {' · '}
              <a
                href={storyUrl(story.slug)}
                target="_blank"
                rel="noreferrer"
                className="hover:text-vermelho inline-flex items-center gap-1"
              >
                /historias/{story.slug}
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-1.5" />
            Editar história
          </Button>
          <Button onClick={() => setEditing({ open: true, episode: null })}>
            <Plus className="h-4 w-4 mr-2" />
            Novo episódio
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          A carregar episódios…
        </div>
      ) : episodes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-beige-warm mb-3" />
            <p className="font-medium text-charcoal">Sem episódios ainda</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Escreva vários de uma vez e agende-os. Assim a publicação mantém o
              ritmo mesmo em semanas cheias.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-beige-medium">
            {episodes.map((episode) => (
              <div
                key={episode.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-beige-light/60 transition-colors"
              >
                <span className="font-display text-xl font-bold text-beige-warm tabular-nums w-8 text-center shrink-0">
                  {episode.number}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-charcoal truncate">
                      {episode.title || 'Sem título'}
                    </span>
                    <StateBadge item={episode} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                    {formatDateTime(episode.published_at)} ·{' '}
                    {episode.reading_minutes} min ·{' '}
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {episode.views}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFbEpisode(episode)}
                    title="Gerar post para o Facebook"
                  >
                    <Facebook className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing({ open: true, episode })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={async () => {
                      if (
                        window.confirm(
                          `Apagar o episódio ${episode.number}? Não há como voltar atrás.`
                        )
                      ) {
                        await deleteEpisode(episode.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <FacebookPostDialog
        open={fbEpisode !== null}
        story={story}
        episode={fbEpisode}
        onClose={() => setFbEpisode(null)}
      />

      {dialog}
    </div>
  );
}
