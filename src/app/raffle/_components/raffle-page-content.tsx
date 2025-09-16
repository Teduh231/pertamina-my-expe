'use client';

import { useState } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Gift, Users, Trophy, Loader2 } from 'lucide-react';
import { Raffle, Event } from '@/app/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
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

type RafflePageContentProps = {
    allEvents: Event[];
    raffles: Raffle[];
};

const newRaffleSchema = z.object({
    eventId: z.string().min(1, 'Please select an event.'),
    prize: z.string().min(2, 'Prize must be at least 2 characters.'),
    numberOfWinners: z.coerce.number().min(1, 'There must be at least 1 winner.'),
});

export function RafflePageContent({ allEvents, raffles }: RafflePageContentProps) {
    const [openNewRaffleDialog, setOpenNewRaffleDialog] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isDrawing, setIsDrawing] = useState<string | null>(null);
    const { toast } = useToast();

    const { control, handleSubmit, register, reset, formState: { errors } } = useForm<z.infer<typeof newRaffleSchema>>({
        resolver: zodResolver(newRaffleSchema),
        defaultValues: {
            eventId: '',
            prize: '',
            numberOfWinners: 1,
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
        const selectedEvent = allEvents.find(e => e.id === data.eventId);
        if (!selectedEvent) return;

        const result = await createRaffle({
            ...data,
            eventName: selectedEvent.name,
        });

        if (result.success) {
            toast({ title: "Raffle created successfully!" });
            reset();
            setOpenNewRaffleDialog(false);
        } else {
            toast({ title: "Error creating raffle", description: result.error, variant: 'destructive' });
        }
        setIsCreating(false);
    };
    
    const handleDrawWinner = async (raffleId: string) => {
        setIsDrawing(raffleId);
        const result = await drawRaffleWinner(raffleId);
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
    };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Raffle Management</h2>
          <p className="text-muted-foreground">
            Create, manage, and draw winners for your event raffles.
          </p>
        </div>
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
                    Configure a new raffle for one of your events.
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="event" className="text-right">Event</Label>
                        <Controller
                            name="eventId"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select an event" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allEvents.filter(e => e.status === 'published' && e.attendees.length > 0).map(event => (
                                            <SelectItem key={event.id} value={event.id}>{event.name} ({event.attendees.length} attendees)</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.eventId && <p className="col-span-4 text-red-500 text-xs text-right">{errors.eventId.message}</p>}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="prize" className="text-right">Prize</Label>
                        <Input id="prize" placeholder="e.g., Amazon Gift Card" className="col-span-3" {...register('prize')} />
                        {errors.prize && <p className="col-span-4 text-red-500 text-xs text-right">{errors.prize.message}</p>}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="numberOfWinners" className="text-right">Winners</Label>
                        <Input id="numberOfWinners" type="number" defaultValue={1} className="col-span-3" {...register('numberOfWinners')} />
                         {errors.numberOfWinners && <p className="col-span-4 text-red-500 text-xs text-right">{errors.numberOfWinners.message}</p>}
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {raffles.map(raffle => (
                 <Card key={raffle.id} className="flex flex-col">
                 <CardHeader>
                   <div className="flex items-center justify-between">
                     <CardTitle className="text-xl">{raffle.eventName}</CardTitle>
                     <Badge variant={getStatusVariant(raffle.status)} className="capitalize">{raffle.status}</Badge>
                   </div>
                   <CardDescription>Prize: {raffle.prize}</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4 flex-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="mr-2 h-4 w-4" />
                        <span>{raffle.winners.length} / {raffle.numberOfWinners} winner(s) drawn</span>
                    </div>
                    {raffle.winners.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2 flex items-center"><Trophy className="mr-2 h-4 w-4 text-yellow-500" /> Winners</h4>
                            <div className="space-y-1 text-sm max-h-24 overflow-y-auto">
                                {raffle.winners.map(winner => (
                                    <p key={winner.attendeeId} className="text-muted-foreground truncate" title={`${winner.name} (${winner.email})`}>{winner.name} ({winner.email})</p>
                                ))}
                            </div>
                            {raffle.status === 'finished' && raffle.drawnAt && <p className="text-xs text-muted-foreground/70 pt-2">Finished on {format(parseISO(raffle.drawnAt), 'PPP p')}</p>}
                        </div>
                    )}
                 </CardContent>
                 {raffle.status === 'active' && (
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
                                    This will randomly draw one winner from the eligible attendees. This action cannot be undone.
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
        {raffles.length === 0 && (
            <Card className="text-center py-12">
                <CardContent>
                    <h3 className="text-lg font-medium">No Raffles Found</h3>
                    <p className="text-sm text-muted-foreground">Create your first raffle to get started.</p>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
