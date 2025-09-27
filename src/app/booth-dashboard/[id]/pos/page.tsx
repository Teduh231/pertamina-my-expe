import { getEventById, getProductsByEvent, getRecentTransactions } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { PosContent } from '@/components/event-dashboard/pos-content';

export default async function EventDashboardPosPage({ params }: { params: { id: string } }) {
  const eventId = params.id;
  
  const [event, products, transactions] = await Promise.all([
    getEventById(eventId),
    getProductsByEvent(eventId),
    getRecentTransactions(eventId, 10) // Fetch more for the dashboard
  ]);

  if (!event) {
    notFound();
  }

  return (
    <ProtectedRoute>
        <AppLayout>
            <PosContent event={event} products={products} initialTransactions={transactions} />
        </AppLayout>
    </ProtectedRoute>
  );
}
