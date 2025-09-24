import { getBoothById, getProductsByBooth, getActivitiesByBooth } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { OverviewContent } from '@/components/booth-dashboard/overview-content';
import { AppLayout } from '@/components/app-layout';

export default async function BoothDashboardOverviewPage({ params }: { params: { id: string } }) {
  const boothId = params.id;
  
  const [booth, products, activities] = await Promise.all([
    getBoothById(boothId),
    getProductsByBooth(boothId),
    getActivitiesByBooth(boothId),
  ]);

  if (!booth) {
    notFound();
  }

  return (
    <ProtectedRoute>
        <AppLayout>
            <OverviewContent booth={booth} products={products} activities={activities} />
        </AppLayout>
    </ProtectedRoute>
  );
}
