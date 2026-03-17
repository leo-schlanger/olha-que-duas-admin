import { Monitor, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import type { NewsletterPost } from '../../types';

interface EmailPreviewProps {
  subject: string;
  posts: NewsletterPost[];
}

export function EmailPreview({ subject, posts }: EmailPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-charcoal">
          Pré-visualização
        </h3>
        <div className="flex gap-1 bg-beige-light rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('desktop')}
            className={`px-3 py-1.5 h-auto ${
              viewMode === 'desktop'
                ? 'bg-white shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('mobile')}
            className={`px-3 py-1.5 h-auto ${
              viewMode === 'mobile'
                ? 'bg-white shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview Container */}
      <div
        className={`mx-auto transition-all ${
          viewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-full'
        }`}
      >
        <Card className="overflow-hidden shadow-lg border-0">
          {/* Email Header Bar */}
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
            <p className="text-xs text-gray-500 mb-0.5">Assunto:</p>
            <p className="text-sm font-medium text-charcoal truncate">
              {subject || 'Sem assunto'}
            </p>
          </div>

          {/* Email Content */}
          <div className="bg-[#F5F5F0]">
            {/* Header */}
            <div className="bg-[#2D2D2D] py-6 text-center">
              <div className="w-32 h-10 bg-white/10 rounded mx-auto flex items-center justify-center">
                <span className="text-white font-display font-bold text-sm">
                  Olha que Duas
                </span>
              </div>
            </div>

            {/* Yellow Bar */}
            <div className="h-1.5 bg-gradient-to-r from-amarelo to-vermelho" />

            {/* Content */}
            <div className="p-6 bg-[#FAF9F6]">
              {/* Greeting */}
              <p className="text-xl font-bold text-charcoal mb-1">
                Olá {'{{nome}}'}!
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Aqui estão as últimas notícias do mundo Olha que Duas.
              </p>

              {/* Gradient Divider */}
              <div className="h-0.5 bg-gradient-to-r from-vermelho to-amarelo rounded mb-6" />

              {/* Posts */}
              {posts.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Seleciona notícias para visualizar aqui
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post, index) => (
                    <Card
                      key={index}
                      className="overflow-hidden border-0 shadow-sm"
                    >
                      {post.image_url && (
                        <img
                          src={post.image_url}
                          alt={post.titulo}
                          className="w-full h-40 object-cover"
                        />
                      )}
                      <CardContent className="p-4">
                        <span className="text-[10px] font-semibold text-vermelho uppercase tracking-wider">
                          {post.categoria}
                        </span>
                        <h4 className="font-bold text-charcoal mt-1 mb-2">
                          {post.titulo}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {post.resumo}
                        </p>
                        <span className="inline-block px-4 py-2 bg-vermelho text-white text-sm font-medium rounded-lg">
                          Ler mais &rarr;
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Social Footer */}
            <div className="bg-amarelo py-5 text-center">
              <p className="font-semibold text-charcoal text-sm mb-3">
                Segue-nos nas redes sociais!
              </p>
              <div className="flex justify-center gap-3">
                {['IG', 'YT', 'FB'].map((social) => (
                  <span
                    key={social}
                    className="w-8 h-8 bg-charcoal rounded-full text-white text-xs font-medium flex items-center justify-center"
                  >
                    {social}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#2D2D2D] py-4 text-center">
              <p className="text-white/80 text-xs mb-1">
                &copy; 2025 Olha que Duas • Todos os direitos reservados
              </p>
              <p className="text-amarelo text-xs">Cancelar subscrição</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
