'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import jsQR from 'jsqr';
import { Booth, Product, Attendee, CheckIn, Activity } from '@/app/lib/definitions';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { redeemMerchandiseForAttendee, createCheckIn } from '@/app/lib/actions';
import { getAttendeeById } from '@/app/lib/data';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

type ScanResult = { 
  status: 'success' | 'error' | 'info'; 
  message: string; 
  attendeeName?: string;
  pointsUsed?: number;
  remainingPoints?: number;
};

type HydratedCheckIn = CheckIn & {
  attendees: { name: string; email: string } | null;
};

export function QrScannerContent({ booth, products, activities }: { booth: Booth & { check_ins: HydratedCheckIn[] }, products: Product[], activities: Activity[] }) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activeAction, setActiveAction] = useState<'check-in' | 'merch' | 'activity'>('check-in');
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

  const handleMerchRedemption = useCallback(async (attendeeId: string) => {
      if (!selectedProduct) return;
      setIsProcessing(true);
      const result = await redeemMerchandiseForAttendee(attendeeId, selectedProduct.id, booth.id);
      
      if (result.success) {
          setScanResult({
              status: 'success',
              message: result.message || 'Redemption successful!',
              attendeeName: result.attendeeName,
              pointsUsed: result.pointsUsed,
              remainingPoints: result.remainingPoints,
          });
          toast({
              title: 'Redemption Successful!',
              description: `${result.attendeeName} redeemed ${selectedProduct.name}.`,
          });
          router.refresh();
      } else {
          setScanResult({
              status: 'error',
              message: result.error || 'Redemption failed.',
              attendeeName: result.attendeeName,
          });
      }
      setIsProcessing(false);
      setSelectedProduct(null);
      setActiveAction('check-in');
      stopCamera();
  }, [selectedProduct, toast, booth.id, router, stopCamera]);

  const handleCheckIn = useCallback(async (attendeeId: string) => {
      setIsProcessing(true);
      const attendee = await getAttendeeById(attendeeId);
      
      if (attendee) {
        const result = await createCheckIn(attendeeId, booth.id);
        if (result.success) {
          setScanResult({ status: 'success', message: 'Check-in successful!', attendeeName: attendee.name });
          router.refresh();
        } else {
          if (result.error?.includes('already checked in')) {
            setScanResult({ status: 'info', message: result.error, attendeeName: attendee.name });
          } else {
            setScanResult({ status: 'error', message: result.error || 'Check-in failed.', attendeeName: attendee.name });
          }
        }
      } else {
        setScanResult({ status: 'error', message: 'Invalid QR Code. Attendee not found.' });
      }
      setIsProcessing(false);
      stopCamera();
  }, [booth.id, router, stopCamera]);
  
  const handleActivityJoin = useCallback(async (attendeeId: string) => {
    // TODO: Implement activity join logic
    if (!selectedActivity) return;
    setIsProcessing(true);
    setScanResult({ status: 'info', message: `Simulating join for ${selectedActivity.name}. Not yet implemented.`, attendeeName: 'Attendee' });
    setIsProcessing(false);
    setSelectedActivity(null);
    setActiveAction('check-in');
    stopCamera();
  }, [selectedActivity, stopCamera]);


  const processQrData = useCallback((qrData: string) => {
    if (isProcessing) return;

    if (activeAction === 'merch' && selectedProduct) {
        handleMerchRedemption(qrData);
    } else if (activeAction === 'activity' && selectedActivity) {
        handleActivityJoin(qrData);
    } else if (activeAction === 'check-in') {
        handleCheckIn(qrData);
    }
  }, [activeAction, selectedProduct, selectedActivity, handleMerchRedemption, handleCheckIn, handleActivityJoin, isProcessing]);

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
  
  const scannerTitle = useMemo(() => {
    if (activeAction === 'merch' && selectedProduct) return `Redeeming: ${selectedProduct.name}`;
    if (activeAction === 'activity' && selectedActivity) return `Activity: ${selectedActivity.name}`;
    return 'QR Scanner';
  }, [activeAction, selectedProduct, selectedActivity]);

  const scannerDescription = useMemo(() => {
    if (activeAction === 'merch' && selectedProduct) return `Scan attendee's QR to redeem for ${selectedProduct.points} points.`;
     if (activeAction === 'activity' && selectedActivity) return `Scan attendee's QR to join activity. Reward: ${selectedActivity.points_reward} points.`;
    return "Start the scanner to check-in an attendee.";
  }, [activeAction, selectedProduct, selectedActivity]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="h-full">
            <CardHeader>
                <CardTitle>{scannerTitle}</CardTitle>
                <CardDescription>
                    {scannerDescription}
                </CardDescription>
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
                <Button onClick={isScanning ? stopCamera : startScanning} className="w-full" disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <QrCode className="mr-2 h-4 w-4" />}
                    {isProcessing ? 'Processing...' : isScanning ? 'Stop Scanner' : 'Start Scanner'}
                </Button>
                 {scanResult && (
                    <Alert variant={getScanResultVariant(scanResult.status)}>
                        {scanResult.status === 'success' && <CheckCircle className="h-4 w-4" />}
                        {scanResult.status === 'error' && <XCircle className="h-4 w-4" />}
                        {scanResult.status === 'info' && <Info className="h-4 w-4" />}
                        <AlertTitle>{scanResult.attendeeName || "Scan Result"}</AlertTitle>
                        <AlertDescription>{scanResult.message}</AlertDescription>
                        {scanResult.status === 'success' && scanResult.pointsUsed !== undefined && (
                            <div className='mt-2 text-xs'>
                                <p>Points Used: {scanResult.pointsUsed}</p>
                                <p>Remaining Points: {scanResult.remainingPoints}</p>
                            </div>
                        )}
                    </Alert>
                )}
            </CardContent>
        </Card>
    </div>

    <div className="lg:col-span-1">
        <Card>
            <CardHeader>
                <CardTitle>Select Action</CardTitle>
                <CardDescription>Choose what to do when a QR is scanned.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <RadioGroup value={activeAction} onValueChange={(value) => setActiveAction(value as any)} className="grid grid-cols-3 gap-2">
                    <div>
                        <RadioGroupItem value="check-in" id="check-in" className="peer sr-only" />
                        <Label htmlFor="check-in" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                           <CheckCircle className="mb-3 h-6 w-6" />
                           Check-in
                        </Label>
                    </div>
                     <div>
                        <RadioGroupItem value="merch" id="merch" className="peer sr-only" />
                        <Label htmlFor="merch" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                           <Shirt className="mb-3 h-6 w-6" />
                           Merch
                        </Label>
                    </div>
                     <div>
                        <RadioGroupItem value="activity" id="activity" className="peer sr-only" />
                        <Label htmlFor="activity" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                           <Flame className="mb-3 h-6 w-6" />
                           Activity
                        </Label>
                    </div>
                </RadioGroup>

                <div className={cn("pt-4 space-y-2", activeAction === 'merch' ? 'block' : 'hidden')}>
                    <h4 className="font-semibold">Select Merchandise</h4>
                     <ScrollArea className="h-72">
                        {products.map((item) => (
                            <Card 
                                key={item.id}
                                className={cn(
                                    "cursor-pointer hover:border-primary transition-colors mb-2",
                                    selectedProduct?.id === item.id && "border-primary ring-2 ring-primary",
                                    (item.stock <= 0 || isProcessing) && "opacity-50 cursor-not-allowed"
                                )}
                                onClick={() => !(item.stock <= 0 || isProcessing) && setSelectedProduct(item)}
                            >
                                <CardContent className="p-3 flex items-center gap-4">
                                    <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden shrink-0">
                                    {item.image_url ? (
                                    <Image src={item.image_url} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />
                                    ) : (
                                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-grow">
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">Stock: {item.stock}</p>
                                    <p className="text-sm font-bold text-primary">{item.points} pts</p>
                                </div>
                                </CardContent>
                            </Card>
                        ))}
                     </ScrollArea>
                </div>

                 <div className={cn("pt-4 space-y-2", activeAction === 'activity' ? 'block' : 'hidden')}>
                    <h4 className="font-semibold">Select Activity</h4>
                     <ScrollArea className="h-72">
                        {activities.map((act) => (
                            <Card 
                                key={act.id}
                                className={cn(
                                    "cursor-pointer hover:border-primary transition-colors mb-2",
                                    selectedActivity?.id === act.id && "border-primary ring-2 ring-primary",
                                    isProcessing && "opacity-50 cursor-not-allowed"
                                )}
                                onClick={() => !isProcessing && setSelectedActivity(act)}
                            >
                                <CardContent className="p-3">
                                    <p className="font-semibold">{act.name}</p>
                                    <p className="text-sm text-muted-foreground">{act.description}</p>
                                    <p className="text-sm font-bold text-primary mt-1">{act.points_reward} pts reward</p>
                                </CardContent>
                            </Card>
                        ))}
                    </ScrollArea>
                </div>

            </CardContent>
        </Card>
    </div>
  </div>
  );
}
