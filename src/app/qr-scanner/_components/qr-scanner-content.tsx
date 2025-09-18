'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { Booth, Product } from '@/app/lib/definitions';
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
  Shirt,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { redeemMerchandiseForAttendee } from '@/app/lib/actions';

type ScanResult = { 
  status: 'success' | 'error' | 'info'; 
  message: string; 
  attendeeName?: string;
  pointsUsed?: number;
  remainingPoints?: number;
};

export function QrScannerContent({ booths, products }: { booths: Booth[], products: Product[] }) {
  const [selectedBoothId, setSelectedBoothId] = useState<string>('');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [checkedInAttendees, setCheckedInAttendees] = useState<{name: string, time: string}[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('check-in');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);


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

  const handleMerchRedemption = useCallback(async (attendeeId: string) => {
      if (!selectedProduct) return;
      setIsRedeeming(selectedProduct.id);
      const result = await redeemMerchandiseForAttendee(attendeeId, selectedProduct.id);
      
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
      stopScanning();
  }, [selectedProduct, stopScanning, toast]);

  const handleCheckIn = useCallback((attendeeId: string) => {
    const selectedBooth = booths.find(e => e.id === selectedBoothId);
    if (!selectedBooth) {
      setScanResult({ status: 'error', message: 'No booth selected. Cannot verify attendee.' });
      return;
    }
    const attendee = selectedBooth.attendees.find(a => a.id === attendeeId);
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
      setScanResult({ status: 'error', message: 'Invalid QR Code. Attendee not found in this booth.' });
    }
    stopScanning();
  }, [selectedBoothId, booths, checkedInAttendees, stopScanning]);


  const processScanResult = useCallback((attendeeId: string) => {
    if (activeTab === 'merch' && selectedProduct) {
        handleMerchRedemption(attendeeId);
    } else if (activeTab === 'check-in') {
        handleCheckIn(attendeeId);
    } else {
      stopScanning();
      toast({
        variant: 'destructive',
        title: 'Action required',
        description: 'Please select a product to redeem on the Merch tab first.',
      });
    }
  }, [activeTab, selectedProduct, handleMerchRedemption, handleCheckIn, stopScanning, toast]);


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
    if (!selectedBoothId) {
        toast({ variant: 'destructive', title: 'No Booth Selected', description: 'Please select a booth before starting the scan.' });
        return;
    }
     if (activeTab === 'merch' && !selectedProduct) {
        toast({ variant: 'destructive', title: 'No Product Selected', description: 'Please select a merchandise item before scanning.' });
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
  }, [selectedBoothId, activeTab, selectedProduct, toast]);

  useEffect(() => {
    if (hasCameraPermission && isScanning) {
      animationFrameId.current = requestAnimationFrame(scanLoop);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [hasCameraPermission, isScanning, scanLoop]);

  useEffect(() => {
    return () => stopScanning();
  }, [stopScanning]);
  
  const handleBoothChange = (boothId: string) => {
    setSelectedBoothId(boothId);
    setScanResult(null);
    setSelectedProduct(null);
    setCheckedInAttendees([]);
    if(isScanning) stopScanning();
  };
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setScanResult(null);
    setSelectedProduct(null);
    if(isScanning) stopScanning();
  }

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
                    Check-in attendees and redeem merchandise.
                </p>
            </div>
             <Select value={selectedBoothId} onValueChange={handleBoothChange}>
                <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select a booth to start..." />
                </SelectTrigger>
                <SelectContent>
                    {booths.filter(e => e.status === 'published').map(booth => (
                    <SelectItem key={booth.id} value={booth.id}>
                        {booth.name}
                    </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>QR Code Scanner</CardTitle>
                    <CardDescription>
                        {activeTab === 'check-in' ? 'Point the camera at an attendee\'s QR code to check them in.' : 'Select a product, then scan an attendee\'s QR code to redeem.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
                        <video ref={videoRef} className={cn("w-full h-full object-cover", isScanning ? "block" : "hidden")} autoPlay muted playsInline />
                        <canvas ref={canvasRef} className="hidden" />

                        {!isScanning && (
                            <div className="text-center text-muted-foreground p-4 absolute">
                                <QrCode className="mx-auto h-16 w-16" />
                                <p className="mt-2 font-semibold">Camera view will appear here</p>
                                 <p className="text-sm">{activeTab === 'merch' && selectedProduct ? `Ready to scan for ${selectedProduct.name}`: ''}</p>
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
                    <Button onClick={isScanning ? stopScanning : startScanning} className="w-full" disabled={!selectedBoothId}>
                        {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        {isScanning ? 'Stop Scan' : 'Start Scan'}
                    </Button>
                     {scanResult && (
                        <Alert variant={getScanResultVariant(scanResult.status)}>
                            {scanResult.status === 'success' && <CheckCircle className="h-4 w-4" />}
                            {scanResult.status === 'error' && <XCircle className="h-4 w-4" />}
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
                             <CardDescription>({checkedInAttendees.length}) attendees checked-in.</CardDescription>
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
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}
