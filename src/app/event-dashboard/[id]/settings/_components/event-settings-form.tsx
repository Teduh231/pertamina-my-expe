
'use client';

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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Event } from '@/app/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { createOrUpdateEvent } from '@/app/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const settingsSchema = z.object({
  status: z.enum(['draft', 'published', 'canceled', 'pending', 'completed']),
  attendee_limit: z.coerce.number().min(0, 'Attendee limit must be a positive number.'),
  check_in_points: z.coerce.number().min(0, 'Check-in points must be a positive number.'),
});

type EventSettingsFormProps = {
  event: Event;
};

export function EventSettingsForm({ event }: EventSettingsFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      status: event.status,
      attendee_limit: event.attendee_limit || 0,
      check_in_points: event.check_in_points || 0,
    },
  });

  async function onSubmit(values: z.infer<typeof settingsSchema>) {
    setIsSubmitting(true);
    
    const result = await createOrUpdateEvent(values, event.id);
    
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Settings Updated!',
        description: `Settings for "${event.name}" have been saved.`,
      });
      router.refresh();
    } else {
      toast({
        title: 'Error Updating Settings',
        description: result.error || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Settings</CardTitle>
        <CardDescription>Manage settings and configurations for your event.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Upcoming (Draft)</SelectItem>
                      <SelectItem value="published">On Air (Published)</SelectItem>
                      <SelectItem value="completed">Done (Completed)</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Control the visibility and state of your event.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="attendee_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attendee Limit</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormDescription>
                    Maximum number of attendees allowed. Set to 0 for unlimited.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="check_in_points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Check-in Points Reward</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormDescription>
                    Points awarded to an attendee upon checking into this event.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
