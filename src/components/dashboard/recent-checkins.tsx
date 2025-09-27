'use client';

import { Attendee } from '@/app/lib/definitions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, parseISO } from 'date-fns';

export function RecentCheckins({ attendees }: { attendees: Attendee[] }) {
  const recentAttendees = attendees
    .slice()
    .sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Check-ins</CardTitle>
        <CardDescription>Latest employee check-ins to events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentAttendees.length > 0 ? (
            recentAttendees.map((attendee) => (
              <div key={attendee.id} className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={`https://i.pravatar.cc/150?u=${attendee.id}`} />
                  <AvatarFallback>{attendee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{attendee.name}</p>
                  <p className="text-xs text-muted-foreground">Checked in to "Digital Transformation Summit"</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(attendee.registered_at), 'p')}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No check-ins yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
