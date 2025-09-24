'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Booth, Product, Activity, CheckIn, Attendee } from '@/app/lib/definitions';
import { Users, Flame, Award, BarChart, MapPin, User, QrCode, Download, PieChartIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

type HydratedCheckIn = CheckIn & { attendees: Attendee | null };

type OverviewContentProps = {
    booth: Booth & { check_ins: HydratedCheckIn[] };
    products: Product[];
    activities: Activity[];
}

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
                    icon={BarChart}
                />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Booth Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                 <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <ActionButton href={`/booth-dashboard/${booth.id}/scanner`} icon={QrCode} variant="secondary">
                                Open QR Scanner
                            </ActionButton>
                             <ActionButton href="#" icon={Download}>
                                Export Attendee List
                            </ActionButton>
                             <ActionButton href="#" icon={PieChartIcon}>
                                View Analytics
                            </ActionButton>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
