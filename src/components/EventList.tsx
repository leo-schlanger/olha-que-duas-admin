import { useState } from 'react';
import { Pencil, Trash2, Plus, Radio, Sparkles } from 'lucide-react';
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

  const activeCount = events.filter(e => e.is_active).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-vermelho/20 border-t-vermelho rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground">Carregando eventos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-charcoal">
            Eventos
          </h2>
          <p className="text-muted-foreground mt-1">
            {events.length} eventos • {activeCount} ativos
          </p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="bg-vermelho hover:bg-vermelho-dark text-white shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <Card className="bg-cream border-beige-medium">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-beige-medium mb-4">
              <Radio className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold text-charcoal mb-2">
              Nenhum evento cadastrado
            </h3>
            <p className="text-muted-foreground mb-6">
              Comece criando seu primeiro evento para a programação
            </p>
            <Button
              onClick={() => setFormOpen(true)}
              className="bg-vermelho hover:bg-vermelho-dark text-white"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Criar Primeiro Evento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, index) => (
            <Card
              key={event.id}
              className={`bg-cream border-beige-medium overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-vermelho/30 animate-fade-in ${
                !event.is_active ? 'opacity-60' : ''
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-0">
                {/* Event Header */}
                <div className="p-4 flex gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-xl bg-beige-light border-2 border-beige-medium overflow-hidden flex items-center justify-center">
                      <img
                        src={event.icon_url}
                        alt={event.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    {event.is_active && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-cream" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-lg text-charcoal truncate">
                      {event.name}
                    </h3>
                    {event.description ? (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {event.description}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground/50 italic mt-1">
                        Sem descrição
                      </p>
                    )}
                  </div>
                </div>

                {/* Event Actions */}
                <div className="px-4 py-3 bg-beige-light/50 border-t border-beige-medium flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={event.is_active}
                      onCheckedChange={(checked) =>
                        onToggleActive(event.id, checked)
                      }
                      className="data-[state=checked]:bg-green-500"
                    />
                    <span className="text-sm font-medium text-charcoal">
                      {event.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditForm(event)}
                      className="h-9 w-9 hover:bg-amarelo/20 hover:text-charcoal"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingEvent(event)}
                      className="h-9 w-9 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Event Form Modal */}
      <EventForm
        open={formOpen}
        onOpenChange={closeForm}
        event={editingEvent}
        onSubmit={editingEvent ? handleEdit : handleCreate}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingEvent} onOpenChange={() => setDeletingEvent(null)}>
        <DialogContent className="bg-cream border-beige-medium">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-charcoal">
              Excluir Evento
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir <strong>"{deletingEvent?.name}"</strong>?
              Esta ação não pode ser desfeita e removerá o evento da programação.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeletingEvent(null)}
              disabled={deleteLoading}
              className="border-beige-medium"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
