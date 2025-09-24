
'use client';

import React, { useState, useMemo } from 'react';
import { Booth, Product, Transaction } from '@/app/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ShoppingCart, List, History, User, Tag, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { redeemProduct } from '@/app/lib/actions';
import { format } from 'date-fns';
import { ScrollArea } from '../ui/scroll-area';

interface PosContentProps {
    booth: Booth;
    products: Product[];
    initialTransactions: Transaction[];
}

export function PosContent({ booth, products, initialTransactions }: PosContentProps) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(products.length > 0 ? products[0] : null);
    const [attendeeId, setAttendeeId] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [transactions, setTransactions] = useState(initialTransactions);
    const { toast } = useToast();

    const handleRedemption = async () => {
        if (!selectedProduct || !attendeeId) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please select a product and enter an attendee ID.',
            });
            return;
        }

        setIsRedeeming(true);
        const result = await redeemProduct(attendeeId, selectedProduct.id, booth.id);

        if (result.success) {
            toast({
                title: 'Redemption Successful!',
                description: `${result.attendeeName} redeemed ${selectedProduct.name}.`,
            });
            // Optimistically update transactions
            if (result.newTransaction) {
                setTransactions(prev => [result.newTransaction!, ...prev]);
            }
            setAttendeeId(''); // Clear input on success
        } else {
            toast({
                variant: 'destructive',
                title: 'Redemption Failed',
                description: result.error,
            });
        }

        setIsRedeeming(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column: Item Selection */}
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><List className="mr-2 h-5 w-5"/>Select Item</CardTitle>
                        <CardDescription>Choose an item for the customer to redeem.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[60vh]">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                                {products.map(product => (
                                    <Card
                                        key={product.id}
                                        className={cn(
                                            'cursor-pointer transition-all overflow-hidden',
                                            selectedProduct?.id === product.id ? 'ring-2 ring-primary' : 'hover:border-primary/50',
                                            product.stock === 0 && 'opacity-50 cursor-not-allowed'
                                        )}
                                        onClick={() => product.stock > 0 && setSelectedProduct(product)}
                                    >
                                        <div className="aspect-square bg-muted flex items-center justify-center relative">
                                            {product.image_url ? (
                                                <Image src={product.image_url} alt={product.name} layout="fill" objectFit="cover" />
                                            ) : (
                                                <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                                            )}
                                            {product.stock === 0 && (
                                                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                                    <p className="font-bold text-destructive">OUT OF STOCK</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 text-center">
                                            <p className="font-semibold truncate">{product.name}</p>
                                            <p className="text-sm text-primary font-bold">{product.points} pts</p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Redemption & History */}
            <div className="lg:col-span-1 space-y-6 sticky top-20">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><ShoppingCart className="mr-2 h-5 w-5" />Redeem for Customer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {selectedProduct ? (
                            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                                <div className="h-16 w-16 bg-background rounded-md overflow-hidden flex-shrink-0">
                                     {selectedProduct.image_url ? (
                                        <Image src={selectedProduct.image_url} alt={selectedProduct.name} height={64} width={64} objectFit="cover" />
                                    ) : (
                                        <ShoppingCart className="h-full w-full text-muted-foreground p-3" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-lg">{selectedProduct.name}</p>
                                    <p className="text-primary font-bold">{selectedProduct.points} Points</p>
                                    <p className="text-xs text-muted-foreground">Stock: {selectedProduct.stock}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-6 bg-muted rounded-lg">
                                <p className="text-muted-foreground">No product selected</p>
                            </div>
                        )}
                        <div className="space-y-2">
                             <label htmlFor="attendeeId" className="text-sm font-medium">Attendee ID</label>
                            <Input
                                id="attendeeId"
                                placeholder="Enter or scan attendee ID..."
                                value={attendeeId}
                                onChange={(e) => setAttendeeId(e.target.value)}
                                disabled={!selectedProduct || isRedeeming}
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleRedemption}
                            disabled={!selectedProduct || !attendeeId || isRedeeming || selectedProduct.stock === 0}
                        >
                            {isRedeeming ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Coins className="mr-2 h-4 w-4" />
                            )}
                            Confirm Redemption
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center"><History className="mr-2 h-5 w-5" />Recent Transactions</CardTitle>
                    </CardHeader>
                    <ScrollArea className="h-48">
                        <CardContent className="space-y-3">
                            {transactions.length > 0 ? transactions.map(tx => (
                                <div key={tx.id} className="text-sm">
                                    <p className="font-medium flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/>{tx.attendee_name}</p>
                                    <p className="text-muted-foreground flex items-center gap-2"><Tag className="h-4 w-4 text-muted-foreground"/>{tx.product_name} ({tx.points_spent} pts)</p>
                                    <p className="text-xs text-muted-foreground/70">{format(new Date(tx.created_at), 'p')}</p>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No transactions yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </ScrollArea>
                </Card>
            </div>
        </div>
    );
}
