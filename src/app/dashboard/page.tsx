'use client';

import { getBooths } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { AnalyticsDashboard } from '@/components/dashboard/analytics-dashboard';
import { UpcomingEvents } from '@/components/dashboard/upcoming-events';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Booth } from '@/app/lib/definitions';

// This component handles the logic for fetching data and rendering based on role.
export default function DashboardPage() {
  const { isAdmin, assignedBoothId, loading: authLoading } = useAuth();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin && assignedBoothId) {
        redirect(`/booth-dashboard/${assignedBoothId}`);
      } else if (isAdmin) {
        // Fetch data only if the user is an admin
        getBooths().then((data) => {
          setBooths(data);
          setLoading(false);
        });
      } else {
        // Non-admin without assigned booth, or some other edge case
        setLoading(false);
      }
    }
  }, [isAdmin, assignedBoothId, authLoading]);

  if (authLoading || (isAdmin && loading)) {
    return (
      <div className="flex h-[calc(100vh-theme(space.16))] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If not admin and no booth assigned, they might see a waiting page or be redirected.
  // For now, we show a minimal layout if they somehow land here.
  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="text-center">
            <h1 className="text-2xl font-bold">Welcome</h1>
            <p className="text-muted-foreground">You do not have administrative access.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 flex flex-col gap-6">
          <AnalyticsDashboard booths={booths} />
        </div>
        <div className="lg:col-span-2">
          <UpcomingEvents booths={booths} />
        </div>
      </div>
    </AppLayout>
  );
}
