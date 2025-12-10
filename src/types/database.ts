// Database Types for Mosque Management System
// These types correspond to the Supabase database schema

// =============================================
// ENUMS
// =============================================

export type UserAccountType = 'member' | 'admin';
export type MembershipType = 'regular' | 'family' | 'student' | 'senior';
export type UserRole = 'admin' | 'imam' | 'board_member' | 'volunteer_coordinator' | 'treasurer' | 'secretary' | 'moderator' | 'member';
export type UserStatus = 'active' | 'inactive' | 'pending';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type DonationStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type ContributionStatus = 'pending' | 'completed' | 'cancelled' | 'failed';
// Legacy alias for backward compatibility
export type KhairatStatus = ContributionStatus;

export type ResourceType = 'article' | 'video' | 'audio' | 'document' | 'link';
export type NotificationType = 'info' | 'warning' | 'success' | 'error';
export type NotificationCategory = 
  | 'kariah_application' 
  | 'contribution' 
  | 'donation' 
  | 'event' 
  | 'announcement' 
  | 'system' 
  | 'membership' 
  | 'payment';

// =============================================
// CORE INTERFACES
// =============================================

export interface Mosque {
  id: string;
  name: string;
  address?: string; // Legacy field for backward compatibility
  address_line1?: string; // Primary address line
  address_line2?: string; // Secondary address line
  city?: string; // City name
  state?: string; // State or federal territory
  postcode?: string; // Postal code
  country?: string; // Country (defaults to Malaysia)
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  logo_url?: string | null; // URL to the mosque logo image
  banner_url?: string | null; // URL to the mosque banner image
  user_id: string; // References auth.users(id) - mosque owner/creator
  settings?: Record<string, unknown>; // JSON object for mosque-specific settings
  is_private: boolean; // Whether the mosque profile is private
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string; // References auth.users(id)
  full_name: string;
  username?: string; // Public username for profile URL
  phone?: string;
  address?: string;
  ic_passport_number?: string; // Identity Card or Passport number
  account_type: UserAccountType;
  membership_type?: MembershipType;
  role: UserRole;
  status: UserStatus;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  date_of_birth?: string;
  gender?: string;
  occupation?: string;
  onboarding_completed: boolean;
  onboarding_completed_at?: string;
  profile_picture_url?: string;
  preferences?: Record<string, unknown>; // JSON object for user preferences
  is_profile_private: boolean; // Whether the user profile is private
  created_at: string;
  updated_at: string;
}


export interface UserDependent {
  id: string;
  user_id: string;
  full_name: string;
  relationship: string; // e.g., 'spouse', 'child', 'parent', 'sibling'
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}


// =============================================
// EVENTS MODULE
// =============================================

export interface Event {
  id: string;
  mosque_id: string;
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  location?: string;
  max_attendees?: number;
  registration_required: boolean;
  registration_deadline?: string;
  status: EventStatus;
  category?: string; // e.g., 'religious', 'educational', 'community'
  image_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  attended: boolean;
  notes?: string;
}

// =============================================
// DONATIONS MODULE
// =============================================

export interface DonationCategory {
  id: string;
  mosque_id: string;
  name: string;
  description?: string;
  target_amount?: number;
  is_active: boolean;
  created_at: string;
}

