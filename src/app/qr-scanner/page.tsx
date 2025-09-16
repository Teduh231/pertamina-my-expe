import { getEvents, getProducts } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { QrScannerContent } from './_components/qr-scanner-content';

export default async function QrScannerPage() {
  const events = await getEvents();
  const products = await getProducts();
  return (
    <AppLayout>
      <QrScannerContent events={events} products={products} />
    </AppLayout>
  );
}
