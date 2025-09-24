import { AdminLoginForm } from '@/components/auth/admin-login-form';
import { TenantLoginForm } from '@/components/auth/tenant-login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2">
                <Image src="https://res.cloudinary.com/dye07cjmn/image/upload/v1757998495/595b1fb6-83c7-4474-8f51-ad09239bdc94.png" alt="EventFlow Logo" width={40} height={40} />
                <span className="text-2xl font-bold">EventFlow</span>
            </Link>
        </div>
        <Tabs defaultValue="tenant" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tenant">Tenant Login</TabsTrigger>
            <TabsTrigger value="admin">Admin Login</TabsTrigger>
          </TabsList>
          <TabsContent value="tenant">
            <Card>
              <CardHeader>
                <CardTitle>Booth Access</CardTitle>
                <CardDescription>
                  Sign in to manage your booth dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TenantLoginForm />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="admin">
             <Card>
              <CardHeader>
                <CardTitle>Administrator Access</CardTitle>
                <CardDescription>
                  Sign in to manage the entire event.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminLoginForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
