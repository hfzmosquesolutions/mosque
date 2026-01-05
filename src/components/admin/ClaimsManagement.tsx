'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  Eye,
  Check,
  X,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  User,
  Building,
  MapPin,
  Mail,
  Phone,
  FileText,
  Plus,
  Download,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  getClaims,
  updateClaim,
  getClaimDocuments
} from '@/lib/api';
import { getKhairatMemberById } from '@/lib/api/khairat-members';
import type {
  KhairatClaimWithDetails,
  ClaimStatus,
  ClaimPriority,
  UpdateKhairatClaim,
  ClaimDocument,
  KhairatMember
} from '@/types/database';
import { ClaimDocumentView } from '@/components/khairat/ClaimDocumentView';

interface ClaimsManagementProps {
  mosqueId: string;
  showHeader?: boolean;
}

const getStatusConfig = (t: any) => ({
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: t('status.pending') },
  under_review: { icon: AlertCircle, color: 'bg-blue-100 text-blue-800', label: t('status.under_review') },
  approved: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: t('status.approved') },
  rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', label: t('status.rejected') },
  paid: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800', label: t('status.paid') },
  cancelled: { icon: XCircle, color: 'bg-gray-100 text-gray-800', label: t('status.cancelled') }
});

const getPriorityConfig = (t: any) => ({
  low: { color: 'bg-gray-100 text-gray-800', label: t('priority.low') },
  medium: { color: 'bg-yellow-100 text-yellow-800', label: t('priority.medium') },
  high: { color: 'bg-red-100 text-red-800', label: t('priority.high') },
  urgent: { color: 'bg-purple-100 text-purple-800', label: t('priority.urgent') }
});

