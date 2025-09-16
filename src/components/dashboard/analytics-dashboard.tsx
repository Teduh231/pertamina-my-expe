'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Calendar,
  CheckCircle,
  Users,
  XCircle,
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { Event } from '@/app/lib/definitions';
import { subDays, format, parseISO } from 'date-fns';

type AnalyticsDashboardProps = {
  events: Event[];
};

const chartConfig = {
  registrations: {
    label: 'Registrations',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

function StatCard({ title, value, subtext, icon: Icon }: { title: string, value: string | number, subtext: string, icon: React.ElementType }) {
    return (
        <Card className="bg-secondary/30 hover:border-primary/50 transition-all border-2 border-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">
              {subtext}
            </p>
          </CardContent>
        </Card>
    )
}

export function AnalyticsDashboard({ events }: AnalyticsDashboardProps) {
  const totalAttendees = events.reduce(
    (acc, event) => acc + (event.attendees?.length || 0),
    0
  );
  const publishedEvents = events.filter(
    (event) => event.status === 'published'
  ).length;
  const upcomingEvents = events.filter(
    (event) => new Date(event.date) >= new Date()
  ).length;

  const registrationData = React.useMemo(() => {
    const data: { [key: string]: number } = {};
    const today = new Date();
    for (let i = 14; i >= 0; i--) {
      const date = format(subDays(today, i), 'MMM d');
      data[date] = 0;
    }

    events.forEach((event) => {
      (event.attendees || []).forEach((attendee) => {
        if (attendee.registered_at) {
            const registrationDate = parseISO(attendee.registered_at);
            const diff = today.getTime() - registrationDate.getTime();
            if (diff / (1000 * 3600 * 24) < 15) {
              const dateStr = format(registrationDate, 'MMM d');
              if (data[dateStr] !== undefined) {
                data[dateStr]++;
              }
            }
        }
      });
    });

    return Object.keys(data).map((date) => ({ date, registrations: data[date] }));
  }, [events]);

  return (
    <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Events" value={events.length} subtext={`${publishedEvents} published events`} icon={Calendar} />
            <StatCard title="Total Attendees" value={totalAttendees} subtext="Across all events" icon={Users} />
            <StatCard title="Upcoming Events" value={upcomingEvents} subtext="Ready to host" icon={CheckCircle} />
            <StatCard title="Canceled Events" value={events.filter((e) => e.status === 'canceled').length} subtext="This year" icon={XCircle} />
        </div>

        <Card className="lg:col-span-3 bg-secondary/30">
            <CardHeader>
            <CardTitle>Registration Trends</CardTitle>
            </CardHeader>
            <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart accessibilityLayer data={registrationData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                    allowDecimals={false}
                    tickFormatter={(value) => value.toString()}
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar
                    dataKey="registrations"
                    fill="var(--color-registrations)"
                    radius={4}
                />
                </BarChart>
            </ChartContainer>
            </CardContent>
        </Card>
    </>
  );
}
