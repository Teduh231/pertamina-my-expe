import { getRaffles } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { ProtectedRoute } from '@/hooks/use-auth';
import type { Raffle } from '@/app/lib/definitions';
import { PrizeHistoryContent } from './_components/prize-history-content';


export default async function PrizeHistoryPage() {
  const raffles: Raffle[] = await getRaffles();

  const finishedRaffles = raffles.filter(r => r.status === 'finished' && r.winners.length > 0);

  return (
    <ProtectedRoute>
      <AppLayout>
        <PrizeHistoryContent raffles={finishedRaffles} />
      </AppLayout>
    </ProtectedRoute>
  );
}
