'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Calendar,
  Building,
  DollarSign,
  Loader2,
  Plus,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { getUserClaims, createClaim, getClaimDocuments } from '@/lib/api';
import type {
  KhairatClaimWithDetails,
  ClaimStatus,
  ClaimPriority,
  CreateKhairatClaim,
  ClaimDocument,
} from '@/types/database';

interface UserClaimsTableProps {
  showHeader?: boolean;
}

const getStatusConfig = (t: any) => ({
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: t('status.pending') },
  under_review: { icon: AlertCircle, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', label: t('status.under_review') },
  approved: { icon: CheckCircle, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: t('status.approved') },
  rejected: { icon: XCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: t('status.rejected') },
  paid: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', label: t('status.paid') },
  cancelled: { icon: XCircle, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', label: t('status.cancelled') }
});

export function UserClaimsTable({ showHeader = true }: UserClaimsTableProps) {
  const { user } = useAuth();
  const t = useTranslations('claims');
  const tc = useTranslations('common');
  
  const [claims, setClaims] = useState<KhairatClaimWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<KhairatClaimWithDetails | null>(null);
  const [selectedClaimDocuments, setSelectedClaimDocuments] = useState<ClaimDocument[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  const statusConfig = getStatusConfig(t);
  const priorityConfig: Record<ClaimPriority, { label: string; color: string }> = {
    low: { label: tc('priority.low') || 'Low', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300' },
    medium: { label: tc('priority.medium') || 'Medium', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    high: { label: tc('priority.high') || 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    urgent: { label: tc('priority.urgent') || 'Urgent', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  };

  useEffect(() => {
    if (user) {
      fetchUserClaims();
    }
  }, [user]);

  const fetchUserClaims = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await getUserClaims(user.id, 50, 0);
      setClaims(response.data || []);
    } catch (error) {
      console.error('Error fetching user claims:', error);
      toast.error(t('messages.loadError') || 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (claim: KhairatClaimWithDetails) => {
    setSelectedClaim(claim);
    setIsModalOpen(true);
    
    // Load documents for this claim
    try {
      setLoadingDocuments(true);
      const response = await getClaimDocuments(claim.id);
      if (response.success) {
        setSelectedClaimDocuments(response.data || []);
      }
    } catch (error) {
      console.error('Error loading claim documents:', error);
      setSelectedClaimDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const columns: ColumnDef<KhairatClaimWithDetails>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('reason')} />
      ),
      cell: ({ row }) => {
        const claim = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {claim.title}
            </div>
            <div className="text-sm text-muted-foreground">
              {claim.mosque?.name || 'Unknown Mosque'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'requested_amount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('amount')} />
      ),
      cell: ({ row }) => {
        const claim = row.original;
        return (
          <div>
            {claim.approved_amount ? (
              <p className="font-semibold text-green-600 text-lg">
                {formatCurrency(claim.approved_amount)}
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  {t('status.pending') || 'Pending'}
                </Badge>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={tc('status')} />
      ),
      cell: ({ row }) => {
        const claim = row.original;
        const StatusIcon = statusConfig[claim.status].icon;
        return (
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            <Badge className={statusConfig[claim.status].color}>
              {statusConfig[claim.status].label}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('submitted')} />
      ),
      cell: ({ row }) => {
        const claim = row.original;
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm">{formatDate(claim.created_at)}</p>
              <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(claim.created_at), { addSuffix: true })}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: tc('actions'),
      cell: ({ row }) => {
        const claim = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetails(claim)}
              className="h-8 px-3"
            >
              <Eye className="h-4 w-4 mr-1" />
              {tc('view')}
            </Button>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-muted-foreground">{t('loadingClaims') || 'Loading claims...'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {t('myClaims') || 'My Claims'}
              </h2>
              <p className="text-muted-foreground mt-1">
                {t('viewMyClaimsDescription') || 'View and track your khairat claims'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {claims.length} records
              </Badge>
            </div>
          </div>
        </div>
      )}

      {claims.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">
            {t('noClaimsYet') || 'No Claims Yet'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8">
            {t('noClaimsDescription') || 'You haven\'t submitted any khairat claims yet. Contact your mosque admin to submit a claim.'}
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={claims}
          searchKey="title"
          searchPlaceholder={t('searchClaims') || 'Search claims...'}
        />
      )}

      {/* Claim Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] min-h-[60vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('claimDetails') || 'Claim Details'}
            </DialogTitle>
            <DialogDescription>
              {t('completeInformationAboutClaim') || 'Complete information about your claim'}
            </DialogDescription>
          </DialogHeader>

          {selectedClaim && (
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('mosque') || 'Mosque'}
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {selectedClaim.mosque?.name || 'Unknown Mosque'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('amount') || 'Amount'}
                    </label>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(selectedClaim.requested_amount)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {tc('status') || 'Status'}
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      {(() => {
                        const StatusIcon = statusConfig[selectedClaim.status].icon;
                        return <StatusIcon className="h-4 w-4" />;
                      })()}
                      <Badge className={statusConfig[selectedClaim.status].color}>
                        {statusConfig[selectedClaim.status].label}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {tc('priority') || 'Priority'}
                    </label>
                    <div className="mt-1">
                      <Badge className={priorityConfig[selectedClaim.priority].color}>
                        {priorityConfig[selectedClaim.priority].label}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('submitted') || 'Submitted'}
                    </label>
                    <p className="font-medium">
                      {formatDate(selectedClaim.created_at)}
                    </p>
                  </div>

                  {selectedClaim.approved_amount && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('approvedAmount') || 'Approved Amount'}
                      </label>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(selectedClaim.approved_amount)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Claim Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t('claimInformation') || 'Claim Information'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('reason') || 'Reason'}
                    </label>
                    <p className="font-medium">
                      {selectedClaim.title}
                    </p>
                  </div>

                  {selectedClaim.description && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('description') || 'Description'}
                      </label>
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg mt-1">
                        <p className="text-sm leading-relaxed">
                          {selectedClaim.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              {selectedClaim.admin_notes && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {t('adminNotes') || 'Admin Notes'}
                  </h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm leading-relaxed">
                      {selectedClaim.admin_notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedClaim.rejection_reason && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 text-red-600">
                    {t('rejectionReason') || 'Rejection Reason'}
                  </h3>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <p className="text-sm leading-relaxed">
                      {selectedClaim.rejection_reason}
                    </p>
                  </div>
                </div>
              )}

              {/* Supporting Documents */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Supporting Documents
                </h3>
                {loadingDocuments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                    <span className="ml-2 text-muted-foreground">Loading documents...</span>
                  </div>
                ) : selectedClaimDocuments.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      No supporting documents uploaded
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedClaimDocuments.map((document) => (
                      <div
                        key={document.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {document.file_type?.startsWith('image/') ? '🖼️' : 
                             document.file_type === 'application/pdf' ? '📄' : 
                             document.file_type?.includes('word') ? '📝' : '📎'}
                          </span>
                          <div>
                            <p className="text-sm font-medium">
                              {document.file_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {document.file_size ? `${(document.file_size / 1024).toFixed(1)} KB` : ''} • 
                              {new Date(document.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(document.file_url, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(document.file_url, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
