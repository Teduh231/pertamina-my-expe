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
import { Loader2, UserPlus } from 'lucide-react';
import React, { useState } from 'react';
import { createOrUpdateBooth, uploadImage } from '@/app/lib/actions';
import { Separator } from '../ui/separator';
import { ImageUpload } from '../ui/image-upload';
import { useAuth } from '@/hooks/use-auth';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Booth name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  location: z.string().min(3, { message: 'Location is required.' }),
  booth_manager: z.string().min(2, { message: 'Booth manager name is required.' }),
  status: z.enum(['draft', 'published', 'canceled', 'pending']),
  image_url: z.string().optional(),
  image_path: z.string().optional(),
  booth_user_email: z.string().email({ message: "Please enter a valid email." }).optional().or(z.literal('')),
  booth_user_password: z.string().min(6, { message: 'Password must be at least 6 characters.' }).optional().or(z.literal('')),
}).refine(data => {
    if (data.booth_user_email || data.booth_user_password) {
        return !!data.booth_user_email && !!data.booth_user_password;
    }
    return true;
}, {
    message: "Both email and password are required to create a booth user.",
    path: ["booth_user_email"],
});

type BoothFormProps = {
  booth?: Booth;
  onFinished?: () => void;
  context?: 'admin' | 'tenant';
};

export function BoothForm({ booth, onFinished, context = 'admin' }: BoothFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const defaultStatus = context === 'tenant' ? 'pending' : (booth?.status || 'draft');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: booth?.name || '',
      description: booth?.description || '',
      location: booth?.location || '',
      booth_manager: booth?.booth_manager || user?.user_metadata?.name || '',
      status: defaultStatus,
      image_url: booth?.image_url || '',
      image_path: booth?.image_path || '',
      booth_user_email: '',
      booth_user_password: ''
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
    
    const result = await createOrUpdateBooth(dataToSubmit, booth?.id);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: `Booth ${booth ? 'updated' : 'request submitted'}!`,
        description: `"${values.name}" is now ${booth ? 'saved' : 'pending approval'}.`,
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
                        <FormLabel>Booth Banner</FormLabel>
                        <FormControl>
                            <ImageUpload
                                onFileSelect={setImageFile}
                                currentImageUrl={field.value}
                            />
                        </FormControl>
                        <FormDescription>
                            Upload a banner image for your booth.
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
                
                {context === 'admin' &&
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
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        'Draft' booths are hidden. 'Published' are visible. 'Pending' need approval.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                }
            </div>
        </div>

        {context === 'admin' && !booth && (
            <>
                <Separator />
                <div className="space-y-4">
                     <h3 className="text-lg font-medium flex items-center gap-2">
                        <UserPlus />
                        Create Booth User (Optional)
                     </h3>
                     <p className="text-sm text-muted-foreground">
                        Optionally create an initial user account that will be assigned to manage this booth. More users can be added later from the Booth User Management page.
                     </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                            control={form.control}
                            name="booth_user_email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>User Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="booth.user@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="booth_user_password"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>User Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </>
        )}
        
        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onFinished}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {booth ? 'Save Changes' : 'Submit for Approval'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
