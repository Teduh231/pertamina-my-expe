'use client';

import { useState } from 'react';
import { Booth } from '@/app/lib/definitions';
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
  boothAnalytics: boolean;
};

export function ReportGenerator({ booths }: { booths: Booth[] }) {
  const [selectedBoothId, setSelectedBoothId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    attendeeList: true,
    loyaltyPoints: false,
    checkInData: false,
    boothAnalytics: true,
  });
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    if (!selectedBoothId) {
      toast({
        variant: 'destructive',
        title: 'No booth selected',
        description: 'Please select a booth to generate a report.',
      });
      return;
    }

    setIsGenerating(true);
    const selectedBooth = booths.find(e => e.id === selectedBoothId);
    if (!selectedBooth) return;

    try {
      // For now, we only export the attendee list as that's what's implemented.
      // In the future, this would generate a more complex PDF/XLS report.
      if (reportOptions.attendeeList) {
        if (selectedBooth.attendees.length === 0) {
            toast({
                title: 'No attendees to export',
                description: `There are no attendees for "${selectedBooth.name}".`,
            });
            setIsGenerating(false);
            return;
        }

        const csvData = await exportAttendeesToCsv(selectedBooth.id);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${selectedBooth.name.replace(/\s/g, '_')}_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'Report Generated!',
          description: `The attendee list for "${selectedBooth.name}" has been downloaded.`,
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
          Select a booth and choose the data to include in your report.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="booth-select">Select Booth</Label>
          <Select value={selectedBoothId} onValueChange={setSelectedBoothId}>
            <SelectTrigger id="booth-select">
              <SelectValue placeholder="Choose a booth..." />
            </SelectTrigger>
            <SelectContent>
              {booths.map(booth => (
                <SelectItem key={booth.id} value={booth.id}>
                  {booth.name}
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
                <Checkbox id="boothAnalytics" checked={reportOptions.boothAnalytics} onCheckedChange={() => handleOptionChange('boothAnalytics')} disabled />
                <Label htmlFor="boothAnalytics" className="font-normal text-muted-foreground">Booth Analytics (coming soon)</Label>
            </div>
          </div>
           <p className="text-xs text-muted-foreground pt-2">Note: PDF/XLS export is under development. Currently, only Attendee List export to CSV is supported.</p>
        </div>

      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerateReport} disabled={isGenerating || !selectedBoothId} className="w-full">
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          {isGenerating ? 'Generating...' : 'Generate and Download Report'}
        </Button>
      </CardFooter>
    </Card>
  );
}
