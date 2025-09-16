'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart2,
  Calendar,
  Settings,
  Users,
  LogOut,
  PlusCircle,
  Ticket,
  ShoppingCart,
  FileText,
  QrCode,
  PanelLeft
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
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
    { href: '/raffle', icon: Ticket, label: 'Raffle & Prizes' },
    { href: '/pos', icon: ShoppingCart, label: 'POS System' },
    { href: '/qr-scanner', icon: QrCode, label: 'QR Scanner' },
    { href: '/reports', icon: FileText, label: 'Reports' },
  ];
  
  if (!user) {
    // For pages like login, signup, landing, we don't want the app layout
    return <>{children}</>;
  }


  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 group-data-[state=expanded]/sidebar-wrapper:w-full">
              <Image src="https://res.cloudinary.com/dye07cjmn/image/upload/v1757998495/595b1fb6-83c7-4474-8f51-ad09239bdc94.png" alt="EventFlow Logo" width={28} height={28} className="shrink-0" />
              <span className="text-lg font-bold group-data-[state=collapsed]/sidebar-wrapper:hidden">EventFlow</span>
            </div>
            <SidebarTrigger className="group-data-[state=collapsed]/sidebar-wrapper:hidden" />
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
                      <span className="group-data-[state=collapsed]/sidebar-wrapper:hidden">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith('/settings')}
                        tooltip="Settings"
                    >
                        <Link href="#">
                        <Settings className="shrink-0" />
                        <span className="group-data-[state=collapsed]/sidebar-wrapper:hidden">Settings</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton asChild tooltip="My Account">
                                <div>
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarImage src="https://picsum.photos/seed/avatar/40/40" />
                                        <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col text-left group-data-[state=collapsed]/sidebar-wrapper:hidden">
                                        <span className="text-sm font-medium truncate">{user?.email}</span>
                                    </div>
                                </div>
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 transition-all duration-300 ease-in-out md:group-data-[state=expanded]/sidebar-wrapper:ml-[var(--sidebar-width)] md:group-data-[state=collapsed]/sidebar-wrapper:ml-[var(--sidebar-width-collapsed)]">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-card px-4 sm:px-6">
                <SidebarTrigger className="md:hidden" />
                <div className="flex-1">
                <h1 className="text-lg font-semibold capitalize">
                    {pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Dashboard'}
                </h1>
                </div>
                <Button asChild size="sm">
                    <Link href="/events/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Event
                    </Link>
                </Button>
            </header>
            <main className="flex-1 overflow-auto p-4 md:p-6">
                {children}
            </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
