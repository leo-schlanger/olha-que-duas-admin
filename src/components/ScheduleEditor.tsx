import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import type { Event, DayOfWeek } from '../types';
import { DAYS_OF_WEEK_SHORT } from '../types';

interface ScheduleEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeEvents: Event[];
  selectedDay?: DayOfWeek;
  onAdd: (eventId: string, dayOfWeek: DayOfWeek, time: string) => Promise<boolean>;
}

// Minutos para seleção
const MINUTES = ['00', '15', '30', '45'];

interface DayTimeSlot {
  day: DayOfWeek;
  hour: string;
  minute: string;
}

export function ScheduleEditor({
  open,
  onOpenChange,
  activeEvents,
  selectedDay,
  onAdd,
}: ScheduleEditorProps) {
  const [eventId, setEventId] = useState<string>('');
  const [slots, setSlots] = useState<DayTimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Adiciona slot inicial quando abre
  useEffect(() => {
    if (open && slots.length === 0) {
      setSlots([{ day: selectedDay ?? 0, hour: '12', minute: '00' }]);
    }
  }, [open, selectedDay]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!eventId) {
      setError('Selecione um evento');
      return;
    }

    if (slots.length === 0) {
      setError('Adicione pelo menos um horário');
      return;
    }

    setLoading(true);
    let hasError = false;

    for (const slot of slots) {
      const time = `${slot.hour.padStart(2, '0')}:${slot.minute}`;
      const success = await onAdd(eventId, slot.day, time);
      if (!success) {
        hasError = true;
      }
    }

    setLoading(false);

    if (!hasError) {
      resetForm();
      onOpenChange(false);
    } else {
      setError('Alguns horários não foram adicionados (podem já existir)');
    }
  };

  const addSlot = () => {
    const lastSlot = slots[slots.length - 1];
    setSlots([
      ...slots,
      {
        day: lastSlot?.day ?? selectedDay ?? 0,
        hour: lastSlot?.hour ?? '12',
        minute: lastSlot?.minute ?? '00',
      },
    ]);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, updates: Partial<DayTimeSlot>) => {
    setSlots(
      slots.map((slot, i) => (i === index ? { ...slot, ...updates } : slot))
    );
  };

  const resetForm = () => {
    setEventId('');
    setSlots([]);
    setError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const selectedEvent = activeEvents.find((e) => e.id === eventId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar à Programação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Seleção de Evento */}
          <div className="space-y-2">
            <Label>Evento</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um evento" />
              </SelectTrigger>
              <SelectContent>
                {activeEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    <div className="flex items-center gap-2">
                      <img
                        src={event.icon_url}
                        alt=""
                        className="w-5 h-5 object-contain"
                      />
                      <span>{event.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview do evento selecionado */}
          {selectedEvent && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <img
                src={selectedEvent.icon_url}
                alt=""
                className="w-12 h-12 object-contain rounded"
              />
              <div>
                <p className="font-medium">{selectedEvent.name}</p>
                {selectedEvent.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {selectedEvent.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Slots de dia/horário */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Dias e Horários</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSlot}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
              {slots.map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                >
                  {/* Dia da semana */}
                  <Select
                    value={slot.day.toString()}
                    onValueChange={(v) =>
                      updateSlot(index, { day: parseInt(v) as DayOfWeek })
                    }
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DAYS_OF_WEEK_SHORT).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Hora */}
                  <Select
                    value={slot.hour}
                    onValueChange={(v) => updateSlot(index, { hour: v })}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                        <SelectItem
                          key={h}
                          value={h.toString().padStart(2, '0')}
                        >
                          {h.toString().padStart(2, '0')}h
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-muted-foreground">:</span>

                  {/* Minutos */}
                  <Select
                    value={slot.minute}
                    onValueChange={(v) => updateSlot(index, { minute: v })}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MINUTES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Remover */}
                  {slots.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 ml-auto"
                      onClick={() => removeSlot(index)}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {slots.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Clique em "Adicionar" para incluir dias e horários
              </p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || activeEvents.length === 0 || slots.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              {loading
                ? 'Adicionando...'
                : `Adicionar ${slots.length} horário${slots.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </form>

        {activeEvents.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Nenhum evento ativo disponível. Ative ou crie eventos primeiro.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
