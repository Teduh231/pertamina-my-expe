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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Activity } from '@/app/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, PlusCircle, Flame, ChevronRight } from 'lucide-react';
import { createActivity } from '@/app/lib/actions';
import { format } from 'date-fns';
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
         <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">
                        <Link href={`/booth-dashboard/${boothId}/activity/${activity.id}`} className="hover:underline">
                          <p className="font-bold">{activity.name}</p>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                        </Link>
                      </TableCell>
                      <TableCell>{activity.points_reward}</TableCell>
                      <TableCell>{format(new Date(activity.created_at), 'PPP')}</TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="icon">
                            <Link href={`/booth-dashboard/${boothId}/activity/${activity.id}`}>
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No activities added yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
         </div>
      </div>
    </div>
  );
}
