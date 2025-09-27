'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Users,
  BarChart as BarChartIcon,
  Award,
  CalendarCheck2,
  Clock,
  Activity,
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
import { Event, Attendee } from '@/app/lib/definitions';

type AnalyticsDashboardProps = {
  events: (Event & { attendees_count?: number })[];
  attendees: Attendee[];
};

const chartConfig = {
  checkIns: {
    label: 'Check-ins',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

const hourlyCheckinData = [
  { hour: '8 AM', checkIns: 65 },
  { hour: '9 AM', checkIns: 120 },
  { hour: '10 AM', checkIns: 90 },
  { hour: '11 AM', checkIns: 75 },
  { hour: '12 PM', checkIns: 50 },
  { hour: '1 PM', checkIns: 80 },
  { hour: '2 PM', checkIns: 35 },
  { hour: '3 PM', checkIns: 25 },
  { hour: '4 PM', checkIns: 18 },
];

function StatCard({ title, value, subtext, icon: Icon }: { title: string, value: string | number, subtext: string, icon: React.ElementType }) {
    return (
        <Card className="bg-card hover:border-primary/50 transition-all border-2 border-transparent">
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

export function AnalyticsDashboard({ events, attendees }: AnalyticsDashboardProps) {
  const totalCheckIns = events.reduce((sum, event) => sum + (event.attendees_count || 0), 0);
  const publishedEvents = events.filter((event) => event.status === 'published').length;
  const totalPoints = attendees.reduce((sum, attendee) => sum + attendee.points, 0);
  const attendanceRate = totalCheckIns > 0 ? 87 : 0; // Placeholder value

  return (
    <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Check-ins" value={totalCheckIns.toLocaleString()} subtext="+20.1% from last month" icon={Clock} />
            <StatCard title="Active Events" value={publishedEvents} subtext="Currently running" icon={Activity} />
            <StatCard title="Points Distributed" value={totalPoints.toLocaleString()} subtext="Across all events" icon={Award} />
            <StatCard title="Attendance Rate" value={`${attendanceRate}%`} subtext="Average across all events" icon={BarChartIcon} />
        </div>

        <Card className="lg:col-span-3 bg-card">
            <CardHeader>
              <CardTitle>Real-Time Check-in Activity</CardTitle>
              <CardDescription>Check-in activity throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart accessibilityLayer data={hourlyCheckinData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                <XAxis
                    dataKey="hour"
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
                    dataKey="checkIns"
                    fill="var(--color-checkIns)"
                    radius={4}
                />
                </BarChart>
            </ChartContainer>
            </CardContent>
        </Card>
    </>
  );
}
