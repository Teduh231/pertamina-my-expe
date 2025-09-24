
'use client';

import React from 'react';
import { Booth, Product, Transaction } from '@/app/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ShoppingCart, TrendingUp, Users, DollarSign, PlusCircle, ArrowRight, Eye } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ScrollArea } from '../ui/scroll-area';

interface PosContentProps {
    booth: Booth;
    products: Product[];
    initialTransactions: Transaction[];
}

function StatCard({ title, value, subtext, icon: Icon, trend }: { title: string, value: string, subtext: string, icon: React.ElementType, trend?: string }) {
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

export function PosContent({ booth, products, initialTransactions }: PosContentProps) {
    // Placeholder data for stats
    const totalSales = initialTransactions.reduce((sum, tx) => sum + tx.points_spent, 0);
    const transactionCount = initialTransactions.length;
    const avgTransaction = transactionCount > 0 ? totalSales / transactionCount : 0;
    
    const productSales = products.map(p => ({ ...p, sold: Math.floor(Math.random() * 50) }));
    const topItem = productSales.reduce((top, p) => p.sold > top.sold ? p : top, productSales[0] || { name: 'N/A' });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">POS System</h2>
                    <p className="text-muted-foreground">Manage merchandise sales and transactions.</p>
                </div>
                <Button asChild>
                    <Link href={`/booth-dashboard/${booth.id}/pos/new`}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Transaction
                    </Link>
                </Button>
            </div>
            
            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Today's Sales" value={`${totalSales.toLocaleString()} pts`} subtext="+12% from yesterday" icon={DollarSign} />
                <StatCard title="Transactions" value={`${transactionCount}`} subtext="+8 in last hour" icon={ShoppingCart} />
                <StatCard title="Top Item" value={topItem?.name || 'N/A'} subtext={`${topItem?.sold || 0} sold today`} icon={TrendingUp} />
                <StatCard title="Avg. Transaction" value={`${avgTransaction.toFixed(0)} pts`} subtext="Per transaction" icon={Users} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Transactions */}
                <div className="lg:col-span-1">
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
                                            <Link href={`/booth-dashboard/${booth.id}/pos/${tx.id}`}>
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

                {/* Inventory Status */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Inventory Status</CardTitle>
                        </CardHeader>
                         <ScrollArea className="h-[450px]">
                            <CardContent>
                                <div className="space-y-4">
                                    {productSales.map(product => (
                                        <div key={product.id} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                                            <div className="flex-1">
                                                <p className="font-semibold">{product.name}</p>
                                                <p className="text-sm text-muted-foreground">Stock: {product.stock} | Sold: {product.sold}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">{product.points} pts</p>
                                                <Badge variant={getStockBadgeVariant(product.stock)}>{getStockBadgeLabel(product.stock)}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </ScrollArea>
                    </Card>
                </div>
            </div>
        </div>
    );
}
