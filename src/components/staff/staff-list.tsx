
'use client';

import { useState, useMemo } from 'react';
import { Staff, Event } from '@/app/lib/definitions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import { MoreVertical, PlusCircle, Trash2, Edit, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StaffForm } from './staff-form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { deleteStaff } from '@/app/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function StaffList({ staff, events }: { staff: Staff[], events: Event[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  const filteredStaff = useMemo(() => {
    if (!searchTerm) return staff;
    const lowercasedFilter = searchTerm.toLowerCase();
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(lowercasedFilter) ||
        s.email.toLowerCase().includes(lowercasedFilter) ||
        s.assignedEventName?.toLowerCase().includes(lowercasedFilter)
    );
  }, [staff, searchTerm]);

  const openFormForNew = () => {
    setSelectedStaff(undefined);
    setIsFormOpen(true);
  };

  const openFormForEdit = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setIsFormOpen(true);
  };

  const handleDelete = async (staffId: string, staffName: string) => {
    setIsDeleting(true);
    const result = await deleteStaff(staffId);
    setIsDeleting(false);

    if (result.success) {
      toast({
        title: 'Staff Deleted',
        description: `"${staffName}" has been successfully deleted.`,
      });
      router.refresh();
    } else {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: result.error || 'Could not delete the staff member.',
      });
    }
  };

  return (
    <>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedStaff ? 'Edit Staff Member' : 'Create New Staff Member'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <StaffForm events={events} staff={selectedStaff} onFinished={() => setIsFormOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle>Staff Management</CardTitle>
            <CardDescription>
              A list of all staff users and their assigned events.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Input
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:max-w-sm"
            />
            <Button onClick={openFormForNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Staff
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Assigned Event</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length > 0 ? (
                filteredStaff.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>
                      {s.event_id ? (
                        <Link href={`/events/manage/${s.event_id}`} className="hover:underline text-primary">
                          {s.assignedEventName || 'View Event'}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Not Assigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openFormForEdit(s)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
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
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the user "{s.name}" and their login credentials.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(s.id, s.name)}
                                  disabled={isDeleting}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Yes, delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No staff found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
