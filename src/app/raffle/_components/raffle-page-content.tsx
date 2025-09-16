'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Gift, Users, Trophy } from 'lucide-react';
import { Raffle, Event } from '@/app/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

type RafflePageContentProps = {
    allEvents: Event[];
    raffles: Raffle[];
};

export function RafflePageContent({ allEvents, raffles }: RafflePageContentProps) {
    const [openNewRaffleDialog, setOpenNewRaffleDialog] = useState(false);

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
            <DialogHeader>
              <DialogTitle>Create New Raffle</DialogTitle>
              <DialogDescription>
                Configure a new raffle for one of your events.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="event" className="text-right">
                  Event
                </Label>
                <Select>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                        {allEvents.filter(e => e.status === 'published').map(event => (
                            <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prize" className="text-right">
                  Prize
                </Label>
                <Input id="prize" placeholder="e.g., Amazon Gift Card" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="winners" className="text-right">
                  Winners
                </Label>
                <Input id="winners" type="number" defaultValue={1} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => setOpenNewRaffleDialog(false)}>Create Raffle</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {raffles.map(raffle => (
                 <Card key={raffle.id}>
                 <CardHeader>
                   <div className="flex items-center justify-between">
                     <CardTitle className="text-xl">{raffle.eventName}</CardTitle>
                     <Badge variant={getStatusVariant(raffle.status)} className="capitalize">{raffle.status}</Badge>
                   </div>
                   <CardDescription>Prize: {raffle.prize}</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="mr-2 h-4 w-4" />
                        <span>{raffle.numberOfWinners} winner(s) to be drawn</span>
                    </div>
                    {raffle.status === 'finished' && raffle.winners.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2 flex items-center"><Trophy className="mr-2 h-4 w-4 text-yellow-500" /> Winners</h4>
                            <div className="space-y-1 text-sm">
                                {raffle.winners.map(winner => (
                                    <p key={winner.attendeeId} className="text-muted-foreground">{winner.name} ({winner.email})</p>
                                ))}
                                {raffle.drawnAt && <p className="text-xs text-muted-foreground/70 pt-2">Drawn on {format(parseISO(raffle.drawnAt), 'PPP p')}</p>}
                            </div>
                        </div>
                    )}
                 </CardContent>
                 {raffle.status === 'active' && (
                     <CardContent>
                        <Button className="w-full">
                            <Gift className="mr-2 h-4 w-4" />
                             Draw Winner
                        </Button>
                     </CardContent>
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
