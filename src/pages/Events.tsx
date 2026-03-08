import { EventList } from '../components/EventList';
import { useEvents } from '../hooks/useEvents';

export function Events() {
  const {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    toggleEventActive,
    deleteEvent,
  } = useEvents();

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <EventList
        events={events}
        loading={loading}
        onCreateEvent={createEvent}
        onUpdateEvent={updateEvent}
        onToggleActive={toggleEventActive}
        onDeleteEvent={deleteEvent}
      />
    </div>
  );
}
