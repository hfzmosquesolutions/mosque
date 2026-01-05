'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Calendar,
  User,
  Loader2,
  Download,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { getUserClaims, getClaimDocuments } from '@/lib/api';
import type {
  KhairatClaimWithDetails,
  ClaimPriority,
  ClaimDocument,
} from '@/types/database';
import { ClaimDocumentView } from '@/components/khairat/ClaimDocumentView';

interface UserClaimsTableProps {
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

export function UserClaimsTable({ showHeader = true }: UserClaimsTableProps) {
  const { user } = useAuth();
  const t = useTranslations('claims');
  const tc = useTranslations('common');
  
  const [claims, setClaims] = useState<KhairatClaimWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<KhairatClaimWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const statusConfig = getStatusConfig(t);
  const priorityConfig: Record<ClaimPriority, { label: string; color: string }> = {
    low: { label: t('priority.low') || 'Low', color: 'bg-gray-100 text-gray-800' },
    medium: { label: t('priority.medium') || 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    high: { label: t('priority.high') || 'High', color: 'bg-red-100 text-red-800' },
    urgent: { label: t('priority.urgent') || 'Urgent', color: 'bg-purple-100 text-purple-800' },
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
  };

  const filterClaims = () => {
    let filtered = claims;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (claim) =>
          claim.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.mosque?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.claim_id?.toLowerCase().includes(searchTerm.toLowerCase())
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
      accessorKey: 'mosque.name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('mosque')} />
      ),
      cell: ({ row }) => {
        const claim = row.original;
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-1">
              <div className="font-medium">{claim.mosque?.name || t('unknownMosque')}</div>
              <div className="text-sm text-muted-foreground">{claim.title}</div>
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
        const claim = row.original;
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
        const claim = row.original;
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
        <DataTableColumnHeader column={column} title={t('userClaimsTable.claimId')} />
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
        const claim = row.original;
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
        const claim = row.original;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(claim)}
            className="h-8 px-3"
          >
            <Eye className="h-4 w-4 mr-1" />
            {t('view')}
          </Button>
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

      {/* Claim Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('claimDetails')}</DialogTitle>
            <DialogDescription>
              {t('claimDetailsDescription')}
            </DialogDescription>
          </DialogHeader>

          {selectedClaim && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {selectedClaim.claim_id && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('userClaimsTable.claimId')}:
                    </label>
                    <p className="text-sm font-medium font-mono">{selectedClaim.claim_id}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('mosque')}
                  </label>
                  <p className="text-sm">{selectedClaim.mosque?.name || t('unknownMosque')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('title')}
                  </label>
                  <p className="text-sm">{selectedClaim.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('requestedAmount')}
                  </label>
                  <p className="text-sm font-medium">{formatCurrency(selectedClaim.requested_amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {tc('status')}
                  </label>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const StatusIcon = statusConfig[selectedClaim.status].icon;
                      return <StatusIcon className="h-4 w-4" />;
                    })()}
                    <Badge className={statusConfig[selectedClaim.status].color}>
                      {statusConfig[selectedClaim.status].label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('priorityLabel')}
                  </label>
                  <Badge className={priorityConfig[selectedClaim.priority].color}>
                    {priorityConfig[selectedClaim.priority].label}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('date')}
                  </label>
                  <p className="text-sm">{formatDate(selectedClaim.created_at)}</p>
                </div>
                {selectedClaim.approved_amount && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('approvedAmount')}
                    </label>
                    <p className="text-sm font-medium text-green-600">{formatCurrency(selectedClaim.approved_amount)}</p>
                  </div>
                )}
              </div>
              {selectedClaim.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('description')}
                  </label>
                  <p className="text-sm">{selectedClaim.description}</p>
                </div>
              )}
              {selectedClaim.admin_notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('adminNotes')}
                  </label>
                  <p className="text-sm">{selectedClaim.admin_notes}</p>
                </div>
              )}
              {selectedClaim.rejection_reason && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('rejectionReason')}
                  </label>
                  <p className="text-sm">{selectedClaim.rejection_reason}</p>
                </div>
              )}

              {/* Person in Charge Information */}
              {(selectedClaim.person_in_charge_name || selectedClaim.person_in_charge_phone || selectedClaim.person_in_charge_relationship) && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    {t('personInCharge')}
                  </label>
                  <div className="space-y-2">
                    {selectedClaim.person_in_charge_name && (
                      <div>
                        <span className="text-xs text-muted-foreground">{t('personInChargeName')}: </span>
                        <span className="text-sm font-medium">{selectedClaim.person_in_charge_name}</span>
                      </div>
                    )}
                    {selectedClaim.person_in_charge_phone && (
                      <div>
                        <span className="text-xs text-muted-foreground">{t('personInChargePhone')}: </span>
                        <span className="text-sm font-medium">{selectedClaim.person_in_charge_phone}</span>
                      </div>
                    )}
                    {selectedClaim.person_in_charge_relationship && (
                      <div>
                        <span className="text-xs text-muted-foreground">{t('personInChargeRelationship')}: </span>
                        <span className="text-sm font-medium">{selectedClaim.person_in_charge_relationship}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Supporting Documents */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t('supportingDocuments')}
                </h3>
                {selectedClaim && (
                  <ClaimDocumentView claimId={selectedClaim.id} />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
