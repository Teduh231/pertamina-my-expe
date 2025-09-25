'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Gift, Users, Trophy, Loader2 } from 'lucide-react';
import { Raffle, Booth } from '@/app/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { createRaffle, drawRaffleWinner } from '@/app/lib/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrizeHistoryContent } from './prize-history-content';

type RafflePageContentProps = {
    booth: Booth;
    activeRaffles: Raffle[];
    finishedRaffles: Raffle[];
};

const newRaffleSchema = z.object({
    prize: z.string().min(2, 'Prize must be at least 2 characters.'),
    number_of_winners: z.coerce.number().min(1, 'There must be at least 1 winner.'),
});

export function RafflePageContent({ booth, activeRaffles, finishedRaffles }: RafflePageContentProps) {
    const [openNewRaffleDialog, setOpenNewRaffleDialog] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isDrawing, setIsDrawing] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof newRaffleSchema>>({
        resolver: zodResolver(newRaffleSchema),
        defaultValues: {
            prize: '',
            number_of_winners: 1,
        },
    });

    const getStatusVariant = (status: Raffle['status']) => {
        switch (status) {
          case 'active':
            return 'default';
          case 'upcoming':
            return 'secondary';
          case 'finished':
            return 'outline';
          default:
            return 'destructive';
        }
    };

    const handleCreateRaffle = async (data: z.infer<typeof newRaffleSchema>) => {
        setIsCreating(true);

        const result = await createRaffle({
            ...data,
            booth_id: booth.id,
            boothName: booth.name,
        });

        if (result.success) {
            toast({ title: "Raffle created successfully!" });
            reset();
            setOpenNewRaffleDialog(false);
            router.refresh();
        } else {
            toast({ title: "Error creating raffle", description: result.error, variant: 'destructive' });
        }
        setIsCreating(false);
    };
    
    const handleDrawWinner = async (raffleId: string) => {
        setIsDrawing(raffleId);
        const result = await drawRaffleWinner(raffleId, booth.id);
        if (result.success) {
            if (result.winner) {
                toast({
                    title: "Winner Drawn!",
                    description: `${result.winner.name} has won the raffle.`,
                });
            } else {
                 toast({
                    title: "Raffle Finished",
                    description: result.message || "All winners have been drawn.",
                });
            }
        } else {
            toast({ title: "Error Drawing Winner", description: result.error, variant: 'destructive' });
        }
        setIsDrawing(null);
        router.refresh();
    };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Dialog open={openNewRaffleDialog} onOpenChange={setOpenNewRaffleDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Raffle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit(handleCreateRaffle)}>
                <DialogHeader>
                <DialogTitle>Create New Raffle</DialogTitle>
                <DialogDescription>
                    Configure a new raffle for the "{booth.name}" booth. Attendees who have checked-in will be eligible.
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="prize">Prize</Label>
                        <Input id="prize" placeholder="e.g., Amazon Gift Card" {...register('prize')} />
                        {errors.prize && <p className="text-red-500 text-xs mt-1">{errors.prize.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="number_of_winners">Number of Winners</Label>
                        <Input id="number_of_winners" type="number" defaultValue={1} {...register('number_of_winners')} />
                         {errors.number_of_winners && <p className="text-red-500 text-xs mt-1">{errors.number_of_winners.message}</p>}
                    </div>
                </div>
                <DialogFooter>
                <Button type="submit" disabled={isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Raffle
                </Button>
                </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

       <Tabs defaultValue="active">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">Active Raffles</TabsTrigger>
                <TabsTrigger value="history">Prize History</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {activeRaffles.map(raffle => (
                         <Card key={raffle.id} className="flex flex-col bg-secondary/30">
                         <CardHeader>
                           <div className="flex items-center justify-between">
                             <CardTitle className="text-xl">{raffle.prize}</CardTitle>
                             <Badge variant={getStatusVariant(raffle.status)} className="capitalize">{raffle.status}</Badge>
                           </div>
                         </CardHeader>
                         <CardContent className="space-y-4 flex-1">
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Users className="mr-2 h-4 w-4" />
                                <span>{raffle.winners?.length || 0} / {raffle.number_of_winners} winner(s) drawn</span>
                            </div>
                            {raffle.winners?.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-2 flex items-center"><Trophy className="mr-2 h-4 w-4 text-yellow-500" /> Winners</h4>
                                    <div className="space-y-1 text-sm max-h-24 overflow-y-auto">
                                        {raffle.winners.map(winner => (
                                            <p key={winner.attendeeId} className="text-muted-foreground truncate" title={`${winner.name} (${winner.email})`}>{winner.name}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                         </CardContent>
                         {(raffle.status === 'active' || raffle.status === 'upcoming') && (
                             <CardFooter>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button className="w-full" disabled={isDrawing === raffle.id}>
                                            {isDrawing === raffle.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
                                            Draw Winner
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will randomly draw one winner from eligible attendees. This action cannot be undone.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDrawWinner(raffle.id)}>Continue</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                             </CardFooter>
                         )}
                       </Card>
                    ))}
                </div>
                {activeRaffles.length === 0 && (
                    <Card className="text-center py-12 bg-secondary/30 border-dashed">
                        <CardContent>
                            <h3 className="text-lg font-medium">No Active Raffles</h3>
                            <p className="text-sm text-muted-foreground">Create a new raffle to get started.</p>
                        </CardContent>
                    </Card>
                )}
            </TabsContent>
            <TabsContent value="history" className="mt-6">
                <PrizeHistoryContent raffles={finishedRaffles} />
            </TabsContent>
       </Tabs>
    </div>
  );
}
