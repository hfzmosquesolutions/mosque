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
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard, StatsCardColors } from '@/components/ui/stats-card';
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
  Heart,
  HeartHandshake,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import {
  getKhairatMembers,
  reviewKhairatApplication,
} from '@/lib/api/khairat-members';
import { KhairatMember } from '@/types/database';

// Filter to only show application statuses (not membership statuses)
type KhairatApplication = KhairatMember & {
  status: 'pending' | 'approved' | 'rejected' | 'under_review' | 'withdrawn';
};

interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  withdrawn: number;
}

interface KhairatApplicationsReviewProps {
  mosqueId: string;
}

export function KhairatApplicationsReview({
  mosqueId,
}: KhairatApplicationsReviewProps) {
  const { user } = useAuth();
  const t = useTranslations('khairatManagement');
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<KhairatApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] =
    useState<KhairatApplication | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(
    null
  );
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const loadApplications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const members = await getKhairatMembers({
        mosque_id: mosqueId,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });

      // Filter to only show application statuses
      const applications = members.filter(member => 
        ['pending', 'approved', 'rejected', 'under_review', 'withdrawn'].includes(member.status)
      ) as KhairatApplication[];

      setApplications(applications);

      // Calculate stats
      const total = applications.length;
      const pending = applications.filter(app => app.status === 'pending').length;
      const approved = applications.filter(app => app.status === 'approved').length;
      const rejected = applications.filter(app => app.status === 'rejected').length;
      const withdrawn = applications.filter(app => app.status === 'withdrawn').length;

      setStats({
        total,
        pending,
        approved,
        rejected,
        withdrawn,
      });
    } catch (error) {
      console.error('Error loading khairat applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [mosqueId, page, statusFilter, searchTerm]);

  const handleReview = (application: KhairatApplication, action: 'approve' | 'reject') => {
    setSelectedApplication(application);
    setReviewAction(action);
    setAdminNotes('');
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedApplication || !reviewAction) return;

    const actualStatus = reviewAction === 'approve' ? 'approved' : 'rejected';
    console.log('Frontend: Submitting review with:', {
      application_id: selectedApplication.id,
      mosque_id: mosqueId,
      status: actualStatus,
      admin_notes: adminNotes || undefined,
    });

    setProcessing(true);
    try {
      await reviewKhairatApplication({
        member_id: selectedApplication.id,
        mosque_id: mosqueId,
        status: reviewAction === 'approve' ? 'approved' : 'rejected',
        admin_notes: adminNotes || undefined,
      });

      toast.success(`Application ${reviewAction}ed successfully`);
      setReviewDialogOpen(false);
      setSelectedApplication(null);
      setReviewAction(null);
      setAdminNotes('');
      loadApplications();
    } catch (error: any) {
      console.error('Error reviewing application:', error);
      toast.error(error?.message || 'Failed to review application');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
      under_review: { label: 'Under Review', variant: 'default' as const, icon: Eye },
      approved: { label: 'Approved', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle },
      withdrawn: { label: 'Withdrawn', variant: 'outline' as const, icon: X },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const columns: ColumnDef<KhairatApplication>[] = [
    {
      accessorKey: 'user.full_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Applicant" />
      ),
      cell: ({ row }) => {
        const application = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium">{application.user?.full_name || 'Unknown User'}</div>
            <div className="text-sm text-muted-foreground">
              {application.user?.phone || 'No contact info'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'ic_passport_number',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="IC/Passport" />
      ),
      cell: ({ row }) => {
        const ic = row.getValue('ic_passport_number') as string;
        return (
          <div className="text-sm font-mono">
            {ic || 'Not provided'}
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
        return getStatusBadge(status);
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Applied" />
      ),
      cell: ({ row }) => {
        const date = row.getValue('created_at') as string;
        return (
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(date), { addSuffix: true })}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const application = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedApplication(application);
                setReviewDialogOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {application.status === 'pending' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReview(application, 'approve')}
                  className="text-green-600 hover:text-green-700"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReview(application, 'reject')}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-sm text-muted-foreground">Loading applications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Applications"
            value={stats.total.toString()}
            icon={Users}
            {...StatsCardColors.blue}
          />
          <StatsCard
            title="Pending Review"
            value={stats.pending.toString()}
            icon={Clock}
            {...StatsCardColors.orange}
          />
          <StatsCard
            title="Approved"
            value={stats.approved.toString()}
            icon={CheckCircle}
            {...StatsCardColors.emerald}
          />
          <StatsCard
            title="Rejected"
            value={stats.rejected.toString()}
            icon={XCircle}
            {...StatsCardColors.red}
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filter Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Khairat Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8">
              <HeartHandshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                No applications found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No khairat applications have been submitted yet'}
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={applications}
              searchKey="user.full_name"
              searchPlaceholder="Search applications..."
            />
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewAction === 'approve' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {reviewAction === 'approve' ? 'Approve Application' : 'Reject Application'}
            </DialogTitle>
            <DialogDescription>
              Review the application details and provide admin notes
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Application Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Applicant</label>
                  <p className="font-medium">{selectedApplication.user?.full_name || 'Unknown User'}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedApplication.user?.phone || 'No contact info'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">IC/Passport</label>
                  <p className="font-mono text-sm">
                    {selectedApplication.ic_passport_number || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Applied</label>
                  <p className="text-sm">
                    {formatDistanceToNow(new Date(selectedApplication.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Application Reason */}
              {selectedApplication.application_reason && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Application Reason</label>
                  <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-sm">{selectedApplication.application_reason}</p>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Admin Notes {reviewAction === 'reject' && '(Required for rejection)'}
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={
                    reviewAction === 'approve'
                      ? 'Optional notes about the approval...'
                      : 'Please provide a reason for rejection...'
                  }
                  rows={4}
                  className="mt-1"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={processing || (reviewAction === 'reject' && !adminNotes.trim())}
                  className={
                    reviewAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {reviewAction === 'approve' ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      {reviewAction === 'approve' ? 'Approve' : 'Reject'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
