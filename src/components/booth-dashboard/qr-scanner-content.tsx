'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { Booth, Product, Attendee } from '@/app/lib/definitions';
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
  Clock,
  Loader2,
  ScanLine,
  Shirt,
  Info,
  Camera,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { redeemMerchandiseForAttendee, createCheckIn } from '@/app/lib/actions';
import { getAttendeeById } from '@/app/lib/data';

type ScanResult = { 
  status: 'success' | 'error' | 'info'; 
  message: string; 
  attendeeName?: string;
  pointsUsed?: number;
  remainingPoints?: number;
};

export function QrScannerContent({ booth, products }: { booth: Booth, products: Product[] }) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [checkedInAttendees, setCheckedInAttendees] = useState<{name: string, time: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('check-in');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);


  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  }, []);

  const handleMerchRedemption = useCallback(async (attendeeId: string) => {
      if (!selectedProduct) return;
      setIsRedeeming(selectedProduct.id);
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
      } else {
          setScanResult({
              status: 'error',
              message: result.error || 'Redemption failed.',
              attendeeName: result.attendeeName,
          });
      }
      setIsRedeeming(null);
      setSelectedProduct(null); // Reset selection
  }, [selectedProduct, toast, booth.id]);

  const handleCheckIn = useCallback(async (attendeeId: string) => {
    const attendee = await getAttendeeById(attendeeId);
    
    if (attendee) {
      const result = await createCheckIn(attendeeId, booth.id);
      if (result.success) {
        setScanResult({ status: 'success', message: 'Check-in successful!', attendeeName: attendee.name });
        const newCheckedIn = { name: attendee.name, time: new Date().toLocaleTimeString() };
        setCheckedInAttendees(prev => [newCheckedIn, ...prev]);
      } else {
        setScanResult({ status: 'info', message: result.error || 'Attendee already checked in.', attendeeName: attendee.name });
      }
    } else {
      setScanResult({ status: 'error', message: 'Invalid QR Code. Attendee not found.' });
    }
  }, [booth.id]);


  const processQrData = useCallback((qrData: string) => {
    if (activeTab === 'merch' && selectedProduct) {
        handleMerchRedemption(qrData);
    } else if (activeTab === 'check-in') {
        handleCheckIn(qrData);
    } else if (activeTab === 'merch' && !selectedProduct) {
      toast({
        variant: 'destructive',
        title: 'Action required',
        description: 'Please select a product to redeem on the Merchandise tab first.',
      });
    }
  }, [activeTab, selectedProduct, handleMerchRedemption, handleCheckIn, toast]);

  const captureAndProcess = useCallback(() => {
    if (isProcessing || !videoRef.current?.HAVE_ENOUGH_DATA || !canvasRef.current) return;

    setIsProcessing(true);
    setScanResult(null);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        processQrData(code.data);
      } else {
        setScanResult({ status: 'error', message: 'No QR code detected. Please try again.' });
      }
    }
    
    setTimeout(() => setIsProcessing(false), 1000); // Prevent rapid clicks

  }, [isProcessing, processQrData]);

  const startCamera = useCallback(async () => {
    if (activeTab === 'merch' && !selectedProduct && !isCameraOn) {
        toast({ variant: 'destructive', title: 'No Product Selected', description: 'Please select a merchandise item before starting the camera.' });
        return;
    }
    setScanResult(null);
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        setIsCameraOn(true);
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setIsCameraOn(false);
        toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
        });
    }
  }, [activeTab, isCameraOn, selectedProduct, toast]);

  useEffect(() => {
    if (isCameraOn) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isCameraOn, startCamera, stopCamera]);
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setScanResult(null);
    setSelectedProduct(null);
    stopCamera();
  }

  const getScanResultVariant = (status: ScanResult['status']) => {
    if (status === 'success') return 'default';
    if (status === 'error') return 'destructive';
    return 'default'; // for 'info'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2">
        <Card className="h-full">
            <CardHeader>
                <CardTitle>QR Code Scanner</CardTitle>
                <CardDescription>
                    {activeTab === 'check-in' ? 'Start camera, aim at a QR code, then capture.' : 'Select a product, start camera, aim, then capture.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
                    <video ref={videoRef} className={cn("w-full h-full object-cover", isCameraOn ? "block" : "hidden")} autoPlay muted playsInline />
                    <canvas ref={canvasRef} className="hidden" />

                    {!isCameraOn && (
                        <div className="text-center text-muted-foreground p-4 absolute">
                            <Camera className="mx-auto h-16 w-16" />
                            <p className="mt-2 font-semibold">Camera is off</p>
                             <p className="text-sm">{activeTab === 'merch' && selectedProduct ? `Ready to scan for ${selectedProduct.name}`: 'Press "Start Camera" to begin'}</p>
                        </div>
                    )}
                    {isCameraOn && (
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
                <div className="flex gap-2">
                    <Button onClick={() => setIsCameraOn(prev => !prev)} variant={isCameraOn ? 'destructive' : 'default'} className="w-1/3">
                        {isCameraOn ? 'Stop Camera' : 'Start Camera'}
                    </Button>
                    <Button onClick={captureAndProcess} className="w-2/3" disabled={!isCameraOn || isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <QrCode className="mr-2 h-4 w-4" />}
                        {isProcessing ? 'Processing...' : 'Capture & Process QR'}
                    </Button>
                </div>
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
        <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="check-in">Check-in</TabsTrigger>
                <TabsTrigger value="merch">Merchandise</TabsTrigger>
            </TabsList>
            <TabsContent value="check-in" className="mt-4">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Clock className="mr-2 h-5 w-5"/>Check-in History</CardTitle>
                         <CardDescription>({checkedInAttendees.length}) attendees checked-in to this booth.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                        {checkedInAttendees.length > 0 ? checkedInAttendees.map((attendee, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <p className="font-medium">{attendee.name}</p>
                                <p className="text-muted-foreground">{attendee.time}</p>
                            </div>
                        )) : (
                            <div className="text-center text-muted-foreground py-10">
                                <p>No attendees checked in yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="merch" className="mt-4">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Shirt className="mr-2 h-5 w-5"/>Redeem Merchandise</CardTitle>
                         <CardDescription>Select a product to redeem.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                        {products.map((item) => (
                            <Button
                                key={item.id}
                                variant={selectedProduct?.id === item.id ? "default" : "outline"}
                                className="w-full justify-between h-12"
                                onClick={() => setSelectedProduct(item)}
                                disabled={item.stock <= 0}
                            >
                                <span>{item.name} {item.stock <= 0 && '(Out of stock)'}</span>
                                <span>{item.points} pts</span>
                            </Button>
                        ))}
                         {products.length === 0 && (
                            <div className="text-center text-muted-foreground py-10">
                                <p>No products available for redemption.</p>
                            </div>
                         )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  </div>
  );
}
