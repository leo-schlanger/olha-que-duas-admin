import { useMemo, useState } from 'react';
import { Plus, Trash2, Clock, Calendar, Sun, CalendarDays } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScheduleEditor } from './ScheduleEditor';
import type { Event, ScheduleWithEvent, ScheduleDateWithEvent, DayOfWeek } from '../types';
import { addDays, formatEventDate, lisbonToday, weekdayOf } from '../lib/scheduleDates';
import { DAYS_OF_WEEK } from '../types';
import { formatTime } from '../lib/utils';

interface ScheduleGridProps {
  schedules: ScheduleWithEvent[];
  activeEvents: Event[];
  loading: boolean;
  onAdd: (eventId: string, dayOfWeek: DayOfWeek, time: string, endTime?: string | null, isAllDay?: boolean) => Promise<boolean>;
  onRemove: (id: string) => Promise<boolean>;
  dates: ScheduleDateWithEvent[];
  onAddDate: (eventId: string, eventDate: string, time: string, endTime?: string | null, isAllDay?: boolean) => Promise<boolean>;
  onRemoveDate: (id: string) => Promise<boolean>;
}

const timeLabel = (item: { time: string; end_time: string | null; is_all_day: boolean }) =>
  item.is_all_day ? 'Dia inteiro' : `${formatTime(item.time)}${item.end_time ? ` - ${formatTime(item.end_time)}` : ''}`;

// Emissões com data desta semana, mostradas no dia correspondente da grelha
function WeekDatedChips({ items }: { items: ScheduleDateWithEvent[] }) {
  if (items.length === 0) return null;
  return (
    <>
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-lg p-2.5 border border-dashed border-vermelho/40 bg-vermelho/5"
          title="Evento com data — remove na secção Eventos com data"
        >
          <div className="flex items-center gap-1 mb-1.5 flex-wrap">
            <span className="flex items-center gap-1 px-2 py-0.5 bg-vermelho/10 rounded-full text-[10px] font-bold text-vermelho">
              <CalendarDays className="h-3 w-3" />
              {item.event_date.slice(8, 10)}/{item.event_date.slice(5, 7)}
            </span>
            <span className="text-xs font-bold text-charcoal">{timeLabel(item)}</span>
          </div>
          <div className="flex items-center gap-2">
            <img src={item.event.icon_url} alt="" className="w-6 h-6 object-contain rounded" />
            <span className="text-xs font-medium text-charcoal">{item.event.name}</span>
          </div>
        </div>
      ))}
    </>
  );
}

