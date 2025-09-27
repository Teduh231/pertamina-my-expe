'use client';

import { Event } from '@/app/lib/definitions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function EventLists({ events }: { events: (Event & { attendees_count?: number })[] }) {
  const activeEvents = events
    .filter((event) => event.status === 'published')
    .slice(0, 3);
    
  const upcomingEvents = events
    .filter((event) => event.status === 'draft')
    .slice(0, 2);

  const calculateAttendance = (count: number, capacity: number) => {
    if (capacity === 0) return 0;
    return (count / capacity) * 100;
  }

  // Dummy capacity for progress bar calculation
  const getCapacity = (index: number) => [250, 50, 1000][index] || 500;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Events</CardTitle>
          <CardDescription>Currently running events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeEvents.length > 0 ? (
            activeEvents.map((event, index) => {
                const capacity = getCapacity(index);
                const attendeeCount = event.attendees_count || 0;
                const attendancePercentage = calculateAttendance(attendeeCount, capacity);
                
                return (
                    <div key={event.id}>
                        <h4 className="font-semibold text-sm mb-1">{event.name}</h4>
                        <div className="flex items-center text-xs text-muted-foreground gap-4 mb-2">
                           <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{event.location}</div>
                           <div className="flex items-center gap-1.5"><Users className="h-3 w-3" />{attendeeCount} / {capacity}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Progress value={attendancePercentage} className="h-2" />
                            <span className="text-xs font-bold">{attendancePercentage.toFixed(0)}%</span>
                        </div>
                    </div>
                )
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No active events.</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>All scheduled events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <div key={event.id} className="border-t first:border-t-0 pt-4 first:pt-0">
                <h4 className="font-semibold text-sm mb-1">{event.name}</h4>
                <div className="flex flex-wrap items-center text-xs text-muted-foreground gap-x-4 gap-y-1">
                   <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{format(parseISO(event.created_at), 'MMMM dd, yyyy')}</div>
                   <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" />10:00 AM</div>
                   <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{event.location}</div>
                   <div className="flex items-center gap-1.5"><Users className="h-3 w-3" />Capacity: 500</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming events.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
