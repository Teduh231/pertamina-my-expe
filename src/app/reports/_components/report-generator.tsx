'use client';

import { useState } from 'react';
import { Booth } from '@/app/lib/definitions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Loader2, BarChart, Users, Award, Flame, PieChart, ShoppingBasket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportBoothAttendeesToCsv } from '@/app/lib/actions';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

type ReportType = 'attendance' | 'sales' | 'engagement' | 'activations' | 'points' | 'raffles';

const reportTypes: { id: ReportType; title: string; description: string; icon: React.ElementType }[] = [
    { id: 'attendance', title: 'Attendance Report', description: 'List of all attendees who checked-in to the booth.', icon: Users },
    { id: 'sales', title: 'Sales Report', description: 'Detailed breakdown of all merchandise transactions.', icon: ShoppingBasket },
    { id: 'engagement', title: 'Engagement Metrics', description: 'Analytics on attendee interactions and activity.', icon: PieChart },
    { id: 'activations', title: 'Activation Analytics', description: 'Performance of each booth activity.', icon: Flame },
    { id: 'points', title: 'Points Distribution', description: 'Track all points awarded and redeemed.', icon: Award },
    { id: 'raffles', title: 'Raffle Results', description: 'Summary of all raffle winners and prizes.', icon: BarChart },
];

export function ReportGenerator({ booths }: { booths: Booth[] }) {
  const { isAdmin, assignedBoothId } = useAuth();
  const [selectedBoothId, setSelectedBoothId] = useState<string>(!isAdmin && assignedBoothId ? assignedBoothId : '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    if (!selectedBoothId) {
      toast({ variant: 'destructive', title: 'No booth selected' });
      return;
    }
    if (selectedReport !== 'attendance') {
      toast({ title: 'Feature not available', description: 'This report type is coming soon.' });
      return;
    }

    setIsGenerating(true);
    const selectedBooth = booths.find(e => e.id === selectedBoothId);
    if (!selectedBooth) {
        setIsGenerating(false);
        toast({ variant: 'destructive', title: 'Booth not found' });
        return;
    }

    try {
        const csvData = await exportBoothAttendeesToCsv(selectedBooth.id);
        const rows = csvData.split('\n');
        if (rows.length <= 1) {
            toast({ title: 'No attendees to export', description: `There are no checked-in attendees for "${selectedBooth.name}".`});
            setIsGenerating(false);
            return;
        }

        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${selectedBooth.name.replace(/\s/g, '_')}_${selectedReport}_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'Report Generated!',
          description: `The ${selectedReport} report for "${selectedBooth.name}" has been downloaded.`,
        });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Report Generation Failed', description: 'Could not generate the report. Please try again.' });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const visibleBooths = isAdmin ? booths : booths.filter(b => b.id === assignedBoothId);
  const currentReportDetails = reportTypes.find(r => r.id === selectedReport);
  const isDownloadable = selectedReport === 'attendance';
  const selectedBoothName = booths.find(b => b.id === selectedBoothId)?.name;

  return (
    <div className="space-y-8">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Report Generator</h2>
            <p className="text-muted-foreground">Select a booth and a report type to generate a download.</p>
        </div>
        
        {/* Step 1: Select Booth */}
        <Card>
            <CardHeader>
                <CardTitle>Step 1: Select a Booth</CardTitle>
            </CardHeader>
            <CardContent>
                {isAdmin ? (
                    <Select value={selectedBoothId} onValueChange={setSelectedBoothId}>
                        <SelectTrigger id="booth-select" className="max-w-md">
                            <SelectValue placeholder="Choose a booth..." />
                        </SelectTrigger>
                        <SelectContent>
                            {visibleBooths.map(booth => (
                                <SelectItem key={booth.id} value={booth.id}>{booth.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="p-4 rounded-lg bg-muted max-w-md">
                        <p className="font-semibold">{selectedBoothName || "Your Assigned Booth"}</p>
                        <p className="text-sm text-muted-foreground">As a tenant, you can only generate reports for your assigned booth.</p>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Step 2: Select Report Type */}
        <Card>
             <CardHeader>
                <CardTitle>Step 2: Select a Report Type</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportTypes.map((report) => (
                    <div
                        key={report.id}
                        onClick={() => selectedBoothId && setSelectedReport(report.id)}
                        className={cn(
                            "p-4 rounded-lg border-2 cursor-pointer transition-all bg-card",
                            selectedReport === report.id ? "border-primary ring-2 ring-primary" : "hover:border-primary/50",
                            !selectedBoothId && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <report.icon className="h-8 w-8 text-primary mb-2" />
                        <h3 className="font-semibold">{report.title}</h3>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                ))}
            </CardContent>
        </Card>

        {/* Step 3: Generate Report */}
        {selectedReport && currentReportDetails && (
            <Card>
                <CardHeader>
                    <CardTitle>Step 3: Generate "{currentReportDetails.title}"</CardTitle>
                    <CardDescription>Booth: <span className="font-semibold text-primary">{selectedBoothName}</span></CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center p-8 bg-muted/50 rounded-lg">
                    <currentReportDetails.icon className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="max-w-md mx-auto text-muted-foreground">
                        {isDownloadable 
                            ? `You are about to generate the ${currentReportDetails.title}. This will be downloaded as a CSV file.`
                            : `The "${currentReportDetails.title}" is not available for download yet. This feature is coming soon.`
                        }
                    </p>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleGenerateReport} disabled={isGenerating || !selectedBoothId || !isDownloadable} className="w-full sm:w-auto ml-auto">
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        {isGenerating ? 'Generating...' : 'Download Report'}
                    </Button>
                </CardFooter>
            </Card>
        )}
    </div>
  );
}
