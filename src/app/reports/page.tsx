import { getEvents } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { ReportGenerator } from './_components/report-generator';
import { ProtectedRoute } from '@/hooks/use-auth';

export default async function ReportsPage() {
  const events = await getEvents();
  
  return (
    <ProtectedRoute>
      <AppLayout>
        <ReportGenerator events={events} />
      </AppLayout>
    </ProtectedRoute>
  );
}
