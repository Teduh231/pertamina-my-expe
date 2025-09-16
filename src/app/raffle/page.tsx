import { getEvents, getRaffles } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { RafflePageContent } from './_components/raffle-page-content';
import type { Event, Raffle } from '@/app/lib/definitions';
import { Separator } from '@/components/ui/separator';
import { PrizeHistoryContent } from './_components/prize-history-content';

export default async function RafflePage() {
  const events: Event[] = await getEvents();
  const allRaffles: Raffle[] = await getRaffles();

  // Filter raffles on the client-side component if needed, or pass all and let the component sort
  const finishedRaffles = allRaffles.filter(r => r.status === 'finished' && r.winners.length > 0);

  return (
    <AppLayout>
      <RafflePageContent allEvents={events} raffles={allRaffles} />
      {finishedRaffles.length > 0 && <Separator className="my-8" />}
      {finishedRaffles.length > 0 && <PrizeHistoryContent raffles={finishedRaffles} />}
    </AppLayout>
  );
}
