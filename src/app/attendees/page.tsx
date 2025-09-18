import { getBooths } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { AttendeeList } from '@/components/attendees/attendee-list';
import type { Booth } from '@/app/lib/definitions';
import { ProtectedRoute } from '@/hooks/use-auth';

export default async function AttendeesPage() {
  const booths: Booth[] = await getBooths();
  return (
    <ProtectedRoute adminOnly={true}>
      <AppLayout>
        <AttendeeList booths={booths} />
      </AppLayout>
    </ProtectedRoute>
  );
}
