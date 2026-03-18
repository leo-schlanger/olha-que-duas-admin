import { Monitor, Smartphone, Instagram, Youtube, Facebook, Heart, Mail } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import type { ContentBlock } from '../../types';
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
        <Card className="overflow-hidden shadow-xl border-0 rounded-xl">
          {/* Email Header Bar */}
          <div className="bg-white px-5 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <Mail className="w-3 h-3" />
              <span>Assunto</span>
            </div>
            <p className="text-sm font-semibold text-[#2D2D2D] truncate">
              {subject || 'Sem assunto'}
            </p>
          </div>

          {/* Email Content */}
          <div className="bg-[#FAFAFA]">
            {/* Header with Logo - LARGER */}
            <div className="bg-[#2D2D2D] py-12 px-8 text-center">
              <img
                src={logo}
                alt="Olha que Duas"
                className="h-36 mx-auto drop-shadow-lg"
              />
            </div>

            {/* Elegant Gradient Divider */}
            <div className="h-1 bg-gradient-to-r from-[#F4C430] via-[#E8A825] to-[#E63946]" />

            {/* Content Area */}
            <div className="p-8">
              {/* Greeting - More elegant */}
              <div className="mb-8">
                <p className="text-2xl font-bold text-[#2D2D2D] mb-2 font-display">
                  Olá!
                </p>
                <p className="text-gray-500 text-base leading-relaxed">
                  Aqui estão as novidades da <span className="font-semibold text-[#E63946]">Olha que Duas</span>.
                </p>
              </div>

              {/* Subtle Divider */}
              <div className="w-16 h-0.5 bg-gradient-to-r from-[#F4C430] to-[#E63946] mb-8" />

              {/* Blocks - More refined */}
              {blocks.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl bg-white">
                  Adiciona blocos de conteúdo para visualizar aqui
                </div>
              ) : (
                <div className="space-y-5">
                  {blocks.map((block, index) => {
                    // Text block
                    if (block.type === 'text') {
                      return (
                        <div
                          key={block.id}
                          className="bg-white rounded-xl p-6 shadow-sm border border-gray-50"
                        >
                          {block.content ? (
                            <p className="text-[#2D2D2D] text-base whitespace-pre-wrap leading-relaxed">
                              {block.content}
                            </p>
                          ) : (
                            <p className="text-gray-400 text-sm italic">
                              Bloco de texto {index + 1} vazio
                            </p>
                          )}
                        </div>
                      );
                    }

                    // Image block
                    if (block.type === 'image') {
                      return (
                        <div
                          key={block.id}
                          className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-50"
                        >
                          {block.imageUrl ? (
                            <div>
                              <img
                                src={block.imageUrl}
                                alt={block.altText || 'Imagem da newsletter'}
                                className="w-full h-auto"
                              />
                              {block.caption && (
                                <p className="text-gray-500 text-sm text-center py-3 px-4 bg-gray-50 border-t border-gray-100">
                                  {block.caption}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="py-8 text-center text-gray-400 text-sm">
                              Imagem não carregada
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Unknown block type - skip
                    return null;
                  })}
                </div>
              )}
            </div>

            {/* Share CTA Section - Cleaner design */}
            <div className="px-8 pb-8">
              <div className="bg-[#2D2D2D] rounded-2xl p-8 text-center relative overflow-hidden">
                {/* Subtle gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F4C430] to-[#E63946]" />

                <div className="relative">
                  <div className="inline-flex items-center gap-2 bg-[#E63946] text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
                    <Heart className="w-3 h-3" />
                    <span>PARTILHA</span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">
                    Conheces alguém que ia adorar?
                  </h3>

                  <p className="text-white/70 text-sm mb-6 leading-relaxed max-w-xs mx-auto">
                    Convida quem gostas para receber novidades e <span className="text-[#F4C430] font-semibold">ofertas exclusivas</span>!
                  </p>

                  {/* CTA Button - More elegant */}
                  <a
                    href="https://olhaqueduas.com/newsletter"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#F4C430] to-[#E8A825] text-[#2D2D2D] font-bold px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg text-sm"
                  >
                    Subscrever Newsletter
                  </a>
                </div>
              </div>
            </div>

            {/* Social Footer - Elegant with original icon styles */}
            <div className="bg-gradient-to-b from-[#F4C430] to-[#E8A825] py-8 text-center">
              <p className="font-semibold text-[#2D2D2D] text-sm mb-4 tracking-wide">
                SEGUE-NOS NAS REDES SOCIAIS
              </p>
              <div className="flex justify-center gap-3">
                <a
                  href="https://www.instagram.com/olhaqueduas2025"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-xl text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://youtube.com/@olhaqueduas-l9m?si=hKFnzKpluIODLFFk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 bg-[#FF0000] rounded-xl text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                >
                  <Youtube className="w-5 h-5" />
                </a>
                <a
                  href="https://www.tiktok.com/@olha.que.duas_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 bg-black rounded-xl text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                >
                  <TikTokIcon className="w-5 h-5" />
                </a>
                <a
                  href="https://www.facebook.com/share/17npXT7nNb/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 bg-[#1877F2] rounded-xl text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Footer - More professional */}
            <div className="bg-[#2D2D2D] py-6 text-center">
              <p className="text-white/60 text-xs mb-2">
                &copy; {new Date().getFullYear()} Olha que Duas - Todos os direitos reservados
              </p>
              <a href="#" className="text-[#F4C430] text-xs hover:underline">
                Cancelar subscrição
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
