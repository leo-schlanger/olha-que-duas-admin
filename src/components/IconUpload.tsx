import { useState, useRef } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
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

    // Validate file type
    if (!file.type.startsWith('image/png')) {
      setValidationError('Apenas arquivos PNG são permitidos');
      return;
    }

    // Validate dimensions
    const isValidSize = await validateImageDimensions(file, 128, 128);
    if (!isValidSize) {
      setValidationError('A imagem deve ter exatamente 128x128 pixels');
      return;
    }

    // Create preview
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
        className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : displayError
            ? 'border-destructive'
            : 'border-input hover:border-primary/50'
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

        <div className="flex flex-col items-center gap-3">
          {displayImage ? (
            <div className="relative">
              <img
                src={displayImage}
                alt="Preview"
                className="w-32 h-32 object-contain border rounded"
              />
              {preview && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Arraste o ícone aqui</p>
                <p className="text-xs text-muted-foreground">ou clique para selecionar</p>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">PNG • 128x128 pixels</p>
        </div>
      </div>

      {displayError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
