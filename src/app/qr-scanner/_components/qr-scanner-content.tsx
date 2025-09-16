'use client';

import { useState, useRef, useEffect } from 'react';
import { Event } from '@/app/lib/definitions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  QrCode,
  CheckCircle,
  XCircle,
  CameraOff,
  Shirt,
  User,
  Clock,
  Ticket,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const mockMerchandise = [
    { id: 'm1', name: 'Official T-Shirt', stock: 50 },
    { id: 'm2', name: 'Limited Edition Poster', stock: 100 },
    { id: 'm3', name: 'Sticker Pack', stock: 200 },
];

export function QrScannerContent({ events }: { events: Event[] }) {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<{ status: 'success' | 'error'; message: string; attendeeName?: string } | null>(null);
  const [checkedInAttendees, setCheckedInAttendees] = useState<{name: string, time: string}[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Mock effect to simulate getting camera permission
    // In a real app, you would use navigator.mediaDevices.getUserMedia
    const getCameraPermission = async () => {
        try {
            // This is a placeholder. A real implementation would be more complex.
            // For security reasons, browsers require user interaction to grant camera access.
            // We simulate a successful permission grant after a delay.
            // In a real implementation, you would use:
            // const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // and handle success and error cases.
            setHasCameraPermission(true);
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({
                variant: 'destructive',
                title: 'Camera Access Denied',
                description: 'Please enable camera permissions in your browser settings.',
            });
        }
    };
    
    // We only request permission if an event is selected to avoid unnecessary prompts
    if (selectedEventId) {
        getCameraPermission();
    }
  }, [selectedEventId, toast]);

  const handleScan = () => {
    // This is a mock scan function.
    // In a real app, you would use a QR library (like html5-qrcode) to process the video stream.
    setScanResult(null);
    const selectedEvent = events.find(e => e.id === selectedEventId);
    if (!selectedEvent || selectedEvent.attendees.length === 0) {
        setScanResult({ status: 'error', message: 'No attendees in this event to scan.' });
        return;
    }
    
    // Simulate finding or not finding an attendee
    const success = Math.random() > 0.3; // 70% chance of success
    if (success) {
        const randomAttendee = selectedEvent.attendees[Math.floor(Math.random() * selectedEvent.attendees.length)];
        const alreadyCheckedIn = checkedInAttendees.some(a => a.name === randomAttendee.name);

        if (alreadyCheckedIn) {
             setScanResult({ status: 'error', message: 'Attendee already checked in.', attendeeName: randomAttendee.name });
        } else {
            setScanResult({ status: 'success', message: 'Check-in successful!', attendeeName: randomAttendee.name });
            const newCheckedIn = { name: randomAttendee.name, time: new Date().toLocaleTimeString() };
            setCheckedInAttendees(prev => [newCheckedIn, ...prev]);
        }
    } else {
        setScanResult({ status: 'error', message: 'Invalid QR Code. Attendee not found.' });
    }
  };
  
  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    setScanResult(null);
    setCheckedInAttendees([]);
    setHasCameraPermission(null);
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
             <div>
                <h2 className="text-3xl font-bold tracking-tight">QR Scanner</h2>
                <p className="text-muted-foreground">
                    Check-in attendees and manage merchandise for your event.
                </p>
            </div>
             <Select value={selectedEventId} onValueChange={handleEventChange}>
                <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select an event to start..." />
                </SelectTrigger>
                <SelectContent>
                    {events.filter(e => e.status === 'published').map(event => (
                    <SelectItem key={event.id} value={event.id}>
                        {event.name}
                    </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Scanner</CardTitle>
                    <CardDescription>
                        Point a QR code at the camera to check-in an attendee.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center overflow-hidden">
                        {selectedEventId && hasCameraPermission ? (
                            // In a real app, the video stream would be here
                            // <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted />
                             <div className="text-center text-muted-foreground p-4">
                                <QrCode className="mx-auto h-16 w-16" />
                                <p className="mt-2 font-semibold">Camera is active</p>
                                <p className="text-sm">Ready to scan QR codes.</p>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground p-4">
                                <CameraOff className="mx-auto h-16 w-16" />
                                <p className="mt-2 font-semibold">
                                    {selectedEventId ? 'Camera permission needed' : 'No event selected'}
                                </p>
                                <p className="text-sm">
                                    {selectedEventId ? 'Allow camera access to begin scanning.' : 'Please select an event to activate the scanner.'}
                                </p>
                            </div>
                        )}
                    </div>
                     {hasCameraPermission === false && (
                        <Alert variant="destructive">
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                                Please allow camera access in your browser settings to use this feature.
                            </AlertDescription>
                        </Alert>
                    )}
                    <Button onClick={handleScan} disabled={!selectedEventId || !hasCameraPermission} className="w-full">
                        <QrCode className="mr-2 h-4 w-4" />
                        Simulate Scan
                    </Button>
                    {scanResult && (
                        <Alert variant={scanResult.status === 'success' ? 'default' : 'destructive'}>
                            {scanResult.status === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            <AlertTitle>{scanResult.attendeeName ? `${scanResult.attendeeName}` : "Scan Result"}</AlertTitle>
                            <AlertDescription>
                                {scanResult.message}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1">
            <Tabs defaultValue="check-in">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="check-in">Check-ins</TabsTrigger>
                    <TabsTrigger value="merch">Merchandise</TabsTrigger>
                </TabsList>
                <TabsContent value="check-in" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><User className="mr-2 h-5 w-5"/>Checked-in Attendees</CardTitle>
                             <CardDescription>{checkedInAttendees.length} people have checked in.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                            {checkedInAttendees.length > 0 ? checkedInAttendees.map((attendee, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{attendee.name}</p>
                                        <p className="text-xs text-muted-foreground flex items-center"><Clock className="mr-1.5 h-3 w-3"/>{attendee.time}</p>
                                    </div>
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                </div>
                            )) : (
                                <div className="text-center text-muted-foreground py-10">
                                    <p>No one has checked in yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="merch" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><Shirt className="mr-2 h-5 w-5"/>Event Merchandise</CardTitle>
                             <CardDescription>Manage merchandise stock.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {mockMerchandise.map((item, index) => (
                                <div key={item.id}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">Stock: {item.stock}</p>
                                        </div>
                                        <Button size="sm" variant="outline">Redeem</Button>
                                    </div>
                                     {index < mockMerchandise.length - 1 && <Separator className="mt-4" />}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}
