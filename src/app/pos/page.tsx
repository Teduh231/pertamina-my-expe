import { getProducts, getRecentTransactions } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { PosContent } from './_components/pos-content';
import { Product, Transaction } from '@/app/lib/definitions';

export default async function PosPage() {
  const products: Product[] = await getProducts();
  const transactions: Transaction[] = await getRecentTransactions(5);

  return (
    <AppLayout>
      <PosContent products={products} transactions={transactions} />
    </AppLayout>
  );
}
