import { getEventById } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { AttendeesContent } from '@/components/event-dashboard/attendees-content';
import { EventDashboardNav } from '@/components/event-dashboard/event-dashboard-nav';

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
      <div className="space-y-6">
        <EventDashboardNav eventId={eventId} />
        <AttendeesContent 
          attendees={checkedInAttendees as any[]} 
          eventName={event.name} 
          eventId={event.id} 
        />
      </div>
    </ProtectedRoute>
  );
}
