import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { buildFacebookPost } from '../../lib/stories';
import type { Episode, Story } from '../../types/stories';
import { Check, Copy } from 'lucide-react';

interface FacebookPostDialogProps {
  open: boolean;
  story: Story;
  episode: Episode | null;
  onClose: () => void;
}

type Placement = 'comentario' | 'post';

/**
 * Monta o post do Facebook a partir do episódio e devolve-o pronto a colar.
 *
 * Existe por dois motivos: poupa a montagem manual do teaser a cada
 * episódio, e garante que o UTM vai sempre preenchido — sem ele não há
 * forma de saber no Umami que variante trouxe leitores.
 */
export function FacebookPostDialog({
  open,
  story,
  episode,
  onClose,
}: FacebookPostDialogProps) {
  const [placement, setPlacement] = useState<Placement>('comentario');
  const [copied, setCopied] = useState<string | null>(null);

  const post = useMemo(() => {
    if (!episode) return null;
    return buildFacebookPost({
      storyTitle: story.title,
      storySlug: story.slug,
      episodeNumber: episode.number,
      episodeTitle: episode.title,
      content: episode.content,
      cliffhanger: episode.cliffhanger,
      linkPlacement: placement,
    });
  }, [story, episode, placement]);

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1800);
  };

  if (!episode || !post) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post para o Facebook</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Onde fica o link</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPlacement('comentario')}
                className={`text-left rounded-lg border px-3 py-2.5 transition-colors ${
                  placement === 'comentario'
                    ? 'border-vermelho bg-vermelho/5'
                    : 'border-beige-medium hover:border-beige-warm'
                }`}
              >
                <span className="block text-sm font-medium text-charcoal">
                  No primeiro comentário
                </span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  Recomendado — o post não perde alcance.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPlacement('post')}
                className={`text-left rounded-lg border px-3 py-2.5 transition-colors ${
                  placement === 'post'
                    ? 'border-vermelho bg-vermelho/5'
                    : 'border-beige-medium hover:border-beige-warm'
                }`}
              >
                <span className="block text-sm font-medium text-charcoal">
                  Dentro do post
                </span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  Para comparar — o Facebook penaliza.
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Texto do post</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copy('body', post.body)}
              >
                {copied === 'body' ? (
                  <Check className="h-4 w-4 mr-1.5 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 mr-1.5" />
                )}
                {copied === 'body' ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm bg-beige-light border border-beige-medium rounded-lg p-4 leading-relaxed">
              {post.body}
            </pre>
          </div>

          {post.comment && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Primeiro comentário</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copy('comment', post.comment)}
                >
                  {copied === 'comment' ? (
                    <Check className="h-4 w-4 mr-1.5 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1.5" />
                  )}
                  {copied === 'comment' ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm bg-beige-light border border-beige-medium rounded-lg p-4 leading-relaxed">
                {post.comment}
              </pre>
              <p className="text-xs text-muted-foreground">
                Publique o post primeiro, depois cole isto no comentário e fixe-o.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Link com medição</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copy('url', post.url)}
              >
                {copied === 'url' ? (
                  <Check className="h-4 w-4 mr-1.5 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 mr-1.5" />
                )}
                {copied === 'url' ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
            <p className="text-xs font-mono break-all bg-beige-light border border-beige-medium rounded-lg p-3">
              {post.url}
            </p>
            <p className="text-xs text-muted-foreground">
              Aponta para o episódio {episode.number + 1}. Confirme que já está
              publicado ou agendado antes de partilhar.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