export function ClaimsManagement({ mosqueId, showHeader = true }: ClaimsManagementProps) {
  const { user } = useAuth();
  const t = useTranslations('claims');
  const tc = useTranslations('common');
  
  const [claims, setClaims] = useState<KhairatClaimWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<KhairatClaimWithDetails | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: '' as ClaimStatus,
    notes: '',
    approved_amount: 0
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<KhairatMember | null>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [loadingMember, setLoadingMember] = useState(false);
  

  const statusConfig = getStatusConfig(t);
  const priorityConfig = getPriorityConfig(t);

  useEffect(() => {
    if (!mosqueId) {
      setClaims([]);
      setLoading(false);
      return;
    }
    fetchData();
  }, [mosqueId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!mosqueId) {
        setClaims([]);
        return;
      }
      const claimsResponse = await getClaims({ mosque_id: mosqueId });
      setClaims(claimsResponse.data || []);
    } catch (error) {
      console.error('[ClaimsManagement] Error fetching data:', error);
      toast.error(t('messages.loadError'));
      setClaims([]); // Clear claims on error
    } finally {
      setLoading(false);
    }
  };

  const handleMemberClick = async (memberId: string) => {
    if (!memberId) return;
    
    setLoadingMember(true);
    setIsMemberModalOpen(true);
    try {
      const member = await getKhairatMemberById(memberId);
      setSelectedMember(member);
    } catch (error) {
      console.error('Error loading member details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load member details';
      toast.error(errorMessage);
      setIsMemberModalOpen(false);
      setSelectedMember(null);
    } finally {
      setLoadingMember(false);
    }
  };

  const handleReviewClaim = async (claim: KhairatClaimWithDetails) => {
    setSelectedClaim(claim);
    setReviewData({
      status: claim.status,
      notes: claim.admin_notes || '',
      approved_amount: claim.approved_amount || claim.requested_amount
    });
    setShowReviewDialog(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedClaim) return;

    try {
      setSubmitting(true);
      const updateData: UpdateKhairatClaim = {
        status: reviewData.status,
        admin_notes: reviewData.notes,
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString()
      };

      if (reviewData.status === 'approved') {
        updateData.approved_amount = reviewData.approved_amount;
        updateData.approved_by = user!.id;
        updateData.approved_at = new Date().toISOString();
      }

      if (reviewData.status === 'rejected') {
        updateData.rejection_reason = reviewData.notes;
      }

      await updateClaim(selectedClaim.id, updateData);
      
      toast.success(t('messages.reviewSubmitted'));
      setShowReviewDialog(false);
      setSelectedClaim(null);
      fetchData();
    } catch (error) {
      console.error('Error updating claim:', error);
      toast.error(t('messages.reviewError'));
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to get member data (only from khairat_member)
  const getMemberData = (claim: KhairatClaimWithDetails) => {
    return claim.khairat_member;
  };

  const filterClaims = () => {
    let filtered = claims;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (claim) => {
          const member = getMemberData(claim);
          return (
            claim.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            claim.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            claim.claim_id?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (claim) => claim.status === statusFilter
      );
    }

    return filtered;
  };

  const filteredClaims = filterClaims();

  const columns: ColumnDef<KhairatClaimWithDetails>[] = [
    {
      accessorKey: 'claimant.full_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('claimant')} />
      ),
      cell: ({ row }) => {
        const claim = row.original as KhairatClaimWithDetails;
        const member = getMemberData(claim);
        return (
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-medium">{member?.full_name || t('unknown')}</span>
              {claim.title && (
                <span className="text-xs text-muted-foreground line-clamp-2">{claim.title}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'member',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('memberId')} />
      ),
      cell: ({ row }) => {
        const claim = row.original as KhairatClaimWithDetails;
        const member = getMemberData(claim);
        
        if (!member) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        
        const memberId = member.id;
        
        return (
          <button
            onClick={() => handleMemberClick(memberId)}
            className="flex flex-col gap-1 hover:opacity-80 transition-opacity text-left"
          >
            {member.membership_number ? (
              <span className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer">
                {member.membership_number}
              </span>
            ) : (
              <span className="font-mono text-xs text-muted-foreground hover:underline cursor-pointer">
                {memberId.slice(0, 8).toUpperCase()}
              </span>
            )}
          </button>
        );
      },
    },
    {
      accessorKey: 'requested_amount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('amount')} />
      ),
      cell: ({ row }) => {
        const claim = row.original as KhairatClaimWithDetails;
        return (
          <div>
            <p className="font-medium">{formatCurrency(claim.requested_amount)}</p>
            {claim.approved_amount && claim.approved_amount !== claim.requested_amount && (
              <p className="text-xs text-green-600">{t('approvedAmount')}: {formatCurrency(claim.approved_amount)}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('priorityLabel')} />
      ),
      cell: ({ row }) => {
        const claim = row.original as KhairatClaimWithDetails;
        return (
          <Badge className={priorityConfig[claim.priority].color}>
            {priorityConfig[claim.priority].label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={tc('status')} />
      ),
      cell: ({ row }) => {
        const claim = row.original as KhairatClaimWithDetails;
        const StatusIcon = statusConfig[claim.status].icon;
        return (
          <Badge className={statusConfig[claim.status].color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig[claim.status].label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'claim_id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('claimsTable.claimId')} />
      ),
      cell: ({ row }) => {
        const claimId = row.getValue('claim_id') as string;
        return claimId ? (
          <span className="font-mono text-sm">{claimId}</span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('submitted')} />
      ),
      cell: ({ row }) => {
        const claim = row.original as KhairatClaimWithDetails;
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(claim.created_at)}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: tc('actions'),
      cell: ({ row }) => {
        const claim = row.original as KhairatClaimWithDetails;
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReviewClaim(claim)}
              className="h-8 w-8 p-0"
              title="Update"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleExportCSV = () => {
    if (!filteredClaims || filteredClaims.length === 0) {
      toast.error(tc('noData') || 'No data to export');
      return;
    }

    const headers = [
      t('exportHeaders.claimantName'),
      t('exportHeaders.title'),
      t('exportHeaders.requestedAmount'),
      t('exportHeaders.approvedAmount'),
      t('exportHeaders.priority'),
      t('exportHeaders.status'),
      t('exportHeaders.submittedAt'),
      t('personInChargeName'),
      t('personInChargePhone'),
      t('personInChargeRelationship'),
    ];

    const rows = filteredClaims.map((c) => {
      const member = getMemberData(c);
      return [
        member?.full_name || '',
        c.title || '',
        (c.requested_amount ?? 0).toString(),
        (c.approved_amount ?? 0).toString(),
        c.priority,
        c.status,
        formatDate(c.created_at),
        c.person_in_charge_name || '',
        c.person_in_charge_phone || '',
        c.person_in_charge_relationship || '',
      ];
    });

    const csv = [headers, ...rows]
      .map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `claims-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(t('messages.exportSuccess', { count: filteredClaims.length }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Standardized header (match payments tab) */}
      {showHeader && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {t('title')}
              </h2>
              <p className="text-muted-foreground mt-1">
                {t('manageDescription')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {filteredClaims.length} {t('records')}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="hover:bg-emerald-50 hover:border-emerald-200"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('exportData')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Claims Table */}
      <DataTable
        columns={columns}
        data={filteredClaims as any}
        customFilters={
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatus')}</SelectItem>
                <SelectItem value="pending">{t('status.pending')}</SelectItem>
                <SelectItem value="under_review">{t('status.under_review')}</SelectItem>
                <SelectItem value="approved">{t('status.approved')}</SelectItem>
                <SelectItem value="rejected">{t('status.rejected')}</SelectItem>
                <SelectItem value="paid">{t('status.paid')}</SelectItem>
                <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('reviewClaim')}</DialogTitle>
            <DialogDescription>
              {t('reviewClaimDescription')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedClaim && (
            <div className="space-y-6">
              {/* Claim Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                {selectedClaim.claim_id && (
                  <div className="col-span-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium">{t('claimsTable.claimId')}</p>
                    <p className="text-sm font-medium font-mono">{selectedClaim.claim_id}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{t('claimant')}</p>
                  {(() => {
                    const member = getMemberData(selectedClaim);
                    return (
                      <>
                        <p className="text-sm text-muted-foreground">{member?.full_name || t('unknown')}</p>
                        {member?.phone && (
                          <p className="text-xs text-muted-foreground mt-1">{member.phone}</p>
                        )}
                        {selectedClaim.khairat_member?.membership_number && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('memberId')}: {selectedClaim.khairat_member.membership_number}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div>
                  <p className="text-sm font-medium">{t('claimAmount')}</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(selectedClaim.requested_amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{t('priorityLabel')}</p>
                  <Badge className={priorityConfig[selectedClaim.priority].color}>
                    {priorityConfig[selectedClaim.priority].label}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium">{t('reason')}</p>
                  <p className="text-sm text-muted-foreground">{selectedClaim.title}</p>
                </div>
                {selectedClaim.description && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium">{t('description')}</p>
                    <p className="text-sm text-muted-foreground">{selectedClaim.description}</p>
                  </div>
                )}
                {/* Person in Charge Information */}
                {(selectedClaim.person_in_charge_name || selectedClaim.person_in_charge_phone || selectedClaim.person_in_charge_relationship) && (
                  <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium mb-2">{t('personInCharge')}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedClaim.person_in_charge_name && (
                        <div>
                          <p className="text-xs text-muted-foreground">{t('personInChargeName')}</p>
                          <p className="text-sm font-medium">{selectedClaim.person_in_charge_name}</p>
                        </div>
                      )}
                      {selectedClaim.person_in_charge_phone && (
                        <div>
                          <p className="text-xs text-muted-foreground">{t('personInChargePhone')}</p>
                          <p className="text-sm font-medium">{selectedClaim.person_in_charge_phone}</p>
                        </div>
                      )}
                      {selectedClaim.person_in_charge_relationship && (
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">{t('personInChargeRelationship')}</p>
                          <p className="text-sm font-medium">{selectedClaim.person_in_charge_relationship}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Review Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{tc('status')}</label>
                  <Select
                    value={reviewData.status}
                    onValueChange={(value) => setReviewData(prev => ({ ...prev, status: value as ClaimStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t('status.pending')}</SelectItem>
                      <SelectItem value="under_review">{t('status.under_review')}</SelectItem>
                      <SelectItem value="approved">{t('status.approved')}</SelectItem>
                      <SelectItem value="rejected">{t('status.rejected')}</SelectItem>
                      <SelectItem value="paid">{t('status.paid')}</SelectItem>
                      <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reviewData.status === 'approved' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('approvedAmount')}</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={selectedClaim.requested_amount}
                      value={reviewData.approved_amount}
                      onChange={(e) => setReviewData(prev => ({ ...prev, approved_amount: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('adminNotes')}</label>
                  <Textarea
                    placeholder={t('adminNotesPlaceholder')}
                    value={reviewData.notes}
                    onChange={(e) => setReviewData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* Supporting Documents */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('supportingDocuments')}</label>
                  {selectedClaim && (
                    <ClaimDocumentView claimId={selectedClaim.id} />
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowReviewDialog(false)}
                  disabled={submitting}
                >
                  {tc('cancel')}
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {tc('save')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Member Details Modal */}
      <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tc('memberDetails') || 'Member Details'}</DialogTitle>
            <DialogDescription>
              {tc('memberDetailsDescription') || 'View detailed information about this member'}
            </DialogDescription>
          </DialogHeader>
          {loadingMember ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : selectedMember ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {selectedMember.membership_number && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {tc('memberId') || 'Member ID'}:
                    </label>
                    <p className="text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {selectedMember.membership_number}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {tc('name') || 'Name'}:
                  </label>
                  <p className="text-sm">{selectedMember.full_name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {tc('status') || 'Status'}:
                  </label>
                  <div className="flex items-center gap-2">
                    {selectedMember.status === 'active' || selectedMember.status === 'approved' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <Badge variant={selectedMember.status === 'active' || selectedMember.status === 'approved' ? 'default' : 'secondary'}>
                      {selectedMember.status}
                    </Badge>
                  </div>
                </div>
                {selectedMember.ic_passport_number && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {tc('icNumber') || 'IC Number'}:
                    </label>
                    <p className="text-sm font-mono">{selectedMember.ic_passport_number}</p>
                  </div>
                )}
                {selectedMember.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {tc('phone') || 'Phone'}:
                    </label>
                    <p className="text-sm">{selectedMember.phone}</p>
                  </div>
                )}
                {selectedMember.email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {tc('email') || 'Email'}:
                    </label>
                    <p className="text-sm">{selectedMember.email}</p>
                  </div>
                )}
                {selectedMember.address && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {tc('address') || 'Address'}:
                    </label>
                    <p className="text-sm">{selectedMember.address}</p>
                  </div>
                )}
                {selectedMember.created_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {tc('createdAt') || 'Created At'}:
                    </label>
                    <p className="text-sm">{formatDate(selectedMember.created_at)}</p>
                  </div>
                )}
              </div>
              {selectedMember.admin_notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {tc('adminNotes') || 'Admin Notes'}:
                  </label>
                  <p className="text-sm">{selectedMember.admin_notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {tc('memberNotFound') || 'Member not found'}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}