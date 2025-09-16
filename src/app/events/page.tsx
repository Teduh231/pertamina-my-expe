import { getEvents } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { EventList } from '@/components/events/event-list';
import { ProtectedRoute } from '@/hooks/use-auth';

export default async function EventsPage() {
  const events = await getEvents();
  return (
    <ProtectedRoute>
      <AppLayout>
        <EventList events={events} />
      </AppLayout>
    </ProtectedRoute>
  );
}
