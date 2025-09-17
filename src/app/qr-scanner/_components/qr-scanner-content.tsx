'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { Event, Product, Attendee } from '@/app/lib/definitions';
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
  Gift,
  ScanLine,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { redeemMerchandiseForAttendee } from '@/app/lib/actions';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';


type ScanMode = 'check-in' | 'merch-redemption';
type RedemptionResult = { 
  status: 'success' | 'error'; 
  message: string; 
  attendeeName?: string;
  pointsUsed?: number;
  remainingPoints?: number;
};

export function QrScannerContent({ events, products }: { events: Event[], products: Product[] }) {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  // States for Check-in
  const [checkInResult, setCheckInResult] = useState<{ status: 'success' | 'error'; message: string; attendeeName?: string } | null>(null);
  const [checkedInAttendees, setCheckedInAttendees] = useState<{name: string, time: string}[]>([]);
  
  // States for Merchandise Redemption
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [redemptionResult, setRedemptionResult] = useState<RedemptionResult | null>(null);
  const [isProcessingRedemption, setIsProcessingRedemption] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const animationFrameId = useRef<number>();
  const [activeTab, setActiveTab] = useState<ScanMode>('check-in');

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
    }
  }, []);

  const startScanning = useCallback(() => {
    setIsScanning(true);
  }, []);

  const processCheckIn = useCallback((attendeeId: string) => {
    const selectedEvent = events.find(e => e.id === selectedEventId);
    if (!selectedEvent) {
      setCheckInResult({ status: 'error', message: 'No event selected. Cannot verify attendee.' });
      return;
    }

    const attendee = selectedEvent.attendees.find(a => a.id === attendeeId);
    if (attendee) {
      const alreadyCheckedIn = checkedInAttendees.some(a => a.name === attendee.name);
      if (alreadyCheckedIn) {
        setCheckInResult({ status: 'error', message: 'Attendee already checked in.', attendeeName: attendee.name });
      } else {
        setCheckInResult({ status: 'success', message: 'Check-in successful!', attendeeName: attendee.name });
        const newCheckedIn = { name: attendee.name, time: new Date().toLocaleTimeString() };
        setCheckedInAttendees(prev => [newCheckedIn, ...prev]);
      }
    } else {
      setCheckInResult({ status: 'error', message: 'Invalid QR Code. Attendee not found in this event.' });
    }
    
    setTimeout(() => {
        setCheckInResult(null);
        startScanning();
    }, 3000);

  }, [selectedEventId, events, checkedInAttendees, startScanning]);

  const processMerchRedemption = useCallback(async (attendeeId: string) => {
    if (!selectedProduct) return;
    
    setIsProcessingRedemption(true);
    setRedemptionResult(null);

    const result = await redeemMerchandiseForAttendee(attendeeId, selectedProduct.id);

    if (result.success) {
        setRedemptionResult({
            status: 'success',
            message: result.message || 'Redemption successful!',
            attendeeName: result.attendeeName,
            pointsUsed: result.pointsUsed,
            remainingPoints: result.remainingPoints,
        });
        toast({ title: "Redemption Successful!" });
    } else {
        setRedemptionResult({
            status: 'error',
            message: result.error || 'Redemption failed.',
            attendeeName: result.attendeeName,
        });
        toast({ variant: 'destructive', title: "Redemption Failed", description: result.error });
    }

    setIsProcessingRedemption(false);
    
    setTimeout(() => {
        setRedemptionResult(null);
        setSelectedProduct(null); // Reset product selection
        startScanning();
    }, 5000);

  }, [selectedProduct, startScanning, toast]);


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
           stopScanning(); // Stop scanning once a code is found
           if (activeTab === 'check-in') {
             processCheckIn(code.data);
           } else if (activeTab === 'merch-redemption' && selectedProduct) {
             processMerchRedemption(code.data);
           } else {
             // If no product is selected in merch tab, just restart
             setTimeout(startScanning, 1000);
           }
        }
      }
    }
    if (isScanning) {
        animationFrameId.current = requestAnimationFrame(scanLoop);
    }
  }, [isScanning, activeTab, selectedProduct, stopScanning, startScanning, processCheckIn, processMerchRedemption]);

  // Effect to manage camera stream
  useEffect(() => {
    const manageCamera = async () => {
      // Start camera only if an event is selected
      if (selectedEventId && !videoRef.current?.srcObject) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          startScanning();
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
          });
        }
      } else if (!selectedEventId && videoRef.current?.srcObject) {
        // Stop camera if no event is selected
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
        setHasCameraPermission(null);
        stopScanning();
      }
    };
    
    manageCamera();

    return () => {
      // Cleanup on unmount
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedEventId, toast, startScanning, stopScanning]);

  // Effect to manage scan loop
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
  
  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    setCheckInResult(null);
    setCheckedInAttendees([]);
    setRedemptionResult(null);
    setSelectedProduct(null);
    setHasCameraPermission(null); // Will trigger camera setup effect
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as ScanMode);
    setCheckInResult(null);
    setRedemptionResult(null);
    setSelectedProduct(null);
    if(!isScanning) startScanning();
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
                       {activeTab === 'check-in' ? 'Point a QR code at the camera to check-in an attendee.' : 'Select a product, then scan the attendee\'s QR code.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
                         <video ref={videoRef} className={cn("w-full h-full object-cover", hasCameraPermission ? "block" : "hidden")} autoPlay muted playsInline />
                         <canvas ref={canvasRef} className="hidden" />

                        {/* Overlays for different states */}
                        {!selectedEventId && (
                             <div className="text-center text-muted-foreground p-4 absolute">
                                <CameraOff className="mx-auto h-16 w-16" />
                                <p className="mt-2 font-semibold">No event selected</p>
                                <p className="text-sm">Please select an event to activate the scanner.</p>
                            </div>
                        )}
                        {selectedEventId && hasCameraPermission === null && (
                            <div className="text-center text-muted-foreground p-4 absolute flex flex-col items-center">
                                <Loader2 className="h-16 w-16 animate-spin" />
                                <p className="mt-2 font-semibold">Waiting for camera...</p>
                            </div>
                        )}
                        {selectedEventId && hasCameraPermission && !isScanning && !checkInResult && !redemptionResult && (
                             <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                                <QrCode className="h-16 w-16" />
                                <p className="font-bold mt-2">Ready to scan</p>
                            </div>
                        )}
                        {activeTab === 'merch-redemption' && selectedProduct && !redemptionResult && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-4">
                                <ScanLine className="h-16 w-16 text-primary" />
                                <p className="font-bold mt-2 text-xl">Ready to Scan for "{selectedProduct.name}"</p>
                                <p>Scan attendee's QR code to redeem.</p>
                            </div>
                        )}

                    </div>
                    {/* Alerts and Results */}
                    {hasCameraPermission === false && selectedEventId && (
                      <Alert variant="destructive"><AlertTitle>Camera Access Required</AlertTitle><AlertDescription>Please allow camera access in your browser settings to use this feature.</AlertDescription></Alert>
                    )}
                    {checkInResult && activeTab === 'check-in' && (
                        <Alert variant={checkInResult.status === 'success' ? 'default' : 'destructive'}>
                            {checkInResult.status === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            <AlertTitle>{checkInResult.attendeeName || "Scan Result"}</AlertTitle>
                            <AlertDescription>{checkInResult.message}</AlertDescription>
                        </Alert>
                    )}
                    {redemptionResult && activeTab === 'merch-redemption' && (
                        <Alert variant={redemptionResult.status === 'success' ? 'default' : 'destructive'}>
                             {redemptionResult.status === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            <AlertTitle>{redemptionResult.attendeeName || "Redemption Result"}</AlertTitle>
                            <AlertDescription>
                                {redemptionResult.message}
                                {redemptionResult.status === 'success' && (
                                    <div className="mt-2 text-xs">
                                        <p>Points Used: <span className="font-bold">{redemptionResult.pointsUsed}</span></p>
                                        <p>Remaining Points: <span className="font-bold">{redemptionResult.remainingPoints}</span></p>
                                    </div>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="check-in">Check-ins</TabsTrigger>
                    <TabsTrigger value="merch-redemption">Merchandise</TabsTrigger>
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
                <TabsContent value="merch-redemption" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><Gift className="mr-2 h-5 w-5"/>Merchandise Redemption</CardTitle>
                            <CardDescription>
                                {selectedProduct ? 'Scan QR code to redeem.' : 'Select a product to begin.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {products.map((item, index) => (
                                <div key={item.id}>
                                    <div 
                                      className={cn(
                                        "flex items-center justify-between p-3 rounded-md border cursor-pointer hover:bg-muted/50",
                                        selectedProduct?.id === item.id && "bg-muted border-primary",
                                        (item.stock <= 0 || isProcessingRedemption) && "opacity-50 cursor-not-allowed"
                                      )}
                                      onClick={() => item.stock > 0 && !isProcessingRedemption && setSelectedProduct(item)}
                                    >
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">{item.points} pts</p>
                                            <p className="text-xs text-muted-foreground">Stock: {item.stock}</p>
                                        </div>
                                        {selectedProduct?.id === item.id ? (
                                            <CheckCircle className="h-5 w-5 text-primary"/>
                                        ) : (
                                          item.stock <= 0 && <span className="text-xs font-semibold text-destructive">OUT OF STOCK</span>
                                        )}
                                    </div>
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
