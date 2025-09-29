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
import { createCheckIn, addActivityParticipant, verifyAttendeeWithPertaminaAPI, redeemProduct } from '@/app/lib/actions';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

type ScanMode = 'check-in' | 'merch' | 'activity';

type ScanResult = { 
  status: 'success' | 'error' | 'info'; 
  message: string; 
  attendeeName?: string;
  phoneNumber?: string;
};

// The full CheckIn object with the nested Attendee object
type RichCheckIn = CheckIn & { attendees: Attendee | null };

export function QrScannerContent({ event, products, activities }: { event: Event & { check_ins?: RichCheckIn[] }, products: Product[], activities: Activity[] }) {
  const [scanMode, setScanMode] = useState<ScanMode>('check-in');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedAttendee, setScannedAttendee] = useState<Attendee | null>(null);
  
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

  const handleCheckIn = useCallback(async (qrData: string) => {
    setIsProcessing(true);
    const verificationResult = await verifyAttendeeWithPertaminaAPI(qrData);

    if (!verificationResult.success) {
      setScanResult({ status: 'error', message: verificationResult.error });
      setIsProcessing(false);
      stopCamera();
      return;
    }
    
    const { phoneNumber } = verificationResult;

    const checkInResult = await createCheckIn(event.id, phoneNumber);
    if (checkInResult.success) {
      setScanResult({ status: 'success', message: 'Check-in berhasil!', phoneNumber: phoneNumber });
      toast({ title: "Check-in Berhasil", description: `Nomor telepon ${phoneNumber} telah check-in.` });
      router.refresh();
    } else {
      setScanResult({ status: 'error', message: checkInResult.error || 'Check-in Gagal.', phoneNumber: phoneNumber });
    }

    setIsProcessing(false);
    stopCamera();
}, [event.id, router, stopCamera, toast]);


  const handleScanForAction = useCallback(async (qrData: string) => {
    setIsProcessing(true);
    stopCamera(); // Stop scanning while we process
    const verificationResult = await verifyAttendeeWithPertaminaAPI(qrData);
    if (!verificationResult.success) {
        setScanResult({ status: 'error', message: verificationResult.error });
        setIsProcessing(false);
        return;
    }
    // A bit of a hack: check-in is required to get an attendee record.
    // In a real app, you'd have a separate endpoint to just get attendee details.
    const checkInResult = await createCheckIn(event.id, verificationResult.phoneNumber);
    if (checkInResult.success && checkInResult.checkIn.attendees) {
        setScannedAttendee(checkInResult.checkIn.attendees);
        setScanResult({ status: 'success', message: `Validated ${checkInResult.checkIn.attendees.name}. Select an item to redeem or activity to join.`, attendeeName: checkInResult.checkIn.attendees.name });
    } else {
       // Find from existing check-ins
       const existingCheckin = event.check_ins?.find(ci => ci.phone_number === verificationResult.phoneNumber);
       if (existingCheckin && existingCheckin.attendees) {
         setScannedAttendee(existingCheckin.attendees);
         setScanResult({ status: 'success', message: `Validated ${existingCheckin.attendees.name}. Select an item to redeem or activity to join.`, attendeeName: existingCheckin.attendees.name });
       } else {
         setScanResult({ status: 'error', message: checkInResult.error || 'Could not validate attendee.' });
       }
    }
    setIsProcessing(false);
  }, [event.id, event.check_ins]);
  

  const processQrData = useCallback((qrData: string) => {
    if (isProcessing) return;

    if (scanMode === 'check-in') {
      handleCheckIn(qrData);
    } else {
      handleScanForAction(qrData);
    }
  }, [isProcessing, scanMode, handleCheckIn, handleScanForAction]);

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
    setScannedAttendee(null);

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
    return () => stopCamera();
  }, [stopCamera]);
  
  const getScanResultVariant = (status: ScanResult['status']) => {
    if (status === 'success') return 'default';
    if (status === 'error') return 'destructive';
    return 'default';
  }

  const sortedCheckIns = useMemo(() => {
    if (!event.check_ins) return [];
    return [...event.check_ins].sort((a, b) => new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime());
  }, [event.check_ins]);
  
  const scannerTitles = {
    'check-in': { title: "QR Scanner: Check-in", description: "Mulai pindai untuk melakukan check-in attendee." },
    'merch': { title: "QR Scanner: Redeem Merchandise", description: "Pindai QR attendee untuk menebus poin dengan merchandise." },
    'activity': { title: "QR Scanner: Join Activity", description: "Pindai QR attendee untuk mengikuti aktivitas." },
  };

  const handleRedeem = async (productId: string) => {
    if (!scannedAttendee) return;
    setIsProcessing(true);
    const result = await redeemProduct(scannedAttendee.id, productId, event.id);
     if (result.success) {
        toast({ title: "Redemption Successful", description: `${result.attendeeName} redeemed an item.`});
        setScannedAttendee(null);
        router.refresh();
    } else {
        toast({ variant: 'destructive', title: "Redemption Failed", description: result.error });
    }
    setIsProcessing(false);
  }

  const handleJoinActivity = async (activityId: string) => {
    if (!scannedAttendee) return;
    setIsProcessing(true);
    const result = await addActivityParticipant(activityId, scannedAttendee.id);
    if (result.success) {
        toast({ title: "Activity Joined!", description: `${result.attendeeName} joined the activity.`});
        setScannedAttendee(null);
        router.refresh();
    } else {
        toast({ variant: result.isInfo ? 'default' : 'destructive', title: "Could not join activity", description: result.error });
    }
     setIsProcessing(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{scannerTitles[scanMode].title}</CardTitle>
                    <CardDescription>{scannerTitles[scanMode].description}</CardDescription>
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
                            <AlertTitle>{scanResult.attendeeName || scanResult.phoneNumber || "Scan Result"}</AlertTitle>
                            <AlertDescription>{scanResult.message}</AlertDescription>
                        </Alert>
                    )}
                    <Button onClick={isScanning ? stopCamera : startScanning} className="w-full" disabled={isProcessing}>
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
                    <CardDescription>Select an action for the QR scan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup value={scanMode} onValueChange={(v) => setScanMode(v as ScanMode)} className="gap-4">
                        <Label htmlFor="mode-check-in" className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer has-[:checked]:bg-accent has-[:checked]:border-primary">
                            <RadioGroupItem value="check-in" id="mode-check-in" />
                            <User className="h-5 w-5" />
                            <span>Check-in Attendee</span>
                        </Label>
                        <Label htmlFor="mode-merch" className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer has-[:checked]:bg-accent has-[:checked]:border-primary">
                            <RadioGroupItem value="merch" id="mode-merch" />
                            <ShoppingBag className="h-5 w-5" />
                            <span>Redeem Merchandise</span>
                        </Label>
                        <Label htmlFor="mode-activity" className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer has-[:checked]:bg-accent has-[:checked]:border-primary">
                            <RadioGroupItem value="activity" id="mode-activity" />
                            <Flame className="h-5 w-5" />
                            <span>Join Activity</span>
                        </Label>
                    </RadioGroup>
                </CardContent>
            </Card>
            
            {scannedAttendee && scanMode === 'merch' && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Redeem for {scannedAttendee.name}</CardTitle>
                        <CardDescription>Available Points: {scannedAttendee.points}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {products.filter(p => p.stock > 0).map(product => (
                            <Button key={product.id} onClick={() => handleRedeem(product.id)} disabled={isProcessing || scannedAttendee.points < product.points} variant="outline" className="w-full justify-between mb-2">
                                <span>{product.name}</span>
                                <span>{product.points} pts</span>
                            </Button>
                        ))}
                    </CardContent>
                 </Card>
            )}

            {scannedAttendee && scanMode === 'activity' && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Join Activity for {scannedAttendee.name}</CardTitle>
                        <CardDescription>Select an activity to join.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {activities.map(activity => (
                            <Button key={activity.id} onClick={() => handleJoinActivity(activity.id)} disabled={isProcessing} variant="outline" className="w-full justify-between mb-2">
                                <span>{activity.name}</span>
                                <span>+{activity.points_reward} pts</span>
                            </Button>
                        ))}
                    </CardContent>
                 </Card>
            )}

            {scanMode === 'check-in' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><History className="mr-2 h-5 w-5"/>Check-in History</CardTitle>
                        <CardDescription>Most recent attendees who checked-in.</CardDescription>
                    </CardHeader>
                    <ScrollArea className="h-72">
                        <CardContent className="space-y-3">
                            {sortedCheckIns.length > 0 ? sortedCheckIns.map((checkIn) => (
                                <div key={checkIn.id} className="flex items-center justify-between text-sm">
                                    <div>
                                        <p className="font-medium flex items-center gap-2">{checkIn.attendees?.name || 'Unknown User'}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-2 pl-1"><Phone className="h-3 w-3" />{checkIn.phone_number}</p>
                                    </div>
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
            )}
        </div>
    </div>
  );
}
