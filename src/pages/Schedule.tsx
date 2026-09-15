import { ScheduleGrid } from '../components/ScheduleGrid';
import { useSchedule } from '../hooks/useSchedule';
import { useEvents } from '../hooks/useEvents';
import { useScheduleDates } from '../hooks/useScheduleDates';

export function Schedule() {
  const {
    schedules,
    loading: scheduleLoading,
    error: scheduleError,
    addToSchedule,
    removeFromSchedule,
    clearError,
  } = useSchedule();

  const { events, loading: eventsLoading } = useEvents();
  const {
    dates,
    loading: datesLoading,
    error: datesError,
    addDate,
    removeDate,
    clearError: clearDatesError,
  } = useScheduleDates();

  const activeEvents = events.filter((e) => e.is_active);
  const loading = scheduleLoading || eventsLoading || datesLoading;

  return (
    <div className="space-y-4">
      {scheduleError && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md flex justify-between items-center">
          <span>{scheduleError}</span>
          <button
            onClick={clearError}
            className="text-sm underline hover:no-underline"
          >
            Fechar
          </button>
        </div>
      )}

      {datesError && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md flex justify-between items-center">
          <span>{datesError}</span>
          <button
            onClick={clearDatesError}
            className="text-sm underline hover:no-underline"
          >
            Fechar
          </button>
        </div>
      )}

      <ScheduleGrid
        schedules={schedules}
        activeEvents={activeEvents}
        loading={loading}
        onAdd={async (eventId, day, time, endTime, isAllDay) => {
          const result = await addToSchedule(eventId, day, time, endTime, isAllDay);
          return !!result;
        }}
        onRemove={removeFromSchedule}
        dates={dates}
        onAddDate={addDate}
        onRemoveDate={removeDate}
      />
    </div>
  );
}
