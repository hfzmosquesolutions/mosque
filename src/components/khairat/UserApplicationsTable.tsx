'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
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
  membership_number?: string;
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
  const tMyMosques = useTranslations('docs.myMosques');
  const tCommon = useTranslations('common');
  const { user } = useAuth();
  const locale = useLocale();
  const router = useRouter();
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
        membership_number: member.membership_number,
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

  const getStatusBadgeInline = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50/80 dark:border-emerald-700 dark:text-emerald-200 dark:bg-emerald-900/40 text-xs">
            Active
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50/80 dark:border-green-700 dark:text-green-200 dark:bg-green-900/40 text-xs">
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50/80 dark:border-yellow-700 dark:text-yellow-200 dark:bg-yellow-900/40 text-xs">
            Pending
          </Badge>
        );
      case 'under_review':
        return (
          <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50/80 dark:border-blue-700 dark:text-blue-200 dark:bg-blue-900/40 text-xs">
            Under Review
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50/80 dark:border-red-700 dark:text-red-200 dark:bg-red-900/40 text-xs">
            Rejected
          </Badge>
        );
      case 'withdrawn':
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-700 bg-gray-50/80 dark:border-gray-700 dark:text-gray-200 dark:bg-gray-900/40 text-xs">
            Withdrawn
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-700 bg-gray-50/80 dark:border-gray-700 dark:text-gray-200 dark:bg-gray-900/40 text-xs">
            Inactive
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        );
    }
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
    return ['under_review', 'approved', 'active'].includes(status);
  };

  const canDelete = (status: string) => {
    return ['pending', 'rejected', 'withdrawn'].includes(status);
  };

  const canWithdrawMembership = (status: string) => {
    return false; // Merged into canWithdraw
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <Loading message={tMyMosques('loadingMyMosques')} />;
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Building className="h-12 w-12 text-emerald-600" />
        </div>
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">
              {tMyMosques('joinYourFirstMosque')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8">
              {tMyMosques('joinYourFirstMosqueDescription')}
            </p>
        <Button 
          size="lg" 
          className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-3" 
          asChild
        >
          <a href="/mosques" target="_blank" rel="noopener noreferrer">
            <Building className="mr-2 h-5 w-5" /> {tMyMosques('findMosques')}
          </a>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {members.map((application) => (
          <Card
            key={application.id}
            className="transition-all hover:shadow-md bg-white/90 dark:bg-slate-800 border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer p-0"
          >
            <div className="flex flex-col md:flex-row">
              {/* Mosque Image/Logo - Left side */}
              <div className="w-full md:w-64 lg:w-80 h-48 md:h-auto bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                <Image
                  src={(application.mosque?.banner_url || application.mosque?.logo_url || '/window.svg') as string}
                  alt={application.mosque?.name || 'Mosque'}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Mosque Content - Right side */}
              <div className="flex-1 px-4 md:px-6 py-4 md:py-5">
                <div className="flex flex-col h-full">
                  {/* Header: Logo, Name, and Menu */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-full overflow-hidden bg-white border border-slate-200 dark:border-slate-700 flex-shrink-0">
                        <Image
                          src={application.mosque?.logo_url || '/icon-khairatkita.png'}
                          alt={`${application.mosque?.name} logo`}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-1">
                          {application.mosque?.id ? (
                            <button
                              onClick={() => application.mosque?.id && window.open(`/mosques/${application.mosque?.id}`, '_blank', 'noopener,noreferrer')}
                              className="text-slate-900 dark:text-slate-100 hover:text-emerald-600 hover:underline transition-colors cursor-pointer"
                              title="View mosque page"
                            >
                              {application.mosque?.name}
                            </button>
                          ) : (
                            <span className="text-slate-500">Unknown Mosque</span>
                          )}
                        </h3>
                        {application.mosque?.address && (
                          <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                            <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-emerald-600" />
                            <span className="truncate">{application.mosque?.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedMember(application);
                        setShowManagementModal(true);
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1 h-8 w-8 flex-shrink-0"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Membership Info and Actions - Bottom section */}
                  <div className="flex flex-col md:flex-row gap-4 mt-auto">
                    {/* Membership Status Card */}
                    <div 
                      className="flex-1 p-4 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md cursor-default"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                            {application.status === 'active' || application.status === 'approved' ? t('memberId') : t('applicationStatus')}
                          </span>
                          {getStatusBadgeInline(application.status)}
                        </div>
                        {application.membership_number && (application.status === 'active' || application.status === 'approved') ? (
                          <>
                            <span className="text-lg font-mono font-semibold text-emerald-700 dark:text-emerald-400 select-all">
                              {application.membership_number}
                            </span>
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                              {t('joined')} {formatDate(application.created_at)}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            {t('applied')} {formatDate(application.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 md:w-48 lg:w-56">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (application.mosque?.id && (application.status === 'approved' || application.status === 'active')) {
                            router.push(`/${locale}/khairat/pay/${application.mosque.id}`);
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
                        {(application.status === 'approved' || application.status === 'active') ? t('makePayment') : t('payKhairat')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (application.mosque?.id && (application.status === 'approved' || application.status === 'active')) {
                            router.push(`/${locale}/khairat/claim/${application.mosque.id}`);
                          }
                        }}
                        disabled={
                          application.status !== 'approved' && application.status !== 'active'
                        }
                        className={
                          (application.status === 'approved' || application.status === 'active')
                            ? "border-blue-300 text-blue-600 hover:bg-blue-50 w-full"
                            : "border-gray-300 text-gray-400 cursor-not-allowed w-full"
                        }
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {t('submitClaim')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (application.mosque?.id) {
                            window.open(`/mosques/${application.mosque.id}`, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className="w-full border-slate-300"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {t('visitMosque')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
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
            <DialogTitle>{t('manageApplication')}</DialogTitle>
            <DialogDescription>
              {t('viewAndManageApplication')}
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
                    {(selectedMember.status === 'approved' || selectedMember.status === 'active') ? t('leaveKhairat') : t('withdrawApplication')}
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
                    {t('deleteApplication')}
                  </Button>
                )}
                
                {!canWithdraw(selectedMember.status) && !canWithdrawMembership(selectedMember.status) && !canDelete(selectedMember.status) && (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    {t('noActionsAvailable')}
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
              {selectedMember?.status === 'approved' ? t('leaveKhairat') : t('withdrawApplication')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedMember?.status === 'approved' 
                ? t('leaveKhairatConfirmation')
                : t('withdrawApplicationConfirmation')
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={selectedMember?.status === 'approved' ? handleWithdrawMembership : handleWithdrawApplication}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={withdrawingId === selectedMember?.id}
            >
              {withdrawingId === selectedMember?.id ? t('processing') : 
               selectedMember?.status === 'approved' ? t('leave') : t('withdraw')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
