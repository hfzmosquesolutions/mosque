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
import type {
  KhairatClaimWithDetails,
  ClaimStatus,
  ClaimPriority,
  UpdateKhairatClaim,
  ClaimDocument
} from '@/types/database';

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
  const [selectedClaimDocuments, setSelectedClaimDocuments] = useState<ClaimDocument[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: '' as ClaimStatus,
    notes: '',
    approved_amount: 0
  });
  const [submitting, setSubmitting] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  

  const statusConfig = getStatusConfig(t);
  const priorityConfig = getPriorityConfig(t);

  useEffect(() => {
    fetchData();
  }, [mosqueId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const claimsResponse = await getClaims({ mosque_id: mosqueId });
      setClaims(claimsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('messages.loadError'));
    } finally {
      setLoading(false);
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
            claim.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{member?.full_name || 'Unknown'}</span>
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
        <DataTableColumnHeader column={column} title={tc('priority')} />
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
      'Claimant Name',
      'Title',
      'Requested Amount (RM)',
      'Approved Amount (RM)',
      'Priority',
      'Status',
      'Submitted At',
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

    toast.success(`Exported ${filteredClaims.length} claim records`);
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
                {t('manageDescription', { fallback: 'View and manage khairat claims' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {filteredClaims.length} records
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="hover:bg-emerald-50 hover:border-emerald-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
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
                placeholder={t('searchPlaceholder') || 'Search claims...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
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
                <div>
                  <p className="text-sm font-medium">{t('claimant')}</p>
                  {(() => {
                    const member = getMemberData(selectedClaim);
                    return (
                      <>
                        <p className="text-sm text-muted-foreground">{member?.full_name || 'Unknown'}</p>
                        {member?.phone && (
                          <p className="text-xs text-muted-foreground mt-1">{member.phone}</p>
                        )}
                        {selectedClaim.khairat_member?.membership_number && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Member ID: {selectedClaim.khairat_member.membership_number}
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
                  <p className="text-sm font-medium">{tc('priority')}</p>
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
                  <label className="text-sm font-medium">Supporting Documents</label>
                  {loadingDocuments ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading documents...</span>
                    </div>
                  ) : selectedClaimDocuments.length === 0 ? (
                    <div className="text-center py-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        No supporting documents uploaded
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedClaimDocuments.map((document) => (
                        <div
                          key={document.id}
                          className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
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
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(document.file_url, '_blank')}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(document.file_url, '_blank')}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
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
    </div>
  );
}