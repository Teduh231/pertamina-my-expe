import { getEventById, getProductsByEvent, getActivitiesByEvent } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { QrScannerContent } from '@/components/event-dashboard/qr-scanner-content';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppLayout } from '@/components/app-layout';

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
        <AppLayout>
            <QrScannerContent event={event} products={products} activities={activities} />
        </AppLayout>
    </ProtectedRoute>
  );
}
