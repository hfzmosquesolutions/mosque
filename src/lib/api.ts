// API utilities for interacting with the Supabase database
// This file provides helper functions for common database operations

import { supabase } from './supabase';
import {
  UserProfile,
  UpdateUserProfile,
  Mosque,
  UpdateMosque,
  KhairatContribution,
  MosqueKhairatSettings,
  UserDependent,
  CreateUserDependent,
  UpdateUserDependent,
  Notification,
  OnboardingData,
  ApiResponse,
  PaginatedResponse,
  DashboardStats,
  KhairatClaim,
  KhairatClaimWithDetails,
  CreateKhairatClaim,
  UpdateKhairatClaim,
  ClaimFilters,
  ClaimStatus
} from '@/types/database';

// Organization People types
export interface OrganizationPerson {
  id: string;
  mosque_id: string;
  full_name: string;
  position: string;
  department?: string;
  email?: string;
  phone?: string;
  address?: string;
  bio?: string;
  profile_picture_url?: string;
  is_public: boolean;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Kariah Registration Settings types
export interface KariahRegistrationSettings {
  requirements: string;
  benefits: string;
  custom_message: string;
}

export interface CreateOrganizationPerson {
  mosque_id: string;
  full_name: string;
  position: string;
  department?: string;
  email?: string;
  phone?: string;
  address?: string;
  bio?: string;
  profile_picture_url?: string;
  is_public?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface UpdateOrganizationPerson {
  full_name?: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  address?: string;
  bio?: string;
  profile_picture_url?: string;
  is_public?: boolean;
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
}

// =============================================
// USER PROFILE OPERATIONS
// =============================================

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
      } catch {
      return { success: false, error: 'Failed to fetch user profile' };
    }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: UpdateUserProfile
): Promise<ApiResponse<UserProfile>> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
      } catch {
      return { success: false, error: 'Failed to update user profile' };
    }
}

/**
 * Complete user onboarding
 */
export async function completeOnboarding(
  userId: string,
  onboardingData: OnboardingData
): Promise<ApiResponse<UserProfile>> {
  try {
    // Ensure user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return { success: false, error: 'User not authenticated' };
    }

    // Verify the session user matches the provided userId
    if (session.user.id !== userId) {
      return { success: false, error: 'User ID mismatch' };
    }

    // Handle mosque creation for admins
    let mosqueId: string | undefined;

    if (onboardingData.accountType === 'admin' && onboardingData.mosqueName) {
      // Check if user already owns a mosque
      const { data: existingMosque, error } = await supabase
        .from('mosques')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking existing mosque:', error);
        return { success: false, error: 'Failed to check existing mosque ownership' };
      }

      if (existingMosque) {
        return { success: false, error: 'You can only create one mosque. You already own a mosque.' };
      }

      // Create new mosque with user_id as the owner
      const { data: mosque, error: mosqueError } = await supabase
        .from('mosques')
        .insert({
          name: onboardingData.mosqueName,
          address: onboardingData.mosqueAddress,
          address_line1: onboardingData.mosqueAddressData?.address_line1,
          address_line2: onboardingData.mosqueAddressData?.address_line2,
          city: onboardingData.mosqueAddressData?.city,
          state: onboardingData.mosqueAddressData?.state,
          postcode: onboardingData.mosqueAddressData?.postcode,
          country: onboardingData.mosqueAddressData?.country,
          institution_type: onboardingData.institutionType || 'mosque', // Default to mosque if not specified
          user_id: userId, // Set the creator as the mosque owner
          is_private: false, // Default to public profile
          settings: {
            enabled_services: [
              'kariah_management',
              'khairat_management', 
              'organization_people',
              'mosque_profile'
            ],
            kariah_registration: {
              requirements: '',
              benefits: '',
              custom_message: ''
            },
            khairat_registration: {
              requirements: '',
              benefits: '',
              custom_message: ''
            }
          }
        })
        .select()
        .single();

      if (mosqueError) {
        console.error('Mosque creation error:', mosqueError);
        return { success: false, error: `Failed to create mosque: ${mosqueError.message}` };
      }

      mosqueId = mosque.id;
    }

    // Update user profile with onboarding data (removed mosque_id)
    const profileUpdates: UpdateUserProfile = {
      full_name: onboardingData.fullName,
      phone: onboardingData.phone,
      address: onboardingData.address || undefined,
      ic_passport_number: onboardingData.icPassportNumber,
      account_type: onboardingData.accountType as 'member' | 'admin',
      role: onboardingData.accountType === 'admin' ? 'admin' : 'member',
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      is_profile_private: false, // Default to public profile
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .update(profileUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to complete onboarding' };
  }
}

/**
 * Check if user has completed onboarding
 */
export async function checkOnboardingStatus(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[API] checkOnboardingStatus - Supabase error:', error);
      return false;
    }
    
    if (!data) {
      console.warn('[API] checkOnboardingStatus - No data returned');
      return false;
    }

    return data.onboarding_completed;
  } catch (error) {
    console.error('[API] checkOnboardingStatus - Catch error:', error);
    return false;
  }
}

