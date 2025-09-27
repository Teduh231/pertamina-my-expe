import { getEventById } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { AttendeesContent } from '@/components/event-dashboard/attendees-content';

export default async function EventAttendeesPage({ params }: { params: { id: string } }) {
  const eventId = params.id;
  const event = await getEventById(eventId);

  if (!event) {
    notFound();
  }

  const checkedInAttendees = event.check_ins?.map(checkIn => ({
    ...checkIn.attendees,
    checked_in_at: checkIn.checked_in_at
  })).filter(Boolean) || [];

  return (
    <ProtectedRoute>
      <AppLayout>
        <AttendeesContent 
          attendees={checkedInAttendees as any[]} 
          eventName={event.name} 
          eventId={event.id} 
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
