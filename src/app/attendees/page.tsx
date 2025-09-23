import { getAttendees } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { AttendeeList } from '@/components/attendees/attendee-list';
import type { Attendee } from '@/app/lib/definitions';
import { ProtectedRoute } from '@/hooks/use-auth';

export default async function AttendeesPage() {
  const attendees: Attendee[] = await getAttendees();
  return (
    <ProtectedRoute adminOnly={true}>
      <AppLayout>
        <AttendeeList attendees={attendees} />
      </AppLayout>
    </ProtectedRoute>
  );
}
