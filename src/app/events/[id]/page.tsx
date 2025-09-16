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
import { ProtectedRoute } from '@/hooks/use-auth';

function AttendeeTable({ event }: { event: Event }) {
    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <CardTitle>Attendees ({event.attendees.length})</CardTitle>
                    <CardDescription>
                        List of registered attendees for "{event.name}".
                    </CardDescription>
                </div>
                <AttendeeExportButton eventId={event.id} eventName={event.name} disabled={event.attendees.length === 0} />
            </CardHeader>
            <CardContent>
                <div className="hidden md:block">
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
                </div>
                 <div className="block md:hidden">
                    <div className="space-y-4">
                        {event.attendees.length > 0 ? (
                            event.attendees.map((attendee: Attendee) => (
                                <div key={attendee.id} className="border rounded-lg p-4 text-sm">
                                    <p className="font-medium">{attendee.name}</p>
                                    <p className="text-muted-foreground">{attendee.email}</p>
                                    <p className="text-muted-foreground text-xs mt-2">Registered: {format(parseISO(attendee.registeredAt), 'PPP')}</p>
                                    {attendee.customResponse && <p className="text-muted-foreground text-xs mt-1">Response: {attendee.customResponse}</p>}
                                </div>
                            ))
                        ) : (
                             <div className="text-center text-muted-foreground py-12">
                                <p>No attendees yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default async function ManageEventPage({ params }: { params: { id: string } }) {
  if (params.id === 'new') {
    notFound();
  }
  
  const event = await getEventById(params.id);

  if (!event) {
    notFound();
  }

  return (
    <ProtectedRoute>
        <AppLayout>
            <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto md:mx-0 md:max-w-md">
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
    </ProtectedRoute>
  );
}
