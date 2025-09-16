import { getEvents } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { ReportGenerator } from './_components/report-generator';

export default async function ReportsPage() {
  const events = await getEvents();
  
  return (
    <AppLayout>
      <ReportGenerator events={events} />
    </AppLayout>
  );
}
