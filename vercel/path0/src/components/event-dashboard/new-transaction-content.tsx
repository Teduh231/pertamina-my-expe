
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Event, Product, Attendee } from '@/app/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ShoppingCart, Trash2, QrCode, Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { redeemProduct } from '@/app/lib/actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getAttendees } from '@/app/lib/data';

type CartItem = Product & { quantity: number };

interface NewTransactionContentProps {
    event: Event;
    products: Product[];
}

export function NewTransactionContent({ event, products }: NewTransactionContentProps) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [attendeeName, setAttendeeName] = useState('');
    const [allAttendees, setAllAttendees] = useState<Attendee[]>([]);
    const [foundAttendees, setFoundAttendees] = useState<Attendee[]>([]);
    const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const { toast } = useToast();
    
    useEffect(() => {
        const fetchAttendees = async () => {
            const attendees = await getAttendees();
            setAllAttendees(attendees);
        };
        fetchAttendees();
    }, []);

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

    const handleSearchAttendee = () => {
        if (!attendeeName) {
            setFoundAttendees([]);
            return;
        };
        setIsSearching(true);
        const results = allAttendees.filter(a => a.name.toLowerCase().includes(attendeeName.toLowerCase()));
        setFoundAttendees(results);
        if (results.length === 0) {
            toast({ variant: 'destructive', title: 'Attendee Not Found' });
        }
        setIsSearching(false);
    };

    const selectAttendee = (attendee: Attendee) => {
        setSelectedAttendee(attendee);
        setAttendeeName(attendee.name);
        setFoundAttendees([]);
    }

    const handleCreateTransaction = async () => {
        if (cart.length === 0 || !selectedAttendee) {
            toast({ variant: 'destructive', title: 'Cannot create transaction', description: 'Please add items to the cart and select an attendee.' });
            return;
        }

        if (selectedAttendee.points < total) {
            toast({ variant: 'destructive', title: 'Insufficient Points', description: `${selectedAttendee.name} does not have enough points.` });
            return;
        }

        setIsProcessing(true);
        let allSuccess = true;
        
        for (const item of cart) {
             for (let i = 0; i < item.quantity; i++) {
                const result = await redeemProduct(selectedAttendee.id, item.id, event.id);
                if(!result.success){
                    allSuccess = false;
                    toast({ variant: 'destructive', title: 'Transaction Failed', description: `Error with item: ${item.name}. ${result.error}` });
                    break;
                }
             }
             if (!allSuccess) break;
        }


        if (allSuccess) {
            toast({ title: 'Transaction Successful!' });
            setCart([]);
            setSelectedAttendee(null);
            setAttendeeName('');
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
                            <div className="flex-1 space-y-1 relative">
                                <label htmlFor="attendee-name" className="text-sm font-medium">Attendee Name</label>
                                <Input id="attendee-name" placeholder="Enter attendee name..." value={attendeeName} onChange={e => setAttendeeName(e.target.value)} />
                                 {foundAttendees.length > 0 && (
                                    <Card className="absolute z-10 w-full mt-1 bg-background shadow-lg">
                                        <CardContent className="p-2 max-h-48 overflow-y-auto">
                                            {foundAttendees.map(attendee => (
                                                <div key={attendee.id} onClick={() => selectAttendee(attendee)} className="p-2 hover:bg-muted rounded-md cursor-pointer">
                                                    <p className="font-semibold">{attendee.name}</p>
                                                    <p className="text-xs text-muted-foreground">{attendee.phone_number}</p>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                 )}
                            </div>
                             <Button onClick={handleSearchAttendee} disabled={isSearching || !attendeeName}>
                                {isSearching ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                            </Button>
                        </div>
                        {selectedAttendee && (
                            <div className="p-3 rounded-lg bg-muted">
                                <p className="font-semibold">{selectedAttendee.name}</p>
                                <p className="text-sm text-primary">Available Points: {selectedAttendee.points} pts</p>
                            </div>
                        )}
                        <div className="flex items-center justify-center p-4 border-2 border-dashed rounded-lg text-muted-foreground">
                            <QrCode className="mr-2 h-5 w-5"/>
                            <span>Scan QR Code to Pay</span>
                        </div>
                    </CardContent>
                     <CardFooter>
                        <Button className="w-full" onClick={handleCreateTransaction} disabled={isProcessing || !selectedAttendee || cart.length === 0}>
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
