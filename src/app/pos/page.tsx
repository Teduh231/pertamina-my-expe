import { AppLayout } from '@/components/app-layout';
import { PosContent } from './_components/pos-content';

export default async function PosPage() {
  return (
    <AppLayout>
      <PosContent />
    </AppLayout>
  );
}
