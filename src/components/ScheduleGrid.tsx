import { useState } from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';
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
        <h2 className="text-lg font-semibold">Programação Semanal</h2>
        <Button onClick={() => handleAddClick()}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {/* Desktop Grid */}
      <div className="hidden lg:grid lg:grid-cols-7 gap-2">
        {([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).map((day) => {
          const daySchedules = getSchedulesByDay(day);
          return (
            <Card key={day} className="min-h-[300px]">
              <CardHeader className="py-3 px-3">
                <CardTitle className="text-sm font-medium text-center">
                  {DAYS_OF_WEEK[day]}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-2 space-y-2">
                {daySchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="group relative bg-muted rounded-md p-2 text-xs"
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">
                        {formatTime(schedule.time)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <img
                        src={schedule.event.icon_url}
                        alt=""
                        className="w-4 h-4 object-contain"
                      />
                      <span className="truncate">{schedule.event.name}</span>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemove(schedule.id)}
                      disabled={removingId === schedule.id}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs"
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
            <Card key={day}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">
                    {DAYS_OF_WEEK[day]}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddClick(day)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {daySchedules.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma programação
                  </p>
                ) : (
                  <div className="space-y-2">
                    {daySchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between bg-muted rounded-md p-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={schedule.event.icon_url}
                            alt=""
                            className="w-10 h-10 object-contain rounded"
                          />
                          <div>
                            <p className="font-medium">{schedule.event.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(schedule.time)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(schedule.id)}
                          disabled={removingId === schedule.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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
