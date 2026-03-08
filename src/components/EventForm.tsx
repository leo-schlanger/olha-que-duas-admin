import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { IconUpload } from './IconUpload';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import type { Event } from '../types';

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
  onSubmit: (
    name: string,
    description: string | null,
    iconFile: File | null
  ) => Promise<boolean>;
}

export function EventForm({ open, onOpenChange, event, onSubmit }: EventFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!event;

  // Sync form state when dialog opens or event changes
  useEffect(() => {
    if (open) {
      if (event) {
        setName(event.name);
        setDescription(event.description || '');
      } else {
        setName('');
        setDescription('');
      }
      setIconFile(null);
      setError(null);
    }
  }, [open, event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!isEditing && !iconFile) {
      setError('Ícone é obrigatório para novos eventos');
      return;
    }

    setLoading(true);
    const success = await onSubmit(
      name.trim(),
      description.trim() || null,
      iconFile
    );
    setLoading(false);

    if (success) {
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-cream border-beige-medium">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-charcoal flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amarelo" />
            {isEditing ? 'Editar Evento' : 'Novo Evento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-charcoal font-medium">
              Nome do Evento <span className="text-vermelho">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Olha que Duas!"
              maxLength={100}
              className="h-11 bg-beige-light border-beige-medium focus:border-vermelho focus:ring-vermelho"
            />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-charcoal font-medium">
              Descrição
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Uma breve descrição do evento..."
              rows={3}
              className="bg-beige-light border-beige-medium focus:border-vermelho focus:ring-vermelho resize-none"
            />
          </div>

          {/* Icon Upload */}
          <div className="space-y-2">
            <Label className="text-charcoal font-medium">
              Ícone {!isEditing && <span className="text-vermelho">*</span>}
              {isEditing && (
                <span className="text-muted-foreground font-normal ml-1">
                  (deixe vazio para manter)
                </span>
              )}
            </Label>
            <IconUpload
              currentIconUrl={isEditing ? event?.icon_url : undefined}
              onFileSelect={setIconFile}
              error={error?.includes('Ícone') ? error : undefined}
            />
          </div>

          {/* Error Message */}
          {error && !error.includes('Ícone') && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="border-beige-medium hover:bg-beige-light"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-vermelho hover:bg-vermelho-dark text-white"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </span>
              ) : isEditing ? (
                'Salvar Alterações'
              ) : (
                'Criar Evento'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
