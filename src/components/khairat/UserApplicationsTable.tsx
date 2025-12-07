'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loading } from '@/components/ui/loading';
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
  Users,
  ExternalLink,
  CreditCard,
  MoreVertical,
  Building
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

// Khairat mosque membership type
interface MosqueMembership {
  id: string;
  mosque_id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  admin_notes?: string;
  mosque?: {
    id: string;
    name: string;
    logo_url?: string;
    banner_url?: string;
    address?: string;
  };
  type: 'khairat';
}

export function UserApplicationsTable({ showHeader = true }: UserApplicationsTableProps) {
  const t = useTranslations('khairat');
  const { user } = useAuth();
  const [members, setMembers] = useState<MosqueMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MosqueMembership | null>(null);

  const fetchApplications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch khairat applications only
      const khairatMembers = await getKhairatMembers({ user_id: user.id });

      const items: MosqueMembership[] = khairatMembers.map((member: any) => ({
        id: member.id,
        mosque_id: member.mosque_id,
        user_id: member.user_id,
        status: member.status,
        created_at: member.created_at,
        updated_at: member.updated_at,
        admin_notes: member.admin_notes,
        mosque: member.mosque,
        type: 'khairat' as const
      })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setMembers(items);
    } catch (error) {
      console.error('Error fetching mosque memberships:', error);
      toast.error('Failed to load mosque memberships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const getStatusBadge = (application: MosqueMembership) => {
    return getSingleStatusBadge(application.status);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Awaiting Review';
      case 'under_review': return 'Under Review';
      case 'approved': return 'Approved';
      case 'active': return 'Active';
      case 'rejected': return 'Not Approved';
      case 'withdrawn': return 'Withdrawn';
      case 'inactive': return 'Inactive';
      default: return status;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your khairat application is being processed';
      case 'under_review':
        return 'Mosque admin is reviewing your application';
      case 'approved':
        return 'You can now make khairat payments';
      case 'active':
        return 'Active khairat member';
      case 'rejected':
        return 'You can reapply later';
      case 'withdrawn':
        return 'You can reapply anytime';
      case 'inactive':
        return 'Membership is inactive';
      default:
        return `Status: ${status}`;
    }
  };

  const getSingleStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="border-yellow-200 text-yellow-800 bg-yellow-50">
              <Clock className="h-3 w-3 mr-1" />
              Awaiting Review
            </Badge>
            <span className="text-xs text-yellow-600">
              Your khairat application is being processed
            </span>
          </div>
        );
      case 'under_review':
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="border-blue-200 text-blue-800 bg-blue-50">
              <FileText className="h-3 w-3 mr-1" />
              Under Review
            </Badge>
            <span className="text-xs text-blue-600">Mosque admin is reviewing your application</span>
          </div>
        );
      case 'approved':
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="border-green-200 text-green-800 bg-green-50">
              <CheckCircle className="h-3 w-3 mr-1" />
              Khairat Member
            </Badge>
            <span className="text-xs text-green-600">
              You can now make khairat payments
            </span>
          </div>
        );
      case 'active':
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="border-green-200 text-green-800 bg-green-50">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
            <span className="text-xs text-green-600">
              Active khairat member
            </span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="border-red-200 text-red-800 bg-red-50">
              <XCircle className="h-3 w-3 mr-1" />
              Not Approved
            </Badge>
            <span className="text-xs text-red-600">You can reapply later</span>
          </div>
        );
      case 'withdrawn':
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="border-gray-200 text-gray-800 bg-gray-50">
              <X className="h-3 w-3 mr-1" />
              Withdrawn
            </Badge>
            <span className="text-xs text-gray-600">You can reapply anytime</span>
          </div>
        );
      case 'inactive':
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="border-gray-200 text-gray-800 bg-gray-50">
              <X className="h-3 w-3 mr-1" />
              Inactive
            </Badge>
            <span className="text-xs text-gray-600">Membership is inactive</span>
          </div>
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
    if (!selectedMember) return;
    
    setWithdrawingId(selectedMember.id);
    try {
      await withdrawKhairatMembership(selectedMember.id);
      toast.success('Application withdrawn successfully');
      setShowWithdrawDialog(false);
      setSelectedMember(null);
      await fetchApplications();
    } catch (error: any) {
      console.error('Error withdrawing application:', error);
      toast.error(error?.message || 'Failed to withdraw application');
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleWithdrawMembership = async () => {
    if (!selectedMember) return;
    
    setWithdrawingId(selectedMember.id);
    try {
      await withdrawKhairatMembership(selectedMember.id);
      toast.success('Membership withdrawn successfully');
      setShowWithdrawDialog(false);
      setSelectedMember(null);
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
    return <Loading />;
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Building className="h-12 w-12 text-emerald-600" />
        </div>
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">
              Join Your First Mosque
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8">
              Connect with mosques in your community and participate in khairat programs to make meaningful contributions.
            </p>
        <Button 
          size="lg" 
          className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-3" 
          asChild
        >
          <a href="/mosques" target="_blank" rel="noopener noreferrer">
            <Building className="mr-2 h-5 w-5" /> Find Mosques
          </a>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((application) => (
          <Card
            key={application.id}
            className="transition-all hover:shadow-md bg-white/90 dark:bg-slate-800 border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer p-0"
          >
            {/* Mosque Banner Image - Full width at top */}
            <div className="w-full h-40 bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <Image
                src={(application.mosque?.banner_url || application.mosque?.logo_url || '/window.svg') as string}
                alt={application.mosque?.name || 'Mosque'}
                width={400}
                height={160}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Mosque Content */}
            <div className="px-4 md:px-5 py-4">
              {/* Mosque Logo and Name */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-white border border-slate-200 dark:border-slate-700 flex-shrink-0">
                  <Image
                    src={application.mosque?.logo_url || '/icon-khairatkita.png'}
                    alt={`${application.mosque?.name} logo`}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    {application.mosque?.id ? (
                      <button
                        onClick={() => application.mosque?.id && window.open(`/mosques/${application.mosque?.id}`, '_blank', 'noopener,noreferrer')}
                        className="text-slate-900 dark:text-slate-100 hover:text-emerald-600 hover:underline transition-colors cursor-pointer"
                        title="View mosque profile"
                      >
                        {application.mosque?.name}
                      </button>
                    ) : (
                      <span className="text-slate-500">Unknown Mosque</span>
                    )}
                  </h3>
                  {application.mosque?.address && (
                    <div className="flex items-center text-xs text-slate-600 dark:text-slate-400 mt-1">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0 text-emerald-600" />
                      <span className="truncate">{application.mosque?.address}</span>
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedMember(application);
                    setShowManagementModal(true);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1 h-8 w-8"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              
                {/* Status */}
                <div className="mb-3">
                  {getStatusBadge(application)}
                </div>
              
              {/* Join Date */}
              <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-4">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Joined {formatDate(application.created_at)}</span>
              </div>
              
                {/* Action Buttons */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (application.mosque?.id && (application.status === 'approved' || application.status === 'active')) {
                      window.open(`/mosques/${application.mosque.id}?openKhairat=true`, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  disabled={
                    application.status !== 'approved' && application.status !== 'active'
                  }
                  className={
                    (application.status === 'approved' || application.status === 'active')
                      ? "border-emerald-300 text-emerald-600 hover:bg-emerald-50 w-full"
                      : "border-gray-300 text-gray-400 cursor-not-allowed w-full"
                  }
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {(application.status === 'approved' || application.status === 'active') ? 'Make Payment' : 'Pay Khairat'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (application.mosque?.id && (application.status === 'approved' || application.status === 'active')) {
                      window.open(`/mosques/${application.mosque.id}?openClaim=true`, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  disabled={
                    application.status !== 'approved' && application.status !== 'active'
                  }
                  className={
                    (application.status === 'approved' || application.status === 'active')
                      ? "border-blue-300 text-blue-600 hover:bg-blue-50 w-full mt-2"
                      : "border-gray-300 text-gray-400 cursor-not-allowed w-full mt-2"
                  }
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {(application.status === 'approved' || application.status === 'active') ? 'Submit Claim' : 'Submit Claim'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (application.mosque?.id) {
                      window.open(`/mosques/${application.mosque.id}`, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="w-full mt-2 border-slate-300"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Mosque
                </Button>
            </div>
          </Card>
        ))}
      </div>

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
              disabled={deletingId === selectedMember?.id}
            >
              {deletingId === selectedMember?.id ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Application Management Modal */}
      <Dialog open={showManagementModal} onOpenChange={setShowManagementModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Application</DialogTitle>
            <DialogDescription>
              View and manage your khairat application
            </DialogDescription>
          </DialogHeader>
          
          {selectedMember && (
            <div className="space-y-4">
              {/* Application Information */}
              <div className="space-y-3">
                     <div className="flex items-center gap-3">
                       <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                         <Image
                           src={selectedMember.mosque?.logo_url || '/icon-khairatkita.png'}
                           alt={`${selectedMember.mosque?.name} logo`}
                           width={48}
                           height={48}
                           className="h-full w-full object-cover"
                         />
                       </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {selectedMember.mosque?.name || 'Unknown Mosque'}
                    </h3>
                    {selectedMember.mosque?.address && (
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{selectedMember.mosque.address}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</label>
                        <div className="mt-1">
                          {getStatusBadge(selectedMember)}
                        </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Applied Date</label>
                    <div className="mt-1 text-sm text-slate-900 dark:text-white">
                      {formatDate(selectedMember.created_at)}
                    </div>
                  </div>
                </div>
                
                {selectedMember.admin_notes && (
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Admin Notes</label>
                    <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-md text-sm text-slate-700 dark:text-slate-300">
                      {selectedMember.admin_notes}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                {canWithdraw(selectedMember.status) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowManagementModal(false);
                      setShowWithdrawDialog(true);
                    }}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Withdraw Application
                  </Button>
                )}
                
                {canWithdrawMembership(selectedMember.status) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowManagementModal(false);
                      setShowWithdrawDialog(true);
                    }}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Leave Khairat
                  </Button>
                )}
                
                {canDelete(selectedMember.status) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowManagementModal(false);
                      setShowDeleteDialog(true);
                    }}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Application
                  </Button>
                )}
                
                {!canWithdraw(selectedMember.status) && !canWithdrawMembership(selectedMember.status) && !canDelete(selectedMember.status) && (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    No actions available for this application
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Withdraw Confirmation Dialog */}
      <AlertDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedMember?.status === 'approved' ? 'Leave Khairat' : 'Withdraw Application'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedMember?.status === 'approved' 
                ? 'Are you sure you want to leave this khairat membership? You can reapply later if needed.'
                : 'Are you sure you want to withdraw this application? You can reapply later if needed.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={selectedMember?.status === 'approved' ? handleWithdrawMembership : handleWithdrawApplication}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={withdrawingId === selectedMember?.id}
            >
              {withdrawingId === selectedMember?.id ? 'Processing...' : 
               selectedMember?.status === 'approved' ? 'Leave' : 'Withdraw'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
