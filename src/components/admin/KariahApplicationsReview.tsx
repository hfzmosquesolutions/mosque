'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { findLegacyRecordsByIcPassport } from '@/lib/api/legacy-records';

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

interface LegacyRecord {
  id: string;
  full_name: string;
  ic_passport_number: string;
  total_amount: number;
  latest_payment_date: string | null;
  status: 'matched' | 'unmatched';
  created_at: string;
  updated_at: string;
}

interface LegacyRecordsResponse {
  records: LegacyRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface KariahApplicationsReviewProps {
  mosqueId: string;
}

export function KariahApplicationsReview({
  mosqueId,
}: KariahApplicationsReviewProps) {
  const { user } = useAuth();
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

  // Legacy records state
  const [legacyRecords, setLegacyRecords] = useState<LegacyRecord[]>([]);
  const [legacyRecordsLoading, setLegacyRecordsLoading] = useState(false);
  const [legacyRecordsPage, setLegacyRecordsPage] = useState(1);
  const [legacyRecordsTotalPages, setLegacyRecordsTotalPages] = useState(1);
  const legacyRecordsLimit = 5;

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
        limit,
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
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mosqueId) {
      loadApplications();
    }
  }, [mosqueId, page, searchTerm, statusFilter]);

  const loadLegacyRecords = async (
    icPassportNumber: string,
    page: number = 1
  ) => {
    setLegacyRecordsLoading(true);
    try {
      const result = await findLegacyRecordsByIcPassport({
        mosque_id: mosqueId,
        ic_passport_number: icPassportNumber,
        page,
        limit: legacyRecordsLimit,
      });

      setLegacyRecords(result.records || []);
      setLegacyRecordsTotalPages(result.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error loading legacy records:', error);
      setLegacyRecords([]);
      setLegacyRecordsTotalPages(1);
    } finally {
      setLegacyRecordsLoading(false);
    }
  };

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

      toast.success(result.message || 'Application reviewed successfully');
      setReviewDialogOpen(false);
      setSelectedApplication(null);
      setReviewAction(null);
      setAdminNotes('');
      setLegacyRecords([]);
      setLegacyRecordsPage(1);
      loadApplications();
    } catch (error) {
      console.error('Error reviewing application:', error);
      toast.error('Failed to review application');
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
    setLegacyRecords([]);
    setLegacyRecordsPage(1);
    setReviewDialogOpen(true);

    // Load legacy records for approval action
    if (action === 'approve') {
      loadLegacyRecords(application.ic_passport_number);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
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
        <DataTableColumnHeader column={column} title="Full Name" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.user?.full_name || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'user.ic_passport_number',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="IC/Passport" />
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
        <DataTableColumnHeader column={column} title="Status" />
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
        <DataTableColumnHeader column={column} title="Applied" />
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
        <DataTableColumnHeader column={column} title="Reviewed By" />
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
      header: 'Actions',
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
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openReviewDialog(application, 'reject')}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
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
              View
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
              <h3 className="font-medium">{application.user?.full_name || 'N/A'}</h3>
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
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Applied:</span>
              <p>{formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Reviewed by:</span>
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
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openReviewDialog(application, 'reject')}
                  className="text-red-600 hover:text-red-700 flex-1"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
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
              View
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Applications
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.approved}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.rejected}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or IC/Passport..."
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
              <SelectItem value="all">All Applications</SelectItem>
              <SelectItem value="pending">Pending Only</SelectItem>
              <SelectItem value="approved">Approved Only</SelectItem>
              <SelectItem value="rejected">Rejected Only</SelectItem>
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
          No applications found
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <DataTable columns={columns} data={applications} />
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
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent
          className={
            reviewAction === 'approve' && legacyRecords.length > 0
              ? 'max-w-4xl'
              : 'max-w-md'
          }
        >
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Application
            </DialogTitle>
            <DialogDescription>
              {selectedApplication && (
                <>
                  You are about to {reviewAction} the kariah application from{' '}
                  <strong>{selectedApplication.user.full_name}</strong>.
                  {reviewAction === 'approve' && (
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Approving this application will create a kariah
                        membership and automatically match any legacy records
                        with the same IC/Passport number.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Legacy Records Section - Only show for approval */}
            {reviewAction === 'approve' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">
                    Matching Legacy Records
                  </h4>
                  {legacyRecordsLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>

                {legacyRecordsLoading ? (
                  <div className="flex items-center justify-center py-8 border rounded-lg">
                    <div className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Loading legacy records...
                      </p>
                    </div>
                  </div>
                ) : legacyRecords.length > 0 ? (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Full Name</TableHead>
                          <TableHead>IC/Passport</TableHead>
                          <TableHead>Payment Date</TableHead>
                          <TableHead>Amount (RM)</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {legacyRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {record.full_name}
                            </TableCell>
                            <TableCell className="font-mono">
                              {record.ic_passport_number}
                            </TableCell>
                            <TableCell>
                              {record.latest_payment_date
                                ? formatDate(record.latest_payment_date)
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {record.total_amount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  record.status === 'matched'
                                    ? 'default'
                                    : 'secondary'
                                }
                                className={
                                  record.status === 'matched'
                                    ? 'bg-green-100 text-green-800'
                                    : ''
                                }
                              >
                                {record.status === 'matched'
                                  ? 'Matched'
                                  : 'Unmatched'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Legacy Records Pagination */}
                    {legacyRecordsTotalPages > 1 && (
                      <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Page {legacyRecordsPage} of {legacyRecordsTotalPages}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newPage = legacyRecordsPage - 1;
                              setLegacyRecordsPage(newPage);
                              if (selectedApplication) {
                                loadLegacyRecords(
                                  selectedApplication.ic_passport_number,
                                  newPage
                                );
                              }
                            }}
                            disabled={
                              legacyRecordsPage <= 1 || legacyRecordsLoading
                            }
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newPage = legacyRecordsPage + 1;
                              setLegacyRecordsPage(newPage);
                              if (selectedApplication) {
                                loadLegacyRecords(
                                  selectedApplication.ic_passport_number,
                                  newPage
                                );
                              }
                            }}
                            disabled={
                              legacyRecordsPage >= legacyRecordsTotalPages ||
                              legacyRecordsLoading
                            }
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      No matching legacy records found for IC/Passport:{' '}
                      {selectedApplication?.ic_passport_number}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Admin Notes */}
            <div>
              <label className="text-sm font-medium">
                Admin Notes (Optional)
              </label>
              <Textarea
                placeholder="Add any notes about this decision..."
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
                Cancel
              </Button>
              <Button
                onClick={handleReview}
                disabled={processing}
                variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              >
                {processing && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {reviewAction === 'approve' ? 'Approve' : 'Reject'} Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
