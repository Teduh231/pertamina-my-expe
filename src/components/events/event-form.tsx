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
import { Textarea } from '@/components/ui/textarea';
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
import { CalendarIcon, Loader2 } from 'lucide-react';
import React from 'react';
import { createOrUpdateEvent } from '@/app/lib/actions';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Event name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  date: z.date({ required_error: 'A date is required.'}),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Invalid time format (HH:MM).' }),
  location: z.string().min(3, { message: 'Location is required.' }),
  speaker: z.string().min(2, { message: 'Speaker name is required.' }),
  status: z.enum(['draft', 'published', 'canceled']),
  image_url: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
});

type EventFormProps = {
  event?: Event;
  onFinished?: () => void;
};

export function EventForm({ event, onFinished }: EventFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: event?.name || '',
      description: event?.description || '',
      date: event?.date ? parseISO(event.date) : undefined,
      time: event?.time || '',
      location: event?.location || '',
      speaker: event?.speaker || '',
      status: event?.status || 'draft',
      image_url: event?.image_url || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const dataToSubmit = {
      ...values,
      date: format(values.date, 'yyyy-MM-dd'),
    };

    const result = await createOrUpdateEvent(dataToSubmit, event?.id);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: `Event ${event ? 'updated' : 'created'} successfully!`,
        description: `"${values.name}" is now saved.`,
      });
      router.refresh();
      if (onFinished) {
        onFinished();
      }
    } else {
      toast({
        title: `Error ${event ? 'updating' : 'creating'} event`,
        description: result.error || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8 flex flex-col">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Tech Conference 2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="flex flex-col flex-1">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us more about this event..."
                          className="resize-none flex-1 min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                            <Input type="url" placeholder="https://example.com/image.png" {...field} />
                        </FormControl>
                        <FormDescription>
                            Provide a URL for the event's banner image.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="space-y-8">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date < new Date(new Date().setHours(0,0,0,0))
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Convention Center, New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="speaker"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Speaker / Host</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                 <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        'Draft' events are hidden. 'Published' are visible to the public.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

            </div>
        </div>
        
        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onFinished}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {event ? 'Save Changes' : 'Create Event'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
