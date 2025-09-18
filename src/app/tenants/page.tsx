import { getBooths, getTenants } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { TenantList } from '@/components/tenants/tenant-list';
import { ProtectedRoute } from '@/hooks/use-auth';
import type { Booth, Tenant } from '@/app/lib/definitions';

export default async function BoothUserManagementPage() {
  const tenants: Tenant[] = await getTenants();
  const booths: Booth[] = await getBooths();

  return (
    <ProtectedRoute adminOnly={true}>
      <AppLayout>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-3">
                <TenantList tenants={tenants} booths={booths} />
            </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
