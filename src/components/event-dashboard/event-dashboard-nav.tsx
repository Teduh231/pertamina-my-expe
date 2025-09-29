"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  CreditCard,
  Flame,
  Ticket,
  QrCode,
  Settings,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function EventDashboardNav({
  eventId,
}: {
  eventId: string;
}) {
  const pathname = usePathname();
  const navItems = [
    {
      href: `/event-dashboard/${eventId}/overview`,
      label: "Overview",
      icon: LayoutGrid,
    },
    {
      href: `/event-dashboard/${eventId}/scanner`,
      label: "Scanner",
      icon: QrCode,
    },
    {
      href: `/event-dashboard/${eventId}/attendees`,
      label: "Attendees",
      icon: Users,
    },
    {
      href: `/event-dashboard/${eventId}/pos`,
      label: "Point of Sale",
      icon: CreditCard,
    },
    {
      href: `/event-dashboard/${eventId}/activity`,
      label: "Activity",
      icon: Flame,
    },
    {
      href: `/event-dashboard/${eventId}/raffle`,
      label: "Raffle",
      icon: Ticket,
    },
    {
      href: `/event-dashboard/${eventId}/settings`,
      label: "Settings",
      icon: Settings,
    },
  ];

  // Determine the active tab by finding the most specific match
  const activeTab = navItems.slice().reverse().find(item => pathname.startsWith(item.href))?.href || navItems[0].href;

  return (
    <Tabs value={activeTab} className="w-full">
      <TabsList className="grid w-full grid-cols-7 h-auto bg-card p-1">
        {navItems.map((item) => (
            <TabsTrigger key={item.href} value={item.href} asChild>
               <Link href={item.href} className="flex items-center gap-2 py-2">
                <item.icon className="h-4 w-4" />
                {item.label}
               </Link>
            </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
