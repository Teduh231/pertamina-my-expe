import { getEvents, getAttendees } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { AnalyticsDashboard } from '@/components/dashboard/analytics-dashboard';
import type { Event, Attendee } from '@/app/lib/definitions';
import { EventLists } from '@/components/dashboard/event-lists';
import { RecentCheckins } from '@/components/dashboard/recent-checkins';
import { ProtectedRoute } from '@/hooks/use-auth';


// This component has been refactored to a Server Component.
// Data is now fetched on the server, which is more secure and performant.
export default async function DashboardPage() {
  const events = await getEvents();
  const attendees = await getAttendees();

  return (
    <ProtectedRoute>
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
    </ProtectedRoute>
  );
}
