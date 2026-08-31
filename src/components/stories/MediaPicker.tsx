import { useState } from 'react';
import { useMediaLibrary } from '../../hooks/useMediaLibrary';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Loader2, ImageIcon } from 'lucide-react';

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

/**
 * Escolhe uma imagem já existente na Biblioteca (bucket media-library).
 * Evita duplicar uploads: quem quiser carregar imagem nova usa o
 * separador Biblioteca, que é onde a gestão de ficheiros vive.
 */
export function MediaPicker({ open, onClose, onSelect }: MediaPickerProps) {
  const { files, loading } = useMediaLibrary();
  const [search, setSearch] = useState('');

  const filtered = files.filter((f) =>
    f.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Escolher imagem</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Procurar por nome…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            A carregar biblioteca…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ImageIcon className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">
              {search
                ? 'Nenhuma imagem com esse nome.'
                : 'A biblioteca está vazia. Carregue imagens no separador Biblioteca.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[55vh] overflow-y-auto pr-1">
            {filtered.map((file) => (
              <button
                key={file.id}
                type="button"
                onClick={() => {
                  onSelect(file.url);
                  onClose();
                }}
                className="group relative aspect-square rounded-lg overflow-hidden border border-beige-medium hover:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho"
                title={file.displayName}
              >
                <img
                  src={file.url}
                  alt={file.displayName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] px-1.5 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {file.displayName}
                </span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
