'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import jsQR from 'jsqr';
import { Booth, Product, Attendee, CheckIn } from '@/app/lib/definitions';
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
  Camera,
  CameraOff,
  ImageIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { redeemMerchandiseForAttendee, createCheckIn } from '@/app/lib/actions';
import { getAttendeeById } from '@/app/lib/data';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type ScanResult = { 
  status: 'success' | 'error' | 'info'; 
  message: string; 
  attendeeName?: string;
  pointsUsed?: number;
  remainingPoints?: number;
};

// Define a more specific type for a check-in that includes attendee data
type HydratedCheckIn = CheckIn & {
  attendees: { name: string; email: string } | null;
};

export function QrScannerContent({ booth, products }: { booth: Booth & { check_ins: HydratedCheckIn[] }, products: Product[] }) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeAction, setActiveAction] = useState<'check-in' | 'merch'>('check-in');
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
      setSelectedProduct(null); // Reset selection
      setActiveAction('check-in'); // Revert to default action
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
          // Differentiate between already checked in and other errors
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


  const processQrData = useCallback((qrData: string) => {
    if (isProcessing) return;

    if (activeAction === 'merch' && selectedProduct) {
        handleMerchRedemption(qrData);
    } else if (activeAction === 'check-in') {
        handleCheckIn(qrData);
    }
  }, [activeAction, selectedProduct, handleMerchRedemption, handleCheckIn, isProcessing]);

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
  
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setActiveAction('merch');
    setScanResult(null);
    toast({
      title: `Redeem: ${product.name}`,
      description: 'The scanner is ready for merchandise redemption.',
    });
  };

  const getScanResultVariant = (status: ScanResult['status']) => {
    if (status === 'success') return 'default';
    if (status === 'error') return 'destructive';
    return 'default'; // for 'info'
  }
  
  const isCaptureDisabled = isProcessing;
  const scannerTitle = activeAction === 'merch' && selectedProduct ? `Redeeming: ${selectedProduct.name}` : 'QR Scanner';
  const scannerDescription = activeAction === 'merch' && selectedProduct ? `Scan attendee's QR to redeem for ${selectedProduct.points} points.` : "Start the scanner to check-in an attendee.";

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
                <CardTitle className="flex items-center"><Shirt className="mr-2 h-5 w-5"/>Redeem Merchandise</CardTitle>
                 <CardDescription>Click a product to activate redemption mode.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto">
                {products.map((item) => (
                    <Card 
                        key={item.id}
                        className={cn(
                            "cursor-pointer hover:border-primary transition-colors",
                             selectedProduct?.id === item.id && activeAction === 'merch' && "border-primary ring-2 ring-primary",
                             (item.stock <= 0 || isProcessing) && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => !(item.stock <= 0 || isProcessing) && handleSelectProduct(item)}
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
                 {products.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                        <p>No products available for redemption.</p>
                        <p className="text-sm">You can add merchandise from the "Merchandise" page.</p>
                    </div>
                 )}
            </CardContent>
        </Card>
    </div>
  </div>
  );
}
