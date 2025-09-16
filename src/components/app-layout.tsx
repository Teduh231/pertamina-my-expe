'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart2,
  Calendar,
  Users,
  Ticket,
  ShoppingCart,
  FileText,
  QrCode,
  LogOut,
  Gift,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', icon: BarChart2, label: 'Dashboard' },
    { href: '/events', icon: Calendar, label: 'Events' },
    { href: '/attendees', icon: Users, label: 'Attendees' },
    { href: '/raffle', icon: Ticket, label: 'Raffle' },
    { href: '/prize-history', icon: Gift, label: 'Prize History' },
    { href: '/pos', icon: ShoppingCart, label: 'POS' },
    { href: '/qr-scanner', icon: QrCode, label: 'QR Scanner' },
    { href: '/reports', icon: FileText, label: 'Reports' },
  ];
  
  if (!user) {
    // For pages like login, signup, landing, we don't want the app layout
    return <>{children}</>;
  }


  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar>
          <SidebarHeader>
             <Link href="/dashboard" className="flex items-center gap-2">
                <Image src="https://res.cloudinary.com/dye07cjmn/image/upload/v1757998495/595b1fb6-83c7-4474-8f51-ad09239bdc94.png" alt="EventFlow Logo" width={28} height={28} className="shrink-0" />
             </Link>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon className="shrink-0" />
                      <span className="group-data-[state=collapsed]/sidebar:opacity-0 group-data-[state=collapsed]/sidebar:w-0 transition-all duration-300 ease-in-out">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 transition-all duration-300 ease-in-out md:ml-[var(--sidebar-width-collapsed)] group-data-[state=expanded]/sidebar:md:ml-[var(--sidebar-width)]">
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="hidden md:flex"/>
                    <SidebarTrigger className="flex md:hidden"/>
                    <h1 className="text-lg font-semibold capitalize">
                        {pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Dashboard'}
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                <Avatar className="h-9 w-9 shrink-0">
                                    <AvatarImage src={`https://i.pravatar.cc/150?u=${user.email}`} />
                                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="bottom" align="end">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">My Account</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Profile</DropdownMenuItem>
                            <DropdownMenuItem>Settings</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            <main className="flex-1 overflow-auto p-4 md:p-6">
                {children}
            </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
