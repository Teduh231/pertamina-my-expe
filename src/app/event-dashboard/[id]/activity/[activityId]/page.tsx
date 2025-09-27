import { notFound } from 'next/navigation';
import { getActivityById, getActivityParticipants } from '@/app/lib/data';
import { Activity, ActivityParticipant } from '@/app/lib/definitions';
import { ProtectedRoute } from '@/hooks/use-auth';
import { ActivityDetailContent } from '@/components/event-dashboard/activity-detail-content';

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
       <ActivityDetailContent activity={activity} participants={participants} eventId={eventId} />
    </ProtectedRoute>
  );
}
