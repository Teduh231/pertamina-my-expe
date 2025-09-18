// This page is no longer needed as creation is handled by a modal on the booths list page.
// We are keeping it in case direct navigation is still desired in the future,
// but for now we redirect to the main booths page.
import { redirect } from 'next/navigation';

export default function NewBoothPage() {
    redirect('/booths');
}
