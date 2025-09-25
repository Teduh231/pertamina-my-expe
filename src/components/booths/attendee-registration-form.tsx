
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { detectPiiInField, registerAttendee } from '@/app/lib/actions';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const formSchema = z
  .object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    phone_number: z.string().min(10, { message: 'Please enter a valid phone number.' }),
    custom_response: z.string().optional(),
    piiConsent: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // This is a placeholder. Logic is handled in the component state.
      return true;
    },
    {
      message: 'You must consent to providing PII.',
      path: ['piiConsent'],
    }
  );

// The form is now generic and doesn't need booth-specific info.
export function AttendeeRegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPiiWarning, setShowPiiWarning] = useState(false);
  const [isCheckingPii, setIsCheckingPii] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone_number: '',
      custom_response: '',
      piiConsent: false,
    },
  });

  const handlePiiCheck = async (
    fieldName: string,
    fieldValue: string
  ) => {
    if (showPiiWarning) return; // Don't re-check if warning is already shown
    setIsCheckingPii(true);
    try {
      const result = await detectPiiInField(fieldName, fieldValue);
      if (result.mayContainPii) {
        setShowPiiWarning(true);
      }
    } catch (error) {
      console.error(error);
      setShowPiiWarning(true); // Assume PII on error
    } finally {
      setIsCheckingPii(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (showPiiWarning && !values.piiConsent) {
      form.setError('piiConsent', {
        type: 'manual',
        message: 'You must agree to the PII consent to register.',
      });
      return;
    }

    setIsSubmitting(true);
    const { piiConsent, ...attendeeData } = values;
    // The boothId is no longer needed for registration.
    const result = await registerAttendee(attendeeData);
    setIsSubmitting(false);

    if (result.success) {
        toast({
            title: 'Registration Successful!',
            description: `Thank you for registering. A confirmation has been sent to your phone.`,
            variant: 'default',
        });
        form.reset();
        setShowPiiWarning(false);
    } else {
        toast({
            title: 'Registration Failed',
            description: result.error || 'An unexpected error occurred. Please try again.',
            variant: 'destructive',
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="081234567890" {...field} type="tel" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="custom_response"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Special Requests (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Allergen info"
                  {...field}
                  onBlur={(e) => {
                    field.onBlur(); // from react-hook-form
                    handlePiiCheck(e.target.name, e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showPiiWarning && (
           <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>Personal Information Notice</AlertTitle>
           <AlertDescription>
             Your response may contain Personally Identifiable Information (PII). By checking the box below, you consent to us collecting and storing this information to facilitate your experience.
           </AlertDescription>
            <FormField
              control={form.control}
              name="piiConsent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-4 bg-background/50">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I acknowledge and consent to providing this information.
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </Alert>
        )}

        <Button type="submit" disabled={isSubmitting || isCheckingPii} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isCheckingPii && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Registering...' : isCheckingPii ? 'Analyzing...' : 'Register Now'}
        </Button>
      </form>
    </Form>
  );
}
