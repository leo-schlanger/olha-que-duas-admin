import { ScheduleGrid } from '../components/ScheduleGrid';
import { useSchedule } from '../hooks/useSchedule';
import { useEvents } from '../hooks/useEvents';

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

  const activeEvents = events.filter((e) => e.is_active);
  const loading = scheduleLoading || eventsLoading;

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

      <ScheduleGrid
        schedules={schedules}
        activeEvents={activeEvents}
        loading={loading}
        onAdd={async (eventId, day, time, endTime, isAllDay) => {
          const result = await addToSchedule(eventId, day, time, endTime, isAllDay);
          return !!result;
        }}
        onRemove={removeFromSchedule}
      />
    </div>
  );
}
