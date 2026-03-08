import { useState, useRef } from 'react';
import { Upload, X, AlertCircle, Image } from 'lucide-react';
import { Button } from './ui/button';
import { validateImageDimensions } from '../lib/utils';

interface IconUploadProps {
  currentIconUrl?: string;
  onFileSelect: (file: File | null) => void;
  error?: string;
}

export function IconUpload({ currentIconUrl, onFileSelect, error }: IconUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File | null) => {
    setValidationError(null);

    if (!file) {
      setPreview(null);
      onFileSelect(null);
      return;
    }

    if (!file.type.startsWith('image/png')) {
      setValidationError('Apenas arquivos PNG são permitidos');
      return;
    }

    const isValidSize = await validateImageDimensions(file, 128, 128);
    if (!isValidSize) {
      setValidationError('A imagem deve ter exatamente 128x128 pixels');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const clearSelection = () => {
    setPreview(null);
    setValidationError(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayError = validationError || error;
  const displayImage = preview || currentIconUrl;

  return (
    <div className="space-y-2">
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 cursor-pointer ${
          isDragging
            ? 'border-vermelho bg-vermelho/5'
            : displayError
            ? 'border-red-400 bg-red-50'
            : 'border-beige-medium bg-beige-light hover:border-vermelho/50 hover:bg-beige'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center gap-4">
          {displayImage ? (
            <div className="relative group">
              <div className="w-28 h-28 rounded-xl bg-cream border-2 border-beige-medium overflow-hidden shadow-md">
                <img
                  src={displayImage}
                  alt="Preview"
                  className="w-full h-full object-contain p-2"
                />
              </div>
              {preview && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {preview && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full">
                  Novo
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full bg-beige-medium flex items-center justify-center">
                <Image className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium text-charcoal">
                  Arraste o ícone aqui
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ou clique para selecionar
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 bg-amarelo/20 rounded-full">
            <Upload className="h-3.5 w-3.5 text-charcoal" />
            <span className="text-xs font-medium text-charcoal">
              PNG • 128×128 pixels
            </span>
          </div>
        </div>
      </div>

      {displayError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-600">{displayError}</span>
        </div>
      )}
    </div>
  );
}
