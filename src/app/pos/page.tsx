import { getProducts, getRecentTransactions } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { PosContent } from './_components/pos-content';
import { Product, Transaction } from '@/app/lib/definitions';
import { ProtectedRoute } from '@/hooks/use-auth';

export default async function PosPage() {
  const products: Product[] = await getProducts();
  const transactions: Transaction[] = await getRecentTransactions(5);

  return (
    <ProtectedRoute>
      <AppLayout>
        <PosContent products={products} transactions={transactions} />
      </AppLayout>
    </ProtectedRoute>
  );
}
