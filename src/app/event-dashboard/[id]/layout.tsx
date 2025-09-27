import { EventDashboardNav } from "@/components/event-dashboard/event-dashboard-nav";
import { getEventById } from "@/app/lib/data";
import { notFound } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import Link from "next/link";
import Image from "next/image";
import { UserProfileDropdown } from "@/components/user-profile-dropdown";


export default async function EventDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const event = await getEventById(params.id);
  if (!event) {
    notFound();
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
            <EventDashboardNav eventId={params.id} eventName={event.name} />
          </SidebarContent>
        </Sidebar>

        <div className="transition-all duration-300 ease-in-out md:ml-[var(--sidebar-width-collapsed)] group-data-[state=expanded]/sidebar:md:ml-[var(--sidebar-width)] flex flex-col h-screen">
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 shrink-0">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="flex md:hidden"/>
                    
                    <h1 className="text-lg font-semibold capitalize hidden md:block">
                        Event Dashboard
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
