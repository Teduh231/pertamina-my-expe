// This page is now merged with the Raffle page.
// We redirect to the Raffle page.
import { redirect } from 'next/navigation';

export default function EventDashboardPrizeHistoryPage({ params }: { params: { id: string } }) {
  redirect(`/event-dashboard/${params.id}/raffle`);
}
