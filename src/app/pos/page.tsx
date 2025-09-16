import { AppLayout } from '@/components/app-layout';
import { ProtectedRoute } from '@/hooks/use-auth';
import { PosContent } from './_components/pos-content';

export default async function PosPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <PosContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
