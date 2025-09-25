'use client';

import React, { useState, useMemo } from 'react';
import { Booth, Product, Transaction, Attendee } from '@/app/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ShoppingCart, List, Trash2, QrCode, Plus, Minus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { redeemProduct } from '@/app/lib/actions';
import { format } from 'date-fns';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { getAttendeeById } from '@/app/lib/data';

type CartItem = Product & { quantity: number };

interface NewTransactionContentProps {
    booth: Booth;
    products: Product[];
}

export function NewTransactionContent({ booth, products }: NewTransactionContentProps) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [attendeeId, setAttendeeId] = useState('');
    const [attendee, setAttendee] = useState<Attendee | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const { toast } = useToast();
    
    const filteredProducts = useMemo(() => {
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, searchTerm]);

    const total = useMemo(() => cart.reduce((sum, item) => sum + item.points * item.quantity, 0), [cart]);

    const addToCart = (product: Product) => {
        setCart(currentCart => {
            const existingItem = currentCart.find(item => item.id === product.id);
            if (existingItem) {
                return currentCart.map(item => 
                    item.id === product.id 
                    ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } 
                    : item
                );
            }
            return [...currentCart, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (productId: string, newQuantity: number) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        setCart(currentCart => {
            if (newQuantity <= 0) {
                return currentCart.filter(item => item.id !== productId);
            }
            return currentCart.map(item =>
                item.id === productId ? { ...item, quantity: Math.min(newQuantity, product.stock) } : item
            );
        });
    };

    const handleSearchAttendee = async () => {
        if (!attendeeId) return;
        setIsSearching(true);
        const foundAttendee = await getAttendeeById(attendeeId);
        if (foundAttendee) {
            setAttendee(foundAttendee);
        } else {
            setAttendee(null);
            toast({ variant: 'destructive', title: 'Attendee Not Found' });
        }
        setIsSearching(false);
    };

    const handleCreateTransaction = async () => {
        if (cart.length === 0 || !attendee) {
            toast({ variant: 'destructive', title: 'Cannot create transaction', description: 'Please add items to the cart and select an attendee.' });
            return;
        }

        if (attendee.points < total) {
            toast({ variant: 'destructive', title: 'Insufficient Points', description: `${attendee.name} does not have enough points.` });
            return;
        }

        setIsProcessing(true);
        // This is a simplified call for a single product redemption.
        // For multi-product cart, you would loop or send the whole cart.
        // For this implementation, we'll process one product at a time for simplicity.
        let allSuccess = true;
        let totalPointsSpent = 0;
        
        // This should be wrapped in a proper DB transaction in a real app.
        for (const item of cart) {
             const result = await redeemProduct(attendee.id, item.id, booth.id);
             if(!result.success){
                allSuccess = false;
                toast({ variant: 'destructive', title: 'Transaction Failed', description: `Error with item: ${item.name}. ${result.error}` });
                break;
             }
             totalPointsSpent += item.points * item.quantity; // Assuming redeemProduct handles quantity
        }


        if (allSuccess) {
            toast({ title: 'Transaction Successful!' });
            setCart([]);
            setAttendee(null);
            setAttendeeId('');
        }

        setIsProcessing(false);
    };


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column: Order & Payment */}
            <div className="lg:col-span-1 space-y-6 sticky top-20">
                 <Card>
                    <CardHeader>
                        <CardTitle>Order Details</CardTitle>
                    </CardHeader>
                    <ScrollArea className="h-64">
                    <CardContent className="space-y-4">
                        {cart.length > 0 ? cart.map(item => (
                            <div key={item.id} className="flex items-center gap-4">
                                <Image src={item.image_url || `https://picsum.photos/seed/${item.id}/100`} alt={item.name} width={48} height={48} className="rounded-md object-cover"/>
                                <div className="flex-1">
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">{item.points} pts</p>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-4 w-4"/></Button>
                                     <span>{item.quantity}</span>
                                     <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-4 w-4"/></Button>
                                </div>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => updateQuantity(item.id, 0)}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        )) : (
                            <div className="text-center text-muted-foreground py-16">
                                <ShoppingCart className="mx-auto h-12 w-12" />
                                <p>Cart is empty</p>
                            </div>
                        )}
                    </CardContent>
                    </ScrollArea>
                    {cart.length > 0 && (
                        <CardFooter className="flex-col !items-stretch space-y-2">
                            <Separator/>
                             <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{total} pts</span></div>
                        </CardFooter>
                    )}
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Payment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-end gap-2">
                            <div className="flex-1 space-y-1">
                                <label htmlFor="attendee-id" className="text-sm font-medium">Attendee ID</label>
                                <Input id="attendee-id" placeholder="Enter attendee ID..." value={attendeeId} onChange={e => setAttendeeId(e.target.value)} />
                            </div>
                             <Button onClick={handleSearchAttendee} disabled={isSearching || !attendeeId}>
                                {isSearching ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                            </Button>
                        </div>
                        {attendee && (
                            <div className="p-3 rounded-lg bg-muted">
                                <p className="font-semibold">{attendee.name}</p>
                                <p className="text-sm text-primary">Available Points: {attendee.points} pts</p>
                            </div>
                        )}
                        <div className="flex items-center justify-center p-4 border-2 border-dashed rounded-lg text-muted-foreground">
                            <QrCode className="mr-2 h-5 w-5"/>
                            <span>Scan QR Code to Pay</span>
                        </div>
                    </CardContent>
                     <CardFooter>
                        <Button className="w-full" onClick={handleCreateTransaction} disabled={isProcessing || !attendee || cart.length === 0}>
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Create Transaction
                        </Button>
                    </CardFooter>
                </Card>
            </div>
            
            {/* Right Column: Product Selection */}
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                           <Input placeholder="Search products..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                    </CardHeader>
                    <ScrollArea className="h-[80vh]">
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredProducts.map(product => (
                                <Card key={product.id} className="cursor-pointer hover:border-primary overflow-hidden" onClick={() => addToCart(product)}>
                                    <div className="aspect-square bg-muted relative">
                                        <Image src={product.image_url || `https://picsum.photos/seed/${product.id}/200`} alt={product.name} layout="fill" objectFit="cover" />
                                    </div>
                                    <div className="p-2 text-center">
                                        <p className="text-sm font-semibold truncate">{product.name}</p>
                                        <p className="text-xs text-primary font-bold">{product.points} pts</p>
                                    </div>
                                </Card>
                            ))}
                        </CardContent>
                    </ScrollArea>
                </Card>
            </div>

        </div>
    );
}
