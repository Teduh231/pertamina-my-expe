import { getEvents } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { AnalyticsDashboard } from '@/components/dashboard/analytics-dashboard';
import { ProtectedRoute } from '@/hooks/use-auth';

export default async function DashboardPage() {
  const events = await getEvents();
  return (
    <ProtectedRoute>
        <AppLayout>
            <AnalyticsDashboard events={events} />
        </AppLayout>
    </ProtectedRoute>
  );
}
