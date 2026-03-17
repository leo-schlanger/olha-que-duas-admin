import { Newspaper, RefreshCw, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import type { BlogPost, NewsletterPost } from '../../types';

interface BlogPostSelectorProps {
  posts: BlogPost[];
  selectedPosts: string[];
  loading: boolean;
  onTogglePost: (postId: string) => void;
  onRefresh: () => void;
}

export function BlogPostSelector({
  posts,
  selectedPosts,
  loading,
  onTogglePost,
  onRefresh,
}: BlogPostSelectorProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-vermelho/20 border-t-vermelho rounded-full animate-spin mb-3" />
        <p className="text-sm text-muted-foreground">Carregando notícias...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-charcoal">
            Selecionar Notícias
          </h3>
          <p className="text-sm text-muted-foreground">
            {selectedPosts.length} selecionadas
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="text-muted-foreground"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <Card className="bg-beige-light/50 border-beige-medium">
          <CardContent className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-beige-medium mb-3">
              <Newspaper className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhuma notícia disponível no blog.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {posts.map((post) => {
            const isSelected = selectedPosts.includes(post.id);
            return (
              <Card
                key={post.id}
                className={`cursor-pointer transition-all border ${
                  isSelected
                    ? 'border-vermelho bg-vermelho/5'
                    : 'border-beige-medium bg-cream hover:border-vermelho/30'
                }`}
                onClick={() => onTogglePost(post.id)}
              >
                <CardContent className="p-3 flex gap-3">
                  <div className="flex items-start pt-0.5">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onTogglePost(post.id)}
                      className="data-[state=checked]:bg-vermelho data-[state=checked]:border-vermelho"
                    />
                  </div>

                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold text-vermelho uppercase tracking-wider">
                      {post.category}
                    </span>
                    <h4 className="font-medium text-sm text-charcoal line-clamp-2 mt-0.5">
                      {post.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(post.published_at).toLocaleDateString('pt-PT')}
                    </p>
                  </div>

                  <a
                    href={`https://olhaqueduas.com/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 p-1.5 text-muted-foreground hover:text-charcoal"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper to convert BlogPost to NewsletterPost
export function blogPostToNewsletterPost(post: BlogPost): NewsletterPost {
  return {
    titulo: post.title,
    resumo: post.summary,
    image_url: post.image_url,
    link: `https://olhaqueduas.com/blog/${post.slug}`,
    categoria: post.category,
  };
}
