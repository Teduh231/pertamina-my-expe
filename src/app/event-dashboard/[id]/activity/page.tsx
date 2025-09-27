import { getActivitiesByEvent } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { ActivityPageContent } from '@/components/event-dashboard/activity-page-content';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity } from '@/app/lib/definitions';

export default async function EventDashboardActivityPage({ params }: { params: { id: string } }) {
  const eventId = params.id;
  
  const activities: Activity[] = await getActivitiesByEvent(eventId);

  if (!eventId) {
    notFound();
  }

  return (
    <ProtectedRoute>
        <Card>
            <CardHeader>
                <CardTitle>Activity Management</CardTitle>
                <CardDescription>Create and manage activities for your event.</CardDescription>
            </CardHeader>
            <CardContent>
               <ActivityPageContent eventId={eventId} activities={activities} />
            </CardContent>
        </Card>
    </ProtectedRoute>
  );
}
