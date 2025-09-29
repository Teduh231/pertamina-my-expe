import { getEventById } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { AttendeesContent } from '@/components/event-dashboard/attendees-content';
import { EventDashboardNav } from '@/components/event-dashboard/event-dashboard-nav';
import { Attendee, CheckIn } from '@/app/lib/definitions';

// Define a more specific type for checked-in attendees
type CheckedInAttendee = CheckIn & {
  attendees: Attendee | null;
};

export default async function EventAttendeesPage({ params }: { params: { id: string } }) {
  const eventId = params.id;
  const event = await getEventById(eventId);

  if (!event) {
    notFound();
  }

  // The check_ins array from getEventById now contains the full attendee object.
  // We just need to filter out any potential nulls.
  const checkedInAttendees = event.check_ins?.filter(
    (ci): ci is CheckedInAttendee => ci.attendees !== null
  ) || [];


  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <EventDashboardNav eventId={eventId} />
        <AttendeesContent 
          attendees={checkedInAttendees} 
          eventName={event.name} 
          eventId={event.id} 
        />
      </div>
    </ProtectedRoute>
  );
}
