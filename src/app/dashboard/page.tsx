import { getEvents } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { AnalyticsDashboard } from '@/components/dashboard/analytics-dashboard';
import { UpcomingEvents } from '@/components/dashboard/upcoming-events';
import { ProtectedRoute } from '@/hooks/use-auth';

export default async function DashboardPage() {
  const events = await getEvents();
  return (
    <ProtectedRoute>
        <AppLayout>
            <div className="space-y-6">
                <AnalyticsDashboard events={events} />
                <UpcomingEvents events={events} />
            </div>
        </AppLayout>
    </ProtectedRoute>
  );
}
