import { getEventById, getProductsByEvent } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { NewTransactionContent } from '@/components/event-dashboard/new-transaction-content';

export default async function NewTransactionPage({ params }: { params: { id: string } }) {
  const eventId = params.id;
  
  const [event, products] = await Promise.all([
    getEventById(eventId),
    getProductsByEvent(eventId),
  ]);

  if (!event) {
    notFound();
  }

  return (
    <ProtectedRoute>
        <NewTransactionContent event={event} products={products} />
    </ProtectedRoute>
  );
}
