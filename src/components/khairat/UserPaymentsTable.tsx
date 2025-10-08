'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
  Eye,
  Receipt,
  TrendingUp,
  Banknote,
  Calendar,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type {
  KhairatContribution,
  KhairatProgram,
  Mosque,
} from '@/types/database';

interface UserPaymentsTableProps {
  contributions: (KhairatContribution & {
    program: KhairatProgram & { mosque: Mosque };
  })[];
  showHeader?: boolean;
}

export function UserPaymentsTable({ contributions, showHeader = true }: UserPaymentsTableProps) {
  const t = useTranslations('khairat');
  const [selectedContribution, setSelectedContribution] = useState<
    | (KhairatContribution & { program: KhairatProgram & { mosque: Mosque } })
    | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContributions, setFilteredContributions] = useState<
    (KhairatContribution & { program: KhairatProgram & { mosque: Mosque } })[]
  >([]);

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toLocaleString()}`;
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
            .includes(searchTerm.toLowerCase()) ||
          contribution.program?.mosque?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    setFilteredContributions(filtered);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
  };

  useEffect(() => {
    filterContributions();
  }, [contributions, searchTerm]);

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
      pending: { label: t('pending'), variant: 'secondary' as const },
      completed: { label: t('completed'), variant: 'default' as const },
      cancelled: { label: t('cancelled'), variant: 'destructive' as const },
      failed: { label: t('failed'), variant: 'destructive' as const },
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

  const handleViewDetails = (
    contribution: KhairatContribution & {
      program: KhairatProgram & { mosque: Mosque };
    }
  ) => {
    setSelectedContribution(contribution);
    setIsModalOpen(true);
  };

  const columns: ColumnDef<
    KhairatContribution & { program: KhairatProgram & { mosque: Mosque } }
  >[] = [
    {
      accessorKey: 'program.name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('program')} />
      ),
      cell: ({ row }) => {
        const contribution = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {contribution.program?.name || 'Unknown Program'}
            </div>
            <div className="text-sm text-muted-foreground">
              {contribution.program?.mosque?.name || 'Unknown Mosque'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('amount')} />
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
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('status')} />
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
      accessorKey: 'contributed_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('date')} />
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(contribution)}
            className="h-8 px-3"
          >
            <Eye className="h-4 w-4 mr-1" />
            {t('view')}
          </Button>
        );
      },
    },
  ];


  // Calculate summary stats
  const totalAmount = contributions.reduce(
    (sum, contribution) => sum + contribution.amount,
    0
  );
  const completedAmount = contributions
    .filter((c) => c.status === 'completed')
    .reduce((sum, contribution) => sum + contribution.amount, 0);
  const pendingAmount = contributions
    .filter((c) => c.status === 'pending')
    .reduce((sum, contribution) => sum + contribution.amount, 0);
  const failedAmount = contributions
    .filter((c) => c.status === 'failed')
    .reduce((sum, contribution) => sum + contribution.amount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      {showHeader && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {t('myPayments')}
              </h2>
              <p className="text-muted-foreground mt-1">
                {t('viewPaymentHistoryDescription')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards removed to standardize with overview-only display */}

      {/* Payments Table (no extra Card wrapper) */}
      <div className={showHeader ? "px-6" : ""}>
          {contributions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('noPaymentsYet')}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {t('paymentHistoryDescription')}
              </p>
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={filteredContributions}
              onResetFilters={handleResetFilters}
              customFilters={
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('searchPayments')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-full"
                    />
                  </div>
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      onClick={handleResetFilters}
                      className="h-9 px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              }
            />
          )}
        </div>

      {/* Payment Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              {t('paymentDetails')}
            </DialogTitle>
            <DialogDescription>
              {t('completeInformationAboutPayment')}
            </DialogDescription>
          </DialogHeader>
          {selectedContribution && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    {t('program')}
                  </h4>
                  <p className="font-semibold">
                    {selectedContribution.program?.name || 'Unknown Program'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    {t('mosque')}
                  </h4>
                  <p className="font-semibold">
                    {selectedContribution.program?.mosque?.name ||
                      'Unknown Mosque'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    {t('amount')}
                  </h4>
                  <p className="font-semibold text-emerald-600 text-lg">
                    {formatCurrency(selectedContribution.amount)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    {t('status')}
                  </h4>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedContribution.status)}
                    {getStatusBadge(selectedContribution.status)}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    {t('paymentMethod')}
                  </h4>
                  <p className="font-semibold capitalize">
                    {selectedContribution.payment_method || t('notSpecified')}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    {t('date')}
                  </h4>
                  <p className="font-semibold">
                    {formatDate(selectedContribution.contributed_at)}
                  </p>
                </div>
              </div>
              {selectedContribution.payment_reference && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Payment Reference
                  </h4>
                  <p className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {selectedContribution.payment_reference}
                  </p>
                </div>
              )}
              {selectedContribution.notes && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Notes
                  </h4>
                  <p className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    {selectedContribution.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
