import { useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Switch } from './ui/switch';
import { EventForm } from './EventForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import type { Event } from '../types';

interface EventListProps {
  events: Event[];
  loading: boolean;
  onCreateEvent: (
    name: string,
    description: string | null,
    iconFile: File
  ) => Promise<Event | null>;
  onUpdateEvent: (
    id: string,
    updates: Partial<Pick<Event, 'name' | 'description' | 'is_active'>>,
    newIconFile?: File
  ) => Promise<boolean>;
  onToggleActive: (id: string, isActive: boolean) => Promise<boolean>;
  onDeleteEvent: (id: string) => Promise<boolean>;
}

export function EventList({
  events,
  loading,
  onCreateEvent,
  onUpdateEvent,
  onToggleActive,
  onDeleteEvent,
}: EventListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleCreate = async (
    name: string,
    description: string | null,
    iconFile: File | null
  ) => {
    if (!iconFile) return false;
    const result = await onCreateEvent(name, description, iconFile);
    return !!result;
  };

  const handleEdit = async (
    name: string,
    description: string | null,
    iconFile: File | null
  ) => {
    if (!editingEvent) return false;
    return onUpdateEvent(
      editingEvent.id,
      { name, description },
      iconFile || undefined
    );
  };

  const handleDelete = async () => {
    if (!deletingEvent) return;
    setDeleteLoading(true);
    await onDeleteEvent(deletingEvent.id);
    setDeleteLoading(false);
    setDeletingEvent(null);
  };

  const openEditForm = (event: Event) => {
    setEditingEvent(event);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingEvent(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Eventos ({events.length})</h2>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum evento cadastrado. Clique em "Novo Evento" para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card
              key={event.id}
              className={!event.is_active ? 'opacity-60' : ''}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <img
                    src={event.icon_url}
                    alt={event.name}
                    className="w-16 h-16 object-contain rounded border"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{event.name}</h3>
                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={event.is_active}
                      onCheckedChange={(checked) =>
                        onToggleActive(event.id, checked)
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      {event.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditForm(event)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingEvent(event)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EventForm
        open={formOpen}
        onOpenChange={closeForm}
        event={editingEvent}
        onSubmit={editingEvent ? handleEdit : handleCreate}
      />

      <Dialog open={!!deletingEvent} onOpenChange={() => setDeletingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Evento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o evento "{deletingEvent?.name}"?
              Esta ação não pode ser desfeita e removerá o evento da programação.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingEvent(null)}
              disabled={deleteLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
