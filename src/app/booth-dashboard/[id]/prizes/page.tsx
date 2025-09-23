import { getRaffles } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { PrizeHistoryContent } from '@/components/booth-dashboard/prize-history-content';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppLayout } from '@/components/app-layout';

export default async function BoothDashboardPrizeHistoryPage({ params }: { params: { id: string } }) {
  const boothId = params.id;
  
  const allRaffles = await getRaffles(boothId);

  const finishedRaffles = allRaffles.filter(r => r.status === 'finished' && r.winners.length > 0);

  return (
    <ProtectedRoute>
        <AppLayout>
            <Card>
                <CardHeader>
                    <CardTitle>Prize History</CardTitle>
                    <CardDescription>A log of all raffle winners from this booth.</CardDescription>
                </CardHeader>
                <CardContent>
                    {finishedRaffles.length > 0 ? (
                         <PrizeHistoryContent raffles={finishedRaffles} />
                    ) : (
                        <div className="text-center text-muted-foreground py-12">
                            <p>No finished raffles with winners yet for this booth.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </AppLayout>
    </ProtectedRoute>
  );
}
