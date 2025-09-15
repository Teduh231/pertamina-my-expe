import { getEventById } from '@/app/lib/data';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EventForm } from '@/components/events/event-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Attendee, Event } from '@/app/lib/definitions';
import { format, parseISO } from 'date-fns';
import { AttendeeExportButton } from './_components/attendee-export-button';

function AttendeeTable({ event }: { event: Event }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Attendees ({event.attendees.length})</CardTitle>
                    <CardDescription>
                        List of registered attendees for "{event.name}".
                    </CardDescription>
                </div>
                <AttendeeExportButton eventId={event.id} eventName={event.name} disabled={event.attendees.length === 0} />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Registered On</TableHead>
                            <TableHead>Custom Response</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {event.attendees.length > 0 ? (
                            event.attendees.map((attendee: Attendee) => (
                                <TableRow key={attendee.id}>
                                    <TableCell className="font-medium">{attendee.name}</TableCell>
                                    <TableCell>{attendee.email}</TableCell>
                                    <TableCell>{format(parseISO(attendee.registeredAt), 'PPP')}</TableCell>
                                    <TableCell>{attendee.customResponse || 'N/A'}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No attendees yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default async function ManageEventPage({ params }: { params: { id: string } }) {
  const event = await getEventById(params.id);

  if (!event) {
    notFound();
  }

  return (
    <AppLayout>
        <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="details">Event Details</TabsTrigger>
                <TabsTrigger value="attendees">Attendees</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Event</CardTitle>
                        <CardDescription>
                            Edit the details for your event below. Changes will be saved upon submission.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <EventForm event={event} />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="attendees" className="mt-6">
               <AttendeeTable event={event} />
            </TabsContent>
        </Tabs>
    </AppLayout>
  );
}
