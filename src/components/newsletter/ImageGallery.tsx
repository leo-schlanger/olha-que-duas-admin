import { useState, useEffect } from 'react';
import { X, Trash2, Image as ImageIcon, Check, FolderOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  getGalleryImages,
  removeFromGallery,
  clearGallery,
  type GalleryImage,
} from '../../lib/imageGallery';

interface ImageGalleryProps {
  open: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
}

export function ImageGallery({ open, onClose, onSelect }: ImageGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setImages(getGalleryImages());
      setSelectedId(null);
    }
  }, [open]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromGallery(id);
    setImages(getGalleryImages());
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const handleClearAll = () => {
    if (confirm('Tens a certeza que queres apagar todas as imagens da galeria?')) {
      clearGallery();
      setImages([]);
      setSelectedId(null);
    }
  };

  const handleSelect = () => {
    const selected = images.find(img => img.id === selectedId);
    if (selected) {
      onSelect(selected.url);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col bg-cream">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-xl text-charcoal flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-vermelho" />
              Galeria de Imagens
            </DialogTitle>
            {images.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpar Tudo
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {images.length === 0 ? (
            <Card className="bg-beige-light/50 border-beige-medium border-dashed">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-beige rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-2">
                  Nenhuma imagem na galeria
                </p>
                <p className="text-sm text-muted-foreground">
                  As imagens que fizeres upload aparecerão aqui para reutilização
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  onClick={() => setSelectedId(image.id)}
                  className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                    selectedId === image.id
                      ? 'border-vermelho ring-2 ring-vermelho/20'
                      : 'border-transparent hover:border-beige-medium'
                  }`}
                >
                  {/* Image */}
                  <div className="aspect-square bg-beige-light">
                    <img
                      src={image.thumbnailUrl || image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Selection indicator */}
                  {selectedId === image.id && (
                    <div className="absolute top-2 left-2 w-6 h-6 bg-vermelho rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(image.id, e)}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>

                  {/* Info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">{image.name}</p>
                    <p className="text-white/70 text-[10px]">{formatDate(image.uploadedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {images.length > 0 && (
          <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t border-beige-medium">
            <p className="text-sm text-muted-foreground">
              {images.length} {images.length === 1 ? 'imagem' : 'imagens'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-beige-medium"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSelect}
                disabled={!selectedId}
                className="bg-vermelho hover:bg-vermelho-dark text-white"
              >
                Usar Imagem
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
