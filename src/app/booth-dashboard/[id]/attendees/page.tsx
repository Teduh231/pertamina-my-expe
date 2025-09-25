import { getBoothById } from '@/app/lib/data';
import { ProtectedRoute } from '@/hooks/use-auth';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { AttendeesContent } from '@/components/booth-dashboard/attendees-content';

export default async function BoothAttendeesPage({ params }: { params: { id: string } }) {
  const boothId = params.id;
  const booth = await getBoothById(boothId);

  if (!booth) {
    notFound();
  }

  const checkedInAttendees = booth.check_ins?.map(checkIn => ({
    ...checkIn.attendees,
    checked_in_at: checkIn.checked_in_at
  })).filter(Boolean) || [];

  return (
    <ProtectedRoute>
      <AppLayout>
        <AttendeesContent 
          attendees={checkedInAttendees as any[]} 
          boothName={booth.name} 
          boothId={booth.id} 
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
