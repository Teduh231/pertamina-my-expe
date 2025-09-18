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
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import React, { useRef } from 'react';
import { createOrUpdateTenant } from '@/app/lib/actions';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }).optional().or(z.literal('')),
  booth_id: z.string().nullable(),
});

type TenantFormProps = {
  tenant?: Tenant;
  booths: Booth[];
  onFinished?: () => void;
};

export function TenantForm({ tenant, booths, onFinished }: TenantFormProps) {
  const { toast } = useToast();
  const router = useRouter();
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    // We use FormData to pass data to server action
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('email', values.email);
    if (values.password) {
      formData.append('password', values.password);
    }
    if (values.booth_id) {
        formData.append('booth_id', values.booth_id);
    }
    if (tenant?.id) {
        formData.append('tenantId', tenant.id);
    }

    const result = await createOrUpdateTenant(formData);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: `Tenant ${tenant ? 'updated' : 'created'} successfully!`,
      });
      router.refresh();
      if (onFinished) {
        onFinished();
      }
    } else {
      toast({
        title: `Error ${tenant ? 'updating' : 'creating'} tenant`,
        description: result.error || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tenant Name</FormLabel>
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
                <Input type="email" placeholder="tenant@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder={tenant ? "Leave blank to keep current password" : "••••••••"} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="booth_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign to Booth</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === 'unassigned' ? null : value)}
                defaultValue={field.value || 'unassigned'}
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
            {tenant ? 'Save Changes' : 'Create Tenant'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
