import { getEvents } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { AttendeeList } from '@/components/attendees/attendee-list';
import type { Event } from '@/app/lib/definitions';
import { ProtectedRoute } from '@/hooks/use-auth';

export default async function AttendeesPage() {
  const events: Event[] = await getEvents();
  return (
    <ProtectedRoute>
      <AppLayout>
        <AttendeeList events={events} />
      </AppLayout>
    </ProtectedRoute>
  );
}
