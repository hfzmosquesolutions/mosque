import { supabase } from '@/lib/supabase';
import {
  KhairatRecord,
  KhairatRecordWithProfile,
  KhairatTransaction,
  KhairatSettings,
  TablesInsert,
  TablesUpdate,
} from '@/types/database';

export class KhairatService {
  private supabase;

  constructor() {
    this.supabase = supabase;
  }

  // Get all khairat records for a mosque or all accessible mosques
  async getKhairatRecords(
    mosqueId?: string,
    filters?: {
      status?: string;
      paymentMethod?: string;
      memberId?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    try {
      let query = this.supabase
        .from('khairat_records')
        .select(
          `
          *,
          profiles!khairat_records_profile_id_fkey(full_name, email, phone)
        `
        )
        .order('created_at', { ascending: false });

      // If mosqueId is provided, filter by it
      if (mosqueId) {
        query = query.eq('mosque_id', mosqueId);
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
        query = query.eq('payment_method', filters.paymentMethod);
      }

      if (filters?.memberId) {
        query = query.eq('profile_id', filters.memberId);
      }

      if (filters?.startDate) {
        query = query.gte('payment_date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('payment_date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching khairat records:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getKhairatRecords:', error);
      throw error;
    }
  }

  // Get single khairat record
  async getKhairatRecord(recordId: string) {
    try {
      const { data, error } = await this.supabase
        .from('khairat_records')
        .select(
          `
          *,
          profiles!khairat_records_profile_id_fkey(full_name, email, phone)
        `
        )
        .eq('id', recordId)
        .single();

      if (error) {
        console.error('Error fetching khairat record:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getKhairatRecord:', error);
      throw error;
    }
  }

  // Create new khairat record
  async createKhairatRecord(recordData: TablesInsert<'khairat_records'>) {
    try {
      const { data, error } = await this.supabase
        .from('khairat_records')
        .insert([recordData])
        .select()
        .single();

      if (error) {
        console.error('Error creating khairat record:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createKhairatRecord:', error);
      throw error;
    }
  }

  // Update khairat record
  async updateKhairatRecord(
    recordId: string,
    updates: TablesUpdate<'khairat_records'>
  ) {
    try {
      const { data, error } = await this.supabase
        .from('khairat_records')
        .update(updates)
        .eq('id', recordId)
        .select()
        .single();

      if (error) {
        console.error('Error updating khairat record:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateKhairatRecord:', error);
      throw error;
    }
  }

  // Delete khairat record
  async deleteKhairatRecord(recordId: string) {
    try {
      const { error } = await this.supabase
        .from('khairat_records')
        .delete()
        .eq('id', recordId);

      if (error) {
        console.error('Error deleting khairat record:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteKhairatRecord:', error);
      throw error;
    }
  }

  // Get khairat transactions
  async getKhairatTransactions(recordId: string) {
    try {
      const { data, error } = await this.supabase
        .from('khairat_transactions')
        .select(
          `
          *,
          performed_by_profile:profiles!performed_by(full_name, email)
        `
        )
        .eq('khairat_record_id', recordId)
        .order('performed_at', { ascending: false });

      if (error) {
        console.error('Error fetching khairat transactions:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getKhairatTransactions:', error);
      throw error;
    }
  }

  // Get khairat settings
  async getKhairatSettings(mosqueId: string) {
    try {
      const { data, error } = await this.supabase
        .from('khairat_settings')
        .select('*')
        .eq('mosque_id', mosqueId)
        .single();

      if (error) {
        console.error('Error fetching khairat settings:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getKhairatSettings:', error);
      throw error;
    }
  }

  // Update khairat settings
  async updateKhairatSettings(
    mosqueId: string,
    settings: TablesUpdate<'khairat_settings'>
  ) {
    try {
      const { data, error } = await this.supabase
        .from('khairat_settings')
        .upsert({
          mosque_id: mosqueId,
          ...settings,
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating khairat settings:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateKhairatSettings:', error);
      throw error;
    }
  }

  // Upload receipt file
  async uploadReceiptFile(file: File, recordId: string) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${recordId}-${Date.now()}.${fileExt}`;
      const filePath = `khairat-receipts/${fileName}`;

      const { data, error } = await this.supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (error) {
        console.error('Error uploading receipt file:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        fileName: fileName,
        filePath: filePath,
      };
    } catch (error) {
      console.error('Error in uploadReceiptFile:', error);
      throw error;
    }
  }

  // Delete receipt file
  async deleteReceiptFile(filePath: string) {
    try {
      const { error } = await this.supabase.storage
        .from('documents')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting receipt file:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteReceiptFile:', error);
      throw error;
    }
  }

  // Get khairat statistics
  async getKhairatStatistics(
    mosqueId?: string,
    filters?: {
      startDate?: string;
      endDate?: string;
    }
  ) {
    try {
      let query = this.supabase.from('khairat_records').select('*');

      // If mosqueId is provided, filter by it
      if (mosqueId) {
        query = query.eq('mosque_id', mosqueId);
      }

      if (filters?.startDate) {
        query = query.gte('payment_date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('payment_date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching khairat statistics:', error);
        throw error;
      }

      const stats = {
        totalRecords: data.length,
        totalAmount: data.reduce(
          (sum: number, record: KhairatRecord) =>
            sum + record.contribution_amount,
          0
        ),
        pendingRecords: data.filter(
          (record: KhairatRecord) => record.status === 'pending'
        ).length,
        approvedRecords: data.filter(
          (record: KhairatRecord) => record.status === 'approved'
        ).length,
        paidRecords: data.filter(
          (record: KhairatRecord) => record.status === 'paid'
        ).length,
        rejectedRecords: data.filter(
          (record: KhairatRecord) => record.status === 'rejected'
        ).length,
        cashPayments: data.filter(
          (record: KhairatRecord) => record.payment_method === 'cash'
        ).length,
        bankTransfers: data.filter(
          (record: KhairatRecord) => record.payment_method === 'bank_transfer'
        ).length,
        chequePayments: data.filter(
          (record: KhairatRecord) => record.payment_method === 'cheque'
        ).length,
        averageContribution:
          data.length > 0
            ? data.reduce(
                (sum: number, record: KhairatRecord) =>
                  sum + record.contribution_amount,
                0
              ) / data.length
            : 0,
      };

      return stats;
    } catch (error) {
      console.error('Error in getKhairatStatistics:', error);
      throw error;
    }
  }

  // Approve khairat record
  async approveKhairatRecord(
    recordId: string,
    approvalData?: {
      receiptNumber?: string;
      notes?: string;
    }
  ) {
    try {
      const updates: TablesUpdate<'khairat_records'> = {
        status: 'approved',
        ...approvalData,
      };

      const { data, error } = await this.supabase
        .from('khairat_records')
        .update(updates)
        .eq('id', recordId)
        .select()
        .single();

      if (error) {
        console.error('Error approving khairat record:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in approveKhairatRecord:', error);
      throw error;
    }
  }

  // Reject khairat record
  async rejectKhairatRecord(recordId: string, rejectionReason: string) {
    try {
      const updates: TablesUpdate<'khairat_records'> = {
        status: 'rejected',
        rejection_reason: rejectionReason,
      };

      const { data, error } = await this.supabase
        .from('khairat_records')
        .update(updates)
        .eq('id', recordId)
        .select()
        .single();

      if (error) {
        console.error('Error rejecting khairat record:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in rejectKhairatRecord:', error);
      throw error;
    }
  }

  // Mark khairat record as paid
  async markKhairatRecordAsPaid(
    recordId: string,
    paymentData?: {
      receiptNumber?: string;
      notes?: string;
    }
  ) {
    try {
      const updates: TablesUpdate<'khairat_records'> = {
        status: 'paid',
        ...paymentData,
      };

      const { data, error } = await this.supabase
        .from('khairat_records')
        .update(updates)
        .eq('id', recordId)
        .select()
        .single();

      if (error) {
        console.error('Error marking khairat record as paid:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in markKhairatRecordAsPaid:', error);
      throw error;
    }
  }

  // Export khairat records
  async exportKhairatRecords(
    mosqueId?: string,
    filters?: {
      status?: string;
      paymentMethod?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    try {
      const records = await this.getKhairatRecords(mosqueId, filters);

      // Convert to CSV format
      const csvHeaders = [
        'ID',
        'Member Name',
        'Member Phone',
        'Member Email',
        'Contribution Amount',
        'Payment Method',
        'Payment Date',
        'Status',
        'Bank Reference',
        'Cheque Number',
        'Receipt Number',
        'Notes',
        'Submitted Date',
        'Submitted By',
        'Approved Date',
        'Approved By',
        'Paid Date',
        'Paid By',
      ];

      const csvRows = records.map((record: any) => [
        record.id,
        record.profiles?.full_name || record.member_name,
        record.profiles?.phone || record.member_phone || '',
        record.profiles?.email || record.member_email || '',
        record.contribution_amount,
        record.payment_method,
        record.payment_date,
        record.status,
        record.bank_reference || '',
        record.cheque_number || '',
        record.receipt_number || '',
        record.notes || '',
        record.submitted_date,
        '',
        record.approved_date || '',
        '',
        record.paid_date || '',
        '',
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map((row: any[]) => row.map((field: any) => `"${field}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error in exportKhairatRecords:', error);
      throw error;
    }
  }
}

export const khairatService = new KhairatService();
