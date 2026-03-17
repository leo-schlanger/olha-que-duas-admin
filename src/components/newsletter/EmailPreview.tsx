import { Monitor, Smartphone, Instagram, Youtube, Facebook, Gift, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import type { ContentBlock } from './BlockEditor';
import logo from '../../assets/logo-olha-que-duas.png';

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

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

            {/* Share CTA Section */}
            <div className="mx-6 mb-6">
              <div className="bg-gradient-to-br from-[#E63946] to-[#c41d2d] rounded-2xl p-5 text-center text-white relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Gift className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
                      Partilha
                    </span>
                  </div>

                  <h3 className="text-lg font-bold mb-2">
                    Conheces alguém que ia adorar?
                  </h3>

                  <p className="text-sm opacity-90 mb-4 leading-relaxed">
                    Convida quem gostas para receber novidades,
                    <span className="font-semibold"> descontos exclusivos</span> e promoções especiais!
                  </p>

                  
                  {/* CTA Button */}
                  <a
                    href="https://olhaqueduas.com/newsletter"
                    className="inline-flex items-center gap-2 bg-white text-[#E63946] font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    <Sparkles className="w-4 h-4" />
                    Subscrever Newsletter
                  </a>

                  <p className="text-[10px] mt-3 opacity-70">
                    olhaqueduas.com/newsletter
                  </p>
                </div>
              </div>
            </div>

            {/* Social Footer */}
            <div className="bg-[#F4C430] py-5 text-center">
              <p className="font-semibold text-[#2D2D2D] text-sm mb-3">
                Segue-nos nas redes sociais!
              </p>
              <div className="flex justify-center gap-2">
                <a
                  href="https://instagram.com/olhaqueduas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-xl text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://youtube.com/@olhaqueduas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-[#FF0000] rounded-xl text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                >
                  <Youtube className="w-5 h-5" />
                </a>
                <a
                  href="https://tiktok.com/@olhaqueduas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-black rounded-xl text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                >
                  <TikTokIcon className="w-5 h-5" />
                </a>
                <a
                  href="https://facebook.com/olhaqueduas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-[#1877F2] rounded-xl text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                >
                  <Facebook className="w-5 h-5" />
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
