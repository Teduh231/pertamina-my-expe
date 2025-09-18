import { getBooths, getProducts } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { QrScannerContent } from './_components/qr-scanner-content';
import { ProtectedRoute } from '@/hooks/use-auth';
import { Booth, Product } from '@/app/lib/definitions';

export default async function QrScannerPage() {
  const booths: Booth[] = await getBooths();
  const products: Product[] = await getProducts();
  return (
    <ProtectedRoute>
      <AppLayout>
        <QrScannerContent booths={booths} products={products}/>
      </AppLayout>
    </ProtectedRoute>
  );
}
