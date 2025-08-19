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
  Loader2,
  Download,
  TrendingUp,
  Users,
  FileText,
  MoreHorizontal,
  Eye,
  Calendar,
  User,
  Building,
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
import { getContributions, updateContributionStatus } from '@/lib/api';
import type { ContributionProgram, Contribution } from '@/types/database';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface ContributionsTabContentProps {
  programs: ContributionProgram[];
}

type ContributionStatus = 'pending' | 'completed' | 'cancelled';

interface ContributionWithProgram extends Contribution {
  program?: ContributionProgram;
}

export function ContributionsTabContent({
  programs,
}: ContributionsTabContentProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
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
        const response = await getContributions(program.id, 100, 0);
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

    setUpdating(contributionId);
    try {
      const response = await updateContributionStatus(
        contributionId,
        newStatus
      );

      if (response.success) {
        toast.success(`Contribution ${newStatus} successfully`);
        loadAllContributions(); // Reload to get updated data
      } else {
        toast.error(response.error || 'Failed to update contribution status');
      }
    } catch (error) {
      console.error('Error updating contribution status:', error);
      toast.error('Failed to update contribution status');
    } finally {
      setUpdating(null);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setProgramFilter('all');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  // Mobile Card Component
  const MobileContributionCard = ({
    contribution,
  }: {
    contribution: ContributionWithProgram;
  }) => (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with Contributor and Amount */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {contribution.contributor_name || 'Anonymous'}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Building className="h-3 w-3" />
                <span className="truncate">
                  {contribution.program?.name || 'Unknown Program'}
                </span>
              </div>
            </div>
            <div className="text-right ml-3">
              <div className="font-bold text-lg text-emerald-600">
                {formatCurrency(contribution.amount)}
              </div>
            </div>
          </div>

          {/* Status and Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(contribution.status)}
              {getStatusBadge(contribution.status)}
            </div>
            <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(contribution.contributed_at)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetails(contribution)}
              className="h-8 px-3"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            {contribution.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleStatusUpdate(contribution.id, 'completed')
                  }
                  disabled={updating === contribution.id}
                  className="h-8 px-3 text-green-600 border-green-200 hover:bg-green-50"
                >
                  {updating === contribution.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleStatusUpdate(contribution.id, 'cancelled')
                  }
                  disabled={updating === contribution.id}
                  className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50"
                >
                  {updating === contribution.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
      header: 'Actions',
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
              View
            </Button>
            {contribution.status === 'pending' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Update Status</DropdownMenuLabel>
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
                    Mark as Completed
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
                    Mark as Cancelled
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

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Payments Management
            </h2>
            <p className="text-muted-foreground mt-1">
              View and manage all payments across all programs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              {filteredContributions.length} records
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-emerald-50 hover:border-emerald-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Total Payments
                  </p>
                  <div className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(totalAmount)}
                  </div>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Completed
                  </p>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(completedAmount)}
                  </div>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Pending
                  </p>
                  <div className="text-2xl font-bold text-amber-600">
                    {formatCurrency(pendingAmount)}
                  </div>
                </div>
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Total Records
                  </p>
                  <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                    {filteredContributions.length}
                  </div>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <FileText className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Contributions Table */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Payments List
          </CardTitle>
          <CardDescription>
            {filteredContributions.length} of {contributions.length} payments
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
              <span className="text-muted-foreground">Loading payments...</span>
            </div>
          ) : filteredContributions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                {contributions.length === 0
                  ? 'No Payments Yet'
                  : 'No Matching Results'}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                {contributions.length === 0
                  ? 'Payments will appear here once people start donating to your programs.'
                  : "Try adjusting your search terms or filters to find what you're looking for."}
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
                    Clear All Filters
                  </Button>
                )}
            </div>
          ) : (
            <>
              {isMobile ? (
                <div className="space-y-4">
                  {/* Mobile Filters */}
                  <div className="flex flex-col gap-3">
                    <Select
                      value={programFilter}
                      onValueChange={setProgramFilter}
                    >
                      <SelectTrigger className="w-full border-slate-200">
                        <SelectValue placeholder="Filter by program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
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
                      <SelectTrigger className="w-full border-slate-200">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Mobile Cards */}
                  <div className="space-y-3">
                    {filteredContributions.map((contribution) => (
                      <MobileContributionCard
                        key={contribution.id}
                        contribution={contribution}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredContributions}
                  searchKey="contributor_name"
                  searchPlaceholder="Search payments..."
                  onResetFilters={handleResetFilters}
                  customFilters={
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Select
                        value={programFilter}
                        onValueChange={setProgramFilter}
                      >
                        <SelectTrigger className="w-full sm:w-48 border-slate-200">
                          <SelectValue placeholder="Filter by program" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Programs</SelectItem>
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
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  }
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Contribution Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contribution Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this contribution
            </DialogDescription>
          </DialogHeader>

          {selectedContribution && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Contributor
                    </label>
                    <p className="text-lg font-semibold">
                      {selectedContribution.contributor_name || 'Anonymous'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Amount
                    </label>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(selectedContribution.amount)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Status
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
                      Program
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
                      Date Contributed
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
                  Payment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Payment Method
                    </label>
                    <p className="font-medium">
                      {selectedContribution.payment_method || 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Payment Reference
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
                  <h3 className="text-lg font-semibold mb-4">Notes</h3>
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
                    Program Description
                  </h3>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                    <p className="text-sm leading-relaxed">
                      {selectedContribution.program.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedContribution.status === 'pending' && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Actions</h3>
                  <div className="flex gap-3">
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
                      Mark as Completed
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
                      Mark as Cancelled
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
