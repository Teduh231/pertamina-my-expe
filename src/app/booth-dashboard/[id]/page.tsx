import { getBoothById, getProducts, getRaffles } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { Booth, Product, Raffle } from '@/app/lib/definitions';
import { QrScannerContent } from '@/components/booth-dashboard/qr-scanner-content';
import { RafflePageContent } from '@/components/booth-dashboard/raffle-page-content';
import { PrizeHistoryContent } from '@/components/booth-dashboard/prize-history-content';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { QrCode, Ticket, Gift } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default async function BoothDashboardPage({ params }: { params: { id: string } }) {
  const boothId = params.id;
  
  const [booth, products, allRaffles] = await Promise.all([
    getBoothById(boothId),
    getProducts(),
    getRaffles(boothId)
  ]);

  if (!booth) {
    notFound();
  }

  const finishedRaffles = allRaffles.filter(r => r.status === 'finished' && r.winners.length > 0);

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{booth.name} - Dashboard</h1>
                <p className="text-muted-foreground">Manage check-ins, raffles, and prizes for this booth.</p>
            </div>
            <Tabs defaultValue="scanner" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="scanner"><QrCode className="mr-2 h-4 w-4" />QR Scanner</TabsTrigger>
                <TabsTrigger value="raffles"><Ticket className="mr-2 h-4 w-4"/>Raffle</TabsTrigger>
                <TabsTrigger value="prizes"><Gift className="mr-2 h-4 w-4"/>Prize History</TabsTrigger>
            </TabsList>
            <TabsContent value="scanner">
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>QR Scanner</CardTitle>
                        <CardDescription>Check-in attendees and redeem merchandise points.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <QrScannerContent booth={booth} products={products} />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="raffles">
                <Card className="mt-4">
                     <CardHeader>
                        <CardTitle>Raffle Management</CardTitle>
                        <CardDescription>Create, manage, and draw winners for this booth's raffles.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <RafflePageContent booth={booth} raffles={allRaffles} />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="prizes">
                <Card className="mt-4">
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
            </TabsContent>
            </Tabs>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}