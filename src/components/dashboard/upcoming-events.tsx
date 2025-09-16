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
import { ArrowRight, Calendar, MapPin, Users as UsersIcon } from 'lucide-react';
import { format, isFuture, parseISO } from 'date-fns';

export function UpcomingEvents({ events }: { events: Event[] }) {
  const upcomingEvents = events
    .filter((event) => isFuture(parseISO(event.date)) && event.status === 'published')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <Card className="lg:col-span-2 bg-secondary/30">
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
        <div className="space-y-4">
        {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
                <div key={event.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <Link href={`/events`} className="font-medium hover:underline">{event.name}</Link>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {format(parseISO(event.date), 'PPP')}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-1.5">
                                <UsersIcon className="h-3 w-3"/>
                                {event.attendees?.length || 0}
                            </Badge>
                             <Button asChild size="sm" variant="ghost">
                                <Link href={`/events`}>Manage</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            ))
        ) : (
             <div className="text-center text-muted-foreground py-12">
                <p>No upcoming events scheduled.</p>
            </div>
        )}
        </div>
      </CardContent>
    </Card>
  );
}
