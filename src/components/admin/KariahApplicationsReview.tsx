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
  UserCheck,
  UserX,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import {
  getKariahApplications,
  reviewKariahApplication,
} from '@/lib/api/kariah-applications';

interface KariahApplication {
  id: string;
  user_id: string;
  mosque_id: string;
  ic_passport_number: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string;
    phone?: string;
    email?: string;
  };
  reviewer?: {
    full_name: string;
  };
}

interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface KariahApplicationsReviewProps {
  mosqueId: string;
}

export function KariahApplicationsReview({
  mosqueId,
}: KariahApplicationsReviewProps) {
  const { user } = useAuth();
  const t = useTranslations('kariahManagement');
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<KariahApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] =
    useState<KariahApplication | null>(null);
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
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mosque_id: mosqueId,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const result = await getKariahApplications({
        mosque_id: mosqueId,
        page,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      setApplications(result.applications || []);
      setTotalPages(result.pagination?.totalPages || 1);

      // Calculate stats
      const allApplications = result.applications || [];
      const stats: ApplicationStats = {
        total: allApplications.length,
        pending: allApplications.filter(
          (app: KariahApplication) => app.status === 'pending'
        ).length,
        approved: allApplications.filter(
          (app: KariahApplication) => app.status === 'approved'
        ).length,
        rejected: allApplications.filter(
          (app: KariahApplication) => app.status === 'rejected'
        ).length,
      };
      setStats(stats);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error(t('failedToLoadApplications'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mosqueId) {
      loadApplications();
    }
  }, [mosqueId, page, searchTerm, statusFilter]);

  const handleReview = async () => {
    if (!selectedApplication || !reviewAction) return;

    setProcessing(true);
    try {
      const result = await reviewKariahApplication({
        application_id: selectedApplication.id,
        mosque_id: mosqueId,
        status: reviewAction === 'approve' ? 'approved' : 'rejected',
        admin_notes: adminNotes.trim() || undefined,
      });

      toast.success(result.message || t('applicationReviewedSuccessfully'));
      setReviewDialogOpen(false);
      setSelectedApplication(null);
      setReviewAction(null);
      setAdminNotes('');
      loadApplications();
    } catch (error) {
      console.error('Error reviewing application:', error);
      toast.error(t('failedToReviewApplication'));
    } finally {
      setProcessing(false);
    }
  };

  const openReviewDialog = (
    application: KariahApplication,
    action: 'approve' | 'reject'
  ) => {
    setSelectedApplication(application);
    setReviewAction(action);
    setAdminNotes('');
    setReviewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">{t('approved')}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">{t('rejected')}</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">{t('pending')}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <UserX className="h-4 w-4 text-red-600" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
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

  // Column definitions for DataTable
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'user.full_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('fullName')} />
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.user?.full_name || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'user.ic_passport_number',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('icPassport')} />
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.original.user?.ic_passport_number || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('status')} />
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <Badge
              className={`${
                status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : status === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('applied')} />
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          {formatDistanceToNow(new Date(row.getValue('created_at')), {
            addSuffix: true,
          })}
        </div>
      ),
    },
    {
      accessorKey: 'reviewed_by',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('reviewedBy')} />
      ),
      cell: ({ row }) => {
        const reviewedBy = row.original.reviewed_by;
        return reviewedBy ? (
          <div className="text-sm">{reviewedBy.full_name}</div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
    },
    {
      id: 'actions',
      header: t('actions'),
      cell: ({ row }) => {
        const application = row.original;
        return (
          <div className="flex items-center gap-2">
            {application.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openReviewDialog(application, 'approve')}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {t('approve')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openReviewDialog(application, 'reject')}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  {t('reject')}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedApplication(application);
                setReviewDialogOpen(true);
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              {t('view')}
            </Button>
          </div>
        );
      },
    },
  ];

  // Mobile card component for responsive design
  const MobileApplicationCard = ({ application }: { application: any }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium">
                {application.user?.full_name || 'N/A'}
              </h3>
              <p className="text-sm text-muted-foreground font-mono">
                {application.user?.ic_passport_number || 'N/A'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(application.status)}
              <Badge
                className={`${
                  application.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : application.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {application.status.charAt(0).toUpperCase() +
                  application.status.slice(1)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t('applied')}:</span>
              <p>
                {formatDistanceToNow(new Date(application.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">{t('reviewedBy')}:</span>
              <p>{application.reviewed_by?.full_name || '-'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            {application.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openReviewDialog(application, 'approve')}
                  className="text-green-600 hover:text-green-700 flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {t('approve')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openReviewDialog(application, 'reject')}
                  className="text-red-600 hover:text-red-700 flex-1"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  {t('reject')}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedApplication(application);
                setReviewDialogOpen(true);
              }}
              className={application.status === 'pending' ? '' : 'flex-1'}
            >
              <Eye className="h-4 w-4 mr-1" />
              {t('view')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title={t('totalApplications')}
            value={stats.total}
            icon={Users}
            {...StatsCardColors.slate}
          />

          <StatsCard
            title={t('pending')}
            value={stats.pending}
            icon={Clock}
            {...StatsCardColors.yellow}
          />

          <StatsCard
            title={t('approved')}
            value={stats.approved}
            icon={UserCheck}
            {...StatsCardColors.emerald}
          />

          <StatsCard
            title={t('rejected')}
            value={stats.rejected}
            icon={UserX}
            {...StatsCardColors.red}
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchByNameOrIcPassport')}
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
              <SelectItem value="all">{t('allApplications')}</SelectItem>
              <SelectItem value="pending">{t('pendingOnly')}</SelectItem>
              <SelectItem value="approved">{t('approvedOnly')}</SelectItem>
              <SelectItem value="rejected">{t('rejectedOnly')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Applications Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('noApplicationsFound')}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <DataTable columns={columns} data={applications} disablePagination={true} />
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {applications.map((application) => (
              <MobileApplicationCard
                key={application.id}
                application={application}
              />
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t('pageXOfY', { page, totalPages })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              {t('previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              {t('next')}
            </Button>
          </div>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? t('approve') : t('reject')} {t('application')}
            </DialogTitle>
            <DialogDescription>
              {selectedApplication && (
                <>
                  {t('youAreAboutTo')} {reviewAction === 'approve' ? t('approve') : t('reject')} {t('theKariahApplicationFrom')}{' '}
                  <strong>{selectedApplication.user.full_name}</strong>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Admin Notes */}
            <div>
              <label className="text-sm font-medium">
                {t('adminNotesOptional')}
              </label>
              <Textarea
                placeholder={t('addNotesAboutDecision')}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setReviewDialogOpen(false)}
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleReview}
                disabled={processing}
                variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              >
                {processing && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {reviewAction === 'approve' ? t('approve') : t('reject')} {t('application')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
