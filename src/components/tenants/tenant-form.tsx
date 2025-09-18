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
import { Booth, Tenant } from '@/app/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import React, { useRef } from 'react';
import { createOrUpdateTenant } from '@/app/lib/actions';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, 'Password must be at least 6 characters.').optional().or(z.literal('')),
  booth_id: z.string().nullable(),
});

type TenantFormProps = {
  tenant?: Tenant;
  booths: Booth[];
  onFinished?: () => void;
};

export function TenantForm({ tenant, booths, onFinished }: TenantFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: tenant?.name || '',
      email: tenant?.email || '',
      password: '',
      booth_id: tenant?.booth_id || null,
    },
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Manually set password as optional if it's an existing tenant
    if (tenant) {
        form.setValue('password', form.getValues('password') || '');
    }

    const validation = await form.trigger();
    if (!validation) return;

    setIsSubmitting(true);

    if (formRef.current) {
        const formData = new FormData(formRef.current);
        if (tenant) {
            formData.append('tenantId', tenant.id);
        }

        const result = await createOrUpdateTenant(formData);

        if (result.success) {
            toast({
                title: `User ${tenant ? 'updated' : 'created'} successfully!`,
            });
            if (onFinished) onFinished();
        } else {
            toast({
                variant: 'destructive',
                title: `Error ${tenant ? 'updating' : 'creating'} user`,
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
              <FormLabel>User Name</FormLabel>
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
                <Input type="email" placeholder="booth.user@example.com" {...field} disabled={!!tenant} />
              </FormControl>
               <FormDescription>
                This will be their login email. Cannot be changed after creation.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {!tenant && (
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
          name="booth_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign to Booth</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === 'unassigned' ? null : value)}
                defaultValue={field.value || 'unassigned'}
                name={field.name}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a booth (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="unassigned">-- Not Assigned --</SelectItem>
                  {booths.filter(b => b.status === 'published').map(booth => (
                    <SelectItem key={booth.id} value={booth.id}>{booth.name}</SelectItem>
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
            {tenant ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
