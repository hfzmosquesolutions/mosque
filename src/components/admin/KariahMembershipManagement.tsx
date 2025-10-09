'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import {
  getKariahMemberships,
  createKariahMembership,
  updateKariahMembership,
  deleteKariahMembership,
  getMembershipStatistics,
} from '@/lib/api/kariah-memberships';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StatsCard, StatsCardColors } from '@/components/ui/stats-card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Users,
  Loader2,
  AlertTriangle,
  Phone,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';

interface KariahMembership {
  id: string;
  user_id: string;
  mosque_id: string;
  membership_number: string;
  status: 'active' | 'inactive' | 'suspended';
  joined_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string;
    phone?: string;
    email?: string;
    ic_passport_number?: string;
  };
}

interface MembershipStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
}

interface CreateMembershipData {
  user_id: string;
  notes?: string;
}

interface UpdateMembershipData {
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
}

interface KariahMembershipManagementProps {
  mosqueId: string;
}

export function KariahMembershipManagement({
  mosqueId,
}: KariahMembershipManagementProps) {
  const { user } = useAuth();
  const t = useTranslations('kariahManagement');
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const [memberships, setMemberships] = useState<KariahMembership[]>([]);
  const [stats, setStats] = useState<MembershipStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMembership, setSelectedMembership] =
    useState<KariahMembership | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Create membership form
  const [createForm, setCreateForm] = useState<CreateMembershipData>({
    user_id: '',
    notes: '',
  });

  // Edit membership form
  const [editForm, setEditForm] = useState<UpdateMembershipData>({
    status: 'active',
    notes: '',
  });

  const loadMemberships = async () => {
    setLoading(true);
    try {
      const filters = {
        mosque_id: mosqueId,
        page,
        limit,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      };

      const data = await getKariahMemberships(filters);
      setMemberships(data.memberships || []);
      setTotalPages(data.pagination?.totalPages || 1);

      // Load statistics
      const statsData = await getMembershipStatistics(mosqueId);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading memberships:', error);
      toast.error(t('failedToLoadMemberships'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mosqueId) {
      loadMemberships();
    }
  }, [mosqueId, page, searchTerm, statusFilter]);

  const handleCreateMembership = async () => {
    if (!createForm.user_id) {
      toast.error(t('pleaseSelectUser'));
      return;
    }

    setProcessing(true);
    try {
      await createKariahMembership({
        ...createForm,
        mosque_id: mosqueId,
      });

      toast.success(t('membershipCreatedSuccessfully'));
      setCreateDialogOpen(false);
      setCreateForm({ user_id: '', notes: '' });
      loadMemberships();
    } catch (error) {
      console.error('Error creating membership:', error);
      toast.error(t('failedToCreateMembership'));
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateMembership = async () => {
    if (!selectedMembership) return;

    setProcessing(true);
    try {
      await updateKariahMembership(selectedMembership.id, editForm);

      toast.success(t('membershipUpdatedSuccessfully'));
      setEditDialogOpen(false);
      setSelectedMembership(null);
      loadMemberships();
    } catch (error) {
      console.error('Error updating membership:', error);
      toast.error(t('failedToUpdateMembership'));
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteMembership = async () => {
    if (!selectedMembership) return;

    setProcessing(true);
    try {
      await deleteKariahMembership(selectedMembership.id);

      toast.success(t('membershipDeletedSuccessfully'));
      setDeleteDialogOpen(false);
      setSelectedMembership(null);
      loadMemberships();
    } catch (error) {
      console.error('Error deleting membership:', error);
      toast.error(t('failedToDeleteMembership'));
    } finally {
      setProcessing(false);
    }
  };

  const openEditDialog = (membership: KariahMembership) => {
    setSelectedMembership(membership);
    setEditForm({
      status: membership.status,
      notes: membership.notes || '',
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (membership: KariahMembership) => {
    setSelectedMembership(membership);
    setDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">{t('active')}</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">{t('suspended')}</Badge>;
      case 'inactive':
      default:
        return <Badge className="bg-gray-100 text-gray-800">{t('inactive')}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'suspended':
        return <UserX className="h-4 w-4 text-red-600" />;
      case 'inactive':
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  // Column definitions for DataTable
  const columns: ColumnDef<KariahMembership>[] = [
    {
      accessorKey: 'user.full_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('member')} />
      ),
      cell: ({ row }) => {
        const membership = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {membership.user.full_name}
            </div>
            {membership.user.ic_passport_number && (
              <div className="text-sm text-muted-foreground font-mono">
                {membership.user.ic_passport_number}
              </div>
            )}
            {membership.user.phone && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {membership.user.phone}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'membership_number',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('membershipNumber')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
            {row.getValue('membership_number')}
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
        const membership = row.original;
        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(membership.status)}
            {getStatusBadge(membership.status)}
          </div>
        );
      },
    },
    {
      accessorKey: 'joined_date',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('joinedDate')} />
      ),
      cell: ({ row }) => {
        const joinedDate = row.getValue('joined_date') as string;
        return (
          <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
            <Calendar className="h-3 w-3" />
            {formatDate(joinedDate)}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: t('actions'),
      cell: ({ row }) => {
        const membership = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(membership)}
              className="h-8 px-3"
            >
              <Edit className="h-4 w-4 mr-1" />
              {t('edit')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDeleteDialog(membership)}
              className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {t('delete')}
            </Button>
          </div>
        );
      },
    },
  ];

  // Mobile Card Component
  const MobileMemberCard = ({
    membership,
  }: {
    membership: KariahMembership;
  }) => (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with Name and Membership Number */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {membership.user.full_name}
              </h3>
              {membership.user.ic_passport_number && (
                <div className="text-sm text-muted-foreground font-mono mt-1">
                  {membership.user.ic_passport_number}
                </div>
              )}
              {membership.user.phone && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Phone className="h-3 w-3" />
                  <span>{membership.user.phone}</span>
                </div>
              )}
            </div>
            <div className="text-right ml-3">
              <div className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                {membership.membership_number}
              </div>
            </div>
          </div>

          {/* Status and Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(membership.status)}
              {getStatusBadge(membership.status)}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(membership.joined_date)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(membership)}
              className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit className="h-4 w-4 mr-1" />
              {t('edit')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDeleteDialog(membership)}
              className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {t('delete')}
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
            title={t('totalMembers')}
            value={stats.total}
            icon={Users}
            {...StatsCardColors.slate}
          />

          <StatsCard
            title={t('active')}
            value={stats.active}
            icon={UserCheck}
            {...StatsCardColors.emerald}
          />

          <StatsCard
            title={t('inactive')}
            value={stats.inactive}
            icon={Users}
            {...StatsCardColors.slate}
          />

          <StatsCard
            title={t('suspended')}
            value={stats.suspended}
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
              placeholder={t('searchByNameOrMembershipNumber')}
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
              <SelectItem value="all">{t('allMembers')}</SelectItem>
              <SelectItem value="active">{t('activeOnly')}</SelectItem>
              <SelectItem value="inactive">{t('inactiveOnly')}</SelectItem>
              <SelectItem value="suspended">{t('suspendedOnly')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('addMember')}
        </Button>
      </div>

      {/* Memberships Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : memberships.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('noMembershipsFound')}
        </div>
      ) : isMobile ? (
        <div className="space-y-4">
          {memberships.map((membership) => (
            <MobileMemberCard key={membership.id} membership={membership} />
          ))}
        </div>
      ) : (
        <div className="hidden md:block">
          <DataTable
            columns={columns}
            data={memberships}
            disablePagination={true}
          />
        </div>
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

      {/* Create Membership Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('createNewMembership')}</DialogTitle>
            <DialogDescription>
              {t('createNewMembershipDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('userIdRequired')}</label>
              <Input
                placeholder={t('enterUserId')}
                value={createForm.user_id}
                onChange={(e) =>
                  setCreateForm({ ...createForm, user_id: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('notesOptional')}</label>
              <Textarea
                placeholder={t('addNotesAboutMembership')}
                value={createForm.notes}
                onChange={(e) =>
                  setCreateForm({ ...createForm, notes: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                {t('cancel')}
              </Button>
              <Button onClick={handleCreateMembership} disabled={processing}>
                {processing && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {t('createMembership')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Membership Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('editMembership')}</DialogTitle>
            <DialogDescription>
              {selectedMembership && (
                <>
                  {t('updateMembershipFor')}{' '}
                  <strong>{selectedMembership.user.full_name}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('statusRequired')}</label>
              <Select
                value={editForm.status}
                onValueChange={(value: 'active' | 'inactive' | 'suspended') =>
                  setEditForm({ ...editForm, status: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('active')}</SelectItem>
                  <SelectItem value="inactive">{t('inactive')}</SelectItem>
                  <SelectItem value="suspended">{t('suspended')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{t('notesOptional')}</label>
              <Textarea
                placeholder={t('addNotesAboutMembership')}
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                {t('cancel')}
              </Button>
              <Button onClick={handleUpdateMembership} disabled={processing}>
                {processing && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {t('updateMembership')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Membership Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('deleteMembership')}</DialogTitle>
            <DialogDescription>
              {selectedMembership && (
                <>
                  {t('confirmDeleteMembershipFor')}{' '}
                  <strong>{selectedMembership.user.full_name}</strong>?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMembership}
              disabled={processing}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('deleteMembership')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
