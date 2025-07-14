import { useState, useEffect, useCallback } from 'react';
import { useAuthState } from '@/hooks/useAuth.v2';
import { khairatService } from '@/services/khairat';
import { MosqueService } from '@/services/api';
import {
  KhairatRecord,
  KhairatRecordWithProfile,
  KhairatSettings,
  TablesInsert,
  TablesUpdate,
} from '@/types/database';

export interface KhairatFilters {
  status?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

export interface KhairatStats {
  totalRecords: number;
  totalAmount: number;
  pendingRecords: number;
  approvedRecords: number;
  paidRecords: number;
  rejectedRecords: number;
  cashPayments: number;
  bankTransfers: number;
  chequePayments: number;
  averageContribution: number;
}

export function useKhairat() {
  const { profile } = useAuthState();
  const [records, setRecords] = useState<KhairatRecordWithProfile[]>([]);
  const [settings, setSettings] = useState<KhairatSettings | null>(null);
  const [stats, setStats] = useState<KhairatStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mosques, setMosques] = useState<{ id: string; name: string }[]>([]);

  // NOTE: Records are now loaded from ALL accessible mosques
  // Users no longer need mosque_id assigned to their profile

  // Load available mosques
  const loadMosques = useCallback(async () => {
    try {
      const data = await MosqueService.getAllMosques();
      setMosques(data);
    } catch (err) {
      console.error('Error loading mosques:', err);
    }
  }, []);

