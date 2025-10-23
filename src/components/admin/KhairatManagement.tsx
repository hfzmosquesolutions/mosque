'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  UserCheck,
  UserX,
  FileText,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import {
  getKhairatMembers,
  reviewKhairatApplication,
  updateKhairatMember,
  withdrawKhairatMembership,
  deleteKhairatMember,
} from '@/lib/api/khairat-members';
import { KhairatMember } from '@/types/database';

interface KhairatManagementProps {
  mosqueId: string;
}

interface ManagementStats {
  total: number;
  applications: {
    pending: number;
    approved: number;
    rejected: number;
    withdrawn: number;
  };
  memberships: {
    active: number;
    inactive: number;
    suspended: number;
  };
}

export function KhairatManagement({
  mosqueId,
}: KhairatManagementProps) {
  const { user } = useAuth();
  const t = useTranslations('khairatManagement');
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<KhairatMember[]>([]);
  const [stats, setStats] = useState<ManagementStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all'); // 'all', 'applications', 'memberships'
  const [selectedMember, setSelectedMember] = useState<KhairatMember | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const loadMembers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const allMembers = await getKhairatMembers({
        mosque_id: mosqueId,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });

      setMembers(allMembers);

      // Calculate stats
      const applications = allMembers.filter(member => 
        ['pending', 'approved', 'rejected', 'under_review', 'withdrawn'].includes(member.status)
      );
      const memberships = allMembers.filter(member => 
        ['active', 'inactive', 'suspended'].includes(member.status)
      );

      setStats({
        total: allMembers.length,
        applications: {
          pending: applications.filter(app => app.status === 'pending').length,
          approved: applications.filter(app => app.status === 'approved').length,
          rejected: applications.filter(app => app.status === 'rejected').length,
          withdrawn: applications.filter(app => app.status === 'withdrawn').length,
        },
        memberships: {
          active: memberships.filter(m => m.status === 'active').length,
          inactive: memberships.filter(m => m.status === 'inactive').length,
          suspended: memberships.filter(m => m.status === 'suspended').length,
        },
      });
    } catch (error) {
      console.error('Error loading khairat members:', error);
      toast.error('Failed to load khairat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [mosqueId, statusFilter]);

  const handleReview = (member: KhairatMember, action: 'approve' | 'reject') => {
    setSelectedMember(member);
    setReviewAction(action);
    setAdminNotes('');
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedMember || !reviewAction) return;

    setProcessing(true);
    try {
      await reviewKhairatApplication({
        member_id: selectedMember.id,
        mosque_id: mosqueId,
        status: reviewAction === 'approve' ? 'approved' : 'rejected',
        admin_notes: adminNotes || undefined,
      });

      toast.success(`Application ${reviewAction}ed successfully`);
      setReviewDialogOpen(false);
      setSelectedMember(null);
      setReviewAction(null);
      setAdminNotes('');
      loadMembers();
    } catch (error: any) {
      console.error('Error reviewing application:', error);
      toast.error(error?.message || 'Failed to review application');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdrawMembership = async (memberId: string) => {
    try {
      await withdrawKhairatMembership(memberId);
      toast.success('Membership withdrawn successfully');
      setReviewDialogOpen(false);
      setSelectedMember(null);
      loadMembers();
    } catch (error: any) {
      console.error('Error withdrawing membership:', error);
      toast.error(error?.message || 'Failed to withdraw membership');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      await deleteKhairatMember(memberId);
      toast.success('Record deleted successfully');
      setReviewDialogOpen(false);
      setSelectedMember(null);
      loadMembers();
    } catch (error: any) {
      console.error('Error deleting member:', error);
      toast.error(error?.message || 'Failed to delete record');
    }
  };

  const handleInactivateMember = async (memberId: string) => {
    try {
      await updateKhairatMember(memberId, { status: 'inactive' });
      toast.success('Member inactivated successfully');
      setReviewDialogOpen(false);
      setSelectedMember(null);
      loadMembers();
    } catch (error: any) {
      console.error('Error inactivating member:', error);
      toast.error(error?.message || 'Failed to inactivate member');
    }
  };

  const handleReactivateMember = async (memberId: string) => {
    try {
      await updateKhairatMember(memberId, { status: 'active' });
      toast.success('Member reactivated successfully');
      setReviewDialogOpen(false);
      setSelectedMember(null);
      loadMembers();
    } catch (error: any) {
      console.error('Error reactivating member:', error);
      toast.error(error?.message || 'Failed to reactivate member');
    }
  };

  const handleRejectWithNotes = async () => {
    if (!selectedMember) return;

    setProcessing(true);
    try {
      await reviewKhairatApplication({
        member_id: selectedMember.id,
        mosque_id: mosqueId,
        status: 'rejected',
        admin_notes: adminNotes || undefined,
      });
      toast.success('Application rejected successfully');
      setReviewDialogOpen(false);
      setShowRejectDialog(false);
      setSelectedMember(null);
      setAdminNotes('');
      loadMembers();
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      toast.error(error?.message || 'Failed to reject application');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      // Application statuses
      pending: { 
        label: 'Pending', 
        className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800', 
        icon: Clock 
      },
      under_review: { 
        label: 'Under Review', 
        className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800', 
        icon: Eye 
      },
      approved: { 
        label: 'Approved', 
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800', 
        icon: CheckCircle 
      },
      rejected: { 
        label: 'Rejected', 
        className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800', 
        icon: XCircle 
      },
      withdrawn: { 
        label: 'Withdrawn', 
        className: 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800', 
        icon: X 
      },
      // Membership statuses
      active: { 
        label: 'Active', 
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800', 
        icon: CheckCircle 
      },
      inactive: { 
        label: 'Inactive', 
        className: 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800', 
        icon: UserX 
      },
      suspended: { 
        label: 'Suspended', 
        className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800', 
        icon: XCircle 
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`flex items-center gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (status: string) => {
    const isApplication = ['pending', 'approved', 'rejected', 'under_review', 'withdrawn'].includes(status);
    return (
      <Badge variant={isApplication ? 'outline' : 'secondary'} className="text-xs">
        {isApplication ? 'Application' : 'Member'}
      </Badge>
    );
  };

  const columns: ColumnDef<KhairatMember>[] = [
    {
      accessorKey: 'user.full_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Member" />
      ),
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium">{member.user?.full_name || 'Unknown User'}</div>
            <div className="text-sm text-muted-foreground">
              {member.user?.phone || 'No contact info'}
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
        const member = row.original;
        return (
          <div className="text-sm font-mono">
            {member.ic_passport_number || 'Not provided'}
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
        const member = row.original;
        return (
          <div className="flex items-center gap-2">
            {getStatusBadge(member.status)}
            {getTypeBadge(member.status)}
          </div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="text-sm">
            {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const member = row.original;

        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedMember(member);
                setReviewDialogOpen(true);
              }}
              className="h-8"
              title="View details"
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        );
      },
    },
  ];

  const filteredMembers = members.filter(member => {
    const matchesSearch = !searchTerm || 
      member.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.ic_passport_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || 
      (typeFilter === 'applications' && ['pending', 'approved', 'rejected', 'under_review', 'withdrawn'].includes(member.status)) ||
      (typeFilter === 'memberships' && ['active', 'inactive', 'suspended'].includes(member.status));

    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Applications"
            value={stats.applications.pending + stats.applications.approved + stats.applications.rejected + stats.applications.withdrawn}
            icon={FileText}
            {...StatsCardColors.blue}
            description="All applications"
          />
          <StatsCard
            title="Pending"
            value={stats.applications.pending.toString()}
            icon={Clock}
            {...StatsCardColors.orange}
            description="Awaiting review"
          />
          <StatsCard
            title="Active Members"
            value={stats.memberships.active.toString()}
            icon={UserCheck}
            {...StatsCardColors.emerald}
            description="Active members"
          />
          <StatsCard
            title="Total Members"
            value={stats.memberships.active + stats.memberships.inactive + stats.memberships.suspended}
            icon={Users}
            {...StatsCardColors.slate}
            description="All members"
          />
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Records</SelectItem>
              <SelectItem value="applications">Applications</SelectItem>
              <SelectItem value="memberships">Members</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredMembers}
        loading={loading}
      />

      {/* Member Details Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Member Details
            </DialogTitle>
            <DialogDescription>
              View and manage member information and status
            </DialogDescription>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-6">
              {/* Status and Type Badge */}
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedMember.status)}
                {getTypeBadge(selectedMember.status)}
              </div>

              {/* Member Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Member Name</label>
                    <p className="font-medium text-lg">{selectedMember.user?.full_name || 'Unknown User'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                    <p className="text-sm">{selectedMember.user?.phone || 'No contact info'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">IC/Passport Number</label>
                    <p className="font-mono text-sm">{selectedMember.ic_passport_number || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Applied Date</label>
                    <p className="text-sm">{formatDistanceToNow(new Date(selectedMember.created_at), { addSuffix: true })}</p>
                  </div>
                  {selectedMember.joined_date && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Joined Date</label>
                      <p className="text-sm">{new Date(selectedMember.joined_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedMember.reviewed_at && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Reviewed</label>
                      <p className="text-sm">{formatDistanceToNow(new Date(selectedMember.reviewed_at), { addSuffix: true })}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Application Reason */}
              {selectedMember.application_reason && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Application Reason</label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                    {selectedMember.application_reason}
                  </p>
                </div>
              )}

              {/* Admin Notes */}
              {selectedMember.admin_notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Admin Notes</label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                    {selectedMember.admin_notes}
                  </p>
                </div>
              )}

              {/* General Notes */}
              {selectedMember.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                    {selectedMember.notes}
                  </p>
                </div>
              )}

              {/* Action Buttons based on status */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                {/* Pending applications */}
                {selectedMember.status === 'pending' && (
                  <>
                    <Button
                      onClick={async () => {
                        setProcessing(true);
                        try {
                          await reviewKhairatApplication({
                            member_id: selectedMember.id,
                            mosque_id: mosqueId,
                            status: 'approved',
                            admin_notes: undefined,
                          });
                          toast.success('Application approved successfully');
                          setReviewDialogOpen(false);
                          setSelectedMember(null);
                          loadMembers();
                        } catch (error: any) {
                          console.error('Error approving application:', error);
                          toast.error(error?.message || 'Failed to approve application');
                        } finally {
                          setProcessing(false);
                        }
                      }}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        setAdminNotes('');
                        setShowRejectDialog(true);
                      }}
                      disabled={processing}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}

                {/* Active members */}
                {selectedMember.status === 'active' && (
                  <Button
                    onClick={() => handleInactivateMember(selectedMember.id)}
                    disabled={processing}
                    variant="outline"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Inactivate
                  </Button>
                )}

                {/* Inactive members */}
                {selectedMember.status === 'inactive' && (
                  <Button
                    onClick={() => handleReactivateMember(selectedMember.id)}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Reactivate
                  </Button>
                )}

                {/* Delete button - available for all statuses */}
                <Button
                  onClick={() => handleDeleteMember(selectedMember.id)}
                  disabled={processing}
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>

                {/* Close button */}
                <Button
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                  disabled={processing}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-amber-600" />
              Reject Application
            </DialogTitle>
            <DialogDescription>
              You can optionally provide a reason for rejecting this application. The user will see this feedback if provided.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="admin-notes" className="text-sm font-medium">
                Reason for rejection (optional)
              </label>
              <textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Please explain why this application is being rejected (optional)..."
                className="w-full min-h-[100px] p-3 border border-slate-300 dark:border-slate-600 rounded-md resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setAdminNotes('');
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectWithNotes}
              disabled={processing}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {processing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Reject Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
