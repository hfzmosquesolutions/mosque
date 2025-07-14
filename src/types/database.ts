export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          updated_at: string | null;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          email: string | null;
          phone: string | null;
          role: 'super_admin' | 'mosque_admin' | 'ajk' | 'member';
          mosque_id: string | null;
          permissions: string[] | null;
          created_at: string;
        };
        Insert: {
          id: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: 'super_admin' | 'mosque_admin' | 'ajk' | 'member';
          mosque_id?: string | null;
          permissions?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: 'super_admin' | 'mosque_admin' | 'ajk' | 'member';
          mosque_id?: string | null;
          permissions?: string[] | null;
          created_at?: string;
        };
      };
      mosques: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          postcode: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          capacity: number | null;
          facilities: string[] | null;
          imam: string | null;
          chairman: string | null;
          established_date: string | null;
          services: string[] | null;
          operating_hours: Record<string, any> | null;
          registration_number: string | null;
          bank_account: string | null;
          created_at: string;
          updated_at: string | null;
          created_by: string | null;
          profile_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          postcode?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          capacity?: number | null;
          facilities?: string[] | null;
          imam?: string | null;
          chairman?: string | null;
          established_date?: string | null;
          services?: string[] | null;
          operating_hours?: Record<string, any> | null;
          registration_number?: string | null;
          bank_account?: string | null;
          created_at?: string;
          updated_at?: string | null;
          created_by?: string | null;
          profile_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          postcode?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          capacity?: number | null;
          facilities?: string[] | null;
          imam?: string | null;
          chairman?: string | null;
          established_date?: string | null;
          services?: string[] | null;
          operating_hours?: Record<string, any> | null;
          registration_number?: string | null;
          bank_account?: string | null;
          created_at?: string;
          updated_at?: string | null;
          created_by?: string | null;
          profile_id?: string | null;
        };
      };
      members: {
        Row: {
          id: string;
          mosque_id: string;
          user_id: string;
          membership_type: 'regular' | 'ajk' | 'committee';
          joined_date: string;
          status: 'active' | 'inactive' | 'suspended';
          notes: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          mosque_id: string;
          user_id: string;
          membership_type?: 'regular' | 'ajk' | 'committee';
          joined_date?: string;
          status?: 'active' | 'inactive' | 'suspended';
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          mosque_id?: string;
          user_id?: string;
          membership_type?: 'regular' | 'ajk' | 'committee';
          joined_date?: string;
          status?: 'active' | 'inactive' | 'suspended';
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      khairat_records: {
        Row: {
          id: string;
          mosque_id: string;
          profile_id: string;
          member_name: string;
          member_phone: string | null;
          member_email: string | null;
          contribution_amount: number;
          payment_method: 'cash' | 'bank_transfer' | 'cheque';
          payment_date: string;
          bank_reference: string | null;
          cheque_number: string | null;
          status: 'pending' | 'approved' | 'paid' | 'rejected';
          notes: string | null;
          receipt_number: string | null;
          receipt_file_url: string | null;
          receipt_file_name: string | null;
          submitted_by: string;
          submitted_date: string;
          approved_by: string | null;
          approved_date: string | null;
          paid_by: string | null;
          paid_date: string | null;
          rejected_by: string | null;
          rejected_date: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mosque_id: string;
          profile_id: string;
          member_name: string;
          member_phone?: string | null;
          member_email?: string | null;
          contribution_amount: number;
          payment_method: 'cash' | 'bank_transfer' | 'cheque';
          payment_date: string;
          bank_reference?: string | null;
          cheque_number?: string | null;
          status?: 'pending' | 'approved' | 'paid' | 'rejected';
          notes?: string | null;
          receipt_number?: string | null;
          receipt_file_url?: string | null;
          receipt_file_name?: string | null;
          submitted_by: string;
          submitted_date?: string;
          approved_by?: string | null;
          approved_date?: string | null;
          paid_by?: string | null;
          paid_date?: string | null;
          rejected_by?: string | null;
          rejected_date?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mosque_id?: string;
          profile_id?: string;
          member_name?: string;
          member_phone?: string | null;
          member_email?: string | null;
          contribution_amount?: number;
          payment_method?: 'cash' | 'bank_transfer' | 'cheque';
          payment_date?: string;
          bank_reference?: string | null;
          cheque_number?: string | null;
          status?: 'pending' | 'approved' | 'paid' | 'rejected';
          notes?: string | null;
          receipt_number?: string | null;
          receipt_file_url?: string | null;
          receipt_file_name?: string | null;
          submitted_by?: string;
          submitted_date?: string;
          approved_by?: string | null;
          approved_date?: string | null;
          paid_by?: string | null;
          paid_date?: string | null;
          rejected_by?: string | null;
          rejected_date?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      khairat_transactions: {
        Row: {
          id: string;
          khairat_record_id: string;
          mosque_id: string;
          transaction_type: string;
          amount: number;
          reference_number: string | null;
          description: string | null;
          performed_by: string;
          performed_at: string;
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          khairat_record_id: string;
          mosque_id: string;
          transaction_type: string;
          amount?: number;
          reference_number?: string | null;
          description?: string | null;
          performed_by: string;
          performed_at?: string;
          metadata?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          khairat_record_id?: string;
          mosque_id?: string;
          transaction_type?: string;
          amount?: number;
          reference_number?: string | null;
          description?: string | null;
          performed_by?: string;
          performed_at?: string;
          metadata?: Record<string, any>;
          created_at?: string;
        };
      };
      khairat_settings: {
        Row: {
          id: string;
          mosque_id: string;
          default_contribution_amount: number;
          minimum_contribution_amount: number;
          maximum_contribution_amount: number | null;
          receipt_prefix: string;
          auto_generate_receipt_number: boolean;
          require_receipt_upload: boolean;
          allowed_payment_methods: ('cash' | 'bank_transfer' | 'cheque')[];
          require_approval: boolean;
          auto_approve_cash_payments: boolean;
          auto_approve_amount_limit: number;
          bank_name: string | null;
          bank_account_number: string | null;
          bank_account_holder: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mosque_id: string;
          default_contribution_amount?: number;
          minimum_contribution_amount?: number;
          maximum_contribution_amount?: number | null;
          receipt_prefix?: string;
          auto_generate_receipt_number?: boolean;
          require_receipt_upload?: boolean;
          allowed_payment_methods?: ('cash' | 'bank_transfer' | 'cheque')[];
          require_approval?: boolean;
          auto_approve_cash_payments?: boolean;
          auto_approve_amount_limit?: number;
          bank_name?: string | null;
          bank_account_number?: string | null;
          bank_account_holder?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mosque_id?: string;
          default_contribution_amount?: number;
          minimum_contribution_amount?: number;
          maximum_contribution_amount?: number | null;
          receipt_prefix?: string;
          auto_generate_receipt_number?: boolean;
          require_receipt_upload?: boolean;
          allowed_payment_methods?: ('cash' | 'bank_transfer' | 'cheque')[];
          require_approval?: boolean;
          auto_approve_cash_payments?: boolean;
          auto_approve_amount_limit?: number;
          bank_name?: string | null;
          bank_account_number?: string | null;
          bank_account_holder?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'super_admin' | 'mosque_admin' | 'ajk' | 'member';
      membership_type: 'regular' | 'ajk' | 'committee';
      membership_status: 'active' | 'inactive' | 'suspended';
      khairat_payment_method: 'cash' | 'bank_transfer' | 'cheque';
      khairat_status: 'pending' | 'approved' | 'paid' | 'rejected';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Type aliases for convenience
export type Profile = Tables<'profiles'>;
export type Mosque = Tables<'mosques'>;
export type Member = Tables<'members'>;
export type KhairatRecord = Tables<'khairat_records'>;
export type KhairatTransaction = Tables<'khairat_transactions'>;
export type KhairatSettings = Tables<'khairat_settings'>;

// Extended types with joined data
export type KhairatRecordWithProfile = KhairatRecord & {
  profiles?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
};

export type UserRole = Database['public']['Enums']['user_role'];
export type MembershipType = Database['public']['Enums']['membership_type'];
export type MembershipStatus = Database['public']['Enums']['membership_status'];
export type KhairatPaymentMethod =
  Database['public']['Enums']['khairat_payment_method'];
export type KhairatStatus = Database['public']['Enums']['khairat_status'];
