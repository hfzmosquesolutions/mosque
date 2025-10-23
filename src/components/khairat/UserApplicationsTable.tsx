'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileText, 
  Trash2, 
  X,
  Heart,
  MapPin,
  Calendar,
  User,
  ExternalLink
} from 'lucide-react';
import { 
  getKhairatMembers,
  deleteKhairatMember,
  withdrawKhairatMembership 
} from '@/lib/api/khairat-members';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { KhairatMember } from '@/types/database';

interface UserApplicationsTableProps {
  showHeader?: boolean;
}

export function UserApplicationsTable({ showHeader = true }: UserApplicationsTableProps) {
  const t = useTranslations('khairat');
  const { user } = useAuth();
  const [members, setMembers] = useState<KhairatMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<KhairatMember | null>(null);

  const fetchApplications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const members = await getKhairatMembers({ user_id: user.id });
      setMembers(members);
    } catch (error) {
      console.error('Error fetching khairat members:', error);
      toast.error('Failed to load khairat records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-200 text-yellow-800 bg-yellow-50">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'under_review':
        return (
          <Badge variant="outline" className="border-blue-200 text-blue-800 bg-blue-50">
            <FileText className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="border-green-200 text-green-800 bg-green-50">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="border-red-200 text-red-800 bg-red-50">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'withdrawn':
        return (
          <Badge variant="outline" className="border-gray-200 text-gray-800 bg-gray-50">
            <X className="h-3 w-3 mr-1" />
            Withdrawn
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const handleDeleteApplication = async () => {
    if (!selectedMember) return;
    
    setDeletingId(selectedMember.id);
    try {
      await deleteKhairatMember(selectedMember.id);
      toast.success('Record deleted successfully');
      setShowDeleteDialog(false);
      setSelectedMember(null);
      await fetchApplications();
    } catch (error: any) {
      console.error('Error deleting record:', error);
      toast.error(error?.message || 'Failed to delete record');
    } finally {
      setDeletingId(null);
    }
  };

  const handleWithdrawApplication = async () => {
    if (!selectedApplication) return;
    
    setWithdrawingId(selectedApplication.id);
    try {
      await withdrawKhairatApplication(selectedApplication.id);
      toast.success('Application withdrawn successfully');
      setShowWithdrawDialog(false);
      setSelectedApplication(null);
      await fetchApplications();
    } catch (error: any) {
      console.error('Error withdrawing application:', error);
      toast.error(error?.message || 'Failed to withdraw application');
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleWithdrawMembership = async () => {
    if (!selectedApplication) return;
    
    // Find the membership for this application
    const membership = memberships.find(m => 
      m.mosque_id === selectedApplication.mosque_id && 
      m.user_id === selectedApplication.user_id
    );
    
    if (!membership) {
      toast.error('Membership not found');
      return;
    }
    
    setWithdrawingId(selectedApplication.id);
    try {
      await withdrawKhairatMembership(membership.id);
      toast.success('Membership withdrawn successfully');
      setShowWithdrawDialog(false);
      setSelectedApplication(null);
      await fetchApplications();
    } catch (error: any) {
      console.error('Error withdrawing membership:', error);
      toast.error(error?.message || 'Failed to withdraw membership');
    } finally {
      setWithdrawingId(null);
    }
  };

  const canWithdraw = (status: string) => {
    return ['pending', 'under_review'].includes(status);
  };

  const canDelete = (status: string) => {
    return ['rejected', 'withdrawn'].includes(status);
  };

  const canWithdrawMembership = (status: string) => {
    return status === 'approved';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent>
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            Loading applications...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="h-12 w-12 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">
          No Khairat Applications
        </h3>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8">
          You haven't submitted any khairat applications yet. Visit a mosque profile to apply for khairat membership.
        </p>
      </div>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-md">
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-emerald-600" />
              My Khairat Applications
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mosque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Admin Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                          <img
                            src={application.mosque?.logo_url || '/icon-kariah-masjid.png'}
                            alt={`${application.mosque?.name} logo`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {application.mosque?.id ? (
                              <button
                                onClick={() => window.open(`/mosques/${application.mosque.id}`, '_blank', 'noopener,noreferrer')}
                                className="text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer transition-colors flex items-center gap-1 group"
                                title="View mosque profile"
                              >
                                {application.mosque.name}
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ) : (
                              <span className="text-slate-500">Unknown Mosque</span>
                            )}
                          </div>
                          {application.mosque?.address && (
                            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate max-w-[200px]">
                                {application.mosque.address}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(application.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(application.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {application.admin_notes ? (
                        <div className="text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                          {application.admin_notes}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">No notes</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canWithdraw(application.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedApplication(application);
                              setShowWithdrawDialog(true);
                            }}
                            disabled={withdrawingId === application.id}
                            className="border-orange-300 text-orange-600 hover:bg-orange-50"
                          >
                            {withdrawingId === application.id ? (
                              <Clock className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <X className="h-3 w-3 mr-1" />
                            )}
                            Withdraw
                          </Button>
                        )}
                        {canWithdrawMembership(application.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedApplication(application);
                              setShowWithdrawDialog(true);
                            }}
                            disabled={withdrawingId === application.id}
                            className="border-orange-300 text-orange-600 hover:bg-orange-50"
                          >
                            {withdrawingId === application.id ? (
                              <Clock className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <X className="h-3 w-3 mr-1" />
                            )}
                            Leave
                          </Button>
                        )}
                        {canDelete(application.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedApplication(application);
                              setShowDeleteDialog(true);
                            }}
                            disabled={deletingId === application.id}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            {deletingId === application.id ? (
                              <Clock className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3 mr-1" />
                            )}
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteApplication}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletingId === selectedApplication?.id}
            >
              {deletingId === selectedApplication?.id ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Withdraw Confirmation Dialog */}
      <AlertDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedApplication?.status === 'approved' ? 'Leave Khairat' : 'Withdraw Application'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedApplication?.status === 'approved' 
                ? 'Are you sure you want to leave this khairat membership? You can reapply later if needed.'
                : 'Are you sure you want to withdraw this application? You can reapply later if needed.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={selectedApplication?.status === 'approved' ? handleWithdrawMembership : handleWithdrawApplication}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={withdrawingId === selectedApplication?.id}
            >
              {withdrawingId === selectedApplication?.id ? 'Processing...' : 
               selectedApplication?.status === 'approved' ? 'Leave' : 'Withdraw'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
