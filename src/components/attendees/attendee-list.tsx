'use client';
import { useState, useMemo } from 'react';
import { Attendee, Booth } from '@/app/lib/definitions';
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
import Link from 'next/link';

type AttendeeWithBooth = Attendee & { boothName: string; boothId: string; };

function exportAllAttendeesToCsv(attendees: AttendeeWithBooth[]): void {
  if (attendees.length === 0) {
    return;
  }
  const headers = ['name', 'email', 'boothName', 'registered_at'];
  const csvRows = [headers.join(',')];

  for (const attendee of attendees) {
    const values = [
      attendee.name,
      attendee.email,
      attendee.boothName,
      attendee.registered_at
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
  link.setAttribute('download', 'all_attendees.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function AttendeeList({ booths }: { booths: Booth[] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const allAttendees: AttendeeWithBooth[] = useMemo(() => {
    return booths.flatMap(booth =>
      (booth.attendees || []).map(attendee => ({
        ...attendee,
        boothName: booth.name,
        boothId: booth.id,
      }))
    );
  }, [booths]);

  const filteredAttendees = useMemo(() => {
    if (!searchTerm) return allAttendees;
    const lowercasedFilter = searchTerm.toLowerCase();
    return allAttendees.filter(
      (attendee) =>
        attendee.name.toLowerCase().includes(lowercasedFilter) ||
        attendee.email.toLowerCase().includes(lowercasedFilter) ||
        attendee.boothName.toLowerCase().includes(lowercasedFilter)
    );
  }, [allAttendees, searchTerm]);

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <CardTitle>All Attendees ({allAttendees.length})</CardTitle>
          <CardDescription>
            A list of all attendees registered for your booths.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input
            placeholder="Search attendees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:max-w-sm"
          />
          <Button onClick={() => exportAllAttendeesToCsv(filteredAttendees)} disabled={filteredAttendees.length === 0} size="sm">
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
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead>Booth</TableHead>
              <TableHead className="hidden md:table-cell">Registered On</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAttendees.length > 0 ? (
              filteredAttendees.map((attendee) => (
                <TableRow key={attendee.id + attendee.boothId}>
                  <TableCell className="font-medium">
                    <div>{attendee.name}</div>
                    <div className="text-muted-foreground text-sm sm:hidden">{attendee.email}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{attendee.email}</TableCell>
                  <TableCell>
                    <Link href={`/booths/${attendee.boothId}`} className="hover:underline text-primary">
                        {attendee.boothName}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{format(parseISO(attendee.registered_at), 'PPP')}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No attendees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
