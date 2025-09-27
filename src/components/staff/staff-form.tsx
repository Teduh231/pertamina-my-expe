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
import { Event, Staff } from '@/app/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import React, { useRef } from 'react';
import { createOrUpdateStaff } from '@/app/lib/actions';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, 'Password must be at least 6 characters.').optional().or(z.literal('')),
  event_id: z.string().nullable(),
});

type StaffFormProps = {
  staff?: Staff;
  events: Event[];
  onFinished?: () => void;
};

export function StaffForm({ staff, events, onFinished }: StaffFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: staff?.name || '',
      email: staff?.email || '',
      password: '',
      event_id: staff?.event_id || null,
    },
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!staff) { // Password is only required for new staff members
        const passwordValidation = await form.trigger('password');
        if (!passwordValidation) return;
    }

    const validation = await form.trigger(['name', 'email', 'event_id']);
    if (!validation) return;

    setIsSubmitting(true);

    if (formRef.current) {
        const formData = new FormData(formRef.current);
        if (staff) {
            formData.append('staffId', staff.id);
        }

        const result = await createOrUpdateStaff(formData);

        if (result.success) {
            toast({
                title: `Staff ${staff ? 'updated' : 'created'} successfully!`,
            });
            router.refresh();
            if (onFinished) onFinished();
        } else {
            toast({
                variant: 'destructive',
                title: `Error ${staff ? 'updating' : 'creating'} staff`,
                description: result.error || 'An unexpected error occurred.',
            });
        }
    }
    
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Staff Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="staff.member@example.com" {...field} disabled={!!staff} />
              </FormControl>
               <FormDescription>
                This will be their login email. Cannot be changed after creation.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {!staff && (
             <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        )}
        <FormField
          control={form.control}
          name="event_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign to Event</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === 'unassigned' ? null : value)}
                defaultValue={field.value || 'unassigned'}
                name={field.name}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="unassigned">-- Not Assigned --</SelectItem>
                  {events.filter(e => e.status === 'published').map(event => (
                    <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onFinished}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {staff ? 'Save Changes' : 'Create Staff'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