  // Load khairat records
  const loadRecords = useCallback(async (filters?: KhairatFilters) => {
    try {
      setLoading(true);
      setError(null);

      // Load records from all accessible mosques
      const data = await khairatService.getKhairatRecords(undefined, filters);

      // Apply search filter if provided
      let filteredData = data;
      if (filters?.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        filteredData = data.filter((record) => {
          const memberName =
            record.profiles?.full_name || record.member_name || '';
          const memberEmail =
            record.profiles?.email || record.member_email || '';
          return (
            memberName.toLowerCase().includes(searchTerm) ||
            memberEmail.toLowerCase().includes(searchTerm) ||
            record.notes?.toLowerCase().includes(searchTerm)
          );
        });
      }

      setRecords(filteredData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records');
      console.error('Error loading khairat records:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load khairat settings (requires mosque selection)
  const loadSettings = useCallback(async (mosqueId?: string) => {
    if (!mosqueId) return;

    try {
      const data = await khairatService.getKhairatSettings(mosqueId);
      setSettings(data);
    } catch (err) {
      console.error('Error loading khairat settings:', err);
    }
  }, []);

  // Load khairat statistics
  const loadStats = useCallback(
    async (filters?: { startDate?: string; endDate?: string }) => {
      try {
        // Load stats from all accessible mosques
        const data = await khairatService.getKhairatStatistics(
          undefined,
          filters
        );
        setStats(data);
      } catch (err) {
        console.error('Error loading khairat statistics:', err);
      }
    },
    []
  );

  // Create new khairat record
  const createRecord = async (
    recordData: Omit<
      TablesInsert<'khairat_records'>,
      'mosque_id' | 'submitted_by'
    >,
    selectedMosqueId: string // Now required since we don't have default mosque_id
  ) => {
    if (!selectedMosqueId || !profile?.id) {
      throw new Error('Missing mosque ID or user profile');
    }

    try {
      const newRecord = await khairatService.createKhairatRecord({
        ...recordData,
        mosque_id: selectedMosqueId,
        submitted_by: profile.id,
      });

      // Refresh records after creation
      await loadRecords();
      await loadStats();

      return newRecord;
    } catch (err) {
      const error =
        err instanceof Error ? err.message : 'Failed to create record';
      setError(error);
      throw new Error(error);
    }
  };

  // Update khairat record
  const updateRecord = async (
    recordId: string,
    updates: TablesUpdate<'khairat_records'>
  ) => {
    try {
      const updatedRecord = await khairatService.updateKhairatRecord(
        recordId,
        updates
      );

      // Refresh records
      await loadRecords();
      await loadStats();

      return updatedRecord;
    } catch (err) {
      const error =
        err instanceof Error ? err.message : 'Failed to update record';
      setError(error);
      throw new Error(error);
    }
  };

  // Delete khairat record
  const deleteRecord = async (recordId: string) => {
    try {
      await khairatService.deleteKhairatRecord(recordId);

      // Refresh records
      await loadRecords();
      await loadStats();

      return true;
    } catch (err) {
      const error =
        err instanceof Error ? err.message : 'Failed to delete record';
      setError(error);
      throw new Error(error);
    }
  };

  // Approve khairat record
  const approveRecord = async (
    recordId: string,
    approvalData?: {
      receiptNumber?: string;
      notes?: string;
    }
  ) => {
    try {
      const updatedRecord = await khairatService.approveKhairatRecord(
        recordId,
        approvalData
      );

      // Refresh records
      await loadRecords();
      await loadStats();

      return updatedRecord;
    } catch (err) {
      const error =
        err instanceof Error ? err.message : 'Failed to approve record';
      setError(error);
      throw new Error(error);
    }
  };

  // Reject khairat record
  const rejectRecord = async (recordId: string, rejectionReason: string) => {
    try {
      const updatedRecord = await khairatService.rejectKhairatRecord(
        recordId,
        rejectionReason
      );

      // Refresh records
      await loadRecords();
      await loadStats();

      return updatedRecord;
    } catch (err) {
      const error =
        err instanceof Error ? err.message : 'Failed to reject record';
      setError(error);
      throw new Error(error);
    }
  };

  // Mark record as paid
  const markAsPaid = async (
    recordId: string,
    paymentData?: {
      receiptNumber?: string;
      notes?: string;
    }
  ) => {
    try {
      const updatedRecord = await khairatService.markKhairatRecordAsPaid(
        recordId,
        paymentData
      );

      // Refresh records
      await loadRecords();
      await loadStats();

      return updatedRecord;
    } catch (err) {
      const error =
        err instanceof Error ? err.message : 'Failed to mark as paid';
      setError(error);
      throw new Error(error);
    }
  };

  // Upload receipt file
  const uploadReceipt = async (file: File, recordId: string) => {
    try {
      const fileData = await khairatService.uploadReceiptFile(file, recordId);

      // Update record with file information
      await updateRecord(recordId, {
        receipt_file_url: fileData.url,
        receipt_file_name: fileData.fileName,
      });

      return fileData;
    } catch (err) {
      const error =
        err instanceof Error ? err.message : 'Failed to upload receipt';
      setError(error);
      throw new Error(error);
    }
  };

  // Export records
  const exportRecords = async (filters?: KhairatFilters) => {
    try {
      const csvContent = await khairatService.exportKhairatRecords(
        undefined,
        filters
      );

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `khairat-records-${
        new Date().toISOString().split('T')[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const error =
        err instanceof Error ? err.message : 'Failed to export records';
      setError(error);
      throw new Error(error);
    }
  };

  // Update settings (requires mosque selection)
  const updateSettings = async (
    mosqueId: string,
    settingsData: TablesUpdate<'khairat_settings'>
  ) => {
    if (!mosqueId) {
      throw new Error('Mosque ID is required to update settings');
    }

    try {
      const updatedSettings = await khairatService.updateKhairatSettings(
        mosqueId,
        settingsData
      );
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      const error =
        err instanceof Error ? err.message : 'Failed to update settings';
      setError(error);
      throw new Error(error);
    }
  };

  // Get user's own records
  const getUserRecords = () => {
    if (!profile?.id) return [];
    return records.filter((record) => record.profile_id === profile.id);
  };

  // Check if user can manage records
  const canManageRecords = () => {
    return (
      profile?.role === 'super_admin' ||
      profile?.role === 'mosque_admin' ||
      profile?.role === 'ajk'
    );
  }; // Initialize data
  useEffect(() => {
    // Load mosques and records for all users
    loadMosques();
    loadRecords();
    loadStats();

    // Settings are loaded on-demand when a specific mosque is selected
  }, [loadRecords, loadStats, loadMosques]);

  return {
    records,
    settings,
    stats,
    loading,
    error,
    mosques,
    userRecords: getUserRecords(),
    canManageRecords: canManageRecords(),
    // Actions
    loadRecords,
    loadSettings,
    loadStats,
    loadMosques,
    createRecord,
    updateRecord,
    deleteRecord,
    approveRecord,
    rejectRecord,
    markAsPaid,
    uploadReceipt,
    exportRecords,
    updateSettings,
    // Utilities
    clearError: () => setError(null),
  };
}

export default useKhairat;
