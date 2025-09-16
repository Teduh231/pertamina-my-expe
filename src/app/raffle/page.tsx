import { getEvents, getRaffles } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { ProtectedRoute } from '@/hooks/use-auth';
import { RafflePageContent } from './_components/raffle-page-content';
import type { Event, Raffle } from '@/app/lib/definitions';

export default async function RafflePage() {
  const events: Event[] = await getEvents();
  const raffles: Raffle[] = await getRaffles();

  return (
    <ProtectedRoute>
      <AppLayout>
        <RafflePageContent allEvents={events} raffles={raffles} />
      </AppLayout>
    </ProtectedRoute>
  );
}
