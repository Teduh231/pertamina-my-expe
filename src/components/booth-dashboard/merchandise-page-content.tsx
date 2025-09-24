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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Product } from '@/app/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, PlusCircle, Package, ImageIcon } from 'lucide-react';
import { createProduct, uploadImage } from '@/app/lib/actions';
import { format } from 'date-fns';
import Image from 'next/image';
import { ImageUpload } from '@/components/ui/image-upload';

const productSchema = z.object({
  name: z.string().min(2, { message: 'Product name must be at least 2 characters.' }),
  points: z.coerce.number().min(0, { message: 'Points must be a positive number.' }),
  stock: z.coerce.number().min(0, { message: 'Stock must be a positive number.' }),
  image_url: z.string().optional(),
  image_path: z.string().optional(),
});

type MerchandisePageContentProps = {
  boothId: string;
  products: Product[];
};

export function MerchandisePageContent({ boothId, products }: MerchandisePageContentProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      points: 10,
      stock: 100,
      image_url: '',
      image_path: '',
    },
  });

  async function onSubmit(values: z.infer<typeof productSchema>) {
    setIsSubmitting(true);
    let imageUrl = '';
    let imagePath = '';

    if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadResult = await uploadImage(formData);

        if (!uploadResult.success) {
            toast({
                variant: 'destructive',
                title: 'Image Upload Failed',
                description: uploadResult.error,
            });
            setIsSubmitting(false);
            return;
        }
        imageUrl = uploadResult.url!;
        imagePath = uploadResult.path!;
    }
    
    const result = await createProduct({ 
        ...values, 
        booth_id: boothId,
        image_url: imageUrl,
        image_path: imagePath
    });
    
    if (result.success) {
      toast({
        title: 'Product Added!',
        description: `"${values.name}" has been added to your merchandise list.`,
      });
      form.reset();
      setImageFile(null);
      router.refresh();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Adding Product',
        description: result.error || 'An unexpected error occurred.',
      });
    }
    
    setIsSubmitting(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <h3 className="text-lg font-semibold mb-4 flex items-center"><PlusCircle className="mr-2 h-5 w-5" />Add New Product</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., T-Shirt" {...field} />
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
                        <FormLabel>Product Image</FormLabel>
                        <FormControl>
                           <ImageUpload
                                onFileSelect={setImageFile}
                                currentImageUrl={field.value}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points to Redeem</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Stock</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Product
            </Button>
          </form>
        </Form>
      </div>
      <div className="lg:col-span-2">
         <h3 className="text-lg font-semibold mb-4 flex items-center"><Package className="mr-2 h-5 w-5" />Current Inventory</h3>
         <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Date Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length > 0 ? (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                            {product.image_url ? (
                              <Image src={product.image_url} alt={product.name} width={48} height={48} className="object-cover w-full h-full" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          <span>{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{product.points}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>{format(new Date(product.created_at), 'PPP')}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No merchandise added yet.
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
