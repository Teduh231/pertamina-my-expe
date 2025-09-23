import { getBoothById, getProductsByBooth } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { MerchandisePageContent } from '@/components/booth-dashboard/merchandise-page-content';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppLayout } from '@/components/app-layout';

export default async function BoothDashboardMerchandisePage({ params }: { params: { id: string } }) {
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
            <Card>
                <CardHeader>
                    <CardTitle>Merchandise Management</CardTitle>
                    <CardDescription>Add and manage products available for redemption at this booth.</CardDescription>
                </CardHeader>
                <CardContent>
                   <MerchandisePageContent boothId={booth.id} products={products} />
                </CardContent>
            </Card>
        </AppLayout>
    </ProtectedRoute>
  );
}
