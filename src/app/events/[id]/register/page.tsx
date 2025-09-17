import { getEventById } from '@/app/lib/data';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AttendeeRegistrationForm } from '@/components/events/attendee-registration-form';
import { Calendar, MapPin, User, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

export default async function EventRegistrationPage({
  params,
}: {
  params: { id: string };
}) {
  const event = await getEventById(params.id);

  if (!event || event.status !== 'published') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
        <header className="relative h-64 md:h-96 w-full">
            {event.image_url ? (
                <Image 
                    src={event.image_url} 
                    alt={event.name} 
                    layout="fill" 
                    objectFit="cover" 
                    className="brightness-50"
                />
            ) : (
                <div className="absolute inset-0 bg-primary/20"></div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="container mx-auto max-w-6xl text-center px-4">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-primary-foreground">
                        {event.name}
                    </h1>
                </div>
            </div>
        </header>

      <main className="container mx-auto max-w-6xl py-8 px-4 -mt-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-12">
          <div className="lg:col-span-2 space-y-6 bg-card p-6 rounded-lg shadow-xl">
            <div className="prose prose-invert max-w-none text-foreground prose-h2:text-foreground prose-h3:text-foreground prose-strong:text-foreground">
              <h2 className="text-2xl font-bold border-b pb-2">About The Event</h2>
              <p className="text-muted-foreground">{event.description}</p>
            </div>
            <Separator />
            <div className="space-y-4">
               <h3 className="text-xl font-bold">Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span>{format(parseISO(event.date), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-primary" />
                        <span>Speaker: {event.speaker}</span>
                    </div>
                </div>
            </div>
          </div>

          <div className="lg:col-span-1 mt-8 lg:mt-0">
            <Card className="shadow-lg lg:shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Register for this Event</CardTitle>
                <CardDescription className="text-center">
                  Seats are limited. Secure your spot now!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AttendeeRegistrationForm event={event} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <footer className="py-6 mt-8 border-t">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
            <p>EventFlow &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