function DatedEventsCard({
  dates,
  removingId,
  onRemove,
  onAdd,
}: {
  dates: ScheduleDateWithEvent[];
  removingId: string | null;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  const today = lisbonToday();
  const upcoming = dates.filter((d) => d.event_date >= today);
  const past = dates.filter((d) => d.event_date < today).reverse();

  const row = (item: ScheduleDateWithEvent, isPast: boolean) => (
    <div
      key={item.id}
      className={`flex items-center justify-between gap-3 rounded-xl p-3 border border-beige-medium ${
        isPast ? 'bg-beige-light/60 opacity-70' : 'bg-white'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <img src={item.event.icon_url} alt="" className="w-10 h-10 object-contain rounded-lg bg-cream border border-beige-medium p-1" />
        <div className="min-w-0">
          <p className="font-medium text-charcoal">{item.event.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatEventDate(item.event_date)} · {timeLabel(item)}
            {item.event_date === today && <span className="ml-2 text-xs font-bold text-vermelho">HOJE</span>}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(item.id)}
        disabled={removingId === item.id}
        className="h-9 w-9 flex-shrink-0 hover:bg-red-50 hover:text-red-600"
        aria-label={`Remover ${item.event.name} de ${formatEventDate(item.event_date)}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <Card className="bg-cream border-beige-medium">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
            <CalendarDays className="h-4 w-4 text-vermelho" />
            Eventos com data
            <span className="text-xs font-normal text-muted-foreground">emissões únicas, não se repetem</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onAdd} className="border-beige-medium">
            <Plus className="h-4 w-4 mr-1" />
            Adicionar com data
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-3">Sem eventos com data marcados</p>
        ) : (
          upcoming.map((item) => row(item, false))
        )}
        {past.length > 0 && (
          <details className="pt-2">
            <summary className="text-xs text-muted-foreground cursor-pointer">
              Já emitidos nos últimos 30 dias ({past.length})
            </summary>
            <div className="space-y-2 mt-2">{past.map((item) => row(item, true))}</div>
          </details>
        )}
      </CardContent>
    </Card>
  );
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
  dates,
  onAddDate,
  onRemoveDate,
}: ScheduleGridProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | undefined>();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const getSchedulesByDay = (day: DayOfWeek) => {
    return schedules
      .filter((s) => s.day_of_week === day)
      .sort((a, b) => {
        // All-day events first
        if (a.is_all_day && !b.is_all_day) return -1;
        if (!a.is_all_day && b.is_all_day) return 1;
        return a.time.localeCompare(b.time);
      });
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

  const handleRemoveDate = async (id: string) => {
    setRemovingId(id);
    await onRemoveDate(id);
    setRemovingId(null);
  };

  // Emissões com data dos próximos 7 dias (hoje incluído), por dia da semana
  const weekDatedByDay = useMemo(() => {
    const today = lisbonToday();
    const end = addDays(today, 6);
    const map = new Map<number, ScheduleDateWithEvent[]>();
    for (const item of dates) {
      if (!item.is_active || item.event_date < today || item.event_date > end) continue;
      const day = weekdayOf(item.event_date);
      map.set(day, [...(map.get(day) ?? []), item]);
    }
    return map;
  }, [dates]);

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
            {totalSlots} horários semanais · {dates.filter((d) => d.event_date >= lisbonToday()).length} eventos com data
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

      <DatedEventsCard
        dates={dates}
        removingId={removingId}
        onRemove={handleRemoveDate}
        onAdd={() => handleAddClick()}
      />

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
                  (() => {
                    const allDayEvent = daySchedules.find((s) => s.is_all_day);
                    const timedEvents = daySchedules.filter((s) => !s.is_all_day);
                    return (
                      <>
                        {/* All-day base event banner */}
                        {allDayEvent && (
                          <div className="group relative bg-purple-50 border border-purple-200 rounded-lg p-2.5 transition-all hover:border-purple-300">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 rounded-full">
                                <Sun className="h-3 w-3 text-purple-700" />
                                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                                  Base do dia
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <img
                                src={allDayEvent.event.icon_url}
                                alt=""
                                className="w-6 h-6 object-contain rounded"
                              />
                              <span className="text-xs font-bold text-purple-800 truncate flex-1">
                                {allDayEvent.event.name}
                              </span>
                            </div>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute -top-1 -right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                              onClick={() => handleRemove(allDayEvent.id)}
                              disabled={removingId === allDayEvent.id}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}

                        {/* Divider when both all-day and timed events exist */}
                        {allDayEvent && timedEvents.length > 0 && (
                          <div className="flex items-center gap-1.5 px-1">
                            <div className="flex-1 h-px bg-purple-200" />
                            <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider">
                              Interrupções
                            </span>
                            <div className="flex-1 h-px bg-purple-200" />
                          </div>
                        )}

                        {/* Timed events */}
                        {timedEvents.map((schedule) => (
                          <div
                            key={schedule.id}
                            className={`group relative rounded-lg p-2.5 transition-all border border-transparent hover:border-beige-medium ${
                              allDayEvent
                                ? 'bg-white/80 hover:bg-white border-l-2 border-l-amarelo'
                                : 'bg-beige-light hover:bg-beige'
                            }`}
                          >
                            {/* Time Badge */}
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-amarelo/20 rounded-full">
                                <Clock className="h-3 w-3 text-charcoal" />
                                <span className="text-xs font-bold text-charcoal">
                                  {formatTime(schedule.time)}
                                  {schedule.end_time && ` - ${formatTime(schedule.end_time)}`}
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
                        ))}
                      </>
                    );
                  })()
                )}

                <WeekDatedChips items={weekDatedByDay.get(day) ?? []} />

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

              <CardContent className="pt-4 space-y-2">
                {daySchedules.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhuma programação para este dia
                  </p>
                ) : (
                  (() => {
                    const allDayEvent = daySchedules.find((s) => s.is_all_day);
                    const timedEvents = daySchedules.filter((s) => !s.is_all_day);
                    return (
                      <div className="space-y-2">
                        {/* All-day base event */}
                        {allDayEvent && (
                          <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center overflow-hidden">
                                <img
                                  src={allDayEvent.event.icon_url}
                                  alt=""
                                  className="w-10 h-10 object-contain"
                                />
                              </div>
                              <div>
                                <p className="font-display font-bold text-purple-800">
                                  {allDayEvent.event.name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <Sun className="h-3.5 w-3.5 text-purple-600" />
                                  <span className="text-sm font-bold text-purple-600">
                                    Base do dia
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemove(allDayEvent.id)}
                              disabled={removingId === allDayEvent.id}
                              className="h-10 w-10 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        )}

                        {/* Divider */}
                        {allDayEvent && timedEvents.length > 0 && (
                          <div className="flex items-center gap-2 px-2">
                            <div className="flex-1 h-px bg-purple-200" />
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                              Interrupções
                            </span>
                            <div className="flex-1 h-px bg-purple-200" />
                          </div>
                        )}

                        {/* Timed events */}
                        {timedEvents.map((schedule) => (
                          <div
                            key={schedule.id}
                            className={`flex items-center justify-between rounded-xl p-4 transition-all ${
                              allDayEvent
                                ? 'bg-white border-l-4 border-l-amarelo border border-beige-medium'
                                : 'bg-beige-light hover:bg-beige'
                            }`}
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
                                    {schedule.end_time && ` - ${formatTime(schedule.end_time)}`}
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
                    );
                  })()
                )}
                <WeekDatedChips items={weekDatedByDay.get(day) ?? []} />
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
        onAdd={async (eventId, day, time, endTime, isAllDay) => {
          const success = await onAdd(eventId, day, time, endTime, isAllDay);
          return success;
        }}
        onAddDate={onAddDate}
      />
    </div>
  );
}
