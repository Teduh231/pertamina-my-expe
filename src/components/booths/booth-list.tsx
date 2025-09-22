'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Booth } from '@/app/lib/definitions';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Users,
  Edit,
  Eye,
  MoreVertical,
  PlusCircle,
  Loader2,
  Trash2,
  Image as ImageIcon,
  MapPin,
  LayoutDashboard,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { deleteBooth } from '@/app/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { BoothForm } from './booth-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type BoothListProps = {
  booths: (Booth & { attendees_count?: number })[];
};

export function BoothList({ booths }: BoothListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBooth, setSelectedBooth] = useState<Booth | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async (boothId: string, boothName: string) => {
    setIsDeleting(true);
    const result = await deleteBooth(boothId);
    setIsDeleting(false);

    if (result.success) {
      toast({
        title: 'Booth Deleted',
        description: `"${boothName}" has been successfully deleted.`,
      });
      router.refresh();
    } else {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: result.error || 'Could not delete the booth. Please try again.',
      });
    }
  };

  const openFormForNew = () => {
    setSelectedBooth(undefined);
    setIsFormOpen(true);
  };

  const openFormForEdit = (booth: Booth) => {
    setSelectedBooth(booth);
    setIsFormOpen(true);
  };


  const filteredBooths = useMemo(() => {
    if (!booths) return [];
    return booths.filter((booth) =>
      booth.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booth.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booth.booth_manager.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [booths, searchTerm]);

  const getStatusVariant = (status: Booth['status']) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'canceled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[800px] bg-card border-border overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedBooth ? 'Edit Booth' : 'Create New Booth'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 px-1">
             <BoothForm booth={selectedBooth} onFinished={() => setIsFormOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Booths</h2>
          <p className="text-muted-foreground">
            Manage all your booths from one place.
          </p>
        </div>
        <div className="flex w-full md:w-auto items-center gap-4">
          <Input
            placeholder="Search booths..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
          <Button onClick={openFormForNew} className="whitespace-nowrap">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Booth
          </Button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredBooths.map((booth) => {
          const attendeeCount = (booth as any).attendees_count || booth.attendees?.length || 0;
          return (
            <Card key={booth.id} className="flex flex-col bg-card hover:border-primary/50 transition-all border-2 border-transparent overflow-hidden">
                {booth.image_url ? (
                    <div className="relative h-40 w-full">
                        <Image src={booth.image_url} alt={booth.name} layout="fill" objectFit="cover" />
                    </div>
                ) : (
                    <div className="h-40 w-full bg-secondary flex items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                )}
              <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold leading-tight">
                    <button onClick={() => openFormForEdit(booth)} className="text-left hover:underline">
                      {booth.name}
                    </button>
                  </CardTitle>
                  <Badge variant={getStatusVariant(booth.status)} className="capitalize">
                    {booth.status}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 pt-2 h-[40px]">
                  {booth.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 p-4 pt-0">
                <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{booth.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{attendeeCount} Attendees</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <div className="flex w-full justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                     <Link href={`/booth-dashboard/${booth.id}`}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                     </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openFormForEdit(booth)}>
                         <Edit className="mr-2 h-4 w-4" />
                         <span>Edit Booth</span>
                      </DropdownMenuItem>
                       <DropdownMenuItem asChild>
                         <Link href={`/booths/${booth.id}/register`} target="_blank">
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Public View</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the
                                booth "{booth.name}" and all of its attendee data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(booth.id, booth.name)}
                                disabled={isDeleting}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Yes, delete booth
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
       {filteredBooths.length === 0 && (
          <div className="text-center text-muted-foreground col-span-full py-12 md:col-span-2 xl:col-span-3">
            <p>No booths found.</p>
            <p className="text-sm">Try adjusting your search terms or create a new booth.</p>
          </div>
        )}
    </div>
  );
}
