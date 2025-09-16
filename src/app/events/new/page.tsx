import { AppLayout } from '@/components/app-layout';
import { EventForm } from '@/components/events/event-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewEventPage() {
    return (
        <AppLayout>
            <Card>
                <CardHeader>
                    <CardTitle>Create New Event</CardTitle>
                    <CardDescription>
                        Fill out the form below to create a new event.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <EventForm />
                </CardContent>
            </Card>
        </AppLayout>
    );
}
