import { getEvents, getRaffles } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { RafflePageContent } from './_components/raffle-page-content';
import type { Event, Raffle } from '@/app/lib/definitions';
import { Separator } from '@/components/ui/separator';
import { PrizeHistoryContent } from '@/components/prize-history/prize-history-content';
import { ProtectedRoute } from '@/hooks/use-auth';

export default async function RafflePage() {
  const events: Event[] = await getEvents();
  const allRaffles: Raffle[] = await getRaffles();

  const finishedRaffles = allRaffles.filter(r => r.status === 'finished' && r.winners.length > 0);

  return (
    <ProtectedRoute>
      <AppLayout>
        <RafflePageContent allEvents={events} raffles={allRaffles} />
        {finishedRaffles.length > 0 && (
          <div className="mt-6">
              <PrizeHistoryContent raffles={finishedRaffles} />
          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
