import { getEventById } from '@/app/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AttendeeRegistrationForm } from '@/components/events/attendee-registration-form';
import { Calendar, MapPin, User, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';

export default async function EventRegistrationPage({
  params,
}: {
  params: { id: string };
}) {
  const event = await getEventById(params.id);

  if (!event || event.status !== 'published') {
    notFound();
  }

  const placeholder = PlaceHolderImages.find(
    (img) => img.id === event.imageId
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="relative h-64 md:h-80 w-full">
        <Image
          src={placeholder?.imageUrl || ''}
          alt={event.name}
          data-ai-hint={placeholder?.imageHint || 'event banner'}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-md">
            {event.name}
          </h1>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-12">
          <div className="lg:col-span-2 space-y-6">
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
            <Card className="shadow-2xl">
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
