import { getEvents } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { AnalyticsDashboard } from '@/components/dashboard/analytics-dashboard';

export default async function DashboardPage() {
  const events = await getEvents();
  return (
    <AppLayout>
      <AnalyticsDashboard events={events} />
    </AppLayout>
  );
}
