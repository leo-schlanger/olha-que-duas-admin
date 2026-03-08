import { useState, useEffect } from 'react';
import { Plus, X, Clock, Calendar } from 'lucide-react';
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

  // Reset form and add initial slot when dialog opens
  useEffect(() => {
    if (open) {
      setEventId('');
      setSlots([{ day: selectedDay ?? 0, hour: '12', minute: '00' }]);
      setError(null);
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

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const selectedEvent = activeEvents.find((e) => e.id === eventId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-cream border-beige-medium">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-charcoal flex items-center gap-2">
            <Calendar className="h-6 w-6 text-amarelo" />
            Adicionar à Programação
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Event Selection */}
          <div className="space-y-2">
            <Label className="text-charcoal font-medium">
              Evento <span className="text-vermelho">*</span>
            </Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger className="h-11 bg-beige-light border-beige-medium focus:border-vermelho focus:ring-vermelho">
                <SelectValue placeholder="Selecione um evento" />
              </SelectTrigger>
              <SelectContent className="bg-cream border-beige-medium">
                {activeEvents.map((event) => (
                  <SelectItem
                    key={event.id}
                    value={event.id}
                    className="focus:bg-beige-light"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={event.icon_url}
                        alt=""
                        className="w-6 h-6 object-contain rounded"
                      />
                      <span className="font-medium">{event.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Event Preview */}
          {selectedEvent && (
            <div className="flex items-center gap-4 p-4 bg-beige-light rounded-xl border border-beige-medium">
              <div className="w-14 h-14 rounded-xl bg-cream border border-beige-medium flex items-center justify-center overflow-hidden">
                <img
                  src={selectedEvent.icon_url}
                  alt=""
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-charcoal">
                  {selectedEvent.name}
                </p>
                {selectedEvent.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {selectedEvent.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Time Slots */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-charcoal font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Dias e Horários
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSlot}
                className="h-8 border-beige-medium hover:bg-beige-light hover:border-vermelho"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {slots.map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-beige-light rounded-xl border border-beige-medium animate-fade-in"
                >
                  {/* Day Selection */}
                  <Select
                    value={slot.day.toString()}
                    onValueChange={(v) =>
                      updateSlot(index, { day: parseInt(v) as DayOfWeek })
                    }
                  >
                    <SelectTrigger className="w-[100px] h-10 bg-cream border-beige-medium focus:border-vermelho">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-cream border-beige-medium">
                      {Object.entries(DAYS_OF_WEEK_SHORT).map(([value, label]) => (
                        <SelectItem key={value} value={value} className="focus:bg-beige-light">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Hour Selection */}
                  <Select
                    value={slot.hour}
                    onValueChange={(v) => updateSlot(index, { hour: v })}
                  >
                    <SelectTrigger className="w-[80px] h-10 bg-cream border-beige-medium focus:border-vermelho">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-cream border-beige-medium max-h-[200px]">
                      {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                        <SelectItem
                          key={h}
                          value={h.toString().padStart(2, '0')}
                          className="focus:bg-beige-light"
                        >
                          {h.toString().padStart(2, '0')}h
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-lg font-bold text-muted-foreground">:</span>

                  {/* Minute Selection */}
                  <Select
                    value={slot.minute}
                    onValueChange={(v) => updateSlot(index, { minute: v })}
                  >
                    <SelectTrigger className="w-[75px] h-10 bg-cream border-beige-medium focus:border-vermelho">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-cream border-beige-medium">
                      {MINUTES.map((m) => (
                        <SelectItem key={m} value={m} className="focus:bg-beige-light">
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Remove Button */}
                  {slots.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 ml-auto hover:bg-red-50 hover:text-red-600"
                      onClick={() => removeSlot(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {slots.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Clique em "Adicionar" para incluir horários</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
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
              disabled={loading || activeEvents.length === 0 || slots.length === 0}
              className="bg-vermelho hover:bg-vermelho-dark text-white"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adicionando...
                </span>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar {slots.length} horário{slots.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>

        {activeEvents.length === 0 && (
          <div className="text-center py-4 text-muted-foreground bg-beige-light rounded-lg mt-2">
            <p className="text-sm">
              Nenhum evento ativo. Crie ou ative eventos primeiro.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
