import { Monitor, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import type { ContentBlock } from './BlockEditor';
import logo from '../../assets/logo-olha-que-duas.png';

interface EmailPreviewProps {
  subject: string;
  blocks: ContentBlock[];
}

export function EmailPreview({ subject, blocks }: EmailPreviewProps) {
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
          <div className="bg-[#FAF9F6]">
            {/* Header with Logo */}
            <div className="bg-[#2D2D2D] py-8 text-center">
              <img
                src={logo}
                alt="Olha que Duas"
                className="h-20 mx-auto"
              />
            </div>

            {/* Yellow/Red Gradient Bar */}
            <div className="h-1.5 bg-gradient-to-r from-[#F4C430] to-[#E63946]" />

            {/* Content */}
            <div className="p-6">
              {/* Greeting */}
              <p className="text-xl font-bold text-[#2D2D2D] mb-1">
                Olá!
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Aqui estão as novidades da Olha que Duas.
              </p>

              {/* Blocks */}
              {blocks.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                  Adiciona blocos de conteúdo para visualizar aqui
                </div>
              ) : (
                <div className="space-y-4">
                  {blocks.map((block, index) => (
                    <div
                      key={block.id}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
                    >
                      {block.content ? (
                        <p className="text-[#2D2D2D] text-sm whitespace-pre-wrap leading-relaxed">
                          {block.content}
                        </p>
                      ) : (
                        <p className="text-gray-400 text-sm italic">
                          Bloco {index + 1} vazio
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Social Footer */}
            <div className="bg-[#F4C430] py-5 text-center">
              <p className="font-semibold text-[#2D2D2D] text-sm mb-3">
                Segue-nos nas redes sociais!
              </p>
              <div className="flex justify-center gap-3">
                <a
                  href="https://instagram.com/olhaqueduas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-[#2D2D2D] rounded-full text-white text-xs font-medium flex items-center justify-center hover:bg-[#E63946] transition-colors"
                >
                  IG
                </a>
                <a
                  href="https://youtube.com/@olhaqueduas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-[#2D2D2D] rounded-full text-white text-xs font-medium flex items-center justify-center hover:bg-[#E63946] transition-colors"
                >
                  YT
                </a>
                <a
                  href="https://facebook.com/olhaqueduas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-[#2D2D2D] rounded-full text-white text-xs font-medium flex items-center justify-center hover:bg-[#E63946] transition-colors"
                >
                  FB
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#2D2D2D] py-4 text-center">
              <p className="text-white/80 text-xs mb-1">
                &copy; {new Date().getFullYear()} Olha que Duas
              </p>
              <p className="text-[#F4C430] text-xs">Cancelar subscrição</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
