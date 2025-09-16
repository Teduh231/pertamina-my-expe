'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, ShoppingCart, History, CheckCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const items = [
  { name: 'Fuel Voucher 50L', points: 500 },
  { name: 'Fuel Voucher 25L', points: 250 },
  { name: 'Pertamina T-Shirt', points: 200 },
  { name: 'Pertamina Cap', points: 150 },
  { name: 'Pertamina Tumbler', points: 100 },
  { name: 'Pertamina Keychain', points: 50 },
];

const transactions = [
  {
    user: 'John Doe',
    item: 'Fuel Voucher 50L',
    points: -500,
    time: '10:09:38 AM',
  },
  {
    user: 'Jane Smith',
    item: 'Pertamina T-Shirt',
    points: -200,
    time: '9:09:38 AM',
  },
];

export function PosContent() {
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
            {items.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-between h-12"
              >
                <span>{item.name}</span>
                <Badge variant="destructive">{item.points} pts</Badge>
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
                Scan User QR
                </CardTitle>
                <CardDescription>Scan customer QR code to verify points</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4 p-8">
                <div className="w-40 h-40 border-2 border-dashed rounded-lg flex items-center justify-center">
                    <QrCode className="h-20 w-20 text-muted-foreground" />
                </div>
                <Button>
                Start QR Scan
                </Button>
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
                {transactions.map((tx, index) => (
                <React.Fragment key={index}>
                    <div className="flex justify-between items-center">
                    <div>
                        <p className="font-semibold">{tx.user}</p>
                        <p className="text-sm text-muted-foreground">{tx.item}</p>
                        <p className="text-xs text-muted-foreground">{tx.time}</p>
                    </div>
                    <div className="flex items-center gap-2 text-green-500 font-bold">
                        <CheckCircle className="h-5 w-5" />
                        <span>{tx.points} pts</span>
                    </div>
                    </div>
                    {index < transactions.length - 1 && <Separator />}
                </React.Fragment>
                ))}
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
