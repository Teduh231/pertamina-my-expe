import { AppLayout } from "@/components/app-layout";

export default async function EventDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <AppLayout>
        {children}
      </AppLayout>
  );
}
