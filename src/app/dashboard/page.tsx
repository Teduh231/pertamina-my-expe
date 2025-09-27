'use client';

import { getEvents, getAttendees } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { AnalyticsDashboard } from '@/components/dashboard/analytics-dashboard';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Event, Attendee } from '@/app/lib/definitions';
import { EventLists } from '@/components/dashboard/event-lists';
import { RecentCheckins } from '@/components/dashboard/recent-checkins';

// This component handles the logic for fetching data.
export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      Promise.all([getEvents(), getAttendees()]).then(([eventData, attendeeData]) => {
        setEvents(eventData);
        setAttendees(attendeeData);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-theme(space.16))] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <AnalyticsDashboard events={events} attendees={attendees} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
             <RecentCheckins attendees={attendees} />
          </div>
          <div className="lg:col-span-1">
            <EventLists events={events} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
