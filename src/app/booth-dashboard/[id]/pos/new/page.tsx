import { getBoothById, getProductsByBooth } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { NewTransactionContent } from '@/components/booth-dashboard/new-transaction-content';

export default async function NewTransactionPage({ params }: { params: { id: string } }) {
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
            <NewTransactionContent booth={booth} products={products} />
        </AppLayout>
    </ProtectedRoute>
  );
}
