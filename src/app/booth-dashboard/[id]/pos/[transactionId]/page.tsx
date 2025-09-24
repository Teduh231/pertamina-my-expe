import { getTransactionById } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { TransactionDetailContent } from '@/components/booth-dashboard/transaction-detail-content';

export default async function TransactionDetailPage({ params }: { params: { id: string; transactionId: string } }) {
  const { id: boothId, transactionId } = params;

  const transaction = await getTransactionById(transactionId);

  if (!transaction) {
    notFound();
  }

  return (
    <ProtectedRoute>
        <AppLayout>
            <TransactionDetailContent transaction={transaction} boothId={boothId} />
        </AppLayout>
    </ProtectedRoute>
  );
}
