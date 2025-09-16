import { getEvents, getRaffles } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { ProtectedRoute } from '@/hooks/use-auth';
import { RafflePageContent } from './_components/raffle-page-content';
import type { Event, Raffle } from '@/app/lib/definitions';
import { Separator } from '@/components/ui/separator';
import { PrizeHistoryContent } from './_components/prize-history-content';

export default async function RafflePage() {
  const events: Event[] = await getEvents();
  const allRaffles: Raffle[] = await getRaffles();

  const activeRaffles = allRaffles.filter(r => r.status === 'active');
  const finishedRaffles = allRaffles.filter(r => r.status === 'finished' && r.winners.length > 0);


  return (
    <ProtectedRoute>
      <AppLayout>
        <RafflePageContent allEvents={events} raffles={activeRaffles} />
        <Separator className="my-8" />
        <PrizeHistoryContent raffles={finishedRaffles} />
      </AppLayout>
    </ProtectedRoute>
  );
}
