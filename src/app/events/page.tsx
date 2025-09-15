import { getEvents } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { EventList } from '@/components/events/event-list';

export default async function EventsPage() {
  const events = await getEvents();
  return (
    <AppLayout>
      <EventList events={events} />
    </AppLayout>
  );
}
