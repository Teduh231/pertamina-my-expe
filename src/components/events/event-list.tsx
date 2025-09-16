'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Event } from '@/app/lib/definitions';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Calendar,
  MapPin,
  Users,
  Edit,
  Download,
  Eye,
  MoreVertical,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { exportAttendeesToCsv } from '@/app/lib/actions';
import { useToast } from '@/hooks/use-toast';

type EventListProps = {
  events: Event[];
};

export function EventList({ events }: EventListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const handleExport = async (eventId: string, eventName: string) => {
    try {
      const csvData = await exportAttendeesToCsv(eventId);
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
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: 'Could not export attendee data. Please try again.',
      });
    }
  };

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((event) =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.speaker.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);

  const getStatusVariant = (status: Event['status']) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'canceled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by name, location, or speaker..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => {
          const attendeeCount = event.attendees?.length || 0;
          return (
            <Card key={event.id} className="flex flex-col">
              <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold leading-tight">
                    <Link href={`/events/${event.id}`} className="hover:underline">
                      {event.name}
                    </Link>
                  </CardTitle>
                  <Badge variant={getStatusVariant(event.status)} className="capitalize">
                    {event.status}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 pt-2">
                  {event.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 p-4 pt-0">
                <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(parseISO(event.date), 'EEE, MMM d, yyyy')} at {event.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{attendeeCount} Attendees</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <div className="flex w-full justify-end gap-2">
                  <Button asChild variant="outline" size="sm" disabled={event.status !== 'published'}>
                    <Link href={`/events/${event.id}/register`} target="_blank">
                      <Eye className="mr-2 h-4 w-4" />
                      Public View
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                         <Link href={`/events/${event.id}`}>
                           <Edit className="mr-2 h-4 w-4" />
                           <span>Edit / Manage</span>
                         </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleExport(event.id, event.name)}
                        disabled={attendeeCount === 0}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        <span>Export Attendees</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
       {filteredEvents.length === 0 && (
          <div className="text-center text-muted-foreground col-span-full py-12">
            <p>No events found.</p>
            <p className="text-sm">Try adjusting your search terms.</p>
          </div>
        )}
    </div>
  );
}
