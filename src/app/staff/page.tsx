import { getEvents, getStaff } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { StaffList } from '@/components/staff/staff-list';
import type { Event, Staff } from '@/app/lib/definitions';
import { useAuth } from '@/hooks/use-auth';

export default async function StaffPage() {
  const staff: Staff[] = await getStaff();
  const events: Event[] = await getEvents();

  // This page should only be accessible by admins.
  // We can add a check here or rely on the UI hiding the link.
  // For robustness, a check is better. The logic is handled in AppLayout now.

  return (
      <AppLayout>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-3">
                <StaffList staff={staff} events={events} />
            </div>
        </div>
      </AppLayout>
  );
}
