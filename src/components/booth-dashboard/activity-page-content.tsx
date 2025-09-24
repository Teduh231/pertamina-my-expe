'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Activity } from '@/app/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, PlusCircle, Flame, Users, Edit, Eye } from 'lucide-react';
import { createActivity } from '@/app/lib/actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import Link from 'next/link';

const activitySchema = z.object({
  name: z.string().min(3, { message: 'Activity name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  points_reward: z.coerce.number().min(0, { message: 'Points must be a positive number.' }),
});

type ActivityPageContentProps = {
  boothId: string;
  activities: Activity[];
};

export function ActivityPageContent({ boothId, activities }: ActivityPageContentProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof activitySchema>>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      name: '',
      description: '',
      points_reward: 10,
    },
  });

  async function onSubmit(values: z.infer<typeof activitySchema>) {
    setIsSubmitting(true);
    
    const result = await createActivity({ 
        ...values, 
        booth_id: boothId,
    });
    
    if (result.success) {
      toast({
        title: 'Activity Added!',
        description: `"${values.name}" has been added to your booth.`,
      });
      form.reset();
      router.refresh();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Adding Activity',
        description: result.error || 'An unexpected error occurred.',
      });
    }
    
    setIsSubmitting(false);
  }

  const icons = [<Flame key="flame" className="h-6 w-6" />, <Users key="users" className="h-6 w-6" />];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <h3 className="text-lg font-semibold mb-4 flex items-center"><PlusCircle className="mr-2 h-5 w-5" />Add New Activity</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Scavenger Hunt" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the activity..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="points_reward"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points Reward</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Activity
            </Button>
          </form>
        </Form>
      </div>
      <div className="lg:col-span-2">
         <h3 className="text-lg font-semibold mb-4 flex items-center"><Flame className="mr-2 h-5 w-5" />Current Activities</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activities.length > 0 ? (
                activities.map((activity, index) => (
                    <Card key={activity.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary">
                                    {icons[index % icons.length]}
                                </div>
                                <Badge variant="outline" className="border-green-500 bg-green-500/10 text-green-700">Active</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2">
                            <CardTitle className="text-lg">{activity.name}</CardTitle>
                            <CardDescription>{activity.description}</CardDescription>
                            <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted p-3 rounded-md mt-4">
                                <span>{activity.participant_count} participants</span>
                                <span className="font-bold text-primary">{activity.points_reward} points</span>
                            </div>
                        </CardContent>
                        <CardFooter className="flex items-center gap-2">
                            <Button asChild className="flex-1">
                                <Link href={`/booth-dashboard/${boothId}/activity/${activity.id}`}>
                                    <Eye className="mr-2 h-4 w-4" /> View
                                </Link>
                            </Button>
                            <Button variant="outline" size="icon">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))
            ) : (
                <div className="md:col-span-2 text-center text-muted-foreground py-24 border-2 border-dashed rounded-lg">
                    <p>No activities added yet.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
