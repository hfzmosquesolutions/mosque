'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Eye, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { getContributions, updateContributionStatus } from '@/lib/api';
import type { ContributionProgram, Contribution } from '@/types/database';
import { toast } from 'sonner';

interface ContributionsListProps {
  program: ContributionProgram;
  isOpen: boolean;
  onClose: () => void;
}

type ContributionStatus = 'pending' | 'completed' | 'cancelled';

export function ContributionsList({ program, isOpen, onClose }: ContributionsListProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [filteredContributions, setFilteredContributions] = useState<Contribution[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && program.id) {
      loadContributions();
    }
  }, [isOpen, program.id]);

  useEffect(() => {
    filterContributions();
  }, [contributions, searchTerm, statusFilter]);

  const loadContributions = async () => {
    setLoading(true);
    try {
      const response = await getContributions(program.id, 50, 0);
      if (response.data) {
        setContributions(response.data);
      }
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
          contribution.contributor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contribution.payment_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contribution.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((contribution) => contribution.status === statusFilter);
    }

    setFilteredContributions(filtered);
  };

  const handleStatusUpdate = async (contributionId: string, newStatus: ContributionStatus) => {
    if (!user) return;

    setUpdating(contributionId);
    try {
      const response = await updateContributionStatus(contributionId, newStatus);
      
      if (response.success) {
        toast.success(`Contribution ${newStatus} successfully`);
        loadContributions(); // Reload to get updated data
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalAmount = filteredContributions.reduce((sum, contribution) => sum + contribution.amount, 0);
  const completedAmount = filteredContributions
    .filter((c) => c.status === 'completed')
    .reduce((sum, contribution) => sum + contribution.amount, 0);
  const pendingAmount = filteredContributions
    .filter((c) => c.status === 'pending')
    .reduce((sum, contribution) => sum + contribution.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Contributions for {program.name}
          </DialogTitle>
          <DialogDescription>
            View and manage all contributions for this contribution program
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalAmount)}
                </div>
                <p className="text-sm text-muted-foreground">Total Contributions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(completedAmount)}
                </div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(pendingAmount)}
                </div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {filteredContributions.length}
                </div>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by contributor name, reference, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
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

          {/* Contributions Table */}
          <div className="flex-1 overflow-auto border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading contributions...</span>
              </div>
            ) : filteredContributions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {contributions.length === 0 ? 'No contributions yet' : 'No contributions match your filters'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contributor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContributions.map((contribution) => (
                    <TableRow key={contribution.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {contribution.contributor_name || 'Anonymous'}
                          </div>
                          {contribution.notes && (
                            <div className="text-sm text-muted-foreground truncate max-w-32">
                              {contribution.notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(contribution.amount)}
                      </TableCell>
                      <TableCell>
                        {contribution.payment_method || '-'}
                      </TableCell>
                      <TableCell>
                        {contribution.payment_reference || '-'}
                      </TableCell>
                      <TableCell>
                        {formatDate(contribution.contributed_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(contribution.status)}
                          {getStatusBadge(contribution.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contribution.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(contribution.id, 'completed')}
                              disabled={updating === contribution.id}
                              className="text-green-600 hover:text-green-700"
                            >
                              {updating === contribution.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(contribution.id, 'cancelled')}
                              disabled={updating === contribution.id}
                              className="text-red-600 hover:text-red-700"
                            >
                              {updating === contribution.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}