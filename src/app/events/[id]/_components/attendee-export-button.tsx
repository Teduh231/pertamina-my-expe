'use client';

import { exportAttendeesToCsv } from "@/app/lib/actions";
import { Button, ButtonProps } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";

interface AttendeeExportButtonProps extends ButtonProps {
    eventId: string;
    eventName: string;
}

export function AttendeeExportButton({ eventId, eventName, ...props }: AttendeeExportButtonProps) {
    const { toast } = useToast();

    const handleExport = async () => {
        try {
            const csvData = await exportAttendeesToCsv(eventId);
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `${eventName.replace(/\s/g, '_')}_attendees.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({
                title: 'Export successful!',
                description: `Attendee data for "${eventName}" has been downloaded.`,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Export failed',
                description: 'Could not export attendee data. Please try again.',
            });
        }
    };

    return (
        <Button onClick={handleExport} {...props} size="sm">
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
             <span className="inline sm:hidden">Export</span>
        </Button>
    );
}
