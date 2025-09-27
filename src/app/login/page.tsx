'use client';

import { AdminLoginForm } from '@/components/auth/admin-login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2">
                <Image src="https://res.cloudinary.com/dye07cjmn/image/upload/v1757998495/595b1fb6-83c7-4474-8f51-ad09239bdc94.png" alt="EventFlow Logo" width={40} height={40} />
                <span className="text-2xl font-bold">EventFlow</span>
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
