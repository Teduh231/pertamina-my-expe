'use client';

import { AdminLoginForm } from '@/components/auth/admin-login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-3">
                <Image src="https://picsum.photos/seed/logo/40/40" alt="My Pertamina Logo" width={40} height={40} />
                <div className="flex flex-col">
                    <span className="font-bold text-lg text-gray-800">My Pertamina</span>
                    <span className="font-semibold text-sm text-gray-600">Xperience</span>
                </div>
            </Link>
        </div>
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
      </div>
    </div>
  );
}