/**
 * Reset user onboarding status (for testing purposes)
 */
export async function resetOnboardingStatus(userId: string): Promise<ApiResponse<boolean>> {
  try {
    // Ensure user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return { success: false, error: 'User not authenticated' };
    }

    // Verify the session user matches the provided userId
    if (session.user.id !== userId) {
      return { success: false, error: 'User ID mismatch' };
    }

    // Reset onboarding status
    const { error } = await supabase
      .from('user_profiles')
      .update({ onboarding_completed: false })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: true };
  } catch (error) {
    return { success: false, error: 'Failed to reset onboarding status' };
  }
}

// =============================================
// MOSQUE OPERATIONS
// =============================================

/**
 * Get mosque by ID
 */
export async function getMosque(mosqueId: string): Promise<ApiResponse<Mosque>> {
  try {
    const { data, error } = await supabase
      .from('mosques')
      .select('*')
      .eq('id', mosqueId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to fetch mosque' };
  }
}

/**
 * Get all mosques (for admin selection)
 */
export async function getAllMosques(): Promise<ApiResponse<Mosque[]>> {
  try {
    console.log('[API] getAllMosques - Starting request');
    const { data, error } = await supabase
      .from('mosques')
      .select('*')
      .order('name');

    if (error) {
      console.error('[API] getAllMosques - Supabase error:', error);
      return { success: false, error: error.message };
    }

    console.log('[API] getAllMosques - Success, count:', data?.length || 0);
    return { success: true, data };
  } catch (error) {
    console.error('[API] getAllMosques - Catch error:', error);
    return { success: false, error: 'Failed to fetch mosques' };
  }
}

/**
 * Update mosque information
 */
export async function updateMosque(
  mosqueId: string,
  updates: UpdateMosque
): Promise<ApiResponse<Mosque>> {
  try {
    console.log('[API] updateMosque - Starting request for mosqueId:', mosqueId);
    const { data, error } = await supabase
      .from('mosques')
      .update(updates)
      .eq('id', mosqueId)
      .select()
      .single();

    if (error) {
      console.error('[API] updateMosque - Supabase error:', error);
      return { success: false, error: error.message };
    }

    console.log('[API] updateMosque - Success:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[API] updateMosque - Catch error:', error);
    return { success: false, error: 'Failed to update mosque' };
  }
}

/**
 * Update mosque settings (including enabled services)
 */
export async function updateMosqueSettings(
  mosqueId: string,
  settings: Record<string, any>
): Promise<ApiResponse<Mosque>> {
  try {
    console.log('[API] updateMosqueSettings - Starting request for mosqueId:', mosqueId);
    
    // First get the current mosque to merge settings
    const { data: currentMosque, error: fetchError } = await supabase
      .from('mosques')
      .select('settings')
      .eq('id', mosqueId)
      .single();

    if (fetchError) {
      console.error('[API] updateMosqueSettings - Error fetching current mosque:', fetchError);
      return { success: false, error: fetchError.message };
    }

    // Merge new settings with existing settings
    const currentSettings = currentMosque?.settings || {};
    const updatedSettings = { ...currentSettings, ...settings };

    const { data, error } = await supabase
      .from('mosques')
      .update({ settings: updatedSettings })
      .eq('id', mosqueId)
      .select()
      .single();

    if (error) {
      console.error('[API] updateMosqueSettings - Supabase error:', error);
      return { success: false, error: error.message };
    }

    console.log('[API] updateMosqueSettings - Success:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[API] updateMosqueSettings - Catch error:', error);
    return { success: false, error: 'Failed to update mosque settings' };
  }
}

// Donations feature removed

// =============================================
// KHAIRAT OPERATIONS (Dedicated tables)
// =============================================

/**
 * Get mosque khairat settings
 */
export async function getMosqueKhairatSettings(
  mosqueId: string
): Promise<ApiResponse<MosqueKhairatSettings>> {
  try {
    const { data: mosque, error } = await supabase
      .from('mosques')
      .select('settings')
      .eq('id', mosqueId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const khairatSettings = mosque.settings?.khairat || {
      enabled: false,
      fixed_price: undefined,
      fixed_prices: undefined,
      description: undefined,
      payment_methods: [],
      target_amount: undefined,
      start_date: undefined,
      end_date: undefined
    };

    // Ensure fixed_prices is included even if it's not in the stored settings
    const settingsWithFixedPrices = {
      ...khairatSettings,
      fixed_prices: khairatSettings.fixed_prices || {
        online_payment: undefined,
        bank_transfer: undefined,
        cash: undefined,
      }
    };

    return { success: true, data: settingsWithFixedPrices };
  } catch (error) {
    return { success: false, error: 'Failed to fetch mosque khairat settings' };
  }
}


/**
 * Create khairat contribution (now mosque-specific)
 */
export async function createKhairatContribution(
  contributionData: Omit<KhairatContribution, 'id' | 'contributed_at'>
): Promise<ApiResponse<KhairatContribution>> {
  try {
    const { data, error } = await supabase
      .from('khairat_contributions')
      .insert(contributionData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to create khairat contribution' };
  }
}


/**
 * Get user's khairat contributions across all mosques
 */
/**
 * Get combined payment history including both legacy records and current contributions
 */
export async function getUserPaymentHistory(
  userId: string,
  mosqueId?: string
): Promise<ApiResponse<any[]>> {
  try {
    // Fetch current contributions with mosque details (all statuses)
    let contributionsQuery = supabase
      .from('khairat_contributions')
      .select(`
        id,
        amount,
        contributed_at,
        status,
        payment_method,
        payment_reference,
        payment_id,
        notes,
        contributor_name,
        mosque:mosques(
          id,
          name,
          address
        )
      `)
      .eq('contributor_id', userId);

    if (mosqueId) {
      contributionsQuery = contributionsQuery.eq('mosque_id', mosqueId);
    }

    const { data: contributions, error: contribError } = await contributionsQuery;

    if (contribError) {
      console.error('Error fetching contributions:', contribError);
      throw new Error(contribError.message);
    }

    // Transform contributions and mark legacy records
    const formattedContributions = (contributions || []).map((contrib: any) => {
      const isLegacy = contrib.payment_method === 'legacy_record';
      
      return {
        id: contrib.id,
        amount: contrib.amount,
        contributed_at: contrib.contributed_at,
        status: contrib.status,
        payment_method: contrib.payment_method,
        payment_reference: contrib.payment_reference,
        payment_id: contrib.payment_id,
        notes: contrib.notes,
        contributor_name: contrib.contributor_name,
        program: {
          id: 'khairat',
          name: isLegacy ? 'Legacy Khairat' : 'Khairat',
          mosque: contrib.mosque,
        },
        mosque: contrib.mosque,
        payment_type: isLegacy ? 'legacy' as const : 'current' as const,
      };
    });

    // Sort by date
    const sortedRecords = formattedContributions.sort(
      (a, b) => new Date(b.contributed_at).getTime() - new Date(a.contributed_at).getTime()
    );

    return {
      success: true,
      data: sortedRecords,
    };
  } catch (error) {
    console.error('Error fetching user payment history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payment history',
    };
  }
}

export async function getUserKhairatContributions(
  userId: string,
  limit = 20,
  offset = 0
): Promise<PaginatedResponse<KhairatContribution & { mosque: Mosque }>> {
  try {
    const { data, error, count } = await supabase
      .from('khairat_contributions')
      .select(`
        *,
        mosque:mosques(
          id,
          name,
          address
        )
      `, { count: 'exact' })
      .eq('contributor_id', userId)
      .order('contributed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(error.message);
    }

    const totalPages = Math.ceil((count || 0) / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    return {
      data: data || [],
      count: count || 0,
      page: currentPage,
      limit,
      total_pages: totalPages,
      has_next: currentPage < totalPages,
      has_prev: currentPage > 1,
    };
  } catch (error) {
    throw new Error('Failed to fetch user khairat contributions');
  }
}


/**
 * Get khairat contributions for a specific mosque (admin view)
 */
export async function getKhairatContributions(
  mosqueId: string,
  limit = 20,
  offset = 0
): Promise<PaginatedResponse<KhairatContribution & { contributor?: UserProfile }>> {
  try {
    const { data, error, count } = await supabase
      .from('khairat_contributions')
      .select(`
        *,
        contributor:user_profiles(
          id,
          full_name,
          phone
        )
      `, { count: 'exact' })
      .eq('mosque_id', mosqueId)
      .order('contributed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(error.message);
    }

    const totalPages = Math.ceil((count || 0) / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    return {
      data: data || [],
      count: count || 0,
      page: currentPage,
      limit,
      total_pages: totalPages,
      has_next: currentPage < totalPages,
      has_prev: currentPage > 1,
    };
  } catch (error) {
    throw new Error('Failed to fetch khairat contributions');
  }
}


/**
 * Update mosque khairat settings
 */
export async function updateMosqueKhairatSettings(
  mosqueId: string,
  settings: MosqueKhairatSettings
): Promise<ApiResponse<MosqueKhairatSettings>> {
  try {
    // Get current settings
    const { data: mosque, error: fetchError } = await supabase
      .from('mosques')
      .select('settings')
      .eq('id', mosqueId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    // Merge new khairat settings with existing ones (don't overwrite other fields)
    const existingKhairatSettings = mosque.settings?.khairat || {};
    const mergedKhairatSettings = {
      ...existingKhairatSettings,
      ...settings,
      // Preserve fixed_prices structure if it exists
      fixed_prices: settings.fixed_prices || existingKhairatSettings.fixed_prices || {
        online_payment: undefined,
        bank_transfer: undefined,
        cash: undefined,
      }
    };

    // Update settings with merged khairat settings
    const updatedSettings = {
      ...mosque.settings,
      khairat: mergedKhairatSettings
    };

    const { data, error } = await supabase
      .from('mosques')
      .update({ settings: updatedSettings })
      .eq('id', mosqueId)
      .select('settings')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: settings };
  } catch (error) {
    return { success: false, error: 'Failed to update mosque khairat settings' };
  }
}

/**
 * Get all khairat contributions for a mosque (admin view)
 */
export async function getMosqueKhairatContributions(
  mosqueId: string,
  limit = 20,
  offset = 0
): Promise<PaginatedResponse<KhairatContribution & { contributor?: UserProfile; member?: { id: string; membership_number?: string | null; full_name?: string } }>> {
  try {
    const { data, error, count } = await supabase
      .from('khairat_contributions')
      .select(`
        *,
        contributor:user_profiles(
          id,
          full_name,
          phone
        ),
        member:khairat_members!khairat_member_id(
          id,
          membership_number,
          full_name
        )
      `, { count: 'exact' })
      .eq('mosque_id', mosqueId)
      .order('contributed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(error.message);
    }

    const totalPages = Math.ceil((count || 0) / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    return {
      data: data || [],
      count: count || 0,
      page: currentPage,
      limit,
      total_pages: totalPages,
      has_next: currentPage < totalPages,
      has_prev: currentPage > 1,
    };
  } catch (error) {
    throw new Error('Failed to fetch mosque khairat contributions');
  }
}



/**
 * Update khairat contribution status
 */
export async function updateKhairatContributionStatus(
  contributionId: string,
  status: 'pending' | 'completed' | 'cancelled' | 'failed'
): Promise<ApiResponse<KhairatContribution>> {
  try {
    const { data, error } = await supabase
      .from('khairat_contributions')
      .update({ status })
      .eq('id', contributionId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to update khairat contribution status' };
  }
}



// =============================================
// NOTIFICATION OPERATIONS
// =============================================

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: string,
  limit = 20
): Promise<ApiResponse<Notification[]>> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to fetch notifications' };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<ApiResponse<Notification>> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to mark notification as read' };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread notification count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return 0;
  }
}

// =============================================
// DASHBOARD OPERATIONS
// =============================================

/**
 * Get dashboard statistics for a mosque
 */
export async function getDashboardStats(mosqueId: string): Promise<ApiResponse<DashboardStats>> {
  try {
    // Members functionality has been removed
    const totalMembers = 0;
    const activeMembers = 0;

    // Events removed: set counts to 0
    const totalEvents = 0;
    const upcomingEvents = 0;

    // Donations removed: set to zero
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const totalDonations = 0;
    const monthlyDonations = 0;
    const totalDonationAmount = 0;
    const monthlyDonationAmount = 0;

    // Previous month donation amount (removed)
    const startOfPreviousMonth = new Date(startOfMonth);
    startOfPreviousMonth.setMonth(startOfPreviousMonth.getMonth() - 1);
    const endOfPreviousMonth = new Date(startOfMonth);
    endOfPreviousMonth.setTime(endOfPreviousMonth.getTime() - 1);
    const previousMonthDonationAmount = 0;
    const donationTrendPercentage = 0;

    // Get khairat contributions directly (no more programs)
    const { data: khairatContributions } = await supabase
      .from('khairat_contributions')
      .select('amount, status')
      .eq('mosque_id', mosqueId);

    // Calculate total khairat amount and monthly contributions
    const totalKhairatAmount = khairatContributions?.reduce((sum, contribution) => 
      contribution.status === 'completed' ? sum + contribution.amount : sum, 0) || 0;
    
    // Get monthly khairat contributions
    const { data: monthlyKhairatData } = await supabase
      .from('khairat_contributions')
      .select('amount')
      .eq('mosque_id', mosqueId)
      .eq('status', 'completed')
      .gte('contributed_at', startOfMonth.toISOString());
    
    const monthlyKhairatContributions = monthlyKhairatData?.reduce((sum, contribution) => sum + contribution.amount, 0) || 0;

    // Get recent activities count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentActivityCount } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('mosque_id', mosqueId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Get mosque profile completion
    const { data: mosqueData } = await supabase
      .from('mosques')
      .select('name, description, address, phone, email, website, capacity')
      .eq('id', mosqueId)
      .single();

    const profileFields = ['name', 'description', 'address', 'phone', 'email'];
    const completedFields = profileFields.filter(field => mosqueData?.[field as keyof typeof mosqueData]);
    const mosqueProfileCompletionPercentage = (completedFields.length / profileFields.length) * 100;
    const profileMissingFields = profileFields.filter(field => !mosqueData?.[field as keyof typeof mosqueData]);



    const stats: DashboardStats = {
      total_members: totalMembers || 0,
      active_members: activeMembers || 0,
      total_events: totalEvents || 0,
      upcoming_events: upcomingEvents || 0,
      total_donations: totalDonations || 0,
      monthly_donations: monthlyDonations || 0,
      total_contribution_programs: 0, // No more programs
      active_contribution_programs: 0, // No more programs
      total_khairat_programs: 0, // No more programs
      active_khairat_programs: 0, // No more programs
      unread_notifications: 0, // This would be user-specific
      recent_activities: [], // This would require a separate query
      // Enhanced metrics
      total_donation_amount: totalDonationAmount,
      monthly_donation_amount: monthlyDonationAmount,
      previous_month_donation_amount: previousMonthDonationAmount,
      donation_trend_percentage: donationTrendPercentage,
      khairat_programs_progress: [], // No more programs
      mosque_profile_completion: {
        percentage: mosqueProfileCompletionPercentage,
        missing_fields: profileMissingFields
      },
      recent_activity_count: recentActivityCount || 0,
       monthly_khairat_contributions: monthlyKhairatContributions,
       total_khairat_amount: totalKhairatAmount
     };

    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: 'Failed to fetch dashboard statistics' };
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Check if user is admin of a mosque
 */
export async function isUserMosqueAdmin(userId: string, mosqueId: string): Promise<boolean> {
  try {
    // Check if user is the mosque owner
    const { data, error } = await supabase
      .from('mosques')
      .select('user_id')
      .eq('id', mosqueId)
      .eq('user_id', userId)
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Get user's mosque ID (if they own a mosque)
 */
export async function getUserMosqueId(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('mosques')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.id;
  } catch (error) {
    return null;
  }
}

/**
 * Search across multiple tables
 */
export async function globalSearch(
  mosqueId: string,
  query: string,
  limit = 10
): Promise<ApiResponse<Array<unknown>>> {
  try {
    // Events removed: return empty array for now or implement other searches
    return { success: true, data: [] };
  } catch (error) {
    return { success: false, error: 'Search failed' };
  }
}


// =============================================
// MEMBER MANAGEMENT OPERATIONS
// =============================================

/**
 * Search mosques for joining
 */
export async function searchMosques(
  query?: string,
  limit = 20,
  offset = 0
): Promise<PaginatedResponse<Mosque>> {
  try {
    let queryBuilder = supabase
      .from('mosques')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,address.ilike.%${query}%`);
    }

    const { data, error, count } = await queryBuilder;

    if (error) {
      return {
        data: [],
        count: 0,
        page: Math.floor(offset / limit) + 1,
        limit,
        total_pages: 0,
        has_next: false,
        has_prev: false
      };
    }

    const totalPages = Math.ceil((count || 0) / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    return {
      data: data || [],
      count: count || 0,
      page: currentPage,
      limit,
      total_pages: totalPages,
      has_next: currentPage < totalPages,
      has_prev: currentPage > 1
    };
  } catch (error) {
    return {
      data: [],
      count: 0,
      page: 1,
      limit,
      total_pages: 0,
      has_next: false,
      has_prev: false
    };
  }
}

// =============================================
// USER DEPENDENTS OPERATIONS
// =============================================

/**
 * Get user dependents
 */
export async function getUserDependents(userId: string): Promise<ApiResponse<UserDependent[]>> {
  try {
    const { data, error } = await supabase
      .from('user_dependents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: 'Failed to fetch user dependents' };
  }
}

/**
 * Create a new dependent
 */
export async function createUserDependent(
  dependentData: CreateUserDependent
): Promise<ApiResponse<UserDependent>> {
  try {
    const { data, error } = await supabase
      .from('user_dependents')
      .insert(dependentData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to create dependent' };
  }
}

/**
 * Update a dependent
 */
export async function updateUserDependent(
  dependentId: string,
  updates: UpdateUserDependent
): Promise<ApiResponse<UserDependent>> {
  try {
    const { data, error } = await supabase
      .from('user_dependents')
      .update(updates)
      .eq('id', dependentId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to update dependent' };
  }
}

/**
 * Delete a dependent
 */
export async function deleteUserDependent(
  dependentId: string
): Promise<ApiResponse<{ success: true }>> {
  try {
    const { error } = await supabase
      .from('user_dependents')
      .delete()
      .eq('id', dependentId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { success: true } };
  } catch (error) {
    return { success: false, error: 'Failed to delete dependent' };
  }
}

// =============================================
// KHAIRAT CLAIMS OPERATIONS
// =============================================

/**
 * Get claims with optional filtering and pagination
 */
export async function getClaims(
  filters?: ClaimFilters,
  limit = 20,
  offset = 0
): Promise<PaginatedResponse<KhairatClaimWithDetails>> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (filters?.mosque_id) {
      params.append('mosqueId', filters.mosque_id);
    }
    // Removed claimant_id filter - we use khairat_member_id instead
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.priority) {
      params.append('priority', filters.priority);
    }
    
    // Calculate page from offset
    const page = Math.floor(offset / limit) + 1;
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await fetch(`/api/khairat-claims?${params.toString()}`);
    const result = await response.json();

    if (!response.ok) {
      return { 
        data: [], 
        count: 0, 
        page: Math.floor(offset / limit) + 1, 
        limit, 
        total_pages: 0, 
        has_next: false, 
        has_prev: false 
      };
    }

    const totalPages = result.pagination?.totalPages || 0;
    const currentPage = result.pagination?.page || 1;

    return {
      data: result.data || [],
      count: result.pagination?.total || 0,
      page: currentPage,
      limit,
      total_pages: totalPages,
      has_next: result.pagination?.hasNext || false,
      has_prev: result.pagination?.hasPrev || false
    };
  } catch {
    return { 
      data: [], 
      count: 0, 
      page: Math.floor(offset / limit) + 1, 
      limit, 
      total_pages: 0, 
      has_next: false, 
      has_prev: false 
    };
  }
}

/**
 * Get a single claim by ID with optional details
 */
export async function getClaimById(
  claimId: string,
  includeDocuments = false
): Promise<ApiResponse<KhairatClaimWithDetails>> {
  try {
    let selectQuery = `
      *,
      claimant:user_profiles!khairat_claims_claimant_id_fkey(
        id,
        full_name,
        email,
        phone
      ),
      mosque:mosques!khairat_claims_mosque_id_fkey(
        id,
        name
      ),
    `;


    if (includeDocuments) {
      selectQuery += `,
        documents:khairat_claim_documents(
          id,
          file_name,
          file_url,
          file_type,
          file_size,
          uploaded_at
        )`;
    }

    const { data, error } = await supabase
      .from('khairat_claims')
      .select(selectQuery)
      .eq('id', claimId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Claim not found' };
    }

    return { success: true, data: data as unknown as KhairatClaimWithDetails };
  } catch {
    return { success: false, error: 'Failed to fetch claim' };
  }
}

/**
 * Create a new khairat claim
 */
export async function createClaim(
  claimData: CreateKhairatClaim
): Promise<ApiResponse<KhairatClaim>> {
  try {
    // Use the API route instead of direct database access to avoid RLS issues
    const response = await fetch('/api/khairat-claims', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        claimantId: claimData.claimant_id,
        khairatMemberId: claimData.khairat_member_id, // Pass khairat_member_id if available
        mosqueId: claimData.mosque_id,
        claimAmount: claimData.requested_amount,
        reason: claimData.title,
        description: claimData.description,
        priority: claimData.priority,
        personInChargeName: claimData.person_in_charge_name,
        personInChargePhone: claimData.person_in_charge_phone,
        personInChargeRelationship: claimData.person_in_charge_relationship,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to create claim' };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error creating claim:', error);
    return { success: false, error: 'Failed to create claim' };
  }
}

/**
 * Update an existing khairat claim
 */
export async function updateClaim(
  claimId: string,
  updates: UpdateKhairatClaim
): Promise<ApiResponse<KhairatClaim>> {
  try {
    const { data, error } = await supabase
      .from('khairat_claims')
      .update(updates)
      .eq('id', claimId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch {
    return { success: false, error: 'Failed to update claim' };
  }
}

/**
 * Update claim status
 */
export async function updateClaimStatus(
  claimId: string,
  status: ClaimStatus,
  notes?: string
): Promise<ApiResponse<KhairatClaim>> {
  try {
    const updates: any = { status };
    
    if (status === 'approved' || status === 'paid') {
      updates.processed_at = new Date().toISOString();
    }
    
    if (notes) {
      updates.admin_notes = notes;
    }

    const { data, error } = await supabase
      .from('khairat_claims')
      .update(updates)
      .eq('id', claimId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch {
    return { success: false, error: 'Failed to update claim status' };
  }
}

/**
 * Cancel a claim (set status to cancelled)
 */
export async function cancelClaim(
  claimId: string
): Promise<ApiResponse<KhairatClaim>> {
  try {
    const { data, error } = await supabase
      .from('khairat_claims')
      .update({ status: 'cancelled' })
      .eq('id', claimId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch {
    return { success: false, error: 'Failed to cancel claim' };
  }
}

/**
 * Get user's claims
 */
export async function getUserClaims(
  userId: string,
  limit = 20,
  offset = 0
): Promise<PaginatedResponse<KhairatClaimWithDetails>> {
  try {
    // Since we removed claimant_id filtering, we need to filter by khairat_member_id instead
    // First, get the user's khairat memberships
    const { getKhairatMembers } = await import('./api/khairat-members');
    const userMemberships = await getKhairatMembers({ user_id: userId });
    
    if (!userMemberships || userMemberships.length === 0) {
      // User has no khairat memberships, return empty
      return { 
        data: [], 
        count: 0, 
        page: 1, 
        limit, 
        total_pages: 0, 
        has_next: false, 
        has_prev: false 
      };
    }
    
    // Get all claims (no filtering by claimant_id anymore)
    // We'll filter client-side by khairat_member_id
    const params = new URLSearchParams();
    params.append('page', '1');
    params.append('limit', '1000'); // Fetch all to filter client-side
    
    const response = await fetch(`/api/khairat-claims?${params.toString()}`);
    const result = await response.json();

    if (!response.ok) {
      return { 
        data: [], 
        count: 0, 
        page: 1, 
        limit, 
        total_pages: 0, 
        has_next: false, 
        has_prev: false 
      };
    }

    // Filter claims by user's khairat_member_ids
    const memberIds = new Set(userMemberships.map(m => m.id));
    const userClaims = (result.data || []).filter((claim: KhairatClaimWithDetails) => 
      claim.khairat_member_id && memberIds.has(claim.khairat_member_id)
    );
    
    // Apply pagination to filtered results
    const page = Math.floor(offset / limit) + 1;
    const from = offset;
    const to = from + limit;
    const paginatedClaims = userClaims.slice(from, to);
    const totalPages = Math.ceil(userClaims.length / limit);

    return {
      data: paginatedClaims,
      count: userClaims.length,
      page,
      limit,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1
    };
  } catch (error) {
    console.error('Error fetching user claims:', error);
    return { 
      data: [], 
      count: 0, 
      page: 1, 
      limit, 
      total_pages: 0, 
      has_next: false, 
      has_prev: false 
    };
  }
}

/**
 * Get mosque claims for admin management
 */
export async function getMosqueClaims(
  mosqueId: string,
  filters?: Omit<ClaimFilters, 'mosque_id'>,
  limit = 20,
  offset = 0
): Promise<PaginatedResponse<KhairatClaimWithDetails>> {
  const claimFilters: ClaimFilters = {
    ...filters,
    mosque_id: mosqueId
  };
  
  return getClaims(claimFilters, limit, offset);
}

/**
 * Get claim counts for a mosque (optimized for dashboard)
 * This is much faster than fetching all claims and counting them
 */
export async function getMosqueClaimCounts(mosqueId: string): Promise<{
  successful: number;
  unsettled: number;
  total: number;
}> {
  try {
    // Fetch counts in parallel using head queries (much faster)
    const [successfulResult, unsettledResult, totalResult] = await Promise.all([
      supabase
        .from('khairat_claims')
        .select('id', { count: 'exact', head: true })
        .eq('mosque_id', mosqueId)
        .in('status', ['approved', 'paid']),
      supabase
        .from('khairat_claims')
        .select('id', { count: 'exact', head: true })
        .eq('mosque_id', mosqueId)
        .in('status', ['pending', 'under_review']),
      supabase
        .from('khairat_claims')
        .select('id', { count: 'exact', head: true })
        .eq('mosque_id', mosqueId)
    ]);

    return {
      successful: successfulResult.count || 0,
      unsettled: unsettledResult.count || 0,
      total: totalResult.count || 0
    };
  } catch (error) {
    console.error('Error fetching claim counts:', error);
    return { successful: 0, unsettled: 0, total: 0 };
  }
}

// =============================================
// CLAIM DOCUMENTS OPERATIONS
// =============================================

/**
 * Get documents for a specific claim
 */
export async function getClaimDocuments(
  claimId: string
): Promise<ApiResponse<any[]>> {
  try {
    const response = await fetch(`/api/khairat-claims/${claimId}/documents`);
    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to fetch documents' };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error fetching claim documents:', error);
    return { success: false, error: 'Failed to fetch documents' };
  }
}

/**
 * Upload a document for a claim
 */
export async function uploadClaimDocument(
  claimId: string,
  file: File,
  uploadedBy: string | null
): Promise<ApiResponse<any>> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (uploadedBy) {
      formData.append('uploadedBy', uploadedBy);
    }

    const response = await fetch(`/api/khairat-claims/${claimId}/documents`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to upload document' };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error uploading claim document:', error);
    return { success: false, error: 'Failed to upload document' };
  }
}

/**
 * Delete a claim document
 */
export async function deleteClaimDocument(
  claimId: string,
  documentId: string,
  userId: string
): Promise<ApiResponse<{ success: true }>> {
  try {
    const response = await fetch(`/api/khairat-claims/${claimId}/documents/${documentId}?userId=${userId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to delete document' };
    }

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error('Error deleting claim document:', error);
    return { success: false, error: 'Failed to delete document' };
  }
}

/**
 * Get payment receipts for a contribution
 */
export async function getPaymentReceipts(
  contributionId: string
): Promise<ApiResponse<any[]>> {
  try {
    const { data, error } = await supabase
      .from('khairat_payment_receipts')
      .select('*')
      .eq('contribution_id', contributionId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: 'Failed to fetch receipts' };
  }
}

/**
 * Upload a payment receipt
 */
export async function uploadPaymentReceipt(
  contributionId: string,
  file: File,
  uploadedBy: string
): Promise<ApiResponse<any>> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadedBy', uploadedBy);

    const response = await fetch(`/api/khairat-contributions/${contributionId}/receipts`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to upload receipt' };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error uploading payment receipt:', error);
    return { success: false, error: 'Failed to upload receipt' };
  }
}

/**
 * Delete a payment receipt
 */
export async function deletePaymentReceipt(
  contributionId: string,
  receiptId: string,
  userId: string
): Promise<ApiResponse<{ success: true }>> {
  try {
    const response = await fetch(`/api/khairat-contributions/${contributionId}/receipts/${receiptId}?userId=${userId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to delete receipt' };
    }

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error('Error deleting payment receipt:', error);
    return { success: false, error: 'Failed to delete receipt' };
  }
}

// =============================================
// ORGANIZATION PEOPLE OPERATIONS
// =============================================

/**
 * Get organization people for a mosque
 */
export async function getOrganizationPeople(
  mosqueId: string,
  isPublic = false
): Promise<ApiResponse<OrganizationPerson[]>> {
  try {
    const response = await fetch(`/api/organization-people?mosque_id=${mosqueId}&public=${isPublic}`);
    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to fetch organization people' };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error fetching organization people:', error);
    return { success: false, error: 'Failed to fetch organization people' };
  }
}

/**
 * Get a specific organization person
 */
export async function getOrganizationPerson(
  id: string
): Promise<ApiResponse<OrganizationPerson>> {
  try {
    const response = await fetch(`/api/organization-people/${id}`);
    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to fetch organization person' };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error fetching organization person:', error);
    return { success: false, error: 'Failed to fetch organization person' };
  }
}

/**
 * Create a new organization person
 */
export async function createOrganizationPerson(
  data: CreateOrganizationPerson
): Promise<ApiResponse<OrganizationPerson>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }

    const response = await fetch('/api/organization-people', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to create organization person' };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error creating organization person:', error);
    return { success: false, error: 'Failed to create organization person' };
  }
}

/**
 * Update an organization person
 */
export async function updateOrganizationPerson(
  id: string,
  data: UpdateOrganizationPerson
): Promise<ApiResponse<OrganizationPerson>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }

    const response = await fetch(`/api/organization-people/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to update organization person' };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error updating organization person:', error);
    return { success: false, error: 'Failed to update organization person' };
  }
}

/**
 * Delete an organization person
 */
export async function deleteOrganizationPerson(
  id: string
): Promise<ApiResponse<{ success: true }>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }

    const response = await fetch(`/api/organization-people/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to delete organization person' };
    }

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error('Error deleting organization person:', error);
    return { success: false, error: 'Failed to delete organization person' };
  }
}

/**
 * Get kariah registration settings for a mosque
 */
export async function getKariahRegistrationSettings(mosqueId: string): Promise<ApiResponse<KariahRegistrationSettings>> {
  try {
    const { data: mosque, error } = await supabase
      .from('mosques')
      .select('settings')
      .eq('id', mosqueId)
      .single();

    if (error) {
      return { success: false, error: `Failed to fetch mosque settings: ${error.message}` };
    }

    const kariahSettings = mosque?.settings?.kariah_registration || {
      requirements: '',
      benefits: '',
      custom_message: ''
    };

    return { success: true, data: kariahSettings };
  } catch (error) {
    console.error('Error fetching kariah registration settings:', error);
    return { success: false, error: 'Failed to fetch kariah registration settings' };
  }
}

/**
 * Update kariah registration settings for a mosque
 */
export async function updateKariahRegistrationSettings(
  mosqueId: string, 
  settings: KariahRegistrationSettings
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    // First, get the current settings to preserve other settings
    const { data: currentMosque, error: fetchError } = await supabase
      .from('mosques')
      .select('settings')
      .eq('id', mosqueId)
      .single();

    if (fetchError) {
      return { success: false, error: `Failed to fetch current settings: ${fetchError.message}` };
    }

    // Merge the new kariah registration settings with existing settings
    const currentSettings = currentMosque?.settings || {};
    const updatedSettings = {
      ...currentSettings,
      kariah_registration: settings
    };

    const { error } = await supabase
      .from('mosques')
      .update({
        settings: updatedSettings
      })
      .eq('id', mosqueId);

    if (error) {
      return { success: false, error: `Failed to update settings: ${error.message}` };
    }

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error('Error updating kariah registration settings:', error);
    return { success: false, error: 'Failed to update kariah registration settings' };
  }
}

/**
 * Get khairat registration settings for a mosque
 */
export async function getKhairatRegistrationSettings(mosqueId: string): Promise<ApiResponse<KariahRegistrationSettings>> {
  try {
    const { data: mosque, error } = await supabase
      .from('mosques')
      .select('settings')
      .eq('id', mosqueId)
      .single();

    if (error) {
      return { success: false, error: `Failed to fetch mosque settings: ${error.message}` };
    }

    const khairatSettings = mosque?.settings?.khairat_registration || {
      requirements: '',
      benefits: '',
      custom_message: ''
    };

    return { success: true, data: khairatSettings };
  } catch (error) {
    console.error('Error fetching khairat registration settings:', error);
    return { success: false, error: 'Failed to fetch khairat registration settings' };
  }
}

/**
 * Update khairat registration settings for a mosque
 */
export async function updateKhairatRegistrationSettings(
  mosqueId: string, 
  settings: KariahRegistrationSettings
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    // First, get the current settings to preserve other settings
    const { data: currentMosque, error: fetchError } = await supabase
      .from('mosques')
      .select('settings')
      .eq('id', mosqueId)
      .single();

    if (fetchError) {
      return { success: false, error: `Failed to fetch current settings: ${fetchError.message}` };
    }

    // Merge the new khairat registration settings with existing settings
    const currentSettings = currentMosque?.settings || {};
    const updatedSettings = {
      ...currentSettings,
      khairat_registration: settings
    };

    const { error } = await supabase
      .from('mosques')
      .update({
        settings: updatedSettings
      })
      .eq('id', mosqueId);

    if (error) {
      return { success: false, error: `Failed to update settings: ${error.message}` };
    }

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error('Error updating khairat registration settings:', error);
    return { success: false, error: 'Failed to update khairat registration settings' };
  }
}