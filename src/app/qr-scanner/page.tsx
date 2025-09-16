import { getEvents, getProducts } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { QrScannerContent } from './_components/qr-scanner-content';
import { ProtectedRoute } from '@/hooks/use-auth';

export default async function QrScannerPage() {
  const events = await getEvents();
  const products = await getProducts();
  return (
    <ProtectedRoute>
      <AppLayout>
        <QrScannerContent events={events} products={products} />
      </AppLayout>
    </ProtectedRoute>
  );
}
