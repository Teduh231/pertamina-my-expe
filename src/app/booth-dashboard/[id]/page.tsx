import { getBoothById, getProductsByBooth } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { QrScannerContent } from '@/components/booth-dashboard/qr-scanner-content';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppLayout } from '@/components/app-layout';

export default async function BoothDashboardScannerPage({ params }: { params: { id: string } }) {
  const boothId = params.id;
  
  const [booth, products] = await Promise.all([
    getBoothById(boothId),
    getProductsByBooth(boothId),
  ]);

  if (!booth) {
    notFound();
  }

  return (
    <ProtectedRoute>
        <AppLayout>
            <QrScannerContent booth={booth} products={products} />
        </AppLayout>
    </ProtectedRoute>
  );
}
