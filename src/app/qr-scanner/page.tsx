import { getEvents } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { QrScannerContent } from './_components/qr-scanner-content';
import { ProtectedRoute } from '@/hooks/use-auth';
import { Event } from '@/app/lib/definitions';

export default async function QrScannerPage() {
  const events: Event[] = await getEvents();
  return (
    <ProtectedRoute>
      <AppLayout>
        <QrScannerContent events={events} />
      </AppLayout>
    </ProtectedRoute>
  );
}
