import { getEvents, getProducts } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { QrScannerContent } from './_components/qr-scanner-content';
import { ProtectedRoute } from '@/hooks/use-auth';
import { Event, Product } from '@/app/lib/definitions';

export default async function QrScannerPage() {
  const events: Event[] = await getEvents();
  const products: Product[] = await getProducts();
  return (
    <ProtectedRoute>
      <AppLayout>
        <QrScannerContent events={events} products={products}/>
      </AppLayout>
    </ProtectedRoute>
  );
}
