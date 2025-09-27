'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { UserProfileDropdown } from '@/components/user-profile-dropdown';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', adminOnly: true },
    { href: '/events', icon: Calendar, label: 'Events', adminOnly: true },
    { href: '/staff', icon: Users2, label: 'User Management', adminOnly: true },
    { href: '/products', icon: ShoppingBasket, label: 'Products', adminOnly: true },
    { href: '/reports', icon: FileText, label: 'Reports', adminOnly: true },
  ];

  const getPageTitle = () => {
    // Exact match first
    const exactMatch = navItems.find(item => item.href === pathname);
    if (exactMatch) return exactMatch.label;
  
    // Then check for prefixes, longest first
    const prefixMatch = navItems
      .filter(item => pathname.startsWith(item.href))
      .sort((a, b) => b.href.length - a.href.length)[0];
    
    if (prefixMatch) return prefixMatch.label;

    if (pathname.startsWith('/event-dashboard')) return 'Event Dashboard';
    return 'Dashboard';
  }


  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#F7F8FA] text-foreground">
        <Sidebar>
          <SidebarHeader>
             <Link href="/dashboard" className="flex items-center gap-3">
                <Image src="https://picsum.photos/seed/logo/40/40" alt="My Pertamina Logo" width={32} height={32} className="shrink-0" />
                <div className="flex flex-col group-data-[state=collapsed]/sidebar:opacity-0 group-data-[state=collapsed]/sidebar:w-0 transition-all duration-300 ease-in-out">
                    <span className="font-bold text-sm text-gray-800">My Pertamina</span>
                    <span className="font-semibold text-xs text-gray-600">Xperience</span>
                </div>
             </Link>
          </SidebarHeader>

          <SidebarContent className="flex-1 flex flex-col justify-between">
            <SidebarMenu>
              {navItems.filter(item => !item.adminOnly || isAdmin).map((item) => (
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

        <div className="transition-all duration-300 ease-in-out md:ml-[var(--sidebar-width-collapsed)] group-data-[state=expanded]/sidebar:md:ml-[var(--sidebar-width)] flex flex-col h-screen">
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 shrink-0">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="flex md:hidden"/>
                    
                    <h1 className="text-lg font-semibold capitalize hidden md:block">
                        {getPageTitle()}
                    </h1>
                </div>

                <UserProfileDropdown />
            </header>
            <main className="flex-1 overflow-auto p-4 md:p-6">
                {children}
            </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
