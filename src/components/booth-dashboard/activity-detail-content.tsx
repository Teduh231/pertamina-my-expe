'use client';

import React from 'react';
import { Activity, ActivityParticipant } from '@/app/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, MoreVertical, Trash2, Users, Award, BarChart, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface ActivityDetailContentProps {
  activity: Activity;
  participants: ActivityParticipant[];
  boothId: string;
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export function ActivityDetailContent({ activity, participants, boothId }: ActivityDetailContentProps) {
  const router = useRouter();

  const totalParticipants = participants.length;
  const totalPointsAwarded = participants.reduce((sum, p) => sum + p.points_awarded, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push(`/booth-dashboard/${boothId}/activity`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{activity.name}</h2>
            <p className="text-muted-foreground">{activity.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Activity
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Participants" value={totalParticipants} icon={Users} />
        <StatCard title="Total Points Awarded" value={totalPointsAwarded.toLocaleString()} icon={Award} />
        <StatCard title="Points per Participant" value={activity.points_reward} icon={BarChart} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Participants</CardTitle>
          <CardDescription>A list of the most recent attendees who completed this activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {participants.length > 0 ? (
              participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{p.attendees.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{p.attendees.name}</p>
                      <p className="text-sm text-muted-foreground">{p.attendees.email}</p>
                      <p className="text-xs text-muted-foreground">Completed on {format(new Date(p.completed_at), 'PPP p')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="font-bold text-primary">+{p.points_awarded} pts</p>
                     <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <p>No one has participated in this activity yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
