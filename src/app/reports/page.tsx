import { getBooths } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { ReportGenerator } from './_components/report-generator';
import { ProtectedRoute } from '@/hooks/use-auth';

export default async function ReportsPage() {
  const booths = await getBooths();
  
  return (
    <ProtectedRoute>
      <AppLayout>
        <ReportGenerator booths={booths} />
      </AppLayout>
    </ProtectedRoute>
  );
}
