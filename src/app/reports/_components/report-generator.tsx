'use client';

import { useState } from 'react';
import { Event } from '@/app/lib/definitions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportAttendeesToCsv } from '@/app/lib/actions';

type ReportOptions = {
  attendeeList: boolean;
  loyaltyPoints: boolean;
  checkInData: boolean;
  eventAnalytics: boolean;
};

export function ReportGenerator({ events }: { events: Event[] }) {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    attendeeList: true,
    loyaltyPoints: false,
    checkInData: false,
    eventAnalytics: true,
  });
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    if (!selectedEventId) {
      toast({
        variant: 'destructive',
        title: 'No event selected',
        description: 'Please select an event to generate a report.',
      });
      return;
    }

    setIsGenerating(true);
    const selectedEvent = events.find(e => e.id === selectedEventId);
    if (!selectedEvent) return;

    try {
      // For now, we only export the attendee list as that's what's implemented.
      // In the future, this would generate a more complex PDF/XLS report.
      if (reportOptions.attendeeList) {
        if (selectedEvent.attendees.length === 0) {
            toast({
                title: 'No attendees to export',
                description: `There are no attendees for "${selectedEvent.name}".`,
            });
            setIsGenerating(false);
            return;
        }

        const csvData = await exportAttendeesToCsv(selectedEvent.id);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${selectedEvent.name.replace(/\s/g, '_')}_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'Report Generated!',
          description: `The attendee list for "${selectedEvent.name}" has been downloaded.`,
        });
      } else {
         toast({
          title: 'Select a report type',
          description: 'Please select at least one option to include in the report.',
        });
      }

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Report Generation Failed',
        description: 'Could not generate the report. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleOptionChange = (option: keyof ReportOptions) => {
    setReportOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Report Generator</CardTitle>
        <CardDescription>
          Select an event and choose the data to include in your report.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="event-select">Select Event</Label>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger id="event-select">
              <SelectValue placeholder="Choose an event..." />
            </SelectTrigger>
            <SelectContent>
              {events.map(event => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Report Contents</Label>
          <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
             <div className="flex items-center space-x-2">
                <Checkbox id="attendeeList" checked={reportOptions.attendeeList} onCheckedChange={() => handleOptionChange('attendeeList')} />
                <Label htmlFor="attendeeList" className="font-normal">Attendee List</Label>
            </div>
             <div className="flex items-center space-x-2">
                <Checkbox id="loyaltyPoints" checked={reportOptions.loyaltyPoints} onCheckedChange={() => handleOptionChange('loyaltyPoints')} disabled />
                <Label htmlFor="loyaltyPoints" className="font-normal text-muted-foreground">Loyalty Points (coming soon)</Label>
            </div>
             <div className="flex items-center space-x-2">
                <Checkbox id="checkInData" checked={reportOptions.checkInData} onCheckedChange={() => handleOptionChange('checkInData')} disabled />
                <Label htmlFor="checkInData" className="font-normal text-muted-foreground">Check-in Data (coming soon)</Label>
            </div>
             <div className="flex items-center space-x-2">
                <Checkbox id="eventAnalytics" checked={reportOptions.eventAnalytics} onCheckedChange={() => handleOptionChange('eventAnalytics')} disabled />
                <Label htmlFor="eventAnalytics" className="font-normal text-muted-foreground">Event Analytics (coming soon)</Label>
            </div>
          </div>
           <p className="text-xs text-muted-foreground pt-2">Note: PDF/XLS export is under development. Currently, only Attendee List export to CSV is supported.</p>
        </div>

      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerateReport} disabled={isGenerating || !selectedEventId} className="w-full">
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          {isGenerating ? 'Generating...' : 'Generate and Download Report'}
        </Button>
      </CardFooter>
    </Card>
  );
}
