
'use client';
import { useState, useMemo } from 'react';
import { Attendee, CheckIn } from '@/app/lib/definitions';
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
import { exportEventAttendeesToCsv } from '@/app/lib/actions';

// The full CheckIn object with the nested Attendee object
type AttendeeWithCheckin = CheckIn & { attendees: Attendee };

export function AttendeesContent({ attendees, eventName, eventId }: { attendees: AttendeeWithCheckin[], eventName: string, eventId: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const handleExport = async () => {
    toast({ title: 'Exporting...', description: 'Please wait while we prepare your CSV file.' });
    try {
        const csvData = await exportEventAttendeesToCsv(eventId);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${eventName.replace(/\s/g, '_')}_attendees.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
            title: 'Export successful!',
            description: `Attendee data for "${eventName}" has been downloaded.`,
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
      (checkIn) =>
        checkIn.attendees.name.toLowerCase().includes(lowercasedFilter) ||
        checkIn.attendees.phone_number.toLowerCase().includes(lowercasedFilter)
    );
  }, [attendees, searchTerm]);

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <CardTitle>Event Attendees ({attendees.length})</CardTitle>
          <CardDescription>
            A list of all attendees who checked into this event.
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
              filteredAttendees.map((checkIn) => (
                <TableRow key={checkIn.id}>
                  <TableCell className="font-medium">
                    <div>{checkIn.attendees.name}</div>
                    <div className="text-muted-foreground text-sm sm:hidden">{checkIn.attendees.phone_number}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{checkIn.attendees.phone_number}</TableCell>
                   <TableCell>{checkIn.attendees.points}</TableCell>
                  <TableCell className="hidden md:table-cell">{format(parseISO(checkIn.checked_in_at), 'PPP p')}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No attendees found for this event.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
