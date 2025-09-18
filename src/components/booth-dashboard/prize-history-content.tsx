'use client';

import { useMemo, useState } from 'react';
import { Raffle, RaffleWinner } from '@/app/lib/definitions';
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
  boothName: string;
  prize: string;
  drawnAt: string;
};

function exportPrizesToCsv(winners: PrizeWinner[]): void {
    if (winners.length === 0) return;
    const headers = ['name', 'email', 'boothName', 'prize', 'drawnAt'];
    const csvRows = [headers.join(',')];
  
    for (const winner of winners) {
      const values = [
        winner.name,
        winner.email,
        winner.boothName,
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

  const allWinners = useMemo(() => {
    return raffles.flatMap(raffle =>
      raffle.winners.map(winner => ({
        ...winner,
        boothName: raffle.boothName,
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
        winner.prize.toLowerCase().includes(lowercasedFilter)
    );
  }, [allWinners, searchTerm]);

  return (
    <div>
        <div className="flex items-center justify-between mb-4">
            <Input
                placeholder="Search winners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
            <Button onClick={() => exportPrizesToCsv(filteredWinners)} disabled={filteredWinners.length === 0} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
            </Button>
        </div>
        <div className="border rounded-lg">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Winner Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Prize</TableHead>
                <TableHead>Date Won</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredWinners.length > 0 ? (
                filteredWinners.map(winner => (
                    <TableRow key={`${winner.attendeeId}-${winner.boothName}-${winner.prize}`}>
                    <TableCell className="font-medium">{winner.name}</TableCell>
                    <TableCell>{winner.email}</TableCell>
                    <TableCell>{winner.prize}</TableCell>
                    <TableCell>{winner.drawnAt}</TableCell>
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                    No prize winners found.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
    </div>
  );
}