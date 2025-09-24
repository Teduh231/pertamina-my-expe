import { getBoothById, getProductsByBooth, getRecentTransactions } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { PosContent } from '@/components/booth-dashboard/pos-content';

export default async function BoothDashboardPosPage({ params }: { params: { id: string } }) {
  const boothId = params.id;
  
  const [booth, products, transactions] = await Promise.all([
    getBoothById(boothId),
    getProductsByBooth(boothId),
    getRecentTransactions(boothId, 5)
  ]);

  if (!booth) {
    notFound();
  }

  return (
    <ProtectedRoute>
        <AppLayout>
            <PosContent booth={booth} products={products} initialTransactions={transactions} />
        </AppLayout>
    </ProtectedRoute>
  );
}
