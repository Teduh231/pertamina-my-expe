import { notFound } from 'next/navigation';
import { getActivityById, getActivityParticipants } from '@/app/lib/data';
import { Activity, ActivityParticipant } from '@/app/lib/definitions';
import { ProtectedRoute } from '@/hooks/use-auth';
import { AppLayout } from '@/components/app-layout';
import { ActivityDetailContent } from '@/components/booth-dashboard/activity-detail-content';

export default async function BoothActivityDetailPage({ params }: { params: { id: string; activityId: string } }) {
  const { id: boothId, activityId } = params;

  if (!boothId || !activityId) {
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
        <AppLayout>
           <ActivityDetailContent activity={activity} participants={participants} boothId={boothId} />
        </AppLayout>
    </ProtectedRoute>
  );
}
