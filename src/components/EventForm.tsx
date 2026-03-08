import { useState } from 'react';
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
  const [name, setName] = useState(event?.name || '');
  const [description, setDescription] = useState(event?.description || '');
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!event;

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
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setIconFile(null);
    setError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    } else if (event) {
      setName(event.name);
      setDescription(event.description || '');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Evento' : 'Novo Evento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do evento"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Ícone {!isEditing && '*'}
              {isEditing && ' (deixe vazio para manter o atual)'}
            </Label>
            <IconUpload
              currentIconUrl={isEditing ? event?.icon_url : undefined}
              onFileSelect={setIconFile}
              error={error?.includes('Ícone') ? error : undefined}
            />
          </div>

          {error && !error.includes('Ícone') && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
