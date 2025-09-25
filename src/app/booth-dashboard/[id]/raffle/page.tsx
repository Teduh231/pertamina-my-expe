import { getBoothById, getRaffles } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { RafflePageContent } from '@/components/booth-dashboard/raffle-page-content';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppLayout } from '@/components/app-layout';

export default async function BoothDashboardRafflePage({ params }: { params: { id: string } }) {
  const boothId = params.id;
  
  const [booth, allRaffles] = await Promise.all([
    getBoothById(boothId),
    getRaffles(boothId)
  ]);

  if (!booth) {
    notFound();
  }

  const activeRaffles = allRaffles.filter(r => r.status !== 'finished');
  const finishedRaffles = allRaffles.filter(r => r.status === 'finished' && r.winners.length > 0);

  return (
    <ProtectedRoute>
        <AppLayout>
            <Card>
                 <CardHeader>
                    <CardTitle>Raffle Management</CardTitle>
                    <CardDescription>Create, manage, and view the history of this booth's raffles.</CardDescription>
                </CardHeader>
                <CardContent>
                   <RafflePageContent booth={booth} activeRaffles={activeRaffles} finishedRaffles={finishedRaffles} />
                </CardContent>
            </Card>
        </AppLayout>
    </ProtectedRoute>
  );
}
