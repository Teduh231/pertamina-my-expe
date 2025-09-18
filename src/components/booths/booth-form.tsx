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
import { Booth } from '@/app/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import React from 'react';
import { createOrUpdateBooth } from '@/app/lib/actions';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Booth name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  location: z.string().min(3, { message: 'Location is required.' }),
  booth_manager: z.string().min(2, { message: 'Booth manager name is required.' }),
  status: z.enum(['draft', 'published', 'canceled']),
  image_url: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
});

type BoothFormProps = {
  booth?: Booth;
  onFinished?: () => void;
};

export function BoothForm({ booth, onFinished }: BoothFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: booth?.name || '',
      description: booth?.description || '',
      location: booth?.location || '',
      booth_manager: booth?.booth_manager || '',
      status: booth?.status || 'draft',
      image_url: booth?.image_url || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const result = await createOrUpdateBooth(values, booth?.id);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: `Booth ${booth ? 'updated' : 'created'} successfully!`,
        description: `"${values.name}" is now saved.`,
      });
      router.refresh();
      if (onFinished) {
        onFinished();
      }
    } else {
      toast({
        title: `Error ${booth ? 'updating' : 'creating'} booth`,
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
                      <FormLabel>Booth Name</FormLabel>
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
                          placeholder="Tell us more about this booth..."
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
                            Provide a URL for the booth's banner image.
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
                  name="booth_manager"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booth Manager / PIC</FormLabel>
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
                            <SelectValue placeholder="Select booth status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        'Draft' booths are hidden. 'Published' are visible to the public.
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
                {booth ? 'Save Changes' : 'Create Booth'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
