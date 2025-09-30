import { getTransactionById } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { TransactionDetailContent } from '@/components/event-dashboard/transaction-detail-content';
import { EventDashboardNav } from '@/components/event-dashboard/event-dashboard-nav';

export default async function TransactionDetailPage({ params }: { params: { id: string; transactionId: string } }) {
  const { id: eventId, transactionId } = params;

  const transaction = await getTransactionById(transactionId);

  if (!transaction) {
    notFound();
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <EventDashboardNav eventId={eventId} />
        <TransactionDetailContent transaction={transaction} eventId={eventId} />
      </div>
    </ProtectedRoute>
  );
}
