
'use client';
import { useState, useMemo } from 'react';
import { Attendee } from '@/app/lib/definitions';
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
import { format, parseISO } from 'date-fns';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportBoothAttendeesToCsv } from '@/app/lib/actions';

type AttendeeWithCheckin = Attendee & { checked_in_at: string };

export function AttendeesContent({ attendees, boothName, boothId }: { attendees: AttendeeWithCheckin[], boothName: string, boothId: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const handleExport = async () => {
    toast({ title: 'Exporting...', description: 'Please wait while we prepare your CSV file.' });
    try {
        const csvData = await exportBoothAttendeesToCsv(boothId);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${boothName.replace(/\s/g, '_')}_attendees.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
            title: 'Export successful!',
            description: `Attendee data for "${boothName}" has been downloaded.`,
        });
    } catch (error) {
        console.error('Export failed:', error);
        toast({
            variant: 'destructive',
            title: 'Export failed',
            description: 'Could not export attendee data. Please try again.',
        });
    }
  };

  const filteredAttendees = useMemo(() => {
    if (!searchTerm) return attendees;
    const lowercasedFilter = searchTerm.toLowerCase();
    return attendees.filter(
      (attendee) =>
        attendee.name.toLowerCase().includes(lowercasedFilter) ||
        attendee.phone_number.toLowerCase().includes(lowercasedFilter)
    );
  }, [attendees, searchTerm]);

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <CardTitle>Booth Attendees ({attendees.length})</CardTitle>
          <CardDescription>
            A list of all attendees who checked into this booth.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input
            placeholder="Search attendees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:max-w-sm"
          />
          <Button onClick={handleExport} disabled={filteredAttendees.length === 0} size="sm">
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Phone Number</TableHead>
              <TableHead>Points</TableHead>
              <TableHead className="hidden md:table-cell">Checked-in At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAttendees.length > 0 ? (
              filteredAttendees.map((attendee) => (
                <TableRow key={attendee.id}>
                  <TableCell className="font-medium">
                    <div>{attendee.name}</div>
                    <div className="text-muted-foreground text-sm sm:hidden">{attendee.phone_number}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{attendee.phone_number}</TableCell>
                   <TableCell>{attendee.points}</TableCell>
                  <TableCell className="hidden md:table-cell">{format(parseISO(attendee.checked_in_at), 'PPP p')}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No attendees found for this booth.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
