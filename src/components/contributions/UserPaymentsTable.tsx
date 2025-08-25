'use client';

import { useState } from 'react';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import {
  Card,
  CardContent,
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
  Building,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import type {
  Contribution,
  ContributionProgram,
  Mosque,
} from '@/types/database';

interface UserPaymentsTableProps {
  contributions: (Contribution & {
    program: ContributionProgram & { mosque: Mosque };
  })[];
}

export function UserPaymentsTable({ contributions }: UserPaymentsTableProps) {
  const [selectedContribution, setSelectedContribution] = useState<
    | (Contribution & { program: ContributionProgram & { mosque: Mosque } })
    | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useIsMobile();

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

  const handleViewDetails = (
    contribution: Contribution & {
      program: ContributionProgram & { mosque: Mosque };
    }
  ) => {
    setSelectedContribution(contribution);
    setIsModalOpen(true);
  };

  const columns: ColumnDef<
    Contribution & { program: ContributionProgram & { mosque: Mosque } }
  >[] = [
    {
      accessorKey: 'program.name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Program" />
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
      accessorKey: 'payment_method',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment Method" />
      ),
      cell: ({ row }) => {
        const paymentMethod = row.getValue('payment_method') as string;
        return (
          <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
            {paymentMethod || 'Not specified'}
          </span>
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
      header: 'Actions',
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
            View
          </Button>
        );
      },
    },
  ];

  // Mobile Card Component
  const MobilePaymentCard = ({
    contribution,
  }: {
    contribution: Contribution & {
      program: ContributionProgram & { mosque: Mosque };
    };
  }) => (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with Program and Amount */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {contribution.program?.name || 'Unknown Program'}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Building className="h-3 w-3" />
                <span className="truncate">
                  {contribution.program?.mosque?.name || 'Unknown Mosque'}
                </span>
              </div>
            </div>
            <div className="text-right ml-3">
              <div className="font-bold text-lg text-emerald-600">
                {formatCurrency(contribution.amount)}
              </div>
            </div>
          </div>

          {/* Status and Payment Method */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(contribution.status)}
              {getStatusBadge(contribution.status)}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 capitalize">
              {contribution.payment_method || 'Not specified'}
            </div>
          </div>

          {/* Date and Action */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(contribution.contributed_at)}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetails(contribution)}
              className="h-8 px-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              My Payments
            </h2>
            <p className="text-muted-foreground mt-1">
              View your payment history and transaction details
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Payments
            </CardTitle>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalAmount)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Across {contributions.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(completedAmount)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {contributions.filter((c) => c.status === 'completed').length}{' '}
              completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {formatCurrency(pendingAmount)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {contributions.filter((c) => c.status === 'pending').length}{' '}
              pending
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed
            </CardTitle>
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(failedAmount)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {contributions.filter((c) => c.status === 'failed').length} failed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-emerald-600" />
            Payment History
          </CardTitle>
          <CardDescription>
            Complete record of your khairat payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contributions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No payments yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Your payment history will appear here once you make your first
                contribution.
              </p>
            </div>
          ) : isMobile ? (
            <div className="space-y-3">
              {contributions.map((contribution) => (
                <MobilePaymentCard
                  key={contribution.id}
                  contribution={contribution}
                />
              ))}
            </div>
          ) : (
            <DataTable columns={columns} data={contributions} />
          )}
        </CardContent>
      </Card>

      {/* Payment Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              Payment Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this payment
            </DialogDescription>
          </DialogHeader>
          {selectedContribution && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Program
                  </h4>
                  <p className="font-semibold">
                    {selectedContribution.program?.name || 'Unknown Program'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Mosque
                  </h4>
                  <p className="font-semibold">
                    {selectedContribution.program?.mosque?.name ||
                      'Unknown Mosque'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Amount
                  </h4>
                  <p className="font-semibold text-emerald-600 text-lg">
                    {formatCurrency(selectedContribution.amount)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Status
                  </h4>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedContribution.status)}
                    {getStatusBadge(selectedContribution.status)}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Payment Method
                  </h4>
                  <p className="font-semibold capitalize">
                    {selectedContribution.payment_method || 'Not specified'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Date
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
