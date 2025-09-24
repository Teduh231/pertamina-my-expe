// Redirect to the new default overview page
import { redirect } from 'next/navigation';

export default function BoothDashboardRootPage({ params }: { params: { id: string } }) {
    redirect(`/booth-dashboard/${params.id}/overview`);
}
