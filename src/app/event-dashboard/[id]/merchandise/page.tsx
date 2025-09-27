// This page is now merged with the POS page.
// We redirect to the POS page.
import { redirect } from 'next/navigation';

export default function EventDashboardMerchandisePage({ params }: { params: { id: string } }) {
  redirect(`/event-dashboard/${params.id}/pos`);
}
