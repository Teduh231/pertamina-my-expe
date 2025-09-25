// This page is now merged with the POS page.
// We redirect to the POS page.
import { redirect } from 'next/navigation';

export default function BoothDashboardMerchandisePage({ params }: { params: { id: string } }) {
  redirect(`/booth-dashboard/${params.id}/pos`);
}
