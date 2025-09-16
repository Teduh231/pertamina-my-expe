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
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <AnalyticsDashboard events={events} />
                </div>
                <div className="lg:col-span-2">
                    <UpcomingEvents events={events} />
                </div>
            </div>
        </AppLayout>
    </ProtectedRoute>
  );
}
