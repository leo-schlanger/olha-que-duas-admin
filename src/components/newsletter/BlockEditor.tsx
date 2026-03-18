import { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Type,
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
  FolderOpen
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { uploadImage } from '../../lib/imageUpload';
import { addToGallery } from '../../lib/imageGallery';
import { ImageGallery } from './ImageGallery';
import type { ContentBlock, TextBlock, ImageBlock, BlockType } from '../../types';

// Re-export for backwards compatibility
export type { ContentBlock };

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: typeof Type; description: string }[] = [
  { type: 'text', label: 'Texto', icon: Type, description: 'Parágrafo de texto' },
  { type: 'image', label: 'Imagem', icon: ImageIcon, description: 'Adicionar imagem' },
];

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const [galleryBlockId, setGalleryBlockId] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImageBlockId, setPendingImageBlockId] = useState<string | null>(null);

  const addBlock = (type: BlockType) => {
    const id = crypto.randomUUID();

    if (type === 'text') {
      const newBlock: TextBlock = {
        id,
        type: 'text',
        content: '',
      };
      onChange([...blocks, newBlock]);
    } else if (type === 'image') {
      const newBlock: ImageBlock = {
        id,
        type: 'image',
        imageUrl: '',
        altText: '',
        caption: '',
      };
      onChange([...blocks, newBlock]);
    }

    setShowBlockPicker(false);
  };

  const updateTextBlock = (id: string, content: string) => {
    onChange(
      blocks.map((block) =>
        block.id === id && block.type === 'text'
          ? { ...block, content }
          : block
      )
    );
  };

  const updateImageBlock = (id: string, updates: Partial<ImageBlock>) => {
    onChange(
      blocks.map((block) =>
        block.id === id && block.type === 'image'
          ? { ...block, ...updates }
          : block
      )
    );
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter((block) => block.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= blocks.length) return;

    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    onChange(newBlocks);
  };

  const handleImageUpload = async (file: File, blockId: string) => {
    setUploadingBlockId(blockId);

    try {
      const result = await uploadImage(file);

      if (result.success && result.url) {
        // Save to gallery for reuse
        addToGallery({
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          name: file.name,
        });

        updateImageBlock(blockId, { imageUrl: result.url });
      } else {
        alert(result.error || 'Erro ao fazer upload da imagem');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Erro ao fazer upload da imagem. Tenta novamente.');
    } finally {
      setUploadingBlockId(null);
      setPendingImageBlockId(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && pendingImageBlockId) {
      handleImageUpload(file, pendingImageBlockId);
    }
    e.target.value = '';
  };

  const triggerImageUpload = (blockId: string) => {
    setPendingImageBlockId(blockId);
    fileInputRef.current?.click();
  };

  const openGallery = (blockId: string) => {
    setGalleryBlockId(blockId);
    setShowGallery(true);
  };

  const handleGallerySelect = (imageUrl: string) => {
    if (galleryBlockId) {
      updateImageBlock(galleryBlockId, { imageUrl });
    }
    setGalleryBlockId(null);
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image Gallery Modal */}
      <ImageGallery
        open={showGallery}
        onClose={() => {
          setShowGallery(false);
          setGalleryBlockId(null);
        }}
        onSelect={handleGallerySelect}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-charcoal">
            Conteúdo
          </h3>
          <p className="text-sm text-muted-foreground">
            {blocks.length} {blocks.length === 1 ? 'bloco' : 'blocos'}
          </p>
        </div>
      </div>

      {/* Empty State */}
      {blocks.length === 0 ? (
        <Card className="bg-beige-light/50 border-beige-medium border-dashed">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-beige rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              Começa a criar a tua newsletter
            </p>
            <div className="flex gap-3 justify-center">
              {BLOCK_TYPES.map((blockType) => (
                <Button
                  key={blockType.type}
                  onClick={() => addBlock(blockType.type)}
                  variant="outline"
                  className="border-beige-medium hover:border-vermelho hover:text-vermelho"
                >
                  <blockType.icon className="h-4 w-4 mr-2" />
                  {blockType.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, index) => (
            <Card
              key={block.id}
              className="bg-white border-beige-medium overflow-hidden group"
            >
              {/* Block Header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-beige-light/50 border-b border-beige-medium">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <div className="flex items-center gap-2 flex-1">
                  {block.type === 'text' ? (
                    <Type className="h-4 w-4 text-vermelho" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-amarelo" />
                  )}
                  <span className="text-xs font-medium text-muted-foreground">
                    {block.type === 'text' ? 'Texto' : 'Imagem'} - Bloco {index + 1}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveBlock(index, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveBlock(index, 'down')}
                    disabled={index === blocks.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => removeBlock(block.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Block Content */}
              <CardContent className="p-4">
                {block.type === 'text' ? (
                  <Textarea
                    value={block.content}
                    onChange={(e) => updateTextBlock(block.id, e.target.value)}
                    placeholder="Escreve o teu conteúdo aqui..."
                    className="min-h-[120px] resize-y border-beige-medium focus:border-vermelho"
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Image Preview or Upload Zone */}
                    {block.imageUrl ? (
                      <div className="relative group/image">
                        <img
                          src={block.imageUrl}
                          alt={block.altText || 'Imagem da newsletter'}
                          className="w-full max-h-64 object-contain rounded-lg bg-beige-light"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => triggerImageUpload(block.id)}
                            className="bg-white hover:bg-gray-100"
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Trocar
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openGallery(block.id)}
                            className="bg-white hover:bg-gray-100"
                          >
                            <FolderOpen className="h-4 w-4 mr-1" />
                            Galeria
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => updateImageBlock(block.id, { imageUrl: '' })}
                            className="bg-white hover:bg-gray-100 text-red-500"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Upload Zone */}
                        <div
                          onClick={() => triggerImageUpload(block.id)}
                          className="border-2 border-dashed border-beige-medium rounded-xl p-6 text-center cursor-pointer hover:border-vermelho hover:bg-vermelho/5 transition-colors"
                        >
                          {uploadingBlockId === block.id ? (
                            <div className="flex flex-col items-center gap-3">
                              <Loader2 className="h-10 w-10 text-vermelho animate-spin" />
                              <p className="text-sm text-muted-foreground">
                                A fazer upload...
                              </p>
                            </div>
                          ) : (
                            <>
                              <div className="w-12 h-12 bg-beige rounded-xl flex items-center justify-center mx-auto mb-2">
                                <Upload className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <p className="font-medium text-charcoal mb-1">
                                Clica para fazer upload
                              </p>
                              <p className="text-xs text-muted-foreground">
                                JPG, PNG ou GIF (máx. 32MB)
                              </p>
                            </>
                          )}
                        </div>

                        {/* Gallery Button */}
                        <Button
                          variant="outline"
                          onClick={() => openGallery(block.id)}
                          className="w-full border-beige-medium hover:border-amarelo hover:text-amarelo"
                        >
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Escolher da Galeria
                        </Button>
                      </div>
                    )}

                    {/* Image Caption (only show if image is uploaded) */}
                    {block.imageUrl && (
                      <div className="space-y-2">
                        <Label htmlFor={`caption-${block.id}`} className="text-xs text-muted-foreground">
                          Legenda (opcional)
                        </Label>
                        <Input
                          id={`caption-${block.id}`}
                          value={block.caption || ''}
                          onChange={(e) => updateImageBlock(block.id, { caption: e.target.value })}
                          placeholder="Adiciona uma legenda..."
                          className="border-beige-medium text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Block Button */}
      {blocks.length > 0 && (
        <div className="relative">
          {showBlockPicker ? (
            <Card className="bg-white border-beige-medium shadow-lg animate-fade-in">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-charcoal">Adicionar bloco</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setShowBlockPicker(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {BLOCK_TYPES.map((blockType) => (
                    <button
                      key={blockType.type}
                      onClick={() => addBlock(blockType.type)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-beige-medium hover:border-vermelho hover:bg-vermelho/5 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-beige flex items-center justify-center group-hover:bg-vermelho/10 transition-colors">
                        <blockType.icon className="h-6 w-6 text-muted-foreground group-hover:text-vermelho" />
                      </div>
                      <span className="text-sm font-medium text-charcoal">{blockType.label}</span>
                      <span className="text-xs text-muted-foreground">{blockType.description}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              onClick={() => setShowBlockPicker(true)}
              variant="outline"
              className="w-full border-dashed border-beige-medium hover:border-vermelho hover:text-vermelho hover:bg-vermelho/5"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Bloco
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
