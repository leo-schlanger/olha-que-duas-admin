import { useState } from 'react';
import { Plus, Trash2, Clock, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScheduleEditor } from './ScheduleEditor';
import type { Event, ScheduleWithEvent, DayOfWeek } from '../types';
import { DAYS_OF_WEEK } from '../types';
import { formatTime } from '../lib/utils';

interface ScheduleGridProps {
  schedules: ScheduleWithEvent[];
  activeEvents: Event[];
  loading: boolean;
  onAdd: (eventId: string, dayOfWeek: DayOfWeek, time: string) => Promise<boolean>;
  onRemove: (id: string) => Promise<boolean>;
}

const DAY_COLORS: Record<DayOfWeek, string> = {
  0: 'from-purple-500 to-purple-600',
  1: 'from-blue-500 to-blue-600',
  2: 'from-green-500 to-green-600',
  3: 'from-yellow-500 to-yellow-600',
  4: 'from-orange-500 to-orange-600',
  5: 'from-pink-500 to-pink-600',
  6: 'from-vermelho to-vermelho-dark',
};

export function ScheduleGrid({
  schedules,
  activeEvents,
  loading,
  onAdd,
  onRemove,
}: ScheduleGridProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | undefined>();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const getSchedulesByDay = (day: DayOfWeek) => {
    return schedules
      .filter((s) => s.day_of_week === day)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const handleAddClick = (day?: DayOfWeek) => {
    setSelectedDay(day);
    setEditorOpen(true);
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    await onRemove(id);
    setRemovingId(null);
  };

  const totalSlots = schedules.length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-vermelho/20 border-t-vermelho rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground">Carregando programação...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-charcoal">
            Programação Semanal
          </h2>
          <p className="text-muted-foreground mt-1">
            {totalSlots} horários programados
          </p>
        </div>
        <Button
          onClick={() => handleAddClick()}
          className="bg-vermelho hover:bg-vermelho-dark text-white shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Horário
        </Button>
      </div>

      {/* Desktop Grid */}
      <div className="hidden lg:grid lg:grid-cols-7 gap-3">
        {([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).map((day) => {
          const daySchedules = getSchedulesByDay(day);
          return (
            <Card
              key={day}
              className="bg-cream border-beige-medium overflow-hidden min-h-[350px] flex flex-col"
            >
              {/* Day Header */}
              <CardHeader className={`py-3 px-3 bg-gradient-to-r ${DAY_COLORS[day]} text-white`}>
                <CardTitle className="text-sm font-bold text-center">
                  {DAYS_OF_WEEK[day]}
                </CardTitle>
              </CardHeader>

              {/* Day Content */}
              <CardContent className="flex-1 px-2 py-2 space-y-2 overflow-y-auto">
                {daySchedules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-6 text-muted-foreground">
                    <Calendar className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-xs text-center">Sem programação</p>
                  </div>
                ) : (
                  daySchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="group relative bg-beige-light hover:bg-beige rounded-lg p-2.5 transition-all border border-transparent hover:border-beige-medium"
                    >
                      {/* Time Badge */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-amarelo/20 rounded-full">
                          <Clock className="h-3 w-3 text-charcoal" />
                          <span className="text-xs font-bold text-charcoal">
                            {formatTime(schedule.time)}
                          </span>
                        </div>
                      </div>

                      {/* Event Info */}
                      <div className="flex items-center gap-2">
                        <img
                          src={schedule.event.icon_url}
                          alt=""
                          className="w-6 h-6 object-contain rounded"
                        />
                        <span className="text-xs font-medium text-charcoal truncate flex-1">
                          {schedule.event.name}
                        </span>
                      </div>

                      {/* Delete Button */}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-1 -right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        onClick={() => handleRemove(schedule.id)}
                        disabled={removingId === schedule.id}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}

                {/* Add Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-9 text-xs border-2 border-dashed border-beige-medium hover:border-vermelho hover:bg-vermelho/5 hover:text-vermelho"
                  onClick={() => handleAddClick(day)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mobile/Tablet List */}
      <div className="lg:hidden space-y-4">
        {([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).map((day) => {
          const daySchedules = getSchedulesByDay(day);
          return (
            <Card key={day} className="bg-cream border-beige-medium overflow-hidden">
              {/* Day Header */}
              <CardHeader className={`py-3 bg-gradient-to-r ${DAY_COLORS[day]}`}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-white">
                    {DAYS_OF_WEEK[day]}
                  </CardTitle>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAddClick(day)}
                    className="bg-white/20 hover:bg-white/30 text-white border-0 h-8"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                {daySchedules.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhuma programação para este dia
                  </p>
                ) : (
                  <div className="space-y-2">
                    {daySchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between bg-beige-light hover:bg-beige rounded-xl p-4 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-cream border border-beige-medium flex items-center justify-center overflow-hidden">
                            <img
                              src={schedule.event.icon_url}
                              alt=""
                              className="w-10 h-10 object-contain"
                            />
                          </div>
                          <div>
                            <p className="font-display font-bold text-charcoal">
                              {schedule.event.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm font-medium text-muted-foreground">
                                {formatTime(schedule.time)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(schedule.id)}
                          disabled={removingId === schedule.id}
                          className="h-10 w-10 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Schedule Editor Modal */}
      <ScheduleEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        activeEvents={activeEvents}
        selectedDay={selectedDay}
        onAdd={async (eventId, day, time) => {
          const success = await onAdd(eventId, day, time);
          return success;
        }}
      />
    </div>
  );
}
