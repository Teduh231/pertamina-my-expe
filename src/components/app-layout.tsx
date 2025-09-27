'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  LayoutDashboard,
  Calendar,
  Users2,
  ShoppingBasket,
  FileText,
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
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', adminOnly: true },
    { href: '/events', icon: Calendar, label: 'Events', adminOnly: true },
    { href: '/staff', icon: Users2, label: 'User Management', adminOnly: true },
    { href: '/products', icon: ShoppingBasket, label: 'Products', adminOnly: true },
    { href: '/reports', icon: FileText, label: 'Reports', adminOnly: true },
  ];

  const getPageTitle = () => {
    const currentNavItem = navItems
        .filter(item => pathname.startsWith(item.href))
        .sort((a, b) => b.href.length - a.href.length)[0];

    if (currentNavItem) {
        return currentNavItem.label;
    }
    if (pathname.startsWith('/event-dashboard')) return 'Event Dashboard';
    return 'Dashboard';
  }


  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#F7F8FA] text-foreground">
        <Sidebar>
          <SidebarHeader>
             <Link href="/dashboard" className="flex items-center gap-3">
                <Image src="https://mypertamina.id/assets/img/logo_mypertamina.png" alt="My Pertamina Logo" width={32} height={32} className="shrink-0" />
                <div className="flex flex-col group-data-[state=collapsed]/sidebar:opacity-0 group-data-[state=collapsed]/sidebar:w-0 transition-all duration-300 ease-in-out">
                    <span className="font-bold text-sm text-gray-800">My Pertamina</span>
                    <span className="font-semibold text-xs text-gray-600">Xperience</span>
                </div>
             </Link>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              {navItems.filter(item => !item.adminOnly || isAdmin).map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
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

        <div className="transition-all duration-300 ease-in-out md:ml-[var(--sidebar-width-collapsed)] group-data-[state=expanded]/sidebar:md:ml-[var(--sidebar-width)]">
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="flex md:hidden"/>
                    
                    <h1 className="text-lg font-semibold capitalize hidden md:block">
                        {getPageTitle()}
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                <Avatar className="h-9 w-9 shrink-0">
                                    <AvatarImage src={`https://i.pravatar.cc/150?u=${user?.email}`} />
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
