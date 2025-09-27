import { notFound } from 'next/navigation';
import { getActivityById, getActivityParticipants } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { ActivityDetailContent } from '@/components/event-dashboard/activity-detail-content';
import { EventDashboardNav } from '@/components/event-dashboard/event-dashboard-nav';

export default async function EventActivityDetailPage({ params }: { params: { id: string; activityId: string } }) {
  const { id: eventId, activityId } = params;

  if (!eventId || !activityId) {
    notFound();
  }
  
  const [activity, participants] = await Promise.all([
    getActivityById(activityId),
    getActivityParticipants(activityId)
  ]);

  if (!activity) {
    notFound();
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <EventDashboardNav eventId={eventId} />
        <ActivityDetailContent activity={activity} participants={participants} eventId={eventId} />
      </div>
    </ProtectedRoute>
  );
}
