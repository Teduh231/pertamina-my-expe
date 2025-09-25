'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Booth, Product, Activity, CheckIn, Attendee } from '@/app/lib/definitions';
import { Users, Flame, Award, BarChart as BarChartIcon, MapPin, User, QrCode, Download, PieChartIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { format, subDays, parseISO } from 'date-fns';


type HydratedCheckIn = CheckIn & { attendees: Attendee | null };

type OverviewContentProps = {
    booth: Booth & { check_ins: HydratedCheckIn[] };
    products: Product[];
    activities: Activity[];
}

const chartConfig = {
  checkIns: {
    label: 'Check-ins',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

function StatCard({ title, value, subtext, icon: Icon }: { title: string, value: string | number, subtext: string, icon: React.ElementType }) {
    return (
        <Card>
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

function ActionButton({ href, icon: Icon, children, variant }: { href: string; icon: React.ElementType; children: React.ReactNode; variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined; }) {
    return (
        <Button asChild variant={variant || 'outline'} className="justify-start">
            <Link href={href}>
                <Icon className="mr-2 h-4 w-4" />
                {children}
            </Link>
        </Button>
    )
}

export function OverviewContent({ booth, products, activities }: OverviewContentProps) {
    const totalCheckIns = booth.check_ins?.length || 0;
    // This is a placeholder, actual number of unique attendees would need a different query
    const totalAttendeesInEvent = 250; 
    const checkInPercentage = totalAttendeesInEvent > 0 ? ((totalCheckIns / totalAttendeesInEvent) * 100).toFixed(0) : 0;

    const totalActivations = activities.length;
    // Placeholder for completions, would require tracking
    const totalCompletions = 156;

    // Placeholder for points distributed
    const pointsDistributed = 45680;
    const avgPointsPerAttendee = totalCheckIns > 0 ? (pointsDistributed / totalCheckIns).toFixed(0) : 0;
    
    // Placeholder for revenue
    const revenue = 12400000;

    const dailyCheckins = React.useMemo(() => {
        const data: { [key: string]: number } = {};
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = format(subDays(today, i), 'MMM d');
            data[date] = 0;
        }

        booth.check_ins?.forEach(checkIn => {
            const checkInDate = parseISO(checkIn.checked_in_at);
            const diffDays = (today.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24);

            if (diffDays < 7) {
                const dateStr = format(checkInDate, 'MMM d');
                if (data[dateStr] !== undefined) {
                    data[dateStr]++;
                }
            }
        });
        return Object.keys(data).map(date => ({ date, checkIns: data[date] }));
    }, [booth.check_ins]);


    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Total Attendees Checked In"
                    value={totalCheckIns}
                    subtext={`${checkInPercentage}% of total event attendees`}
                    icon={Users}
                />
                 <StatCard 
                    title="Activations"
                    value={totalActivations}
                    subtext={`${totalCompletions} total completions`}
                    icon={Flame}
                />
                 <StatCard 
                    title="Points Distributed"
                    value={pointsDistributed.toLocaleString()}
                    subtext={`Avg ${avgPointsPerAttendee} per attendee`}
                    icon={Award}
                />
                 <StatCard 
                    title="Revenue"
                    value={`Rp ${new Intl.NumberFormat('id-ID').format(revenue / 1000000)}M`}
                    subtext="From merchandise sales"
                    icon={BarChartIcon}
                />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Check-in Activity</CardTitle>
                             <CardDescription>Last 7 days</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                <BarChart accessibilityLayer data={dailyCheckins}>
                                <CartesianGrid vertical={false} />
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
                </div>
                 <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <ActionButton href={`/booth-dashboard/${booth.id}/scanner`} icon={QrCode} variant="secondary">
                                Open QR Scanner
                            </ActionButton>
                             <ActionButton href="/reports" icon={Download}>
                                Export Attendee List
                            </ActionButton>
                             <ActionButton href="/reports" icon={PieChartIcon}>
                                View Full Analytics
                            </ActionButton>
                        </CardContent>
                    </Card>
                </div>
                 <div className="lg:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Booth Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="flex items-center gap-4 text-sm p-3 bg-muted rounded-md">
                                <MapPin className="h-5 w-5 text-primary"/>
                                <span>{booth.location}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm p-3 bg-muted rounded-md">
                                <User className="h-5 w-5 text-primary"/>
                                <span>Manager: {booth.booth_manager}</span>
                            </div>
                             <div className="flex items-center gap-4 text-sm p-3 bg-muted rounded-md">
                                <Users className="h-5 w-5 text-primary"/>
                                <span>{totalCheckIns} attendees checked in</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
