import { ProtectedRoute } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wrench } from 'lucide-react';
import { EventDashboardNav } from '@/components/event-dashboard/event-dashboard-nav';

export default function EventSettingsPage({ params }: { params: { id: string } }) {

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <EventDashboardNav eventId={params.id} />
        <Card>
            <CardHeader>
                <CardTitle>Event Settings</CardTitle>
                <CardDescription>Manage settings and configurations for your event.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center text-muted-foreground py-24 border-2 border-dashed rounded-lg">
                    <Wrench className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">Under Construction</h3>
                    <p className="mt-1 text-sm">Event settings will be available here soon.</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
