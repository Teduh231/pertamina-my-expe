
'use client';

import React from 'react';
import { Transaction } from '@/app/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import Image from 'next/image';

interface TransactionDetailContentProps {
  transaction: Transaction & { attendee: { name: string, phone_number: string, points: number } };
  eventId: string;
}

export function TransactionDetailContent({ transaction, eventId }: TransactionDetailContentProps) {
  const router = useRouter();

  const subtotal = transaction.items.reduce((sum, item) => sum + item.points * item.quantity, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push(`/event-dashboard/${eventId}/pos`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transaction Details</h2>
          <p className="text-muted-foreground">Review the details of a past transaction.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle>Transaction #{transaction.id.substring(0, 8)}</CardTitle>
            <CardDescription>
              Completed on {format(new Date(transaction.created_at), 'MMMM d, yyyy \\'at\\' p')}
            </CardDescription>
          </div>
           <Badge variant="default">Paid</Badge>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Customer</h3>
                <div className="p-4 rounded-lg bg-muted space-y-2">
                    <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> {transaction.attendee.name}</p>
                    <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {transaction.attendee.phone_number}</p>
                </div>
            </div>
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Summary</h3>
                 <div className="p-4 rounded-lg bg-muted space-y-2">
                    <p className="flex items-center justify-between"><span>Payment Method:</span> <span className="font-medium">Points</span></p>
                    <p className="flex items-center justify-between"><span>Status:</span> <span className="font-medium text-green-600">Successful</span></p>
                </div>
            </div>
        </CardContent>
        <Separator/>
        <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-4">Items Purchased</h3>
            <div className="space-y-4">
                 {transaction.items.map(item => (
                    <div key={item.product_id} className="flex items-center gap-4">
                        <Image src={`https://picsum.photos/seed/${item.product_id}/100`} alt={item.product_name} width={56} height={56} className="rounded-md object-cover"/>
                        <div className="flex-1">
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">{item.points * item.quantity} pts</p>
                    </div>
                 ))}
            </div>
        </CardContent>
        <Separator/>
        <CardFooter className="flex-col items-end space-y-2 pt-6 bg-muted/50">
            <div className="flex justify-between w-full max-w-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{subtotal} pts</span>
            </div>
            <div className="flex justify-between w-full max-w-sm font-bold text-lg">
                <span>Total</span>
                <span>{transaction.points_spent} pts</span>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
