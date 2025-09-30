
'use client';

import React, { useState } from 'react';
import { Event, Product, Transaction } from '@/app/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, TrendingUp, Users, DollarSign, PlusCircle, Eye, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createProduct, uploadImage } from '@/app/lib/actions';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/ui/image-upload';

interface PosContentProps {
    event: Event;
    products: Product[];
    initialTransactions: Transaction[];
}

function StatCard({ title, value, subtext, icon: Icon }: { title: string, value: string, subtext: string, icon: React.ElementType }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{subtext}</p>
            </CardContent>
        </Card>
    );
}

function getStockBadgeVariant(stock: number): 'default' | 'destructive' | 'secondary' {
    if (stock > 20) return 'default';
    if (stock > 0) return 'secondary';
    return 'destructive';
}
function getStockBadgeLabel(stock: number): string {
    if (stock > 20) return 'In Stock';
    if (stock > 0) return 'Low Stock';
    return 'Out of Stock';
}

const productSchema = z.object({
  name: z.string().min(2, { message: 'Product name must be at least 2 characters.' }),
  points: z.coerce.number().min(0, { message: 'Points must be a positive number.' }),
  stock: z.coerce.number().min(0, { message: 'Stock must be a positive number.' }),
  image_url: z.string().optional(),
  image_path: z.string().optional(),
});


export function PosContent({ event, products, initialTransactions }: PosContentProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);

    // Placeholder data for stats
    const totalSales = initialTransactions.reduce((sum, tx) => sum + tx.points_spent, 0);
    const transactionCount = initialTransactions.length;
    const avgTransaction = transactionCount > 0 ? totalSales / transactionCount : 0;
    
    const productSales = products.map(p => ({ ...p, sold: Math.floor(Math.random() * 50) }));
    const topItem = productSales.reduce((top, p) => p.sold > top.sold ? p : top, productSales[0] || { name: 'N/A' });

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

    async function onProductSubmit(values: z.infer<typeof productSchema>) {
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
            event_id: event.id,
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Point of Sale</h2>
                    <p className="text-muted-foreground">Manage merchandise sales, inventory, and transactions.</p>
                </div>
                <Button asChild>
                    <Link href={`/event-dashboard/${event.id}/pos/new`}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Transaction
                    </Link>
                </Button>
            </div>

            <Tabs defaultValue="dashboard">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="inventory">Inventory</TabsTrigger>
                    <TabsTrigger value="add">Add Product</TabsTrigger>
                </TabsList>
                
                <TabsContent value="dashboard" className="mt-6">
                    <div className="space-y-6">
                        {/* Stat Cards */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <StatCard title="Today's Sales" value={`${totalSales.toLocaleString()} pts`} subtext="+12% from yesterday" icon={DollarSign} />
                            <StatCard title="Transactions" value={`${transactionCount}`} subtext="+8 in last hour" icon={ShoppingCart} />
                            <StatCard title="Top Item" value={topItem?.name || 'N/A'} subtext={`${topItem?.sold || 0} sold today`} icon={TrendingUp} />
                            <StatCard title="Avg. Transaction" value={`${avgTransaction.toFixed(0)} pts`} subtext="Per transaction" icon={Users} />
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Transactions</CardTitle>
                            </CardHeader>
                            <ScrollArea className="h-[450px]">
                                <CardContent className="space-y-4">
                                    {initialTransactions.length > 0 ? initialTransactions.map(tx => (
                                        <div key={tx.id} className="flex items-center">
                                            <div className="flex-1">
                                                <p className="font-semibold">{tx.attendee_name}</p>
                                                <p className="text-sm text-muted-foreground">{tx.product_name}</p>
                                                <p className="text-xs text-muted-foreground">TXN-{tx.id.substring(0,6)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">{tx.points_spent} pts</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(tx.created_at), 'p')}</p>
                                            </div>
                                            <Button asChild variant="ghost" size="icon" className="ml-2">
                                                <Link href={`/event-dashboard/${event.id}/pos/${tx.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    )) : (
                                        <p className="text-muted-foreground text-center py-16">No transactions yet.</p>
                                    )}
                                </CardContent>
                            </ScrollArea>
                        </Card>
                    </div>
                </TabsContent>
                
                <TabsContent value="inventory" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Inventory Status</CardTitle>
                            <CardDescription>An overview of your current product stock.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="border rounded-lg">
                                <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Points</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Status</TableHead>
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
                                        <TableCell>
                                            <Badge variant={getStockBadgeVariant(product.stock)}>{getStockBadgeLabel(product.stock)}</Badge>
                                        </TableCell>
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
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="add" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Product</CardTitle>
                            <CardDescription>Fill out the form below to add a new item to your inventory.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                            <form onSubmit={form.handleSubmit(onProductSubmit)} className="space-y-4 max-w-lg">
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
                                <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Product
                                </Button>
                            </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
