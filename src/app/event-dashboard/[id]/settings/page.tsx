
import { ProtectedRoute } from '@/hooks/use-auth';
import { getEventById } from '@/app/lib/data';
import { notFound } from 'next/navigation';
import { EventSettingsForm } from './_components/event-settings-form';
import { EventDashboardNav } from '@/components/event-dashboard/event-dashboard-nav';

export default async function EventSettingsPage({ params }: { params: { id: string } }) {
  const event = await getEventById(params.id);

  if (!event) {
    notFound();
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <EventDashboardNav eventId={params.id} />
        <EventSettingsForm event={event} />
      </div>
    </ProtectedRoute>
  );
}
