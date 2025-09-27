import { getEventById, getProductsByEvent, getActivitiesByEvent } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { QrScannerContent } from '@/components/event-dashboard/qr-scanner-content';
import { EventDashboardNav } from '@/components/event-dashboard/event-dashboard-nav';

export default async function EventDashboardScannerPage({ params }: { params: { id: string } }) {
  const eventId = params.id;
  
  const [event, products, activities] = await Promise.all([
    getEventById(eventId),
    getProductsByEvent(eventId),
    getActivitiesByEvent(eventId),
  ]);

  if (!event) {
    notFound();
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <EventDashboardNav eventId={eventId} />
        <QrScannerContent event={event} products={products} activities={activities} />
      </div>
    </ProtectedRoute>
  );
}
