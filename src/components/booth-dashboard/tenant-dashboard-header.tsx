'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';

export function TenantDashboardHeader({ boothName }: { boothName: string }) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
                <Image src="https://res.cloudinary.com/dye07cjmn/image/upload/v1757998495/595b1fb6-83c7-4474-8f51-ad09239bdc94.png" alt="EventFlow Logo" width={28} height={28} className="shrink-0" />
            </Link>
            <h1 className="text-lg font-semibold capitalize">
                {boothName} - Dashboard
            </h1>
        </div>

        <div className="flex items-center gap-4">
             <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={`https://i.pravatar.cc/150?u=${user?.email}`} />
                <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
            </Button>
        </div>
    </header>
  );
}
