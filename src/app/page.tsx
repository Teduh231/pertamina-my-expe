import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, BarChart, Calendar, ShieldCheck, Download, LogIn } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: <Calendar className="h-10 w-10 text-primary" />,
    title: 'Effortless Event Management',
    description:
      'Create, edit, and publish events in minutes. Our intuitive interface makes managing your events a breeze, from draft to completion.',
  },
  {
    icon: <BarChart className="h-10 w-10 text-primary" />,
    title: 'Insightful Analytics',
    description:
      'Gain valuable insights with a comprehensive dashboard. Track registrations, monitor attendee engagement, and make data-driven decisions.',
  },
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: 'Smart PII Detection',
    description:
      'Our AI-powered assistant automatically detects potential Personally Identifiable Information in attendee submissions to help you stay compliant.',
  },
  {
    icon: <Download className="h-10 w-10 text-primary" />,
    title: 'Attendee Export',
    description:
      'Easily export your attendee lists to a CSV file. Perfect for check-ins, marketing campaigns, and post-event follow-ups.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <Calendar className="h-7 w-7 text-primary" />
           <h1 className="text-2xl font-bold">EventFlow</h1>
        </div>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Login
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="relative py-20 md:py-32 text-center overflow-hidden">
          <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
              <div
                  className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iaHNsYSgxMjAsIDMwJSwgODAlLCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48cGF0aCBkPSJNIDAgMCBMIDQwIDAgNDAgNDAgMCA0MCAwIDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iaHNsYSgxMjAsIDMwJSwgODAlLCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30">
              </div>
          </div>
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
              The Future of Event Management is Here
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
              Streamline your workflow, engage your audience, and host unforgettable events with our AI-powered platform.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/dashboard">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Powerful Features, Simple Interface</h2>
              <p className="mt-3 max-w-xl mx-auto text-muted-foreground">
                Everything you need to manage your events from start to finish.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="items-center">
                    {feature.icon}
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} EventFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