export interface Donation {
  id: string;
  mosque_id: string;
  donor_id?: string;
  donor_name?: string; // For anonymous or guest donations
  donor_email?: string;
  donor_phone?: string;
  category_id?: string;
  amount: number;
  currency: string;
  payment_method?: string; // e.g., 'card', 'bank_transfer', 'cash'
  payment_reference?: string;
  status: DonationStatus;
  is_anonymous: boolean;
  is_recurring: boolean;
  recurring_frequency?: string; // 'monthly', 'yearly', etc.
  notes?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// KHAIRAT (WELFARE) MODULE - Simplified Structure
// =============================================

// Khairat is now mosque-specific, no more programs
export interface KhairatContribution {
  id: string;
  mosque_id: string;
  contributor_id?: string;
  contributor_name?: string;
  amount: number;
  payment_method?: string;
  payment_reference?: string;
  status: ContributionStatus;
  notes?: string;
  contributed_at: string;
  payment_data?: PaymentData;
  created_at?: string;
  updated_at?: string;
  bill_id?: string | null;
}

// Minimal legacy KhairatProgram interface (for backward compatibility)
export interface KhairatProgram {
  id: string;
  name: string;
  description?: string;
  target_amount?: number;
  current_amount?: number;
  mosque_id?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Mosque khairat settings (stored in mosques.settings jsonb)
export interface MosqueKhairatSettings {
  enabled: boolean;
  fixed_price?: number;
  description?: string;
  payment_methods?: string[];
  target_amount?: number;
  start_date?: string;
  end_date?: string;
}

export interface KhairatMember {
  id: string;
  user_id?: string | null; // Optional - can be NULL for members without accounts
  mosque_id: string;
  ic_passport_number?: string;
  application_reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review' | 'withdrawn' | 'active' | 'inactive' | 'suspended';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  joined_date?: string;
  membership_number?: string;
  notes?: string;
  // Direct member data (used when user_id is NULL)
  full_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    phone?: string;
  } | null;
  mosque?: {
    id: string;
    name: string;
  };
}

// Legacy interfaces for backward compatibility (deprecated)
export interface KhairatApplication extends Omit<KhairatMember, 'joined_date' | 'notes'> {
  status: 'pending' | 'approved' | 'rejected' | 'under_review' | 'withdrawn';
}

export interface KhairatMembership extends Omit<KhairatMember, 'ic_passport_number' | 'application_reason' | 'admin_notes' | 'reviewed_by' | 'reviewed_at'> {
  status: 'active' | 'inactive' | 'suspended';
}





// =============================================
// RESOURCES MODULE
// =============================================

export interface ResourceCategory {
  id: string;
  mosque_id: string;
  name: string;
  description?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Resource {
  id: string;
  mosque_id: string;
  category_id?: string;
  title: string;
  description?: string;
  content?: string;
  file_url?: string;
  external_url?: string;
  resource_type?: ResourceType;
  language: string;
  tags?: string[]; // Array of tags for searching
  is_featured: boolean;
  is_published: boolean;
  view_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// SYSTEM INTERFACES
// =============================================

export interface AuditLog {
  id: string;
  user_id?: string;
  mosque_id?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  mosque_id?: string;
  title: string;
  message: string;
  type: NotificationType;
  category?: NotificationCategory;
  is_read: boolean;
  action_url?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  read_at?: string;
}

export interface SystemSetting {
  id: string;
  mosque_id?: string;
  key: string;
  value: Record<string, unknown>;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================
// EXTENDED INTERFACES WITH RELATIONS
// =============================================

// User profile with mosque information
export interface UserProfileWithMosque extends UserProfile {
  mosque?: Mosque;
}

// Event with creator and registration info
export interface EventWithDetails extends Event {
  creator?: UserProfile;
  registrations?: EventRegistration[];
  registration_count?: number;
  user_registered?: boolean;
}

// Donation with category and donor info
export interface DonationWithDetails extends Donation {
  category?: DonationCategory;
  donor?: UserProfile;
}

// Contribution program with contributions
export interface KhairatProgramWithContributions extends KhairatProgram {
  contributions?: KhairatContribution[];
  contribution_count?: number;
  progress_percentage?: number;
}

// Legacy alias for backward compatibility
export interface KhairatProgramWithContributions extends KhairatProgram {
  contributions?: KhairatContribution[];
  contribution_count?: number;
  progress_percentage?: number;
}

// Resource with category info
export interface ResourceWithCategory extends Resource {
  category?: ResourceCategory;
  creator?: UserProfile;
}



// =============================================
// API RESPONSE TYPES
// =============================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// =============================================
// FORM DATA TYPES
// =============================================

// Import AddressData from address form component
export interface AddressData {
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  full_address?: string; // For backward compatibility
}

// Onboarding form data (matches existing interface)
export interface OnboardingData {
  fullName: string;
  phone: string;
  address: string;
  icPassportNumber: string;
  accountType: UserAccountType | '';
  mosqueName?: string;
  mosqueAddress?: string;
  mosqueAddressData?: AddressData;
}

// Event creation/update form
export interface EventFormData {
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  location?: string;
  max_attendees?: number;
  registration_required: boolean;
  registration_deadline?: string;
  category?: string;
  image_url?: string;
}

// Donation form data
export interface DonationFormData {
  amount: number;
  category_id?: string;
  donor_name?: string;
  donor_email?: string;
  donor_phone?: string;
  payment_method?: string;
  is_anonymous: boolean;
  is_recurring: boolean;
  recurring_frequency?: string;
  notes?: string;
}

// Khairat contribution form data
export interface KhairatContributionFormData {
  program_id: string;
  amount: number;
  contributor_name?: string;
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
}

// Legacy alias for backward compatibility
export type ContributionFormData = KhairatContributionFormData;



// Resource form data
export interface ResourceFormData {
  title: string;
  description?: string;
  content?: string;
  category_id?: string;
  resource_type?: ResourceType;
  file_url?: string;
  external_url?: string;
  language: string;
  tags?: string[];
  is_featured: boolean;
}

// =============================================
// DASHBOARD STATISTICS
// =============================================

export interface DashboardStats {
  total_members: number;
  active_members: number;
  total_events: number;
  upcoming_events: number;
  total_donations: number;
  monthly_donations: number;
  // Enhanced donation metrics
  total_donation_amount: number;
  monthly_donation_amount: number;
  previous_month_donation_amount: number;
  donation_trend_percentage: number;
  // Contribution program metrics
  total_contribution_programs: number;
  active_contribution_programs: number;
  khairat_programs_progress: Array<{
    id: string;
    name: string;
    current_amount: number;
    target_amount: number;
    progress_percentage: number;
  }>;
  // Legacy aliases
  total_khairat_programs: number;
  active_khairat_programs: number;
  // Activity and notification metrics
  unread_notifications: number;
  recent_activities: AuditLog[];
  recent_activity_count: number;
  // Mosque profile metrics
  mosque_profile_completion: {
    percentage: number;
    missing_fields: string[];
  };
  // Additional metrics
  monthly_khairat_contributions: number;
  total_khairat_amount: number;
}

// =============================================
// SEARCH AND FILTER TYPES
// =============================================

export interface SearchFilters {
  query?: string;
  status?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MemberFilters extends SearchFilters {
  account_type?: UserAccountType;
  membership_type?: MembershipType;
  role?: UserRole;
  status?: UserStatus;
}

export interface EventFilters extends SearchFilters {
  status?: EventStatus;
  category?: string;
  registration_required?: boolean;
}

export interface DonationFilters extends SearchFilters {
  status?: DonationStatus;
  category_id?: string;
  amount_min?: number;
  amount_max?: number;
  is_recurring?: boolean;
}

// =============================================
// UTILITY TYPES
// =============================================

// For creating new records (without id, timestamps)
export type CreateMosque = Omit<Mosque, 'id' | 'created_at' | 'updated_at'>;
export type CreateEvent = Omit<Event, 'id' | 'created_at' | 'updated_at'>;
export type CreateDonation = Omit<Donation, 'id' | 'created_at' | 'updated_at'>;
export type CreateResource = Omit<Resource, 'id' | 'created_at' | 'updated_at' | 'view_count'>;
export type CreateUserDependent = Omit<UserDependent, 'id' | 'created_at' | 'updated_at'>;

// For updating records (partial, without id, timestamps)
export type UpdateMosque = Partial<Omit<Mosque, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateUserProfile = Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateEvent = Partial<Omit<Event, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateDonation = Partial<Omit<Donation, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateResource = Partial<Omit<Resource, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateUserDependent = Partial<Omit<UserDependent, 'id' | 'created_at' | 'updated_at'>>;

// Database table names (useful for generic functions)
export type TableName = 
  | 'mosques'
  | 'user_profiles'
  | 'events'
  | 'event_registrations'
  | 'donation_categories'
  | 'donations'
  | 'khairat_programs'
  | 'khairat_contributions'
  | 'khairat_applications'
  | 'khairat_memberships'
  | 'khairat_claims'
  | 'khairat_claim_documents'
  | 'resource_categories'
  | 'resources'
  | 'audit_logs'
  | 'notifications'
  | 'system_settings'
  | 'user_dependents';

// Generic database record type
export type DatabaseRecord = {
  id: string;
  created_at: string;
  updated_at?: string;
};

// =============================================
// SUPABASE SPECIFIC TYPES
// =============================================

// For Supabase client typing
export interface Database {
  public: {
    Tables: {
      mosques: {
        Row: Mosque;
        Insert: CreateMosque;
        Update: UpdateMosque;
      };
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>;
        Update: UpdateUserProfile;
      };
      events: {
        Row: Event;
        Insert: CreateEvent;
        Update: UpdateEvent;
      };
      donations: {
        Row: Donation;
        Insert: CreateDonation;
        Update: UpdateDonation;
      };

      khairat_programs: {
        Row: KhairatProgram;
        Insert: Omit<KhairatProgram, 'id' | 'created_at' | 'updated_at' | 'current_amount'>;
        Update: Partial<Omit<KhairatProgram, 'id' | 'created_at' | 'updated_at'>>;
      };

      khairat_contributions: {
        Row: KhairatContribution;
        Insert: Omit<KhairatContribution, 'id' | 'created_at' | 'updated_at' | 'bill_id'> & { bill_id?: string | null };
        Update: Partial<Omit<KhairatContribution, 'id' | 'created_at' | 'updated_at'>>;
      };

      khairat_applications: {
        Row: KhairatApplication;
        Insert: Omit<KhairatApplication, 'id' | 'created_at' | 'updated_at' | 'user' | 'mosque' | 'program'>;
        Update: Partial<Omit<KhairatApplication, 'id' | 'created_at' | 'updated_at' | 'user' | 'mosque' | 'program'>>;
      };

      khairat_memberships: {
        Row: KhairatMembership;
        Insert: Omit<KhairatMembership, 'id' | 'created_at' | 'updated_at' | 'user' | 'mosque' | 'program'>;
        Update: Partial<Omit<KhairatMembership, 'id' | 'created_at' | 'updated_at' | 'user' | 'mosque' | 'program'>>;
      };

      resources: {
        Row: Resource;
        Insert: CreateResource;
        Update: UpdateResource;
      };
      user_dependents: {
        Row: UserDependent;
        Insert: CreateUserDependent;
        Update: UpdateUserDependent;
      };
      khairat_claims: {
        Row: KhairatClaim;
        Insert: CreateKhairatClaim;
        Update: UpdateKhairatClaim;
      };
      khairat_claim_documents: {
        Row: ClaimDocument;
        Insert: Omit<ClaimDocument, 'id' | 'created_at'>;
        Update: never; // Documents are insert/delete only
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_account_type: UserAccountType;
      membership_type: MembershipType;
      user_role: UserRole;
      user_status: UserStatus;
      event_status: EventStatus;
      donation_status: DonationStatus;
      contribution_status: ContributionStatus;
      khairat_status: KhairatStatus; // Legacy alias
      claim_status: ClaimStatus;
      claim_priority: ClaimPriority;
    };
  };
}
export type ProgramType =
  | 'khairat'
  | 'zakat'
  | 'infaq'
  | 'sadaqah'
  | 'general'
  | 'education'
  | 'maintenance';

// =============================================
// PAYMENT DATA TYPES
// =============================================

// Base payment data interface
export interface BasePaymentData {
  provider: string;
  paid_at?: string;
  transaction_id?: string;
  transaction_status?: string;
}

// Billplz specific payment data
export interface BillplzPaymentData extends BasePaymentData {
  provider: 'billplz';
  billplz_id: string;
  paid_amount?: number;
  collection_id?: string;
  state?: string;
  due_at?: string;
  mobile?: string;
  email?: string;
}

// Stripe specific payment data
export interface StripePaymentData extends BasePaymentData {
  provider: 'stripe';
  payment_intent_id: string;
  charge_id?: string;
  transaction_fee?: number;
  net_amount?: number;
  currency?: string;
  payment_method_type?: string;
  last4?: string;
  brand?: string;
}

// ToyyibPay specific payment data
export interface ToyyibPayPaymentData extends BasePaymentData {
  provider: 'toyyibpay';
  toyyibpay_bill_code: string;
  paid_amount?: number;
  category_code?: string;
  bill_external_reference_no?: string;
  bill_name?: string;
  bill_description?: string;
  bill_date?: string;
  bill_url?: string;
  fpx_transaction_id?: string;
  fpx_seller_order_no?: string;
  status_id?: string;
}

// Union type for all payment providers
export type PaymentData = BillplzPaymentData | StripePaymentData | ToyyibPayPaymentData | BasePaymentData;

// Claim-related types
export type ClaimStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'paid' | 'cancelled';
export type ClaimPriority = 'low' | 'medium' | 'high' | 'urgent';

// Khairat Claims interfaces
export interface KhairatClaim {
  id: string;
  claimant_id?: string; // Optional for backward compatibility, prefer khairat_member_id
  khairat_member_id?: string; // Reference to khairat_members table
  mosque_id: string;
  title: string;
  description: string;
  requested_amount: number;
  approved_amount?: number;
  status: ClaimStatus;
  priority: ClaimPriority;
  admin_notes?: string;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ClaimDocument {
  id: string;
  claim_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}


// Extended interfaces with relations
export interface KhairatClaimWithDetails extends KhairatClaim {
  khairat_member?: KhairatMember; // Primary source for member data
  claimant?: UserProfile; // Fallback for backward compatibility
  mosque?: Mosque;
  program?: KhairatProgram;
  documents?: ClaimDocument[];
  reviewer?: UserProfile;
  approver?: UserProfile;
}

// Form data interfaces
export interface ClaimFormData {
  mosque_id: string;
  requested_amount: number;
  title: string;
  description?: string;
  priority: ClaimPriority;
  documents?: File[];
}

// Create and Update types
export type CreateKhairatClaim = Omit<KhairatClaim, 'id' | 'created_at' | 'updated_at' | 'status' | 'submitted_at'>;
export type UpdateKhairatClaim = Partial<Omit<KhairatClaim, 'id' | 'created_at' | 'updated_at' | 'claimant_id' | 'mosque_id'>>;

// Filters for claims
export interface ClaimFilters extends SearchFilters {
  mosque_id?: string;
  status?: ClaimStatus;
  priority?: ClaimPriority;
  claimant_id?: string;
  amount_min?: number;
  amount_max?: number;
  submitted_from?: string;
  submitted_to?: string;
}

// =============================================
// KARIAH MEMBER INTERFACES
// =============================================

export interface KariahMember {
  id: string;
  user_id: string;
  mosque_id: string;
  ic_passport_number?: string;
  application_reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review' | 'withdrawn' | 'active' | 'inactive' | 'suspended';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  joined_date?: string;
  membership_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    phone?: string;
  };
  mosque?: {
    id: string;
    name: string;
  };
}

// Legacy interfaces for backward compatibility (deprecated)
export interface KariahApplication extends Omit<KariahMember, 'joined_date' | 'notes' | 'membership_number'> {
  status: 'pending' | 'approved' | 'rejected' | 'under_review' | 'withdrawn';
}

export interface KariahMembership extends Omit<KariahMember, 'ic_passport_number' | 'application_reason' | 'admin_notes' | 'reviewed_by' | 'reviewed_at'> {
  status: 'active' | 'inactive' | 'suspended';
}