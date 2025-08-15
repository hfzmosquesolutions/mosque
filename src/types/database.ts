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
export type ContributionStatus = 'pending' | 'completed' | 'cancelled';
// Legacy alias for backward compatibility
export type KhairatStatus = ContributionStatus;

export type ResourceType = 'article' | 'video' | 'audio' | 'document' | 'link';
export type NotificationType = 'info' | 'warning' | 'success' | 'error';

// =============================================
// CORE INTERFACES
// =============================================

export interface Mosque {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  user_id: string; // References auth.users(id) - mosque owner/creator
  prayer_times?: Record<string, unknown>; // JSON object for prayer times configuration
  settings?: Record<string, unknown>; // JSON object for mosque-specific settings
  is_private: boolean; // Whether the mosque profile is private
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string; // References auth.users(id)
  full_name: string;
  phone?: string;
  address?: string;
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

export interface MosqueFollower {
  id: string;
  user_id: string;
  mosque_id: string;
  followed_at: string;
  created_at: string;
}

export interface UserFollower {
  id: string;
  follower_id: string; // The user who is following
  following_id: string; // The user being followed
  followed_at: string;
  created_at: string;
}

export interface MosqueUserFollower {
  id: string;
  mosque_id: string; // The mosque that is following
  user_id: string; // The user being followed by the mosque
  followed_at: string;
  created_at: string;
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
// CONTRIBUTION (WELFARE) MODULE
// =============================================

export interface ContributionProgram {
  id: string;
  mosque_id: string;
  name: string;
  description?: string;
  target_amount?: number;
  current_amount: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Contribution {
  id: string;
  program_id: string;
  contributor_id?: string;
  contributor_name?: string;
  amount: number;
  payment_method?: string;
  payment_reference?: string;
  status: ContributionStatus;
  notes?: string;
  contributed_at: string;
}

// Legacy alias for backward compatibility
export type KhairatProgram = ContributionProgram;
export type KhairatContribution = Contribution;





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
export interface ContributionProgramWithContributions extends ContributionProgram {
  contributions?: Contribution[];
  contribution_count?: number;
  progress_percentage?: number;
}

// Legacy alias for backward compatibility
export type KhairatProgramWithContributions = ContributionProgramWithContributions;

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

// Onboarding form data (matches existing interface)
export interface OnboardingData {
  fullName: string;
  phone: string;
  address: string;
  accountType: UserAccountType | '';
  mosqueAction?: 'join' | 'create';
  mosqueName?: string;
  mosqueAddress?: string;
  existingMosqueId?: string;
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

// Contribution form data
export interface ContributionFormData {
  program_id: string;
  amount: number;
  contributor_name?: string;
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
}

// Legacy alias for backward compatibility
export type KhairatContributionFormData = ContributionFormData;



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
  total_contribution_programs: number;
  active_contribution_programs: number;
  // Legacy aliases
  total_khairat_programs: number;
  active_khairat_programs: number;
  unread_notifications: number;
  recent_activities: AuditLog[];
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

// For updating records (partial, without id, timestamps)
export type UpdateMosque = Partial<Omit<Mosque, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateUserProfile = Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateEvent = Partial<Omit<Event, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateDonation = Partial<Omit<Donation, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateResource = Partial<Omit<Resource, 'id' | 'created_at' | 'updated_at'>>;

// Database table names (useful for generic functions)
export type TableName = 
  | 'mosques'
  | 'user_profiles'
  | 'events'
  | 'event_registrations'
  | 'donation_categories'
  | 'donations'
  | 'contribution_programs'
  | 'contribution_contributions'
  | 'khairat_programs'
  | 'khairat_contributions'

  | 'resource_categories'
  | 'resources'
  | 'audit_logs'
  | 'notifications'
  | 'system_settings'
  | 'mosque_followers'
  | 'user_followers'
  | 'mosque_user_followers';

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

      resources: {
        Row: Resource;
        Insert: CreateResource;
        Update: UpdateResource;
      };
      mosque_followers: {
        Row: MosqueFollower;
        Insert: Omit<MosqueFollower, 'id' | 'created_at'>;
        Update: never; // Following relationships are insert/delete only
      };
      user_followers: {
        Row: UserFollower;
        Insert: Omit<UserFollower, 'id' | 'created_at'>;
        Update: never; // Following relationships are insert/delete only
      };
      mosque_user_followers: {
        Row: MosqueUserFollower;
        Insert: Omit<MosqueUserFollower, 'id' | 'created_at'>;
        Update: never; // Following relationships are insert/delete only
      };
      // Add other tables as needed
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
    
    };
  };
}