'use client';

import { useMemo, useState } from 'react';
import { Raffle, RaffleWinner } from '@/app/lib/definitions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type PrizeWinner = RaffleWinner & {
  eventName: string;
  prize: string;
  drawnAt: string;
};

function exportPrizesToCsv(winners: PrizeWinner[]): void {
    if (winners.length === 0) return;
    const headers = ['name', 'email', 'eventName', 'prize', 'drawnAt'];
    const csvRows = [headers.join(',')];
  
    for (const winner of winners) {
      const values = [
        winner.name,
        winner.email,
        winner.eventName,
        winner.prize,
        winner.drawnAt,
      ].map(value => {
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }
  
    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'prize_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function PrizeHistoryContent({ raffles }: { raffles: Raffle[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openUploadDialog, setOpenUploadDialog] = useState(false);

  const allWinners: PrizeWinner[] = useMemo(() => {
    if (!raffles) return [];
    return raffles
      .filter(raffle => raffle.status === 'finished' && raffle.winners?.length > 0)
      .flatMap(raffle =>
        raffle.winners.map(winner => ({
          ...winner,
          eventName: raffle.eventName,
          prize: raffle.prize,
          drawnAt: raffle.drawn_at ? format(parseISO(raffle.drawn_at), 'PPP p') : 'N/A',
        }))
    );
  }, [raffles]);

  const filteredWinners = useMemo(() => {
    if (!searchTerm) return allWinners;
    const lowercasedFilter = searchTerm.toLowerCase();
    return allWinners.filter(
      winner =>
        winner.name.toLowerCase().includes(lowercasedFilter) ||
        winner.email.toLowerCase().includes(lowercasedFilter) ||
        winner.eventName.toLowerCase().includes(lowercasedFilter) ||
        winner.prize.toLowerCase().includes(lowercasedFilter)
    );
  }, [allWinners, searchTerm]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Prize History</CardTitle>
          <CardDescription>
            A log of all raffle winners from your events.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
            <Input
                placeholder="Search winners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
            />
            <Dialog open={openUploadDialog} onOpenChange={setOpenUploadDialog}>
                <DialogTrigger asChild>
                    <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Upload CSV</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Prize Data</DialogTitle>
                        <DialogDescription>
                            This feature is not yet implemented.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="csv-upload">CSV File</Label>
                            <Input id="csv-upload" type="file" accept=".csv" disabled />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={() => setOpenUploadDialog(false)} disabled>Upload</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Button onClick={() => exportPrizesToCsv(filteredWinners)} disabled={filteredWinners.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Winner Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Prize</TableHead>
              <TableHead>Date Won</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWinners.length > 0 ? (
              filteredWinners.map(winner => (
                <TableRow key={`${winner.attendeeId}-${winner.eventName}`}>
                  <TableCell className="font-medium">{winner.name}</TableCell>
                  <TableCell>{winner.email}</TableCell>
                  <TableCell>{winner.eventName}</TableCell>
                  <TableCell>{winner.prize}</TableCell>
                  <TableCell>{winner.drawnAt}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No prize winners found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
