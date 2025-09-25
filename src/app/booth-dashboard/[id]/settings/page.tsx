import { ProtectedRoute } from '@/hooks/use-auth';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export default function BoothSettingsPage() {

  return (
    <ProtectedRoute>
        <AppLayout>
            <Card>
                <CardHeader>
                    <CardTitle>Booth Settings</CardTitle>
                    <CardDescription>Manage settings and configurations for your booth.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-24 border-2 border-dashed rounded-lg">
                        <Wrench className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">Under Construction</h3>
                        <p className="mt-1 text-sm">Booth settings will be available here soon.</p>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    </ProtectedRoute>
  );
}
