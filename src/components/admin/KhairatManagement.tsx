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
  Edit,
  Plus,
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
import { supabase } from '@/lib/supabase';
import { isValidMalaysiaIc, normalizeMalaysiaIc } from '@/lib/utils';

interface KhairatManagementProps {
  mosqueId: string;
  createDialogOpen?: boolean;
  onCreateDialogChange?: (open: boolean) => void;
}

export function KhairatManagement({
  mosqueId,
  createDialogOpen: externalCreateDialogOpen,
  onCreateDialogChange,
}: KhairatManagementProps) {
  const { user } = useAuth();
  const t = useTranslations('khairatManagement');
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<KhairatMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<KhairatMember | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [internalCreateDialogOpen, setInternalCreateDialogOpen] = useState(false);
  
  // Use external dialog state if provided, otherwise use internal state
  const createDialogOpen = externalCreateDialogOpen !== undefined 
    ? externalCreateDialogOpen 
    : internalCreateDialogOpen;
  const setCreateDialogOpen = onCreateDialogChange || setInternalCreateDialogOpen;
  const [createForm, setCreateForm] = useState({
    user_id: '',
    full_name: '',
    ic_passport_number: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    useDirectData: false, // Toggle between user_id or direct data
  });

  const loadMembers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const allMembers = await getKhairatMembers({
        mosque_id: mosqueId,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });

      setMembers(allMembers);
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

  const handleCreateMember = async () => {
    // Validate based on mode
    if (!createForm.useDirectData) {
      // Using user_id mode
      if (!createForm.user_id) {
        toast.error('User ID is required');
        return;
      }
    } else {
      // Using direct data mode
      if (!createForm.full_name || !createForm.ic_passport_number) {
        toast.error('Full name and IC number are required');
        return;
      }
    }

    setProcessing(true);
    try {
      if (!createForm.useDirectData) {
        // Check if user exists
        const { data: userProfile, error: userError } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .eq('id', createForm.user_id)
          .single();

        if (userError || !userProfile) {
          toast.error('User not found. Please check the User ID.');
          setProcessing(false);
          return;
        }

        // Check if member already exists
        const { data: existingMember } = await supabase
          .from('khairat_members')
          .select('id, status')
          .eq('user_id', createForm.user_id)
          .eq('mosque_id', mosqueId)
          .single();

        if (existingMember) {
          toast.error(`User already has a ${existingMember.status} membership`);
          setProcessing(false);
          return;
        }
      } else {
        // Check if member with same IC already exists for this mosque
        const { data: existingMember } = await supabase
          .from('khairat_members')
          .select('id, status')
          .eq('ic_passport_number', createForm.ic_passport_number)
          .eq('mosque_id', mosqueId)
          .is('user_id', null)
          .single();

        if (existingMember) {
          toast.error(`A member with this IC number already exists with ${existingMember.status} status`);
          setProcessing(false);
          return;
        }
      }

      // Create the member directly as active
      const insertData: any = {
        mosque_id: mosqueId,
        ic_passport_number: createForm.ic_passport_number || null,
        notes: createForm.notes || null,
        status: 'active',
        joined_date: new Date().toISOString().split('T')[0],
      };

      if (createForm.useDirectData) {
        // Direct data mode - no user_id
        insertData.full_name = createForm.full_name;
        insertData.phone = createForm.phone || null;
        insertData.email = createForm.email || null;
        insertData.address = createForm.address || null;
      } else {
        // User account mode
        insertData.user_id = createForm.user_id;
      }

      const { data: newMember, error: createError } = await supabase
        .from('khairat_members')
        .insert(insertData)
        .select(`
          *,
          user:user_profiles!khairat_members_user_id_fkey(id, full_name, phone),
          mosque:mosques(id, name)
        `)
        .single();

      if (createError) {
        throw new Error(createError.message);
      }

      toast.success('Member registered successfully');
      setCreateDialogOpen(false);
      setCreateForm({ 
        user_id: '', 
        full_name: '',
        ic_passport_number: '', 
        phone: '',
        email: '',
        address: '',
        notes: '',
        useDirectData: false,
      });
      loadMembers();
    } catch (error: any) {
      console.error('Error creating member:', error);
      toast.error(error?.message || 'Failed to register member');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      // Application statuses
      pending: { 
        label: t('pending'), 
        className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800', 
        icon: Clock 
      },
      under_review: { 
        label: t('under_review'), 
        className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800', 
        icon: Eye 
      },
      approved: { 
        label: t('approved'), 
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800', 
        icon: CheckCircle 
      },
      rejected: { 
        label: t('rejected'), 
        className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800', 
        icon: XCircle 
      },
      withdrawn: { 
        label: t('withdrawn'), 
        className: 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800', 
        icon: X 
      },
      // Membership statuses
      active: { 
        label: t('active'), 
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800', 
        icon: CheckCircle 
      },
      inactive: { 
        label: t('inactive'), 
        className: 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800', 
        icon: UserX 
      },
      suspended: { 
        label: t('suspended'), 
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
        {isApplication ? t('table.application') : t('table.member')}
      </Badge>
    );
  };

  const columns: ColumnDef<KhairatMember>[] = [
    {
      accessorKey: 'full_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.name')} />
      ),
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="font-medium">
            {member.full_name || t('table.unknownUser')}
          </div>
        );
      },
    },
    {
      accessorKey: 'ic_passport_number',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.icNo')} />
      ),
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="text-sm font-mono">
            {member.ic_passport_number || t('table.notProvided')}
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.phone')} />
      ),
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="text-sm">
            {member.phone || t('table.noContactInfo')}
          </div>
        );
      },
    },
    {
      accessorKey: 'membership_number',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.memberId')} />
      ),
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="text-sm font-mono">
            {member.membership_number || '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.status')} />
      ),
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center gap-2">
            {getStatusBadge(member.status)}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: t('table.actions'),
      cell: ({ row }) => {
        const member = row.original;

        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedMember(member);
                setReviewDialogOpen(true);
              }}
              className="h-8 w-8 p-0"
              title="Update"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const filteredMembers = members.filter(member => {
    const matchesSearch =
      !searchTerm ||
      member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.ic_passport_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.membership_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
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
      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredMembers}
        customFilters={
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('table.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('table.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('table.allStatuses')}</SelectItem>
                <SelectItem value="pending">{t('pending')}</SelectItem>
                <SelectItem value="approved">{t('approved')}</SelectItem>
                <SelectItem value="rejected">{t('rejected')}</SelectItem>
                <SelectItem value="withdrawn">{t('withdrawn')}</SelectItem>
                <SelectItem value="active">{t('active')}</SelectItem>
                <SelectItem value="inactive">{t('inactive')}</SelectItem>
                <SelectItem value="suspended">{t('suspended')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Member Details Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t('memberDetails.title')}
            </DialogTitle>
            <DialogDescription>
              {t('memberDetails.description')}
            </DialogDescription>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedMember.status)}
              </div>

              {/* Member Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('memberDetails.memberName')}</label>
                    <p className="font-medium text-lg">
                      {selectedMember.full_name || t('table.unknownUser')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('memberDetails.phoneNumber')}</label>
                    <p className="text-sm">
                      {selectedMember.phone || t('table.noContactInfo')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('memberDetails.icNumber')}</label>
                    <p className="font-mono text-sm">{selectedMember.ic_passport_number || t('table.notProvided')}</p>
                  </div>
                  {selectedMember.address && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('memberDetails.address')}</label>
                      <p className="text-sm">{selectedMember.address}</p>
                    </div>
                  )}
                  {selectedMember.email && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('memberDetails.email')}</label>
                      <p className="text-sm">{selectedMember.email}</p>
                    </div>
                  )}
                  {selectedMember.membership_number && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('memberDetails.memberId')}</label>
                      <p className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">{selectedMember.membership_number}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('memberDetails.appliedDate')}</label>
                    <p className="text-sm">{formatDistanceToNow(new Date(selectedMember.created_at), { addSuffix: true })}</p>
                  </div>
                  {selectedMember.joined_date && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('memberDetails.joinedDate')}</label>
                      <p className="text-sm">{new Date(selectedMember.joined_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedMember.reviewed_at && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('memberDetails.lastReviewed')}</label>
                      <p className="text-sm">{formatDistanceToNow(new Date(selectedMember.reviewed_at), { addSuffix: true })}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Application Reason */}
              {selectedMember.application_reason && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('memberDetails.applicationReason')}</label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                    {selectedMember.application_reason}
                  </p>
                </div>
              )}

              {/* Admin Notes */}
              {selectedMember.admin_notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('memberDetails.adminNotes')}</label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                    {selectedMember.admin_notes}
                  </p>
                </div>
              )}

              {/* General Notes */}
              {selectedMember.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('memberDetails.notes')}</label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                    {selectedMember.notes}
                  </p>
                </div>
              )}

              {/* Dependents Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('memberDetails.dependents') || 'Tanggungan (Dependents)'}
                  </label>
                  <Badge variant="secondary">
                    {selectedMember.dependents?.length || 0}
                  </Badge>
                </div>
                {selectedMember.dependents && selectedMember.dependents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedMember.dependents.map((dependent: any) => (
                      <Card key={dependent.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-sm font-medium">{dependent.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {dependent.relationship}
                              {dependent.ic_passport_number && ` • ${dependent.ic_passport_number}`}
                            </p>
                          </div>
                          <div className="text-sm space-y-1">
                            {dependent.date_of_birth && (
                              <p className="text-xs text-muted-foreground">
                                DOB: {new Date(dependent.date_of_birth).toLocaleDateString()}
                              </p>
                            )}
                            {dependent.phone && (
                              <p className="text-xs text-muted-foreground">Phone: {dependent.phone}</p>
                            )}
                            {dependent.emergency_contact && (
                              <Badge variant="outline" className="text-xs">Emergency Contact</Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {t('memberDetails.noDependents') || 'No dependents registered'}
                  </p>
                )}
              </div>

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
                      {t('memberDetails.approve')}
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
                      {t('memberDetails.reject')}
                    </Button>
                  </>
                )}


                {/* Delete button - available for all statuses */}
                <Button
                  onClick={() => handleDeleteMember(selectedMember.id)}
                  disabled={processing}
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('memberDetails.delete')}
                </Button>

                {/* Close button */}
                <Button
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                  disabled={processing}
                >
                  {t('memberDetails.close')}
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
              {t('rejectDialog.title')}
            </DialogTitle>
            <DialogDescription>
              {t('rejectDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="admin-notes" className="text-sm font-medium">
                {t('rejectDialog.reasonForRejection')}
              </label>
              <textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={t('rejectDialog.rejectionPlaceholder')}
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
              {t('rejectDialog.cancel')}
            </Button>
            <Button
              onClick={handleRejectWithNotes}
              disabled={processing}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {processing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  {t('rejectDialog.rejecting')}
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  {t('rejectDialog.rejectApplication')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Member Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('registerDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('registerDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Toggle between user account and direct data */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <input
                type="checkbox"
                id="useDirectData"
                checked={createForm.useDirectData}
                onChange={(e) =>
                  setCreateForm({ ...createForm, useDirectData: e.target.checked })
                }
                className="h-4 w-4"
              />
              <label htmlFor="useDirectData" className="text-sm font-medium cursor-pointer">
                {t('registerDialog.registerWithoutAccount')}
              </label>
            </div>

            {createForm.useDirectData ? (
              /* Direct Data Mode - No user account required */
              <>
                <div>
                  <label className="text-sm font-medium">{t('registerDialog.fullNameRequired')}</label>
                  <Input
                    placeholder={t('registerDialog.enterFullName')}
                    value={createForm.full_name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, full_name: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('registerDialog.icNumberRequired')}</label>
              <Input
                placeholder={t('registerDialog.enterIcNumber')}
                value={createForm.ic_passport_number}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    ic_passport_number: normalizeMalaysiaIc(e.target.value).slice(0, 12),
                  })
                }
                className="mt-1"
                maxLength={12}
              />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('registerDialog.phoneOptional')}</label>
                  <Input
                    placeholder={t('registerDialog.enterPhoneNumber')}
                    value={createForm.phone}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, phone: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('registerDialog.emailOptional')}</label>
                  <Input
                    type="email"
                    placeholder={t('registerDialog.enterEmailAddress')}
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, email: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('registerDialog.addressOptional')}</label>
                  <Textarea
                    placeholder={t('registerDialog.enterAddress')}
                    value={createForm.address}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, address: e.target.value })
                    }
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </>
            ) : (
              /* User Account Mode */
              <>
                <div>
                  <label className="text-sm font-medium">{t('registerDialog.userIdRequired')}</label>
                  <Input
                    placeholder={t('registerDialog.enterUserId')}
                    value={createForm.user_id}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, user_id: e.target.value })
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('registerDialog.userIdHint')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('registerDialog.icNumberOptional')}</label>
                  <Input
                    placeholder={t('registerDialog.enterIcNumber')}
                    value={createForm.ic_passport_number}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        ic_passport_number: normalizeMalaysiaIc(e.target.value).slice(0, 12),
                      })
                    }
                    className="mt-1"
                    maxLength={12}
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium">{t('registerDialog.notesOptional')}</label>
              <Textarea
                placeholder={t('registerDialog.addNotesAboutMembership')}
                value={createForm.notes}
                onChange={(e) =>
                  setCreateForm({ ...createForm, notes: e.target.value })
                }
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setCreateForm({ 
                    user_id: '', 
                    full_name: '',
                    ic_passport_number: '', 
                    phone: '',
                    email: '',
                    address: '',
                    notes: '',
                    useDirectData: false,
                  });
                }}
                disabled={processing}
              >
                {t('registerDialog.cancel')}
              </Button>
              <Button onClick={handleCreateMember} disabled={processing}>
                {processing && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {t('registerDialog.registerMember')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
