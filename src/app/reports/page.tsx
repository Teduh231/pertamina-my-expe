import { getEvents } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { ProtectedRoute } from '@/hooks/use-auth';
import { ReportGenerator } from './_components/report-generator';

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
