// This page is no longer needed as creation is handled by a modal on the events list page.
// We are keeping it in case direct navigation is still desired in the future,
// but for now we redirect to the main events page.
import { redirect } from 'next/navigation';

export default function NewEventPage() {
    redirect('/events');
}
