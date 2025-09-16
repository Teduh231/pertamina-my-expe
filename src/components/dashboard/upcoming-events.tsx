import { Event } from '@/app/lib/definitions';
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
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { format, isFuture, parseISO } from 'date-fns';

export function UpcomingEvents({ events }: { events: Event[] }) {
  const upcomingEvents = events
    .filter((event) => isFuture(parseISO(event.date)) && event.status === 'published')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-2">
        <div>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>
                A preview of your next 5 scheduled events.
            </CardDescription>
        </div>
         <Button asChild variant="outline" size="sm">
            <Link href="/events">
                View All Events
                <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
         </Button>
      </CardHeader>
      <CardContent>
        <div className="block md:hidden">
            <div className="space-y-4">
            {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="font-medium">{event.name}</p>
                            <p className="text-sm text-muted-foreground">{format(parseISO(event.date), 'PPP')}</p>
                            <p className="text-sm text-muted-foreground">{event.location}</p>
                            <Badge variant="outline">{event.attendees?.length || 0} Attendees</Badge>
                        </div>
                         <Button asChild size="sm" variant="ghost">
                            <Link href={`/events/${event.id}`}>Manage</Link>
                        </Button>
                    </div>
                ))
            ) : (
                 <div className="text-center text-muted-foreground py-12">
                    <p>No upcoming events scheduled.</p>
                </div>
            )}
            </div>
        </div>
        <div className="hidden md:block">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Attendees</TableHead>
                <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                    <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{format(parseISO(event.date), 'PPP')}</TableCell>
                    <TableCell>{event.location}</TableCell>
                    <TableCell>
                        <Badge variant="outline">{event.attendees?.length || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost">
                            <Link href={`/events/${event.id}`}>Manage</Link>
                        </Button>
                    </TableCell>
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                    No upcoming events scheduled.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
