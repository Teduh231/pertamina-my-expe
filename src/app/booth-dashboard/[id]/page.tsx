import { getBoothById, getProductsByBooth, getRaffles } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { QrScannerContent } from '@/components/booth-dashboard/qr-scanner-content';
import { RafflePageContent } from '@/components/booth-dashboard/raffle-page-content';
import { PrizeHistoryContent } from '@/components/booth-dashboard/prize-history-content';
import { MerchandisePageContent } from '@/components/booth-dashboard/merchandise-page-content';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { QrCode, Ticket, Gift, Shirt } from 'lucide-react';
import { TenantDashboardHeader } from '@/components/booth-dashboard/tenant-dashboard-header';


export default async function BoothDashboardPage({ params }: { params: { id: string } }) {
  const boothId = params.id;
  
  const [booth, products, allRaffles] = await Promise.all([
    getBoothById(boothId),
    getProductsByBooth(boothId),
    getRaffles(boothId)
  ]);

  if (!booth) {
    notFound();
  }

  const finishedRaffles = allRaffles.filter(r => r.status === 'finished' && r.winners.length > 0);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground">
        <TenantDashboardHeader boothName={booth.name} />
        <main className="p-4 md:p-6">
            <div className="space-y-6">
                <Tabs defaultValue="scanner" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="scanner"><QrCode className="mr-2 h-4 w-4" />QR Scanner</TabsTrigger>
                    <TabsTrigger value="merchandise"><Shirt className="mr-2 h-4 w-4"/>Merchandise</TabsTrigger>
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
                <TabsContent value="merchandise">
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Merchandise Management</CardTitle>
                            <CardDescription>Add and manage products available for redemption at this booth.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <MerchandisePageContent boothId={booth.id} products={products} />
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
        </main>
      </div>
    </ProtectedRoute>
  );
}
