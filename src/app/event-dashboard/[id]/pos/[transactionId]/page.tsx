import { getTransactionById } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { TransactionDetailContent } from '@/components/event-dashboard/transaction-detail-content';

export default async function TransactionDetailPage({ params }: { params: { id: string; transactionId: string } }) {
  const { id: eventId, transactionId } = params;

  const transaction = await getTransactionById(transactionId);

  if (!transaction) {
    notFound();
  }

  return (
    <ProtectedRoute>
        <TransactionDetailContent transaction={transaction} eventId={eventId} />
    </ProtectedRoute>
  );
}
