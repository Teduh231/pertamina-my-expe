'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
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
  QrCode,
  CheckCircle,
  XCircle,
  CameraOff,
  User,
  Clock,
  Loader2,
  ScanLine,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

type ScanResult = { 
  status: 'success' | 'error' | 'info'; 
  message: string; 
  attendeeName?: string;
};

export function QrScannerContent({ events }: { events: Event[] }) {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [checkedInAttendees, setCheckedInAttendees] = useState<{name: string, time: string}[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const animationFrameId = useRef<number>();

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const processScanResult = useCallback((attendeeId: string) => {
    stopScanning();

    const selectedEvent = events.find(e => e.id === selectedEventId);
    if (!selectedEvent) {
      setScanResult({ status: 'error', message: 'No event selected. Cannot verify attendee.' });
      return;
    }

    const attendee = selectedEvent.attendees.find(a => a.id === attendeeId);
    if (attendee) {
      const alreadyCheckedIn = checkedInAttendees.some(a => a.name === attendee.name);
      if (alreadyCheckedIn) {
        setScanResult({ status: 'error', message: 'Attendee already checked in.', attendeeName: attendee.name });
      } else {
        setScanResult({ status: 'success', message: 'Check-in successful!', attendeeName: attendee.name });
        const newCheckedIn = { name: attendee.name, time: new Date().toLocaleTimeString() };
        setCheckedInAttendees(prev => [newCheckedIn, ...prev]);
      }
    } else {
      setScanResult({ status: 'error', message: 'Invalid QR Code. Attendee not found in this event.' });
    }
  }, [selectedEventId, events, checkedInAttendees, stopScanning]);

  const scanLoop = useCallback(() => {
    if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA && canvasRef.current && isScanning) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
           processScanResult(code.data);
        }
      }
    }
    if (isScanning) {
      animationFrameId.current = requestAnimationFrame(scanLoop);
    }
  }, [isScanning, processScanResult]);

  const startScanning = useCallback(async () => {
    if (!selectedEventId) {
        toast({ variant: 'destructive', title: 'No Event Selected', description: 'Please select an event before starting the scan.' });
        return;
    }
    setScanResult(null);
    setIsScanning(true);
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setIsScanning(false);
        toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
        });
    }
  }, [selectedEventId, toast]);

  useEffect(() => {
    if (hasCameraPermission && isScanning) {
      animationFrameId.current = requestAnimationFrame(scanLoop);
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [hasCameraPermission, isScanning, scanLoop]);

  useEffect(() => {
    // Cleanup camera on component unmount
    return () => stopScanning();
  }, [stopScanning]);
  
  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    setScanResult(null);
    setCheckedInAttendees([]);
    if(isScanning) stopScanning();
  };

  const getScanResultVariant = (status: ScanResult['status']) => {
    if (status === 'success') return 'default';
    if (status === 'error') return 'destructive';
    return 'default';
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
             <div>
                <h2 className="text-3xl font-bold tracking-tight">QR Scanner</h2>
                <p className="text-muted-foreground">
                    Check-in attendees by scanning their QR code.
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>QR Code Scanner</CardTitle>
                <CardDescription>
                    Arahkan kamera ke QR code peserta.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
                    <video ref={videoRef} className={cn("w-full h-full object-cover", isScanning ? "block" : "hidden")} autoPlay muted playsInline />
                    <canvas ref={canvasRef} className="hidden" />

                    {!isScanning && (
                        <div className="text-center text-muted-foreground p-4 absolute">
                            <QrCode className="mx-auto h-16 w-16" />
                            <p className="mt-2 font-semibold">Tampilan kamera akan muncul di sini</p>
                        </div>
                    )}
                    {isScanning && (
                         <div className="absolute inset-0 bg-transparent flex items-center justify-center">
                            <ScanLine className="h-1/2 w-1/2 text-white/20 animate-pulse" />
                        </div>
                    )}
                </div>
                 {hasCameraPermission === false && (
                    <Alert variant="destructive">
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>Please allow camera access to use this feature.</AlertDescription>
                    </Alert>
                )}
                <Button onClick={isScanning ? stopScanning : startScanning} className="w-full" disabled={!selectedEventId}>
                    {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    {isScanning ? 'Hentikan Scan' : 'Mulai Scan'}
                </Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Hasil Pindaian</CardTitle>
                 <CardDescription>Status check-in peserta akan muncul di sini.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!scanResult && (
                    <div className="text-center text-muted-foreground py-16">
                        <User className="mx-auto h-12 w-12" />
                        <p className="mt-4 font-semibold">Menunggu Pindaian</p>
                        <p className="text-sm">Scan QR code untuk melihat hasil.</p>
                    </div>
                )}
                {scanResult && (
                    <Alert variant={getScanResultVariant(scanResult.status)}>
                        {scanResult.status === 'success' && <CheckCircle className="h-4 w-4" />}
                        {scanResult.status === 'error' && <XCircle className="h-4 w-4" />}
                        <AlertTitle>{scanResult.attendeeName || "Hasil Pindaian"}</AlertTitle>
                        <AlertDescription>{scanResult.message}</AlertDescription>
                    </Alert>
                )}

                <Separator />
                
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        Riwayat Check-in ({checkedInAttendees.length})
                    </h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {checkedInAttendees.length > 0 ? checkedInAttendees.map((attendee, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <p className="font-medium">{attendee.name}</p>
                                <p className="text-muted-foreground">{attendee.time}</p>
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Belum ada peserta yang check-in.</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
