'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Download,
  TrendingUp,
  Users,
  FileText,
  MoreHorizontal,
  Eye,
  Calendar,
  User,
  AlertTriangle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getKhairatContributions, updateKhairatContributionStatus } from '@/lib/api';
import type { KhairatProgram, KhairatContribution } from '@/types/database';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface KhairatTabContentProps {
  programs: KhairatProgram[];
}

type ContributionStatus = 'pending' | 'completed' | 'cancelled' | 'failed';

interface ContributionWithProgram extends KhairatContribution {
  program?: KhairatProgram;
}

export function KhairatTabContent({
  programs,
}: KhairatTabContentProps) {
  const { user } = useAuth();
  const t = useTranslations('khairat');
  const [loading, setLoading] = useState(false);
  const [contributions, setContributions] = useState<ContributionWithProgram[]>(
    []
  );
  const [filteredContributions, setFilteredContributions] = useState<
    ContributionWithProgram[]
  >([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedContribution, setSelectedContribution] =
    useState<ContributionWithProgram | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadAllContributions = async () => {
    setLoading(true);
    try {
      const allContributions: ContributionWithProgram[] = [];

      // Load contributions from all programs
      for (const program of programs) {
        const response = await getKhairatContributions(program.id, 100, 0);
        if (response.data) {
          const contributionsWithProgram = response.data.map(
            (contribution) => ({
              ...contribution,
              program: program,
            })
          );
          allContributions.push(...contributionsWithProgram);
        }
      }

      // Sort by date (newest first)
      allContributions.sort(
        (a, b) =>
          new Date(b.contributed_at).getTime() -
          new Date(a.contributed_at).getTime()
      );

      setContributions(allContributions);
    } catch (error) {
      console.error('Error loading contributions:', error);
      toast.error('Failed to load contributions');
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
          contribution.payment_reference
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          contribution.notes
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          contribution.program?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (contribution) => contribution.status === statusFilter
      );
    }

    // Filter by program
    if (programFilter !== 'all') {
      filtered = filtered.filter(
        (contribution) => contribution.program?.id === programFilter
      );
    }

    setFilteredContributions(filtered);
  };

  useEffect(() => {
    if (programs.length > 0) {
      loadAllContributions();
    }
  }, [programs]);

  useEffect(() => {
    filterContributions();
  }, [contributions, searchTerm, statusFilter, programFilter]);

  const handleStatusUpdate = async (
    contributionId: string,
    newStatus: ContributionStatus
  ) => {
    if (!user) return;

    // Find the contribution to check payment method
    const contribution = contributions.find((c) => c.id === contributionId);
    if (!contribution) {
      toast.error('Contribution not found');
      return;
    }

    // Only allow status updates for cash payments
    if (contribution.payment_method !== 'cash') {
      toast.error(
        'Only cash payments can be manually updated. Online payments are handled automatically by the payment provider.'
      );
      return;
    }

    setUpdating(contributionId);
    try {
      const response = await updateKhairatContributionStatus(
        contributionId,
        newStatus
      );

      if (response.success) {
        toast.success(t('statusUpdatedSuccessfully'));
        loadAllContributions(); // Reload to get updated data
      } else {
        toast.error(response.error || t('failedToUpdateStatus'));
      }
    } catch (error) {
      console.error('Error updating contribution status:', error);
      toast.error(t('failedToUpdateStatus'));
    } finally {
      setUpdating(null);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setProgramFilter('all');
  };

  const handleExportCSV = () => {
    if (filteredContributions.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Define CSV headers
    const headers = [
      'Contributor Name',
      'Program Name',
      'Amount (RM)',
      'Status',
      'Payment Method',
      'Payment Reference',
      'Notes',
      'Contributed Date',
    ];

    // Convert data to CSV format
    const csvData = filteredContributions.map((contribution) => [
      contribution.contributor_name || 'Anonymous',
      contribution.program?.name || 'Unknown Program',
      contribution.amount.toString(),
      contribution.status,
      contribution.payment_method || 'Not specified',
      contribution.payment_reference || '',
      contribution.notes || '',
      new Date(contribution.contributed_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    ]);

    // Combine headers and data
    const csvContent = [headers, ...csvData]
      .map((row) =>
        row
          .map((field) => `"${field.toString().replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `payments-export-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredContributions.length} payment records`);
  };

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' as const },
      completed: { label: 'Completed', variant: 'default' as const },
      cancelled: { label: 'Cancelled', variant: 'destructive' as const },
      failed: { label: 'Failed', variant: 'destructive' as const },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getPaymentMethodBadge = (paymentMethod: string) => {
    const methodConfig = {
      cash: { label: t('cash'), variant: 'secondary' as const },
      billplz: { label: 'Billplz', variant: 'outline' as const },
      toyyibpay: { label: 'ToyyibPay', variant: 'outline' as const },
    };

    const config =
      methodConfig[paymentMethod as keyof typeof methodConfig] || 
      { label: paymentMethod || t('notSpecified'), variant: 'secondary' as const };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };


  const handleViewDetails = (contribution: ContributionWithProgram) => {
    setSelectedContribution(contribution);
    setIsModalOpen(true);
  };

  const columns: ColumnDef<ContributionWithProgram>[] = [
    {
      accessorKey: 'contributor_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contributor" />
      ),
      cell: ({ row }) => {
        const contribution = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {contribution.contributor_name || 'Anonymous'}
            </div>
            <div className="text-sm text-muted-foreground">
              {contribution.program?.name || 'Unknown Program'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => {
        return (
          <div className="font-semibold text-emerald-600 text-lg">
            {formatCurrency(row.getValue('amount'))}
          </div>
        );
      },
    },
    {
      accessorKey: 'payment_method',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('paymentMethod')} />
      ),
      cell: ({ row }) => {
        const paymentMethod = row.getValue('payment_method') as string;
        return (
          <div className="flex items-center gap-2">
            {getPaymentMethodBadge(paymentMethod)}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const contribution = row.original;
        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(contribution.status)}
            {getStatusBadge(contribution.status)}
          </div>
        );
      },
    },
    {
      accessorKey: 'contributed_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        const contributedAt = row.getValue('contributed_at') as string;
        return (
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {formatDate(contributedAt)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: t('actions'),
      cell: ({ row }) => {
        const contribution = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetails(contribution)}
              className="h-8 px-3"
            >
              <Eye className="h-4 w-4 mr-1" />
              {t('view')}
            </Button>
            {contribution.status === 'pending' &&
              contribution.payment_method === 'cash' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t('updateStatus')}</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() =>
                        handleStatusUpdate(contribution.id, 'completed')
                      }
                      disabled={updating === contribution.id}
                      className="gap-2 text-green-600"
                    >
                      {updating === contribution.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      {t('markAsCompleted')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        handleStatusUpdate(contribution.id, 'cancelled')
                      }
                      disabled={updating === contribution.id}
                      className="gap-2 text-red-600"
                    >
                      {updating === contribution.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      {t('markAsCancelled')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
          </div>
        );
      },
    },
  ];

  // Calculate summary stats
  const totalAmount = filteredContributions.reduce(
    (sum, contribution) => sum + contribution.amount,
    0
  );
  const completedAmount = filteredContributions
    .filter((c) => c.status === 'completed')
    .reduce((sum, contribution) => sum + contribution.amount, 0);
  const pendingAmount = filteredContributions
    .filter((c) => c.status === 'pending')
    .reduce((sum, contribution) => sum + contribution.amount, 0);
  const failedAmount = filteredContributions
    .filter((c) => c.status === 'failed')
    .reduce((sum, contribution) => sum + contribution.amount, 0);
  
  // Calculate pending cash payments that need admin action
  const pendingCashPayments = filteredContributions.filter(
    (c) => c.status === 'pending' && c.payment_method === 'cash'
  );

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {t('paymentsManagement')}
            </h2>
            <p className="text-muted-foreground mt-1">
              {t('viewAndManageAllPayments')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              {filteredContributions.length} records
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

        {/* Summary cards removed to standardize with overview-only display */}
      </div>

      {/* Pending Cash Payments Notice */}
      {pendingCashPayments.length > 0 && (
        <div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-800 mb-1">
                  {t('pendingCashPaymentsNotice', { 
                    count: pendingCashPayments.length,
                    fallback: `${pendingCashPayments.length} pending cash payment${pendingCashPayments.length > 1 ? 's' : ''} require${pendingCashPayments.length > 1 ? '' : 's'} your action`
                  })}
                </h3>
                <p className="text-sm text-amber-700">
                  {t('pendingCashPaymentsDescription', { 
                    fallback: 'These cash payments are waiting for you to mark them as completed or cancelled. Please review and take action on these payments.'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Contributions Table (no extra Card wrapper) */}
      <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
              <span className="text-muted-foreground">{t('loadingPayments')}</span>
            </div>
          ) : filteredContributions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                {contributions.length === 0
                  ? t('noPaymentsYet')
                  : t('noMatchingResults')}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                {contributions.length === 0
                  ? t('paymentsWillAppear')
                  : t('tryAdjustingFilters')}
              </p>
              {contributions.length > 0 &&
                (searchTerm ||
                  statusFilter !== 'all' ||
                  programFilter !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    className="mt-2"
                  >
                    {t('clearAllFilters')}
                  </Button>
                )}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredContributions}
              searchKey="contributor_name"
              searchPlaceholder={t('searchPayments')}
              onResetFilters={handleResetFilters}
              customFilters={
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select
                    value={programFilter}
                    onValueChange={setProgramFilter}
                  >
                    <SelectTrigger className="w-full sm:w-48 border-slate-200">
                      <SelectValue placeholder={t('filterByProgram')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allPrograms')}</SelectItem>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-full sm:w-48 border-slate-200">
                      <SelectValue placeholder={t('filterByStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allStatus')}</SelectItem>
                      <SelectItem value="pending">{t('pending')}</SelectItem>
                      <SelectItem value="completed">{t('completed')}</SelectItem>
                      <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                      <SelectItem value="failed">{t('failed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              }
            />
          )}
        </div>

      {/* Contribution Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] min-h-[60vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('contributionDetails')}
            </DialogTitle>
            <DialogDescription>
              {t('completeInformationAboutContribution')}
            </DialogDescription>
          </DialogHeader>

          {selectedContribution && (
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('contributor')}
                    </label>
                    <p className="text-lg font-semibold">
                      {selectedContribution.contributor_name || 'Anonymous'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('amount')}
                    </label>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(selectedContribution.amount)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('status')}
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(selectedContribution.status)}
                      {getStatusBadge(selectedContribution.status)}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('program')}
                    </label>
                    <div className="space-y-2">
                      <p className="font-medium">
                        {selectedContribution.program?.name ||
                          'Unknown Program'}
                      </p>
                      <Badge
                        variant={
                          selectedContribution.program?.is_active
                            ? 'default'
                            : 'secondary'
                        }
                        className={`text-xs ${
                          selectedContribution.program?.is_active
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {selectedContribution.program?.is_active
                          ? 'Active'
                          : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('dateContributed')}
                    </label>
                    <p className="font-medium">
                      {formatDate(selectedContribution.contributed_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t('paymentInformation')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('paymentMethod')}
                    </label>
                    <p className="font-medium">
                      {selectedContribution.payment_method || 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('paymentReference')}
                    </label>
                    <p className="font-medium font-mono text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {selectedContribution.payment_reference || 'No reference'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedContribution.notes && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">{t('notes')}</h3>
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                    <p className="text-sm leading-relaxed">
                      {selectedContribution.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Program Description */}
              {selectedContribution.program?.description && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {t('programDescription')}
                  </h3>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                    <p className="text-sm leading-relaxed">
                      {selectedContribution.program.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedContribution.status === 'pending' &&
                selectedContribution.payment_method === 'cash' && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">{t('actions')}</h3>
                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={() => {
                          handleStatusUpdate(
                            selectedContribution.id,
                            'completed'
                          );
                          setIsModalOpen(false);
                        }}
                        disabled={updating === selectedContribution.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {updating === selectedContribution.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        {t('markAsCompleted')}
                      </Button>

                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleStatusUpdate(
                            selectedContribution.id,
                            'cancelled'
                          );
                          setIsModalOpen(false);
                        }}
                        disabled={updating === selectedContribution.id}
                      >
                        {updating === selectedContribution.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        {t('markAsCancelled')}
                      </Button>
                    </div>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
