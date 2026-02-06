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
  Upload,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import {
  getKhairatMembers,
  getKhairatMemberById,
  reviewKhairatApplication,
  updateKhairatMember,
  withdrawKhairatMembership,
  deleteKhairatMember,
  bulkCreateKhairatMembers,
} from '@/lib/api/khairat-members';
import {
  bulkCreateKhairatMemberDependents,
  updateKhairatMemberDependent,
  deleteKhairatMemberDependent,
  createKhairatMemberDependent,
} from '@/lib/api/khairat-member-dependents';
import { KhairatMember, CreateKhairatMemberDependent } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { isValidMalaysiaIc, normalizeMalaysiaIc } from '@/lib/utils';

interface KhairatManagementProps {
  mosqueId: string;
  createDialogOpen?: boolean;
  onCreateDialogChange?: (open: boolean) => void;
  bulkUploadDialogOpen?: boolean;
  onBulkUploadDialogChange?: (open: boolean) => void;
}

export function KhairatManagement({
  mosqueId,
  createDialogOpen: externalCreateDialogOpen,
  onCreateDialogChange,
  bulkUploadDialogOpen: externalBulkUploadDialogOpen,
  onBulkUploadDialogChange,
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
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [editForm, setEditForm] = useState<{
    full_name: string;
    ic_passport_number: string;
    membership_number: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
    status: 'pending' | 'approved' | 'rejected' | 'under_review' | 'withdrawn' | 'active' | 'inactive' | 'suspended';
    original_registration_date: string;
  }>({
    full_name: '',
    ic_passport_number: '',
    membership_number: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    status: 'active',
    original_registration_date: '',
  });
  const [editDependents, setEditDependents] = useState<Array<{
    id?: string;
    full_name: string;
    relationship: string;
    ic_passport_number: string;
    date_of_birth: string;
    gender: string;
    phone: string;
    email: string;
    address: string;
    emergency_contact: boolean;
    notes: string;
  }>>([]);
  const [internalCreateDialogOpen, setInternalCreateDialogOpen] = useState(false);
  
  // Bulk upload state
  const [internalBulkUploadDialogOpen, setInternalBulkUploadDialogOpen] = useState(false);
  const bulkUploadDialogOpen = externalBulkUploadDialogOpen !== undefined 
    ? externalBulkUploadDialogOpen 
    : internalBulkUploadDialogOpen;
  const setBulkUploadDialogOpen = onBulkUploadDialogChange || setInternalBulkUploadDialogOpen;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const previewItemsPerPage = 10;
  const [uploadResult, setUploadResult] = useState<{
    errors?: string[];
    skipped?: string[];
    dependents_errors?: string[];
    created_count: number;
    dependents_created?: number;
  } | null>(null);
  const [showErrorsDialog, setShowErrorsDialog] = useState(false);
  
  // Use external dialog state if provided, otherwise use internal state
  const createDialogOpen = externalCreateDialogOpen !== undefined 
    ? externalCreateDialogOpen 
    : internalCreateDialogOpen;
  const setCreateDialogOpen = onCreateDialogChange || setInternalCreateDialogOpen;
  const [createForm, setCreateForm] = useState({
    full_name: '',
    ic_passport_number: '',
    membership_number: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    original_registration_date: new Date().toISOString().split('T')[0], // Default to today
  });
  const [memberDependents, setMemberDependents] = useState<Array<{
    id: string;
    full_name: string;
    relationship: string;
    ic_passport_number: string;
    date_of_birth: string;
    gender: string;
    phone: string;
    email: string;
    address: string;
    emergency_contact: boolean;
    notes: string;
  }>>([]);
  const [showDependentsForm, setShowDependentsForm] = useState(false);

  const loadMembers = async () => {
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

  const handleEditMember = (member: KhairatMember) => {
    // Switch to edit mode - dialog should already be open
    setIsEditingMember(true);
    setEditForm({
      full_name: member.full_name || '',
      ic_passport_number: member.ic_passport_number || '',
      membership_number: member.membership_number || '',
      phone: member.phone || '',
      email: member.email || '',
      address: member.address || '',
      notes: member.notes || '',
      status: member.status,
      original_registration_date: member.original_registration_date || new Date(member.created_at).toISOString().split('T')[0],
    });
    // Initialize dependents for editing
    setEditDependents(
      member.dependents?.map((dep: any) => ({
        id: dep.id,
        full_name: dep.full_name || '',
        relationship: dep.relationship || '',
        ic_passport_number: dep.ic_passport_number || '',
        date_of_birth: dep.date_of_birth ? new Date(dep.date_of_birth).toISOString().split('T')[0] : '',
        gender: dep.gender || '',
        phone: dep.phone || '',
        email: dep.email || '',
        address: dep.address || '',
        emergency_contact: dep.emergency_contact || false,
        notes: dep.notes || '',
      })) || []
    );
  };

  const handleSaveMember = async () => {
    if (!selectedMember) return;

    setProcessing(true);
    try {
      // Validate IC if changed
      let normalizedIc = editForm.ic_passport_number;
      if (editForm.ic_passport_number && editForm.ic_passport_number !== selectedMember.ic_passport_number) {
        normalizedIc = normalizeMalaysiaIc(editForm.ic_passport_number).slice(0, 12);
        if (!isValidMalaysiaIc(normalizedIc)) {
          toast.error('Invalid IC number. Please enter a valid 12-digit Malaysian IC number.');
          setProcessing(false);
          return;
        }
      }

      // Update member
      await updateKhairatMember(selectedMember.id, {
        full_name: editForm.full_name || undefined,
        ic_passport_number: normalizedIc || undefined,
        membership_number: editForm.membership_number || undefined,
        phone: editForm.phone || undefined,
        email: editForm.email || undefined,
        address: editForm.address || undefined,
        notes: editForm.notes || undefined,
        status: editForm.status,
        original_registration_date: editForm.original_registration_date || undefined,
      });

      // Handle dependents
      const existingDependentIds = selectedMember.dependents?.map((d: any) => d.id) || [];
      const currentDependentIds = editDependents.filter(d => d.id).map(d => d.id!);
      const dependentsToDelete = existingDependentIds.filter((id: string) => !currentDependentIds.includes(id));

      // Delete removed dependents
      for (const dependentId of dependentsToDelete) {
        const result = await deleteKhairatMemberDependent(dependentId);
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete dependent');
        }
      }

      // Update or create dependents
      for (const dependent of editDependents) {
        if (dependent.id) {
          // Update existing dependent
          const result = await updateKhairatMemberDependent(dependent.id, {
            full_name: dependent.full_name,
            relationship: dependent.relationship,
            ic_passport_number: dependent.ic_passport_number,
            date_of_birth: dependent.date_of_birth || undefined,
            gender: dependent.gender || undefined,
            phone: dependent.phone || undefined,
            email: dependent.email || undefined,
            address: dependent.address || undefined,
            emergency_contact: dependent.emergency_contact,
            notes: dependent.notes || undefined,
          });
          if (!result.success) {
            throw new Error(result.error || 'Failed to update dependent');
          }
        } else {
          // Create new dependent
          const result = await createKhairatMemberDependent({
            khairat_member_id: selectedMember.id,
            full_name: dependent.full_name,
            relationship: dependent.relationship,
            ic_passport_number: dependent.ic_passport_number,
            date_of_birth: dependent.date_of_birth || undefined,
            gender: dependent.gender || undefined,
            phone: dependent.phone || undefined,
            email: dependent.email || undefined,
            address: dependent.address || undefined,
            emergency_contact: dependent.emergency_contact,
            notes: dependent.notes || undefined,
          });
          if (!result.success) {
            throw new Error(result.error || 'Failed to create dependent');
          }
        }
      }

      toast.success('Member updated successfully');
      setIsEditingMember(false);
      loadMembers();
      // Reload member details
      const updatedMember = await getKhairatMemberById(selectedMember.id);
      setSelectedMember(updatedMember);
    } catch (error: any) {
      console.error('Error updating member:', error);
      toast.error(error?.message || 'Failed to update member');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingMember(false);
    setEditForm({
      full_name: '',
      ic_passport_number: '',
      membership_number: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      status: 'active',
      original_registration_date: new Date().toISOString().split('T')[0],
    });
    setEditDependents([]);
  };

  const handleCreateMember = async () => {
    // Validate required fields
    if (!createForm.full_name || !createForm.ic_passport_number) {
      toast.error('Full name and IC number are required');
      return;
    }

    // Validate IC number format
    const normalizedIc = normalizeMalaysiaIc(createForm.ic_passport_number).slice(0, 12);
    if (!isValidMalaysiaIc(normalizedIc)) {
      toast.error('Invalid IC number. Please enter a valid 12-digit Malaysian IC number.');
      return;
    }

    setProcessing(true);
    try {
      // Check if member with same IC already exists for this mosque
      const { data: existingMember } = await supabase
        .from('khairat_members')
        .select('id, status')
        .eq('ic_passport_number', normalizedIc)
        .eq('mosque_id', mosqueId)
        .maybeSingle();

      if (existingMember) {
        toast.error(`A member with this IC number already exists with ${existingMember.status} status`);
        setProcessing(false);
        return;
      }

      // Check if membership number is provided and if it's unique for this mosque
      if (createForm.membership_number && createForm.membership_number.trim()) {
        const { data: existingByMembershipNumber } = await supabase
          .from('khairat_members')
          .select('id, status')
          .eq('membership_number', createForm.membership_number.trim())
          .eq('mosque_id', mosqueId)
          .maybeSingle();

        if (existingByMembershipNumber) {
          toast.error(`A member with this membership ID already exists with ${existingByMembershipNumber.status} status`);
          setProcessing(false);
          return;
        }
      }

      // Create the member directly as active (no user_id)
      const insertData: any = {
        mosque_id: mosqueId,
        full_name: createForm.full_name,
        ic_passport_number: normalizedIc,
        membership_number: createForm.membership_number?.trim() || null,
        phone: createForm.phone || null,
        email: createForm.email || null,
        address: createForm.address || null,
        notes: createForm.notes || null,
        status: 'active',
        joined_date: new Date().toISOString().split('T')[0],
      };

      const { data: newMember, error: createError } = await supabase
        .from('khairat_members')
        .insert(insertData)
        .select(`
          *,
          mosque:mosques(id, name)
        `)
        .single();

      if (createError) {
        throw new Error(createError.message);
      }

      // Create dependents if any
      if (newMember && memberDependents.length > 0) {
        const validDependents = memberDependents
          .filter(dep => dep.full_name && dep.relationship)
          .map(dep => ({
            full_name: dep.full_name,
            relationship: dep.relationship,
            ic_passport_number: dep.ic_passport_number?.trim() || undefined,
            date_of_birth: dep.date_of_birth || undefined,
            gender: dep.gender || undefined,
            phone: dep.phone?.trim() || undefined,
            email: dep.email?.trim() || undefined,
            address: dep.address?.trim() || undefined,
            emergency_contact: dep.emergency_contact || false,
            notes: dep.notes?.trim() || undefined,
          }));

        if (validDependents.length > 0) {
          const { success, error: dependentsError } = await bulkCreateKhairatMemberDependents(
            newMember.id,
            validDependents
          );

          if (!success) {
            console.error('Error creating dependents:', dependentsError);
            toast.warning('Member created but failed to add some dependents');
          } else {
            toast.success(`Member registered successfully with ${validDependents.length} dependent(s)`);
          }
        }
      } else {
        toast.success('Member registered successfully');
      }

      setCreateDialogOpen(false);
      setCreateForm({ 
        full_name: '',
        ic_passport_number: '',
        membership_number: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        original_registration_date: new Date().toISOString().split('T')[0],
      });
      setMemberDependents([]);
      setShowDependentsForm(false);
      loadMembers();
    } catch (error: any) {
      console.error('Error creating member:', error);
      toast.error(error?.message || 'Failed to register member');
    } finally {
      setProcessing(false);
    }
  };

  // Bulk upload handlers
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        await parseCSVForPreview(file);
      } else {
        toast.error(t('bulkUpload.invalidFileFormat') || 'Please select a CSV file');
        event.target.value = '';
      }
    }
  };

  const parseCSVForPreview = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text
        .trim()
        .split('\n')
        .filter((line) => line.trim());

      if (lines.length < 2) {
        toast.error(t('bulkUpload.csvMustHaveHeaderAndData') || 'CSV must have at least a header row and one data row');
        return;
      }

      const headers = lines[0]
        .split(',')
        .map((h) => h.trim().replace(/"/g, ''));
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        // Parse CSV line handling quoted values (including JSON arrays)
        for (let j = 0; j < lines[i].length; j++) {
          const char = lines[i][j];
          if (char === '"') {
            // Handle escaped quotes within JSON
            if (j + 1 < lines[i].length && lines[i][j + 1] === '"') {
              current += '"';
              j++; // Skip next quote
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim().replace(/^"|"$/g, '')); // Add the last value

        const record: any = {};
        headers.forEach((header, index) => {
          const value = values[index] || '';
          // Preserve the value as-is, especially for JSON strings in dependents
          record[header] = value;
        });

        data.push(record);
      }

      setPreviewData(data);
      setShowPreview(true);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast.error(t('bulkUpload.errorParsingCsv') || 'Error parsing CSV file');
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile || !previewData.length) {
      toast.error(t('bulkUpload.pleaseSelectFileAndReview') || 'Please select a file and review the data');
      return;
    }

    setUploading(true);
    try {
      // Validate and clean the preview data
      const validMembers = previewData
        .filter((record) => {
          return record.ic_passport_number && record.full_name;
        })
        .map((record) => {
          // Parse dependents if provided (can be JSON string or array)
          let dependents: any[] = [];
          if (record.dependents) {
            try {
              if (typeof record.dependents === 'string' && record.dependents.trim()) {
                dependents = JSON.parse(record.dependents);
              } else if (Array.isArray(record.dependents)) {
                dependents = record.dependents;
              }
            } catch (e) {
              console.warn('Failed to parse dependents JSON:', e);
            }
          }

          return {
            full_name: record.full_name?.trim() || '',
            ic_passport_number: record.ic_passport_number?.trim() || '',
            membership_number: record.membership_number?.trim() || undefined,
            phone: record.phone?.trim() || undefined,
            email: record.email?.trim() || undefined,
            address: record.address?.trim() || undefined,
            notes: record.notes?.trim() || undefined,
            dependents: dependents.length > 0 ? dependents : undefined,
          };
        });

      if (validMembers.length === 0) {
        toast.error(t('bulkUpload.noValidRecordsFound') || 'No valid records found');
        return;
      }

      const result = await bulkCreateKhairatMembers({
        mosque_id: mosqueId,
        members: validMembers,
      });

      const dependentsCount = (result as any).dependents_created || 0;
      const dependentsErrors = (result as any).dependents_errors || [];
      const dependentsMsg = dependentsCount > 0 ? ` with ${dependentsCount} dependent(s)` : '';

      // Store result for error dialog
      const hasErrors = (result.errors && result.errors.length > 0) || 
                        (result.skipped && result.skipped.length > 0) || 
                        (dependentsErrors.length > 0);
      
      if (hasErrors) {
        setUploadResult({
          errors: result.errors || [],
          skipped: result.skipped || [],
          dependents_errors: dependentsErrors,
          created_count: result.created_count,
          dependents_created: dependentsCount,
        });
        setShowErrorsDialog(true);
      }

      if (result.errors && result.errors.length > 0) {
        toast.warning(
          t('bulkUpload.uploadedWithErrors', { 
            count: result.created_count,
            errors: result.errors.length 
          }) || `Uploaded ${result.created_count} member(s)${dependentsMsg} with ${result.errors.length} error(s)`,
          {
            action: {
              label: t('bulkUpload.viewDetails') || 'View Details',
              onClick: () => setShowErrorsDialog(true),
            },
          }
        );
      } else if (result.skipped && result.skipped.length > 0) {
        toast.warning(
          t('bulkUpload.uploadedWithSkipped', { 
            count: result.created_count,
            skipped: result.skipped.length 
          }) || `Uploaded ${result.created_count} member(s)${dependentsMsg}, ${result.skipped.length} skipped`,
          {
            action: {
              label: t('bulkUpload.viewDetails') || 'View Details',
              onClick: () => setShowErrorsDialog(true),
            },
          }
        );
      } else {
        if (dependentsErrors.length > 0) {
          toast.warning(
            `Successfully uploaded ${result.created_count} member(s)${dependentsMsg}, but ${dependentsErrors.length} dependent(s) failed to create`,
            {
              action: {
                label: t('bulkUpload.viewDetails') || 'View Details',
                onClick: () => setShowErrorsDialog(true),
              },
            }
          );
        } else {
          toast.success(
            t('bulkUpload.successfullyUploaded', { count: result.created_count }) || 
            `Successfully uploaded ${result.created_count} member(s)${dependentsMsg}`
          );
        }
      }

      // Only close dialog and reset if no errors
      if (!hasErrors) {
        setSelectedFile(null);
        setPreviewData([]);
        setShowPreview(false);
        setPreviewPage(1);
        setBulkUploadDialogOpen(false);
      }
      loadMembers();
    } catch (error: any) {
      console.error('Error uploading members:', error);
      toast.error(error?.message || t('bulkUpload.failedToUpload') || 'Failed to upload members');
    } finally {
      setUploading(false);
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
      accessorKey: 'dependents',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.dependents') || 'Tanggungan'} />
      ),
      cell: ({ row }) => {
        const member = row.original;
        const dependentsCount = member.dependents?.length || 0;
        return (
          <div className="text-sm">
            {dependentsCount > 0 ? (
              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                <Users className="h-3 w-3" />
                {dependentsCount}
              </Badge>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
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
                setIsEditingMember(false);
                setReviewDialogOpen(true);
              }}
              className="h-8 w-8 p-0"
              title={t('memberDetails.view') || 'View Details'}
            >
              <Eye className="h-4 w-4" />
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
      {/* Bulk Upload Dialog */}
      <Dialog open={bulkUploadDialogOpen} onOpenChange={setBulkUploadDialogOpen}>
        <DialogContent className="max-w-[98vw] w-[98vw] max-h-[95vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{t('bulkUpload.title') || 'Bulk Upload Members'}</DialogTitle>
            <DialogDescription>
              {t('bulkUpload.description') || 'Upload a CSV file to register multiple members at once'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-y-auto min-h-0 pr-1">
            {/* Download Template Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/khairat-members-bulk-upload-template.csv';
                  link.download = 'khairat-members-bulk-upload-template.csv';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('bulkUpload.downloadTemplate') || 'Download CSV Template'}
              </Button>
            </div>

            {/* File Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('bulkUpload.selectCsvFile') || 'Select CSV File'}
              </label>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {t('bulkUpload.csvFormatHint') || 'CSV perlu mengandungi: full_name, ic_passport_number, membership_number (pilihan), phone (pilihan), email (pilihan), address (pilihan), notes (pilihan), dependents (pilihan)'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('bulkUpload.dependentsHint') || 'Tinggalkan kosong jika tiada tanggungan. Untuk tambah tanggungan, gunakan format JSON atau daftar secara manual selepas ini.'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {t('bulkUpload.duplicateNote') || 'Note: Members with duplicate IC numbers or membership IDs will be skipped.'}
              </p>
            </div>

            {/* Preview Table */}
            {showPreview && previewData.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    {t('bulkUpload.preview') || 'Preview'} ({previewData.length} {t('bulkUpload.records') || 'records'})
                  </label>
                </div>
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead className="min-w-[150px]">{t('bulkUpload.fullName') || 'Full Name'}</TableHead>
                          <TableHead className="min-w-[120px]">{t('bulkUpload.icNumber') || 'IC Number'}</TableHead>
                          <TableHead className="min-w-[120px]">{t('bulkUpload.membershipNumber') || 'Membership ID'}</TableHead>
                          <TableHead className="min-w-[120px]">{t('bulkUpload.phone') || 'Phone'}</TableHead>
                          <TableHead className="min-w-[150px]">{t('bulkUpload.email') || 'Email'}</TableHead>
                          <TableHead className="min-w-[100px]">{t('bulkUpload.dependents') || 'Dependents'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData
                          .slice(
                            (previewPage - 1) * previewItemsPerPage,
                            previewPage * previewItemsPerPage
                          )
                          .map((record, index) => (
                            <TableRow key={(previewPage - 1) * previewItemsPerPage + index}>
                              <TableCell className="font-medium">{record.full_name || '-'}</TableCell>
                              <TableCell className="font-mono text-xs">{record.ic_passport_number || '-'}</TableCell>
                              <TableCell>{record.membership_number || '-'}</TableCell>
                              <TableCell>{record.phone || '-'}</TableCell>
                              <TableCell className="text-sm">{record.email || '-'}</TableCell>
                              <TableCell>
                                {(() => {
                                  try {
                                    // Get dependents field (case-insensitive)
                                    const dependentsValue = record.dependents || record.Dependents || record.DEPENDENTS || '';
                                    
                                    if (!dependentsValue || dependentsValue.trim() === '') {
                                      return '-';
                                    }

                                    let deps: any[] = [];
                                    
                                    if (typeof dependentsValue === 'string') {
                                      // Try to parse as JSON
                                      const cleaned = dependentsValue.trim();
                                      if (cleaned.startsWith('[') || cleaned.startsWith('{')) {
                                        deps = JSON.parse(cleaned);
                                      } else {
                                        return '-';
                                      }
                                    } else if (Array.isArray(dependentsValue)) {
                                      deps = dependentsValue;
                                    }

                                    // Ensure it's an array
                                    if (!Array.isArray(deps)) {
                                      return '-';
                                    }

                                    // Filter out invalid entries
                                    const validDeps = deps.filter(dep => dep && (dep.full_name || dep.relationship));
                                    
                                    return validDeps.length > 0 ? (
                                      <Badge variant="secondary">{validDeps.length}</Badge>
                                    ) : '-';
                                  } catch (error) {
                                    console.error('Error parsing dependents in preview:', error, record.dependents);
                                    return '-';
                                  }
                                })()}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Pagination Controls */}
                  {previewData.length > previewItemsPerPage && (
                    <div className="flex items-center justify-between border-t px-4 py-3 bg-muted/50">
                      <div className="text-sm text-muted-foreground">
                        {t('bulkUpload.showing') || 'Showing'}{' '}
                        {(previewPage - 1) * previewItemsPerPage + 1} -{' '}
                        {Math.min(previewPage * previewItemsPerPage, previewData.length)}{' '}
                        {t('bulkUpload.of') || 'of'} {previewData.length}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                          disabled={previewPage === 1}
                        >
                          {t('bulkUpload.previous') || 'Previous'}
                        </Button>
                        <div className="text-sm text-muted-foreground">
                          {t('bulkUpload.page') || 'Page'} {previewPage} {t('bulkUpload.of') || 'of'}{' '}
                          {Math.ceil(previewData.length / previewItemsPerPage)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setPreviewPage((p) =>
                              Math.min(
                                Math.ceil(previewData.length / previewItemsPerPage),
                                p + 1
                              )
                            )
                          }
                          disabled={
                            previewPage >= Math.ceil(previewData.length / previewItemsPerPage)
                          }
                        >
                          {t('bulkUpload.next') || 'Next'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setBulkUploadDialogOpen(false);
                setSelectedFile(null);
                setPreviewData([]);
                setShowPreview(false);
                setPreviewPage(1);
              }}
              disabled={uploading}
            >
              {t('bulkUpload.cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={handleBulkUpload}
              disabled={uploading || !showPreview || previewData.length === 0}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('bulkUpload.uploading') || 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('bulkUpload.uploadMembers') || 'Upload Members'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Errors Dialog */}
      <Dialog open={showErrorsDialog} onOpenChange={setShowErrorsDialog}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              {t('bulkUpload.uploadResults') || 'Upload Results'}
            </DialogTitle>
            <DialogDescription>
              {t('bulkUpload.uploadResultsDescription') || 'Review errors and skipped records from the bulk upload'}
            </DialogDescription>
          </DialogHeader>

          {uploadResult && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">{t('bulkUpload.created') || 'Created'}</div>
                  <div className="text-2xl font-bold text-green-600">{uploadResult.created_count}</div>
                </Card>
                {uploadResult.dependents_created && uploadResult.dependents_created > 0 && (
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">{t('bulkUpload.dependentsCreated') || 'Dependents Created'}</div>
                    <div className="text-2xl font-bold text-green-600">{uploadResult.dependents_created}</div>
                  </Card>
                )}
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">{t('bulkUpload.errors') || 'Errors'}</div>
                    <div className="text-2xl font-bold text-red-600">{uploadResult.errors.length}</div>
                  </Card>
                )}
                {uploadResult.skipped && uploadResult.skipped.length > 0 && (
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">{t('bulkUpload.skipped') || 'Skipped'}</div>
                    <div className="text-2xl font-bold text-amber-600">{uploadResult.skipped.length}</div>
                  </Card>
                )}
              </div>

              {/* Errors Section */}
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    {t('bulkUpload.errors') || 'Errors'} ({uploadResult.errors.length})
                  </h3>
                  <div className="border rounded-md max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">{t('bulkUpload.row') || 'Row'}</TableHead>
                          <TableHead>{t('bulkUpload.errorMessage') || 'Error Message'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uploadResult.errors.map((error, index) => {
                          const rowMatch = error.match(/Row (\d+):/);
                          const rowNumber = rowMatch ? rowMatch[1] : '';
                          const errorMessage = error.replace(/Row \d+: /, '');
                          return (
                            <TableRow key={index}>
                              <TableCell className="font-mono text-sm">{rowNumber}</TableCell>
                              <TableCell className="text-sm text-red-600">{errorMessage}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Skipped Section */}
              {uploadResult.skipped && uploadResult.skipped.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-amber-600 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {t('bulkUpload.skipped') || 'Skipped'} ({uploadResult.skipped.length})
                  </h3>
                  <div className="border rounded-md max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">{t('bulkUpload.row') || 'Row'}</TableHead>
                          <TableHead>{t('bulkUpload.skipReason') || 'Reason'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uploadResult.skipped.map((skip, index) => {
                          const rowMatch = skip.match(/Row (\d+):/);
                          const rowNumber = rowMatch ? rowMatch[1] : '';
                          const skipReason = skip.replace(/Row \d+: /, '');
                          return (
                            <TableRow key={index}>
                              <TableCell className="font-mono text-sm">{rowNumber}</TableCell>
                              <TableCell className="text-sm text-amber-600">{skipReason}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Dependents Errors Section */}
              {uploadResult.dependents_errors && uploadResult.dependents_errors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-orange-600 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {t('bulkUpload.dependentsErrors') || 'Dependents Errors'} ({uploadResult.dependents_errors.length})
                  </h3>
                  <div className="border rounded-md max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">{t('bulkUpload.row') || 'Row'}</TableHead>
                          <TableHead>{t('bulkUpload.errorMessage') || 'Error Message'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uploadResult.dependents_errors.map((error, index) => {
                          const rowMatch = error.match(/Row (\d+):/);
                          const rowNumber = rowMatch ? rowMatch[1] : '';
                          const errorMessage = error.replace(/Row \d+: /, '');
                          return (
                            <TableRow key={index}>
                              <TableCell className="font-mono text-sm">{rowNumber}</TableCell>
                              <TableCell className="text-sm text-orange-600">{errorMessage}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  onClick={() => {
                    setShowErrorsDialog(false);
                    setUploadResult(null);
                    setSelectedFile(null);
                    setPreviewData([]);
                    setShowPreview(false);
                    setPreviewPage(1);
                    setBulkUploadDialogOpen(false);
                  }}
                >
                  {t('bulkUpload.close') || 'Close'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
      <Dialog open={reviewDialogOpen} onOpenChange={(open) => {
        setReviewDialogOpen(open);
        if (!open) {
          setIsEditingMember(false);
          setSelectedMember(null);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t('memberDetails.title')}
            </DialogTitle>
            <DialogDescription>
              {t('memberDetails.description')}
            </DialogDescription>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-6 overflow-y-auto flex-1 min-h-0 pr-1">
              {/* Status Badge and Edit Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedMember.status)}
                </div>
                {!isEditingMember && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditMember(selectedMember)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {t('memberDetails.edit') || 'Edit'}
                  </Button>
                )}
              </div>

              {isEditingMember ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('registerDialog.fullNameRequired')}</label>
                      <Input
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('registerDialog.icNumberRequired')}</label>
                      <Input
                        value={editForm.ic_passport_number}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            ic_passport_number: normalizeMalaysiaIc(e.target.value).slice(0, 12),
                          })
                        }
                        className={`h-10 ${
                          editForm.ic_passport_number && 
                          !isValidMalaysiaIc(normalizeMalaysiaIc(editForm.ic_passport_number).slice(0, 12))
                            ? 'border-red-500 focus-visible:ring-red-500' 
                            : ''
                        }`}
                        maxLength={12}
                      />
                      {editForm.ic_passport_number && 
                       !isValidMalaysiaIc(normalizeMalaysiaIc(editForm.ic_passport_number).slice(0, 12)) && (
                        <p className="text-xs text-red-500">
                          {t('registerDialog.invalidIcNumber') || 'Invalid IC number'}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('registerDialog.membershipNumberOptional')}</label>
                      <Input
                        value={editForm.membership_number}
                        onChange={(e) => setEditForm({ ...editForm, membership_number: e.target.value })}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('registerDialog.phoneOptional')}</label>
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('registerDialog.emailOptional')}</label>
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('memberDetails.status') || 'Status'}</label>
                      <Select
                        value={editForm.status}
                        onValueChange={(value: any) => setEditForm({ ...editForm, status: value })}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">{t('active')}</SelectItem>
                          <SelectItem value="inactive">{t('inactive')}</SelectItem>
                          <SelectItem value="suspended">{t('suspended')}</SelectItem>
                          <SelectItem value="pending">{t('pending')}</SelectItem>
                          <SelectItem value="approved">{t('approved')}</SelectItem>
                          <SelectItem value="rejected">{t('rejected')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('registerDialog.addressOptional')}</label>
                    <Textarea
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="min-h-[80px]"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('registerDialog.notesOptional')}</label>
                    <Textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="min-h-[80px]"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('registerDialog.registrationDate') || 'Registration Date'}</label>
                    <Input
                      type="date"
                      value={editForm.original_registration_date || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setEditForm({ ...editForm, original_registration_date: e.target.value })}
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('registerDialog.registrationDateHint') || 'Set the date when this member originally registered. Leave as today for new members, or set a past date for legacy members.'}
                    </p>
                  </div>

                  {/* Dependents Section in Edit Mode */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        {t('registerDialog.dependentsTitle') || 'Dependents (Tanggungan)'}
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditDependents([
                            ...editDependents,
                            {
                              full_name: '',
                              relationship: '',
                              ic_passport_number: '',
                              date_of_birth: '',
                              gender: '',
                              phone: '',
                              email: '',
                              address: '',
                              emergency_contact: false,
                              notes: '',
                            },
                          ]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('registerDialog.addAnotherDependent') || 'Add Dependent'}
                      </Button>
                    </div>

                    {editDependents.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        {t('memberDetails.noDependents') || 'No dependents registered'}
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {editDependents.map((dependent, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-medium">
                                {t('registerDialog.dependent') || 'Dependent'} {index + 1}
                              </h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditDependents(editDependents.filter((_, i) => i !== index));
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">{t('registerDialog.fullNameRequired')}</label>
                                <Input
                                  value={dependent.full_name}
                                  onChange={(e) => {
                                    const updated = [...editDependents];
                                    updated[index].full_name = e.target.value;
                                    setEditDependents(updated);
                                  }}
                                  className="h-10"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">{t('registerDialog.enterRelationship')}</label>
                                <Input
                                  value={dependent.relationship}
                                  onChange={(e) => {
                                    const updated = [...editDependents];
                                    updated[index].relationship = e.target.value;
                                    setEditDependents(updated);
                                  }}
                                  className="h-10"
                                  placeholder={t('registerDialog.enterRelationship') || 'e.g., spouse, child'}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">{t('registerDialog.icNumberRequired')}</label>
                                <Input
                                  value={dependent.ic_passport_number}
                                  onChange={(e) => {
                                    const updated = [...editDependents];
                                    updated[index].ic_passport_number = normalizeMalaysiaIc(e.target.value).slice(0, 12);
                                    setEditDependents(updated);
                                  }}
                                  className="h-10"
                                  maxLength={12}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">{t('registerDialog.dateOfBirth')}</label>
                                <Input
                                  type="date"
                                  value={dependent.date_of_birth}
                                  onChange={(e) => {
                                    const updated = [...editDependents];
                                    updated[index].date_of_birth = e.target.value;
                                    setEditDependents(updated);
                                  }}
                                  className="h-10"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">{t('registerDialog.gender')}</label>
                                <Select
                                  value={dependent.gender}
                                  onValueChange={(value) => {
                                    const updated = [...editDependents];
                                    updated[index].gender = value;
                                    setEditDependents(updated);
                                  }}
                                >
                                  <SelectTrigger className="h-10">
                                    <SelectValue placeholder={t('registerDialog.gender')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="male">{t('registerDialog.male')}</SelectItem>
                                    <SelectItem value="female">{t('registerDialog.female')}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">{t('registerDialog.phoneOptional')}</label>
                                <Input
                                  value={dependent.phone}
                                  onChange={(e) => {
                                    const updated = [...editDependents];
                                    updated[index].phone = e.target.value;
                                    setEditDependents(updated);
                                  }}
                                  className="h-10"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">{t('registerDialog.emailOptional')}</label>
                                <Input
                                  type="email"
                                  value={dependent.email}
                                  onChange={(e) => {
                                    const updated = [...editDependents];
                                    updated[index].email = e.target.value;
                                    setEditDependents(updated);
                                  }}
                                  className="h-10"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">{t('registerDialog.addressOptional')}</label>
                                <Input
                                  value={dependent.address}
                                  onChange={(e) => {
                                    const updated = [...editDependents];
                                    updated[index].address = e.target.value;
                                    setEditDependents(updated);
                                  }}
                                  className="h-10"
                                />
                              </div>
                            </div>
                            <div className="mt-4 space-y-2">
                              <label className="text-sm font-medium">{t('registerDialog.notesOptional')}</label>
                              <Textarea
                                value={dependent.notes}
                                onChange={(e) => {
                                  const updated = [...editDependents];
                                  updated[index].notes = e.target.value;
                                  setEditDependents(updated);
                                }}
                                className="min-h-[60px]"
                                rows={2}
                              />
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
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
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('memberDetails.registrationDate') || 'Registration Date'}</label>
                        <p className="text-sm">
                          {selectedMember.original_registration_date 
                            ? new Date(selectedMember.original_registration_date).toLocaleDateString()
                            : new Date(selectedMember.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedMember.joined_date && 
                       selectedMember.joined_date !== selectedMember.original_registration_date &&
                       selectedMember.joined_date !== new Date(selectedMember.created_at).toISOString().split('T')[0] && (
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
                </>
              )}

              {/* Application Reason - Only show in view mode */}
              {!isEditingMember && selectedMember.application_reason && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('memberDetails.applicationReason')}</label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                    {selectedMember.application_reason}
                  </p>
                </div>
              )}

              {/* Admin Notes - Only show in view mode */}
              {!isEditingMember && selectedMember.admin_notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('memberDetails.adminNotes')}</label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                    {selectedMember.admin_notes}
                  </p>
                </div>
              )}

              {/* General Notes - Only show in view mode */}
              {!isEditingMember && selectedMember.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('memberDetails.notes')}</label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                    {selectedMember.notes}
                  </p>
                </div>
              )}

              {/* Dependents Section - Only show in view mode */}
              {!isEditingMember && (
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
              )}
            </div>
          )}

          {/* Action Buttons based on status - Fixed at bottom */}
          {selectedMember && (
            <div className="flex flex-wrap gap-3 pt-4 border-t flex-shrink-0 bg-background">
              {isEditingMember ? (
                /* Edit Mode Buttons */
                <>
                  <Button
                    onClick={handleSaveMember}
                    disabled={processing || !editForm.full_name || !editForm.ic_passport_number}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('memberDetails.saving') || 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {t('memberDetails.save') || 'Save'}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={processing}
                  >
                    {t('memberDetails.cancel') || 'Cancel'}
                  </Button>
                </>
              ) : (
                <>
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
                  onClick={() => {
                    setReviewDialogOpen(false);
                    setIsEditingMember(false);
                    setSelectedMember(null);
                  }}
                  disabled={processing}
                >
                  {t('memberDetails.close')}
                </Button>
                </>
              )}
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
        <DialogContent className="max-w-[98vw] w-[98vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('registerDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('registerDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Member Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold pb-2 border-b">{t('registerDialog.memberInformation') || 'Member Information'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('registerDialog.fullNameRequired')}</label>
                  <Input
                    placeholder={t('registerDialog.enterFullName')}
                    value={createForm.full_name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, full_name: e.target.value })
                    }
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
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
                    className={`h-10 ${
                      createForm.ic_passport_number && 
                      !isValidMalaysiaIc(normalizeMalaysiaIc(createForm.ic_passport_number).slice(0, 12))
                        ? 'border-red-500 focus-visible:ring-red-500' 
                        : ''
                    }`}
                    maxLength={12}
                  />
                  {createForm.ic_passport_number && 
                   !isValidMalaysiaIc(normalizeMalaysiaIc(createForm.ic_passport_number).slice(0, 12)) && (
                    <p className="text-xs text-red-500">
                      {t('registerDialog.invalidIcNumber') || 'Invalid IC number. Please enter a valid 12-digit Malaysian IC number.'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('registerDialog.membershipNumberOptional')}</label>
                  <Input
                    placeholder={t('registerDialog.enterMembershipNumber')}
                    value={createForm.membership_number}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        membership_number: e.target.value,
                      })
                    }
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('registerDialog.phoneOptional')}</label>
                  <Input
                    placeholder={t('registerDialog.enterPhoneNumber')}
                    value={createForm.phone}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, phone: e.target.value })
                    }
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('registerDialog.emailOptional')}</label>
                  <Input
                    type="email"
                    placeholder={t('registerDialog.enterEmailAddress')}
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, email: e.target.value })
                    }
                    className="h-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('registerDialog.addressOptional')}</label>
                <Textarea
                  placeholder={t('registerDialog.enterAddress')}
                  value={createForm.address}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, address: e.target.value })
                  }
                  className="min-h-[80px]"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('registerDialog.notesOptional')}</label>
                <Textarea
                  placeholder={t('registerDialog.addNotesAboutMembership')}
                  value={createForm.notes}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, notes: e.target.value })
                  }
                  className="min-h-[80px]"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('registerDialog.registrationDate') || 'Registration Date'}</label>
                <Input
                  type="date"
                  value={createForm.original_registration_date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCreateForm({ ...createForm, original_registration_date: e.target.value })}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  {t('registerDialog.registrationDateHint') || 'Set the date when this member originally registered. Defaults to today for new members, or set a past date for legacy members.'}
                </p>
              </div>
            </div>

            {/* Dependents Section */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-base font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t('registerDialog.dependentsTitle')}
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('registerDialog.dependentsDescription')}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!showDependentsForm && memberDependents.length === 0) {
                      setMemberDependents([{
                        id: `dep-${Date.now()}`,
                        full_name: '',
                        relationship: '',
                        ic_passport_number: '',
                        date_of_birth: '',
                        gender: 'male',
                        phone: '',
                        email: '',
                        address: '',
                        emergency_contact: false,
                        notes: '',
                      }]);
                    }
                    setShowDependentsForm(!showDependentsForm);
                  }}
                >
                  {showDependentsForm ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      {t('registerDialog.hideDependents')}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('registerDialog.addDependents')}
                    </>
                  )}
                </Button>
              </div>

              {showDependentsForm && (
                <div className="space-y-4">
                  {memberDependents.map((dependent, index) => (
                    <Card key={dependent.id} className="p-5 border-2 border-dashed">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-semibold">
                          {t('registerDialog.dependent')} {index + 1}
                        </h4>
                        {memberDependents.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setMemberDependents(memberDependents.filter((_, i) => i !== index));
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            {t('registerDialog.fullName')} <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={dependent.full_name}
                            onChange={(e) => {
                              const updated = [...memberDependents];
                              updated[index].full_name = e.target.value;
                              setMemberDependents(updated);
                            }}
                            placeholder={t('registerDialog.enterFullName')}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            {t('registerDialog.relationship')} <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={dependent.relationship}
                            onChange={(e) => {
                              const updated = [...memberDependents];
                              updated[index].relationship = e.target.value;
                              setMemberDependents(updated);
                            }}
                            placeholder={t('registerDialog.enterRelationship')}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t('registerDialog.icNumber')}</label>
                          <Input
                            value={dependent.ic_passport_number}
                            onChange={(e) => {
                              const updated = [...memberDependents];
                              updated[index].ic_passport_number = normalizeMalaysiaIc(e.target.value).slice(0, 12);
                              setMemberDependents(updated);
                            }}
                            placeholder={t('registerDialog.enterIcNumber')}
                            className="h-10"
                            maxLength={12}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t('registerDialog.dateOfBirth')}</label>
                          <Input
                            type="date"
                            value={dependent.date_of_birth}
                            onChange={(e) => {
                              const updated = [...memberDependents];
                              updated[index].date_of_birth = e.target.value;
                              setMemberDependents(updated);
                            }}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t('registerDialog.gender')}</label>
                          <Select
                            value={dependent.gender}
                            onValueChange={(value) => {
                              const updated = [...memberDependents];
                              updated[index].gender = value;
                              setMemberDependents(updated);
                            }}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">{t('registerDialog.male')}</SelectItem>
                              <SelectItem value="female">{t('registerDialog.female')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t('registerDialog.phone')}</label>
                          <Input
                            value={dependent.phone}
                            onChange={(e) => {
                              const updated = [...memberDependents];
                              updated[index].phone = e.target.value;
                              setMemberDependents(updated);
                            }}
                            placeholder={t('registerDialog.enterPhoneNumber')}
                            className="h-10"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setMemberDependents([...memberDependents, {
                        id: `dep-${Date.now()}-${Math.random()}`,
                        full_name: '',
                        relationship: '',
                        ic_passport_number: '',
                        date_of_birth: '',
                        gender: 'male',
                        phone: '',
                        email: '',
                        address: '',
                        emergency_contact: false,
                        notes: '',
                      }]);
                    }}
                    className="w-full h-10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('registerDialog.addAnotherDependent')}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setCreateForm({ 
                    full_name: '',
                    ic_passport_number: '',
                    membership_number: '',
                    phone: '',
                    email: '',
                    address: '',
                    notes: '',
                    original_registration_date: new Date().toISOString().split('T')[0],
                  });
                  setMemberDependents([]);
                  setShowDependentsForm(false);
                }}
                disabled={processing}
              >
                {t('registerDialog.cancel')}
              </Button>
              <Button 
                onClick={handleCreateMember} 
                disabled={
                  processing || 
                  !createForm.full_name || 
                  !createForm.ic_passport_number ||
                  !isValidMalaysiaIc(normalizeMalaysiaIc(createForm.ic_passport_number).slice(0, 12))
                }
              >
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
