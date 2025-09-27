import { AppLayout } from "@/components/app-layout";
import { EventDashboardNav } from "@/components/event-dashboard/event-dashboard-nav";
import { getEventById } from "@/app/lib/data";
import { notFound } from "next/navigation";

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
    <AppLayout>
      <div className="grid flex-1 md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r bg-muted/40 md:block">
          <EventDashboardNav eventId={params.id} eventName={event.name} />
        </aside>
        <main>{children}</main>
      </div>
    </AppLayout>
  );
}
