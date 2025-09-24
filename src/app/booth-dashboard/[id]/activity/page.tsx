import { getActivitiesByBooth } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { ActivityPageContent } from '@/components/booth-dashboard/activity-page-content';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppLayout } from '@/components/app-layout';
import { Activity } from '@/app/lib/definitions';

export default async function BoothDashboardActivityPage({ params }: { params: { id: string } }) {
  const boothId = params.id;
  
  const activities: Activity[] = await getActivitiesByBooth(boothId);

  if (!boothId) {
    notFound();
  }

  return (
    <ProtectedRoute>
        <AppLayout>
            <Card>
                <CardHeader>
                    <CardTitle>Activity Management</CardTitle>
                    <CardDescription>Create and manage activities for your booth.</CardDescription>
                </CardHeader>
                <CardContent>
                   <ActivityPageContent boothId={boothId} activities={activities} />
                </CardContent>
            </Card>
        </AppLayout>
    </ProtectedRoute>
  );
}
