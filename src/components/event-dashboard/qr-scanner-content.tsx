
'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import jsQR from 'jsqr';
import { Event, Product, Attendee, CheckIn, Activity } from '@/app/lib/definitions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  QrCode,
  CheckCircle,
  XCircle,
  Loader2,
  ScanLine,
  Shirt,
  Info,
  CameraOff,
  ImageIcon,
  Flame,
  Clock,
  User,
  History,
  ShoppingBag,
  List,
  Phone,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { createCheckIn, addActivityParticipant } from '@/app/lib/actions';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

type ScanMode = 'check-in' | 'activity';
type ScanResult = { 
  status: 'success' | 'error' | 'info'; 
  message: string; 
  attendeeName?: string; 
  isInfo?: boolean 
};

export function QrScannerContent({ event, products, activities }: { event: Event & { check_ins?: CheckIn[] }, products: Product[], activities: Activity[] }) {
  const [scanMode, setScanMode] = useState<ScanMode>('check-in');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const animationFrameId = useRef<number>();
  
  const stopCamera = useCallback(() => {
    setIsScanning(false);
    if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
    }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);
  
  const handleCheckIn = useCallback(async (attendeeId: string) => {
    setIsProcessing(true);
    const result = await createCheckIn(attendeeId, event.id);

    if (result.success) {
      setScanResult({ status: 'success', message: 'Attendee checked in successfully!' });
       toast({
        title: "Check-in Successful",
        description: `An attendee has been checked into ${event.name}.`,
      });
      router.refresh();
    } else {
      setScanResult({ status: 'error', message: result.error || 'Check-in failed.' });
    }

    setIsProcessing(false);
    stopCamera();
  }, [event, router, stopCamera, toast]);

  const handleActivityCompletion = useCallback(async (attendeeId: string) => {
    if (!selectedActivityId) {
        setScanResult({ status: 'error', message: 'No activity selected.' });
        stopCamera();
        return;
    };

    setIsProcessing(true);
    const result = await addActivityParticipant(selectedActivityId, attendeeId);
    
    if(result.success) {
        setScanResult({ status: 'success', message: result.message, attendeeName: result.attendeeName });
        toast({
            title: 'Activity Completed!',
            description: `${result.attendeeName} awarded ${result.pointsAwarded} points.`,
        });
        router.refresh();
    } else {
        setScanResult({ status: result.isInfo ? 'info' : 'error', message: result.error, attendeeName: result.attendeeName });
    }

    setIsProcessing(false);
    stopCamera();
  }, [selectedActivityId, router, stopCamera, toast]);

  const processQrData = useCallback((qrData: string) => {
    if (isProcessing) return;

    if (scanMode === 'check-in') {
      handleCheckIn(qrData);
    } else if (scanMode === 'activity') {
      handleActivityCompletion(qrData);
    }
  }, [scanMode, isProcessing, handleCheckIn, handleActivityCompletion]);

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
           processQrData(code.data);
        }
      }
    }
    if (isScanning) {
      animationFrameId.current = requestAnimationFrame(scanLoop);
    }
  }, [isScanning, processQrData]);

  const startScanning = useCallback(async () => {
    if (isScanning) return;
    setScanResult(null);
    setIsProcessing(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsScanning(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to use this app.',
      });
    }
  }, [isScanning, toast]);

  useEffect(() => {
    if (isScanning) {
      animationFrameId.current = requestAnimationFrame(scanLoop);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isScanning, scanLoop]);
  
  useEffect(() => {
    // Cleanup camera on component unmount
    return () => stopCamera();
  }, [stopCamera]);
  
  const getScanResultVariant = (status: ScanResult['status']) => {
    if (status === 'success') return 'default';
    if (status === 'error') return 'destructive';
    return 'default'; // for 'info'
  }
  
  const scannerTitle = scanMode === 'check-in' ? "Attendee Check-in" : "Activity Completion";
  const scannerDescription = scanMode === 'check-in' 
    ? "Scan an attendee's QR code to check them into the event." 
    : `Scan to award points for completing "${activities.find(a => a.id === selectedActivityId)?.name || '...'}"`;

  const sortedCheckIns = useMemo(() => {
    if (!event.check_ins) return [];
    return [...event.check_ins].sort((a, b) => new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime());
  }, [event.check_ins]);
  

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{scannerTitle}</CardTitle>
                    <CardDescription>{scannerDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
                        <video ref={videoRef} className={cn("w-full h-full object-cover", isScanning ? "block" : "hidden")} autoPlay muted playsInline />
                        <canvas ref={canvasRef} className="hidden" />

                        {!isScanning && (
                            <div className="text-center text-muted-foreground p-4 absolute">
                                <CameraOff className="mx-auto h-16 w-16" />
                                <p className="mt-2 font-semibold">Scanner is Off</p>
                            </div>
                        )}
                        {hasCameraPermission === false && (
                            <div className="text-center text-muted-foreground p-4 absolute">
                                <CameraOff className="mx-auto h-16 w-16" />
                                <p className="mt-2 font-semibold">Camera Access Denied</p>
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
                    {scanResult && (
                        <Alert variant={getScanResultVariant(scanResult.status)} className="h-full">
                            {scanResult.status === 'success' && <CheckCircle className="h-4 w-4" />}
                            {scanResult.status === 'error' && <XCircle className="h-4 w-4" />}
                            {scanResult.status === 'info' && <Info className="h-4 w-4" />}
                            <AlertTitle>{scanResult.attendeeName || "Scan Result"}</AlertTitle>
                            <AlertDescription>{scanResult.message}</AlertDescription>
                        </Alert>
                    )}
                    <Button onClick={isScanning ? stopCamera : startScanning} className="w-full" disabled={isProcessing || (scanMode === 'activity' && !selectedActivityId)}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <QrCode className="mr-2 h-4 w-4" />}
                        {isProcessing ? 'Processing...' : isScanning ? 'Stop Scanner' : 'Start Scanner'}
                    </Button>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Scan Mode</CardTitle>
                    <CardDescription>Select what you want to scan for.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup value={scanMode} onValueChange={(v) => setScanMode(v as ScanMode)} className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="check-in" id="check-in"/>
                            <Label htmlFor="check-in">Attendee Check-in</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="activity" id="activity"/>
                            <Label htmlFor="activity">Activity Completion</Label>
                        </div>
                    </RadioGroup>
                    {scanMode === 'activity' && (
                        <div className="mt-4 space-y-2">
                            <Label>Select Activity:</Label>
                             <ScrollArea className="h-40 border rounded-md p-2">
                                {activities.map(act => (
                                    <Button 
                                        key={act.id} 
                                        variant={selectedActivityId === act.id ? 'secondary' : 'ghost'}
                                        className="w-full justify-start"
                                        onClick={() => setSelectedActivityId(act.id)}
                                    >
                                        {act.name}
                                    </Button>
                                ))}
                            </ScrollArea>
                        </div>
                    )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><History className="mr-2 h-5 w-5"/>Check-in History</CardTitle>
                    <CardDescription>Most recent attendees who checked-in.</CardDescription>
                </CardHeader>
                <ScrollArea className="h-72">
                    <CardContent className="space-y-3">
                        {sortedCheckIns.length > 0 ? sortedCheckIns.map((checkIn) => (
                            <div key={checkIn.id} className="flex items-center justify-between text-sm">
                                <p className="font-medium flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{checkIn.phone_number}</p>
                                <p className="text-muted-foreground">{format(new Date(checkIn.checked_in_at), 'p')}</p>
                            </div>
                        )) : (
                            <div className="text-center text-muted-foreground py-10">
                                <p>No attendees checked in yet.</p>
                            </div>
                        )}
                    </CardContent>
                </ScrollArea>
            </Card>
        </div>
    </div>
  );
}
