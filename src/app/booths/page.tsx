import { getBooths } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { BoothList } from '@/components/booths/booth-list';
import { ProtectedRoute } from '@/hooks/use-auth';

export default async function BoothsPage() {
  const booths = await getBooths();
  return (
    <ProtectedRoute>
      <AppLayout>
        <BoothList booths={booths} />
      </AppLayout>
    </ProtectedRoute>
  );
}
