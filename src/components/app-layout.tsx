'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart2,
  Calendar,
  PanelLeft,
  Settings,
  Users,
  LogOut,
  PlusCircle,
  Ticket,
  Trophy,
  ShoppingCart,
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
    { href: '/reports', icon: FileText, label: 'Reports' },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarHeader>
              <div className="flex h-10 items-center justify-center p-2 group-data-[collapsible=icon]:hidden">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-primary" />
                  <h1 className="text-lg font-bold">EventFlow</h1>
                </Link>
              </div>
               <div className="hidden h-10 items-center justify-center p-2 group-data-[collapsible=icon]:flex">
                 <Link href="/dashboard" className="flex items-center gap-2">
                   <Calendar className="h-6 w-6 text-primary" />
                 </Link>
              </div>
            </SidebarHeader>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-sidebar-accent">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://picsum.photos/seed/avatar/40/40" />
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-medium">{user?.email}</span>
                    <span className="text-xs text-muted-foreground">
                      Event Organizer
                    </span>
                  </div>
                </div>
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
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold capitalize">
                {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
