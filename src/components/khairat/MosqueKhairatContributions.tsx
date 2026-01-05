'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Download,
  TrendingUp,
  Users,
  FileText,
  Eye,
  Calendar,
  User,
  AlertTriangle,
  Search,
  Edit,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getMosqueKhairatContributions, updateKhairatContributionStatus } from '@/lib/api';
import { getKhairatMemberById } from '@/lib/api/khairat-members';
import type { KhairatContribution, UserProfile, KhairatMember } from '@/types/database';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { PaymentReceiptView } from '@/components/khairat/PaymentReceiptView';

interface MosqueKhairatContributionsProps {
  mosqueId: string;
  showHeader?: boolean;
}

type ContributionStatus = 'pending' | 'completed' | 'cancelled' | 'failed';

interface ContributionWithUser extends KhairatContribution {
  contributor?: UserProfile;
  member?: {
    id: string;
    membership_number?: string | null;
    full_name?: string;
  };
}

export function MosqueKhairatContributions({
  mosqueId,
  showHeader = true,
}: MosqueKhairatContributionsProps) {
  const t = useTranslations('khairat');
  const [loading, setLoading] = useState(false);
  const [contributions, setContributions] = useState<ContributionWithUser[]>([]);
  const [filteredContributions, setFilteredContributions] = useState<ContributionWithUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedContribution, setSelectedContribution] = useState<ContributionWithUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<KhairatMember | null>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [loadingMember, setLoadingMember] = useState(false);

  const loadContributions = async () => {
    setLoading(true);
    try {
      const response = await getMosqueKhairatContributions(mosqueId, 100, 0);
      if (response.data) {
        setContributions(response.data);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error(t('paymentsTable.failedToLoadPayments'));
    } finally {
      setLoading(false);
    }
  };

  const filterContributions = () => {
    let filtered = contributions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (contribution) =>
          contribution.contributor_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          contribution.payment_id
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          contribution.payment_reference
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          contribution.member?.membership_number
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          contribution.member?.full_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          contribution.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (contribution) => contribution.status === statusFilter
      );
    }

    setFilteredContributions(filtered);
  };

  useEffect(() => {
    if (mosqueId) {
      loadContributions();
    }
  }, [mosqueId]);

  useEffect(() => {
    filterContributions();
  }, [contributions, searchTerm, statusFilter]);

  const handleStatusUpdate = async (
    contributionId: string,
    newStatus: ContributionStatus
  ) => {
    setUpdating(contributionId);
    try {
      const response = await updateKhairatContributionStatus(contributionId, newStatus);
      if (response.success) {
        toast.success(t('paymentsTable.paymentStatusUpdated'));
        loadContributions(); // Reload to get updated data
      } else {
        toast.error(response.error || t('paymentsTable.failedToUpdateStatus'));
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error(t('paymentsTable.failedToUpdatePaymentStatus'));
    } finally {
      setUpdating(null);
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
      toast.error(t('paymentsTable.failedToLoadMemberDetails') || 'Failed to load member details');
      setIsMemberModalOpen(false);
    } finally {
      setLoadingMember(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
      failed: 'destructive',
    } as const;

    const statusLabels: Record<string, string> = {
      completed: t('paymentsTable.completed'),
      pending: t('paymentsTable.pending'),
      cancelled: t('paymentsTable.cancelled'),
      failed: t('paymentsTable.failed'),
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns: ColumnDef<ContributionWithUser>[] = [
    {
      accessorKey: 'contributor_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('paymentsTable.payerName')} />
      ),
      cell: ({ row }) => {
        const contributorName = row.getValue('contributor_name') as string;
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{contributorName || t('paymentsTable.anonymous')}</span>
          </div>
        );
      },
    },
    {
      id: 'member',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('paymentsTable.member')} />
      ),
      cell: ({ row }) => {
        const contribution = row.original;
        const member = contribution.member;
        const memberId = contribution.khairat_member_id;
        
        // Only show if there's a linked member via khairat_member_id
        if (!memberId || !member) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        
        // Show membership number if available, otherwise show member ID
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
      accessorKey: 'amount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('paymentsTable.amount')} />
      ),
      cell: ({ row }) => {
        const amount = row.getValue('amount') as number;
        return (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="font-medium">{formatCurrency(amount)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('paymentsTable.status')} />
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            {getStatusBadge(status)}
          </div>
        );
      },
    },
    {
      accessorKey: 'payment_method',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('paymentsTable.paymentMethod')} />
      ),
      cell: ({ row }) => {
        const method = row.getValue('payment_method') as string;
        return (
          <Badge variant="outline" className="capitalize">
            {method?.replace('_', ' ') || t('paymentsTable.notAvailable')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'payment_id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('paymentsTable.paymentId')} />
      ),
      cell: ({ row }) => {
        const paymentId = row.getValue('payment_id') as string;
        return paymentId ? (
          <span className="font-mono text-sm">{paymentId}</span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
    },
    {
      accessorKey: 'contributed_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('paymentsTable.date')} />
      ),
      cell: ({ row }) => {
        const date = row.getValue('contributed_at') as string;
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(date)}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: t('paymentsTable.actions'),
      cell: ({ row }) => {
        const contribution = row.original;
        const isUpdating = updating === contribution.id;

        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedContribution(contribution);
                setIsModalOpen(true);
              }}
              className="h-8 w-8 p-0"
              title={t('paymentsTable.viewDetails') || 'View Details'}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Edit className="h-4 w-4" />
              )}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {showHeader && (
        <div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('paymentsTable.khairatPayments')}
            </CardTitle>
            <CardDescription>
              {t('paymentsTable.manageAndTrackPayments')}
            </CardDescription>
          </CardHeader>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredContributions}
        customFilters={
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('paymentsTable.searchPayments')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('paymentsTable.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('paymentsTable.allStatus')}</SelectItem>
                <SelectItem value="pending">{t('paymentsTable.pending')}</SelectItem>
                <SelectItem value="completed">{t('paymentsTable.completed')}</SelectItem>
                <SelectItem value="cancelled">{t('paymentsTable.cancelled')}</SelectItem>
                <SelectItem value="failed">{t('paymentsTable.failed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Payment Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('paymentsTable.paymentDetails')}</DialogTitle>
            <DialogDescription>
              {t('paymentsTable.paymentDetailsDescription')}
            </DialogDescription>
          </DialogHeader>
          {selectedContribution && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {selectedContribution.payment_id && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('paymentsTable.paymentId')}:
                    </label>
                    <p className="text-sm font-medium font-mono">{selectedContribution.payment_id}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('paymentsTable.payerName')}
                  </label>
                  <p className="text-sm">{selectedContribution.contributor_name || t('paymentsTable.anonymous')}</p>
                </div>
                {selectedContribution.khairat_member_id && selectedContribution.member && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('paymentsTable.member')}
                    </label>
                    <p className="text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {selectedContribution.member.membership_number || 
                       selectedContribution.khairat_member_id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('paymentsTable.amount')}
                  </label>
                  <p className="text-sm font-medium">{formatCurrency(selectedContribution.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('paymentsTable.status')}
                  </label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedContribution.status)}
                    {getStatusBadge(selectedContribution.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('paymentsTable.paymentMethod')}
                  </label>
                  <p className="text-sm capitalize">
                    {selectedContribution.payment_method?.replace('_', ' ') || t('paymentsTable.notAvailable')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('paymentsTable.date')}
                  </label>
                  <p className="text-sm">{formatDate(selectedContribution.contributed_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('paymentsTable.reference')}
                  </label>
                  <p className="text-sm">{selectedContribution.payment_reference || t('paymentsTable.notAvailable')}</p>
                </div>
              </div>
              {selectedContribution.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('paymentsTable.notes')}
                  </label>
                  <p className="text-sm">{selectedContribution.notes}</p>
                </div>
              )}
              {(selectedContribution.payment_method === 'bank_transfer' || selectedContribution.payment_method === 'cash') && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    {t('paymentReceipts')}
                  </label>
                  <PaymentReceiptView contributionId={selectedContribution.id} />
                </div>
              )}
              
              {/* Status update actions for cash payments */}
              {selectedContribution.payment_method === 'cash' && (
                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-muted-foreground mb-3 block">
                    {t('paymentsTable.actions')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedContribution.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            handleStatusUpdate(selectedContribution.id, 'completed');
                            setIsModalOpen(false);
                          }}
                          disabled={updating === selectedContribution.id}
                        >
                          {updating === selectedContribution.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          {t('paymentsTable.markAsCompleted')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            handleStatusUpdate(selectedContribution.id, 'cancelled');
                            setIsModalOpen(false);
                          }}
                          disabled={updating === selectedContribution.id}
                        >
                          {updating === selectedContribution.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                          )}
                          {t('paymentsTable.cancel')}
                        </Button>
                      </>
                    )}
                    {selectedContribution.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleStatusUpdate(selectedContribution.id, 'pending');
                          setIsModalOpen(false);
                        }}
                        disabled={updating === selectedContribution.id}
                      >
                        {updating === selectedContribution.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Clock className="h-4 w-4 mr-2" />
                        )}
                        {t('paymentsTable.markAsPending')}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Member Details Modal */}
      <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('paymentsTable.memberDetails') || 'Member Details'}</DialogTitle>
            <DialogDescription>
              {t('paymentsTable.memberDetailsDescription') || 'View detailed information about this member'}
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
                      {t('paymentsTable.memberIdLabel') || 'Member ID'}:
                    </label>
                    <p className="text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {selectedMember.membership_number}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('paymentsTable.name') || 'Name'}:
                  </label>
                  <p className="text-sm">{selectedMember.full_name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('paymentsTable.status') || 'Status'}:
                  </label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedMember.status)}
                    {getStatusBadge(selectedMember.status)}
                  </div>
                </div>
                {selectedMember.ic_passport_number && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('payPage.icNumberLabel') || 'IC Number'}:
                    </label>
                    <p className="text-sm font-mono">{selectedMember.ic_passport_number}</p>
                  </div>
                )}
                {selectedMember.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('payPage.mobileNumberLabel') || 'Phone'}:
                    </label>
                    <p className="text-sm">{selectedMember.phone}</p>
                  </div>
                )}
                {selectedMember.email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('payPage.emailLabel') || 'Email'}:
                    </label>
                    <p className="text-sm">{selectedMember.email}</p>
                  </div>
                )}
                {selectedMember.address && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('paymentsTable.address') || 'Address'}:
                    </label>
                    <p className="text-sm">{selectedMember.address}</p>
                  </div>
                )}
                {selectedMember.joined_date && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('paymentsTable.joinedDate') || 'Joined Date'}:
                    </label>
                    <p className="text-sm">{new Date(selectedMember.joined_date).toLocaleDateString('en-MY')}</p>
                  </div>
                )}
                {selectedMember.created_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('paymentsTable.createdAt') || 'Created At'}:
                    </label>
                    <p className="text-sm">{formatDate(selectedMember.created_at)}</p>
                  </div>
                )}
              </div>
              {selectedMember.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('paymentsTable.notes') || 'Notes'}:
                  </label>
                  <p className="text-sm">{selectedMember.notes}</p>
                </div>
              )}
              {selectedMember.admin_notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('paymentsTable.adminNotes') || 'Admin Notes'}:
                  </label>
                  <p className="text-sm">{selectedMember.admin_notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('paymentsTable.memberNotFound') || 'Member not found'}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
