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
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export function EventDashboardNav({
  eventId,
  eventName,
}: {
  eventId: string;
  eventName: string;
}) {
  const pathname = usePathname();
  const navItems = [
    {
      href: `/event-dashboard/${eventId}/overview`,
      label: "Overview",
      icon: LayoutGrid,
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
      href: `/event-dashboard/${eventId}/scanner`,
      label: "Scanner",
      icon: QrCode,
    },
    {
      href: `/event-dashboard/${eventId}/settings`,
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <nav className="grid items-start gap-2 p-4 text-sm font-medium">
      <div className="pb-4">
        <h3 className="font-semibold text-lg text-primary">{eventName}</h3>
        <p className="text-xs text-muted-foreground">Event Management</p>
      </div>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
            pathname === item.href && "bg-primary/10 text-primary"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
       <div className="my-4 border-t"></div>
        <Button variant="ghost" asChild className="justify-start text-muted-foreground">
            <Link href="/events">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Events
            </Link>
        </Button>
    </nav>
  );
}
