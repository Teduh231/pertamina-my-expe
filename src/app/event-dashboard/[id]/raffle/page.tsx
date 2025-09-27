import { getEventById, getRaffles } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { RafflePageContent } from '@/components/event-dashboard/raffle-page-content';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EventDashboardNav } from '@/components/event-dashboard/event-dashboard-nav';

export default async function EventDashboardRafflePage({ params }: { params: { id: string } }) {
  const eventId = params.id;
  
  const [event, allRaffles] = await Promise.all([
    getEventById(eventId),
    getRaffles(eventId)
  ]);

  if (!event) {
    notFound();
  }

  const activeRaffles = allRaffles.filter(r => r.status !== 'finished');
  const finishedRaffles = allRaffles.filter(r => r.status === 'finished' && r.winners.length > 0);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <EventDashboardNav eventId={eventId} />
        <Card>
             <CardHeader>
                <CardTitle>Raffle Management</CardTitle>
                <CardDescription>Create, manage, and view the history of this event's raffles.</CardDescription>
            </CardHeader>
            <CardContent>
               <RafflePageContent event={event} activeRaffles={activeRaffles} finishedRaffles={finishedRaffles} />
            </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
