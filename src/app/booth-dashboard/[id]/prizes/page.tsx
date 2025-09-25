// This page is now merged with the Raffle page.
// We redirect to the Raffle page.
import { redirect } from 'next/navigation';

export default function BoothDashboardPrizeHistoryPage({ params }: { params: { id: string } }) {
  redirect(`/booth-dashboard/${params.id}/raffle`);
}
