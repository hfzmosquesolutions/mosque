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
  MoreHorizontal,
  Eye,
  Calendar,
  User,
  AlertTriangle,
  Search,
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
import { getMosqueKhairatContributions, updateKhairatContributionStatus } from '@/lib/api';
import type { KhairatContribution, UserProfile } from '@/types/database';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface MosqueKhairatContributionsProps {
  mosqueId: string;
  showHeader?: boolean;
}

type ContributionStatus = 'pending' | 'completed' | 'cancelled' | 'failed';

interface ContributionWithUser extends KhairatContribution {
  contributor?: UserProfile;
}

export function MosqueKhairatContributions({
  mosqueId,
  showHeader = true,
}: MosqueKhairatContributionsProps) {
  const { user } = useAuth();
  const t = useTranslations('khairat');
  const [loading, setLoading] = useState(false);
  const [contributions, setContributions] = useState<ContributionWithUser[]>([]);
  const [filteredContributions, setFilteredContributions] = useState<ContributionWithUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedContribution, setSelectedContribution] = useState<ContributionWithUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadContributions = async () => {
    setLoading(true);
    try {
      const response = await getMosqueKhairatContributions(mosqueId, 100, 0);
      if (response.data) {
        setContributions(response.data);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payments');
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
        toast.success('Payment status updated successfully');
        loadContributions(); // Reload to get updated data
      } else {
        toast.error(response.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    } finally {
      setUpdating(null);
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

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
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
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const contributorName = row.getValue('contributor_name') as string;
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{contributorName || 'Anonymous'}</span>
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
        <DataTableColumnHeader column={column} title="Status" />
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
        <DataTableColumnHeader column={column} title="Payment Method" />
      ),
      cell: ({ row }) => {
        const method = row.getValue('payment_method') as string;
        return (
          <Badge variant="outline" className="capitalize">
            {method?.replace('_', ' ') || 'N/A'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'contributed_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
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
      header: 'Actions',
      cell: ({ row }) => {
        const contribution = row.original;
        const isUpdating = updating === contribution.id;
        const isCashPayment = contribution.payment_method === 'cash';

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedContribution(contribution);
                  setIsModalOpen(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {/* Only allow status changes for cash payments */}
              {isCashPayment && (
                <>
                  <DropdownMenuSeparator />
                  {contribution.status === 'pending' && (
                    <>
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate(contribution.id, 'completed')}
                        disabled={isUpdating}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Completed
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate(contribution.id, 'cancelled')}
                        disabled={isUpdating}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel
                      </DropdownMenuItem>
                    </>
                  )}
                  {contribution.status === 'completed' && (
                    <DropdownMenuItem
                      onClick={() => handleStatusUpdate(contribution.id, 'pending')}
                      disabled={isUpdating}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Mark as Pending
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
              Khairat Payments
            </CardTitle>
            <CardDescription>
              Manage and track khairat payments for this mosque
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
                placeholder="Search payments..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Payment Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              View detailed information about this payment
            </DialogDescription>
          </DialogHeader>
          {selectedContribution && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Name
                  </label>
                  <p className="text-sm">{selectedContribution.contributor_name || 'Anonymous'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Amount
                  </label>
                  <p className="text-sm font-medium">{formatCurrency(selectedContribution.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedContribution.status)}
                    {getStatusBadge(selectedContribution.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Payment Method
                  </label>
                  <p className="text-sm capitalize">
                    {selectedContribution.payment_method?.replace('_', ' ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Date
                  </label>
                  <p className="text-sm">{formatDate(selectedContribution.contributed_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Reference
                  </label>
                  <p className="text-sm">{selectedContribution.payment_reference || 'N/A'}</p>
                </div>
              </div>
              {selectedContribution.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Notes
                  </label>
                  <p className="text-sm">{selectedContribution.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
