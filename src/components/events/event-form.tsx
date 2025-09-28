
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
import { Loader2, UserPlus } from 'lucide-react';
import React, { useState } from 'react';
import { createOrUpdateEvent, uploadImage } from '@/app/lib/actions';
import { Separator } from '../ui/separator';
import { ImageUpload } from '../ui/image-upload';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Event name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  location: z.string().min(3, { message: 'Location is required.' }),
  event_manager: z.string().min(2, { message: 'Event manager name is required.' }),
  status: z.enum(['draft', 'published', 'canceled', 'pending', 'completed']),
  image_url: z.string().optional(),
  image_path: z.string().optional(),
  attendee_limit: z.coerce.number().min(0, 'Attendee limit must be a positive number.'),
  check_in_points: z.coerce.number().min(0, 'Check-in points must be a positive number.'),
});

type EventFormProps = {
  event?: Event;
  onFinished?: () => void;
  context?: 'admin' | 'tenant';
};

export function EventForm({ event, onFinished, context = 'admin' }: EventFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const defaultStatus = event?.status || 'draft';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: event?.name || '',
      description: event?.description || '',
      location: event?.location || '',
      event_manager: event?.event_manager || '',
      status: defaultStatus,
      image_url: event?.image_url || '',
      image_path: event?.image_path || '',
      attendee_limit: event?.attendee_limit || 0,
      check_in_points: event?.check_in_points || 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    let imageUrl = values.image_url;
    let imagePath = values.image_path;

    if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadResult = await uploadImage(formData);
        if (!uploadResult.success) {
            toast({ variant: 'destructive', title: 'Image Upload Failed', description: uploadResult.error });
            setIsSubmitting(false);
            return;
        }
        imageUrl = uploadResult.url;
        imagePath = uploadResult.path;
    }

    const dataToSubmit = {
      ...values,
      image_url: imageUrl,
      image_path: imagePath,
    };
    
    const result = await createOrUpdateEvent(dataToSubmit, event?.id);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: `Event ${event ? 'updated' : 'created'}!`,
        description: `"${values.name}" is now ${event ? 'saved' : 'created'}.`,
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
                        <Input placeholder="e.g., Tech Startup Showcase" {...field} />
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
                        <FormLabel>Event Banner URL</FormLabel>
                        <FormControl>
                            <Input placeholder="https://example.com/banner.jpg" {...field} />
                        </FormControl>
                        <FormDescription>
                            Provide a direct link to the banner image.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="space-y-8">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Hall A, Section 3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="event_manager"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Manager / PIC</FormLabel>
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
                        'Draft' events are hidden. 'Published' are visible.
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
