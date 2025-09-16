'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, ShoppingCart, History, CheckCircle, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Product, Transaction } from '@/app/lib/definitions';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { redeemProduct } from '@/app/lib/actions';

interface PosContentProps {
    products: Product[];
    transactions: Transaction[];
}

export function PosContent({ products, transactions }: PosContentProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleRedeem = async (product: Product) => {
    if (!user) {
        toast({ variant: 'destructive', title: "You must be logged in." });
        return;
    }
    setIsRedeeming(product.id);
    const result = await redeemProduct(product.id, user.id, product.name, product.points);
    if (result.success) {
        toast({ title: "Redemption Successful!", description: `${product.name} has been redeemed.` });
    } else {
        toast({ variant: 'destructive', title: "Redemption Failed", description: result.error });
    }
    setIsRedeeming(null);
    setSelectedProduct(null);
  }

  return (
    <div>
       <div className="mb-6">
          <h2 className="text-3xl font-bold">POS System</h2>
          <p className="text-muted-foreground">
            Point redemption and transaction management
          </p>
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Select Item */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Select Item
            </CardTitle>
            <CardDescription>Choose item and set point amount</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {products.map((item, index) => (
              <Button
                key={index}
                variant={selectedProduct?.id === item.id ? "default" : "outline"}
                className="w-full justify-between h-12"
                onClick={() => setSelectedProduct(item)}
                disabled={item.stock <= 0}
              >
                <span>{item.name} {item.stock <= 0 && '(Out of stock)'}</span>
                <Badge variant={selectedProduct?.id === item.id ? "secondary" : "destructive"}>{item.points} pts</Badge>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Scan & Transactions */}
        <div className="lg:col-span-2 space-y-6">
            {/* Scan User QR */}
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                <QrCode className="mr-2 h-5 w-5" />
                Redeem for Customer
                </CardTitle>
                <CardDescription>Scan customer QR code to verify points, then click redeem.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4 p-8">
                {selectedProduct ? (
                     <div className="text-center">
                        <p className="text-muted-foreground">Selected Item:</p>
                        <h3 className="text-2xl font-bold">{selectedProduct.name}</h3>
                        <p className="text-xl font-semibold text-destructive">{selectedProduct.points} points</p>
                        <Button 
                          onClick={() => handleRedeem(selectedProduct)} 
                          className="mt-4"
                          disabled={isRedeeming === selectedProduct.id}
                        >
                          {isRedeeming === selectedProduct.id && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                          Confirm Redemption
                        </Button>
                     </div>
                ) : (
                    <div className="w-40 h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-4">
                        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mt-2">Select an item to redeem</p>
                    </div>
                )}
            </CardContent>
            </Card>
            {/* Recent Transactions */}
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                <History className="mr-2 h-5 w-5" />
                Recent Transactions
                </CardTitle>
                <CardDescription>Latest point redemptions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {transactions.length > 0 ? transactions.map((tx, index) => (
                <React.Fragment key={index}>
                    <div className="flex justify-between items-center">
                    <div>
                        <p className="font-semibold">{tx.user_name}</p>
                        <p className="text-sm text-muted-foreground">{tx.product_name}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(tx.created_at), "PPP p")}</p>
                    </div>
                    <div className="flex items-center gap-2 text-green-500 font-bold">
                        <CheckCircle className="h-5 w-5" />
                        <span>-{tx.points} pts</span>
                    </div>
                    </div>
                    {index < transactions.length - 1 && <Separator />}
                </React.Fragment>
                )) : (
                    <div className="text-center text-muted-foreground py-10">
                        <p>No transactions yet.</p>
                    </div>
                )}
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
