import { useState, useRef } from 'react';
import { useMediaLibrary, type MediaFile } from '../hooks/useMediaLibrary';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Upload,
  Trash2,
  Copy,
  Check,
  Loader2,
  ImageIcon,
  Search,
  FolderOpen,
} from 'lucide-react';

export function MediaLibrary() {
  const { files, loading, uploading, error, uploadFiles, deleteFile } = useMediaLibrary();
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      await uploadFiles(selectedFiles);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (droppedFiles.length > 0) {
      await uploadFiles(droppedFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const copyUrl = (file: MediaFile) => {
    navigator.clipboard.writeText(file.url);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (fileName: string) => {
    if (confirmDelete === fileName) {
      await deleteFile(fileName);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(fileName);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-charcoal">Biblioteca</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Faça upload e gerencie as imagens do projeto
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
          <span>{files.length} imagens</span>
        </div>
      </div>

      {/* Upload Zone */}
      <Card className="border-2 border-dashed border-beige-medium hover:border-vermelho/50 transition-colors">
        <CardContent className="p-0">
          <div
            className={`relative p-8 text-center cursor-pointer transition-all ${
              isDragging ? 'bg-vermelho/5 border-vermelho' : ''
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 text-vermelho animate-spin" />
                <p className="font-medium text-charcoal">Fazendo upload...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-beige-medium flex items-center justify-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-charcoal">
                    Arraste imagens aqui ou clique para selecionar
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PNG, JPG, GIF, SVG, WebP — múltiplos arquivos permitidos
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Search */}
      {files.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Gallery Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-vermelho animate-spin" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="font-medium text-charcoal">
              {search ? 'Nenhuma imagem encontrada' : 'Biblioteca vazia'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? 'Tente outro termo de busca'
                : 'Faça upload de imagens usando a área acima'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredFiles.map((file) => (
            <Card
              key={file.id}
              className="group overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-square bg-beige-light relative overflow-hidden">
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-full object-contain p-2"
                  loading="lazy"
                />

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 bg-white/90 hover:bg-white text-charcoal"
                    onClick={() => copyUrl(file)}
                    title="Copiar URL"
                  >
                    {copiedId === file.id ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-9 w-9 ${
                      confirmDelete === file.name
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-white/90 hover:bg-white text-charcoal'
                    }`}
                    onClick={() => handleDelete(file.name)}
                    title={
                      confirmDelete === file.name ? 'Clique novamente para confirmar' : 'Excluir'
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <CardContent className="p-2">
                <p className="text-xs text-muted-foreground truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground/60">{formatSize(file.size)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
