'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  TrendingUp,
  Calendar,
  Search,
  User,
  AlertTriangle,
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
import type { KhairatContribution, Mosque } from '@/types/database';
import { PaymentReceiptView } from '@/components/khairat/PaymentReceiptView';

interface UserPaymentsTableProps {
  contributions: (KhairatContribution & { mosque?: Mosque; program?: { name?: string; mosque?: Mosque } })[];
  showHeader?: boolean;
}

export function UserPaymentsTable({ contributions, showHeader = true }: UserPaymentsTableProps) {
  const t = useTranslations('khairat');
  const [selectedContribution, setSelectedContribution] = useState<
    | (KhairatContribution & { mosque?: Mosque; program?: { name?: string; mosque?: Mosque } })
    | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filteredContributions, setFilteredContributions] = useState<
    (KhairatContribution & { mosque?: Mosque; program?: { name?: string; mosque?: Mosque } })[]
  >([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
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

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (contribution) => contribution.status === statusFilter
      );
    }

    setFilteredContributions(filtered);
  };

  useEffect(() => {
    filterContributions();
  }, [contributions, searchTerm, statusFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      completed: t('userPaymentsTable.completed'),
      pending: t('userPaymentsTable.pending'),
      cancelled: t('userPaymentsTable.cancelled'),
      failed: t('userPaymentsTable.failed'),
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };


  const handleViewDetails = (
    contribution: KhairatContribution & { mosque?: Mosque; program?: { name?: string; mosque?: Mosque } }
  ) => {
    setSelectedContribution(contribution);
    setIsModalOpen(true);
  };

  const columns: ColumnDef<
    KhairatContribution & { mosque?: Mosque; program?: { name?: string; mosque?: Mosque }; payment_type?: 'legacy' | 'current' }
  >[] = [
    {
      accessorKey: 'program.mosque.name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('userPaymentsTable.mosque')} />
      ),
      cell: ({ row }) => {
        const contribution = row.original;
        const isLegacy = (contribution as any).payment_type === 'legacy';
        const mosqueName = contribution.program?.mosque?.name || contribution.mosque?.name || t('userPaymentsTable.unknownMosque');
        const programName = contribution.program?.name || 'Khairat';
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{mosqueName}</span>
                {isLegacy && (
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400">
                    {t('userPaymentsTable.legacy')}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {programName}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('userPaymentsTable.amount')} />
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
        <DataTableColumnHeader column={column} title={t('userPaymentsTable.status')} />
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
        <DataTableColumnHeader column={column} title={t('userPaymentsTable.paymentMethod')} />
      ),
      cell: ({ row }) => {
        const method = row.getValue('payment_method') as string;
        return (
          <Badge variant="outline" className="capitalize">
            {method?.replace('_', ' ') || t('userPaymentsTable.notAvailable')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'payment_id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('userPaymentsTable.paymentId')} />
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
        <DataTableColumnHeader column={column} title={t('userPaymentsTable.date')} />
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
      header: t('userPaymentsTable.actions'),
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
            {t('userPaymentsTable.view')}
          </Button>
        );
      },
    },
  ];


  return (
    <div className="space-y-6">
      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredContributions}
        customFilters={
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('userPaymentsTable.searchPayments')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('userPaymentsTable.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('userPaymentsTable.allStatus')}</SelectItem>
                <SelectItem value="pending">{t('userPaymentsTable.pending')}</SelectItem>
                <SelectItem value="completed">{t('userPaymentsTable.completed')}</SelectItem>
                <SelectItem value="cancelled">{t('userPaymentsTable.cancelled')}</SelectItem>
                <SelectItem value="failed">{t('userPaymentsTable.failed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Payment Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('userPaymentsTable.paymentDetails')}</DialogTitle>
            <DialogDescription>
              {t('userPaymentsTable.paymentDetailsDescription')}
            </DialogDescription>
          </DialogHeader>
          {selectedContribution && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {selectedContribution.payment_id && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('userPaymentsTable.paymentId')}:
                    </label>
                    <p className="text-sm font-medium font-mono">{selectedContribution.payment_id}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('userPaymentsTable.mosque')}
                  </label>
                  <p className="text-sm">{selectedContribution.program?.mosque?.name || selectedContribution.mosque?.name || t('userPaymentsTable.unknownMosque')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('userPaymentsTable.program')}
                  </label>
                  <p className="text-sm">{selectedContribution.program?.name || 'Khairat'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('userPaymentsTable.amount')}
                  </label>
                  <p className="text-sm font-medium">{formatCurrency(selectedContribution.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('userPaymentsTable.status')}
                  </label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedContribution.status)}
                    {getStatusBadge(selectedContribution.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('userPaymentsTable.paymentMethod')}
                  </label>
                  <p className="text-sm capitalize">
                    {selectedContribution.payment_method?.replace('_', ' ') || t('userPaymentsTable.notAvailable')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('userPaymentsTable.date')}
                  </label>
                  <p className="text-sm">{formatDate(selectedContribution.contributed_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('userPaymentsTable.reference')}
                  </label>
                  <p className="text-sm">{selectedContribution.payment_reference || t('userPaymentsTable.notAvailable')}</p>
                </div>
                {(selectedContribution as any).payment_type === 'legacy' && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('userPaymentsTable.type')}
                    </label>
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400">
                      {t('userPaymentsTable.legacy')}
                    </Badge>
                  </div>
                )}
              </div>
              {selectedContribution.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('userPaymentsTable.notes')}
                  </label>
                  <p className="text-sm">{selectedContribution.notes}</p>
                </div>
              )}
              {(selectedContribution.payment_method === 'bank_transfer' || selectedContribution.payment_method === 'cash') && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Payment Receipts
                  </label>
                  <PaymentReceiptView contributionId={selectedContribution.id} />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
