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

  return (
    <ProtectedRoute>
        <AppLayout>
            <Card>
                 <CardHeader>
                    <CardTitle>Raffle Management</CardTitle>
                    <CardDescription>Create, manage, and draw winners for this booth's raffles.</CardDescription>
                </CardHeader>
                <CardContent>
                   <RafflePageContent booth={booth} raffles={allRaffles} />
                </CardContent>
            </Card>
        </AppLayout>
    </ProtectedRoute>
  );
}
