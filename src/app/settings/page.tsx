
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProtectedRoute } from '@/hooks/use-auth';
import { Wrench } from 'lucide-react';

export default function SettingsPage() {
  return (
    <ProtectedRoute adminOnly={true}>
      <AppLayout>
        <Card>
            <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Manage your application settings.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center text-muted-foreground py-24 border-2 border-dashed rounded-lg">
                    <Wrench className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">Under Construction</h3>
                    <p className="mt-1 text-sm">Global settings will be available here soon.</p>
                </div>
            </CardContent>
        </Card>
      </AppLayout>
    </ProtectedRoute>
  );
}
