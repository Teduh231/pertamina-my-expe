// Redirect to the new default overview page
import { redirect } from 'next/navigation';

export default function EventDashboardRootPage({ params }: { params: { id: string } }) {
    redirect(`/event-dashboard/${params.id}/overview`);
}
