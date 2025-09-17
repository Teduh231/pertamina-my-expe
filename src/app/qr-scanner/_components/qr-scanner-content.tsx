'use client';

import { useState, useRef, useEffect } from 'react';
import { Event, Product } from '@/app/lib/definitions';
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
  QrCode,
  CheckCircle,
  XCircle,
  CameraOff,
  Shirt,
  User,
  Clock,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { redeemProduct } from '@/app/lib/actions';
import { useAuth } from '@/hooks/use-auth';

export function QrScannerContent({ events, products }: { events: Event[], products: Product[] }) {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<{ status: 'success' | 'error'; message: string; attendeeName?: string } | null>(null);
  const [checkedInAttendees, setCheckedInAttendees] = useState<{name: string, time: string}[]>([]);
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();


  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
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
    
    if (selectedEventId) {
        getCameraPermission();
    }
  }, [selectedEventId, toast]);

  const handleScan = () => {
    setScanResult(null);
    const selectedEvent = events.find(e => e.id === selectedEventId);
    if (!selectedEvent || selectedEvent.attendees.length === 0) {
        setScanResult({ status: 'error', message: 'No attendees in this event to scan.' });
        return;
    }
    
    const success = Math.random() > 0.3;
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

  const handleRedeem = async (product: Product) => {
    if (!user) {
        toast({ variant: 'destructive', title: "You must be logged in." });
        return;
    }
    setIsRedeeming(product.id);
    const result = await redeemProduct(product.id, user.id, product.name, product.points);
    if (result.success) {
        toast({ title: "Redemption Successful!", description: `${product.name} has been redeemed.` });
    } else {
        toast({ variant: 'destructive', title: "Redemption Failed", description: result.error });
    }
    setIsRedeeming(null);
  }

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
                        {selectedEventId ? (
                            hasCameraPermission ? (
                                <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
                            ) : (
                                <div className="text-center text-muted-foreground p-4">
                                    <CameraOff className="mx-auto h-16 w-16" />
                                    <p className="mt-2 font-semibold">
                                        {hasCameraPermission === false ? 'Camera permission denied' : 'Waiting for camera...'}
                                    </p>
                                    <p className="text-sm">
                                        {hasCameraPermission === false ? 'Please allow camera access in your browser settings.' : 'Select an event to activate the scanner.'}
                                    </p>
                                </div>
                            )
                        ) : (
                            <div className="text-center text-muted-foreground p-4">
                                <CameraOff className="mx-auto h-16 w-16" />
                                <p className="mt-2 font-semibold">No event selected</p>
                                <p className="text-sm">Please select an event to activate the scanner.</p>
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
                            {products.map((item, index) => (
                                <div key={item.id}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">Stock: {item.stock}</p>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => handleRedeem(item)}
                                            disabled={isRedeeming === item.id || item.stock <= 0}
                                        >
                                          {isRedeeming === item.id ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Redeem' }
                                        </Button>
                                    </div>
                                     {index < products.length - 1 && <Separator className="mt-4" />}
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
