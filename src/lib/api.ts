// API utilities for interacting with the Supabase database
// This file provides helper functions for common database operations

import { supabase } from './supabase';
import {
  UserProfile,
  UpdateUserProfile,
  Mosque,
  UpdateMosque,
  Event,
  CreateEvent,
  UpdateEvent,
  EventRegistration,
  MosqueFollower,
  Donation,
  CreateDonation,
  KhairatProgram,
  KhairatContribution,
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

    // First, handle mosque creation or joining
    let mosqueId: string | undefined;

    if (onboardingData.accountType === 'admin') {
      if (onboardingData.mosqueAction === 'create' && onboardingData.mosqueName) {
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
            user_id: userId, // Set the creator as the mosque owner
            is_private: false, // Default to public profile
          })
          .select()
          .single();

        if (mosqueError) {
          console.error('Mosque creation error:', mosqueError);
          return { success: false, error: `Failed to create mosque: ${mosqueError.message}` };
        }

        mosqueId = mosque.id;

        // TODO: Create default Khairat program for the new mosque
        // This functionality can be added later if needed
      } else if (onboardingData.mosqueAction === 'join' && onboardingData.existingMosqueId) {
        mosqueId = onboardingData.existingMosqueId;

        // Add user as admin of existing mosque
        await supabase
          .from('mosque_members')
          .insert({
            user_id: userId,
            mosque_id: mosqueId,
            role: 'admin',
            assigned_by: userId,
          });
      }
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
    console.log('[API] getMosque - Starting request for mosqueId:', mosqueId);
    const { data, error } = await supabase
      .from('mosques')
      .select('*')
      .eq('id', mosqueId)
      .single();

    if (error) {
      console.error('[API] getMosque - Supabase error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[API] getMosque - Catch error:', error);
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

// =============================================
// EVENT OPERATIONS
// =============================================

/**
 * Get events for a mosque
 */
export async function getEvents(
  mosqueId: string,
  limit = 10,
  offset = 0
): Promise<PaginatedResponse<Event>> {
  try {
    console.log('[API] getEvents - Starting request for mosqueId:', mosqueId, 'limit:', limit, 'offset:', offset);
    const { data, error, count } = await supabase
      .from('events')
      .select('*, creator:user_profiles(full_name)', { count: 'exact' })
      .eq('mosque_id', mosqueId)
      .eq('status', 'published')
      .order('event_date', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[API] getEvents - Supabase error:', error);
      throw new Error(error.message);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    console.log('[API] getEvents - Success, count:', totalCount, 'data length:', data?.length || 0);
    return {
      data: data || [],
      count: totalCount,
      page: currentPage,
      limit,
      total_pages: totalPages,
      has_next: currentPage < totalPages,
      has_prev: currentPage > 1,
    };
  } catch (error) {
    console.error('[API] getEvents - Catch error:', error);
    throw new Error('Failed to fetch events');
  }
}

/**
 * Get all events from all mosques (public access)
 */
export async function getAllEvents(
  limit = 10,
  offset = 0
): Promise<PaginatedResponse<Event & { mosque: { name: string; id: string } }>> {
  try {
    console.log('[API] getAllEvents - Starting request, limit:', limit, 'offset:', offset);
    const { data, error, count } = await supabase
      .from('events')
      .select('*, creator:user_profiles(full_name), mosque:mosques(id, name)', { count: 'exact' })
      .eq('status', 'published')
      .order('event_date', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[API] getAllEvents - Supabase error:', error);
      throw new Error(error.message);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    console.log('[API] getAllEvents - Success, count:', totalCount, 'data length:', data?.length || 0);
    return {
      data: data || [],
      count: totalCount,
      page: currentPage,
      limit,
      total_pages: totalPages,
      has_next: currentPage < totalPages,
      has_prev: currentPage > 1,
    };
  } catch (error) {
    console.error('[API] getAllEvents - Catch error:', error);
    throw new Error('Failed to fetch all events');
  }
}

/**
 * Get a single event by ID
 */
export async function getEventById(eventId: string): Promise<ApiResponse<Event>> {
  try {
    console.log('[API] getEventById - Starting request for eventId:', eventId);
    const { data, error } = await supabase
      .from('events')
      .select('*, creator:user_profiles(full_name), mosque:mosques(name)')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('[API] getEventById - Supabase error:', error);
      return { success: false, error: error.message };
    }

    console.log('[API] getEventById - Success:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[API] getEventById - Catch error:', error);
    return { success: false, error: 'Failed to fetch event' };
  }
}

/**
 * Create a new event
 */
export async function createEvent(eventData: CreateEvent): Promise<ApiResponse<Event>> {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to create event' };
  }
}

/**
 * Register for an event
 */
export async function registerForEvent(
  eventId: string,
  userId: string
): Promise<ApiResponse<EventRegistration>> {
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .insert({
        event_id: eventId,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to register for event' };
  }
}

/**
 * Check if user is registered for specific events
 */
export async function getUserEventRegistrations(
  userId: string,
  eventIds: string[]
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('event_id')
      .eq('user_id', userId)
      .in('event_id', eventIds);

    if (error) {
      console.error('Failed to get user event registrations:', error);
      return [];
    }

    return data?.map(reg => reg.event_id) || [];
  } catch (error) {
    console.error('Failed to get user event registrations:', error);
    return [];
  }
}

/**
 * Check if user is registered for a specific event
 */
export async function isUserRegisteredForEvent(
  userId: string,
  eventId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking event registration:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking event registration:', error);
    return false;
  }
}

/**
 * Update an existing event
 */
export async function updateEvent(
  eventId: string,
  updates: UpdateEvent
): Promise<ApiResponse<Event>> {
  try {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to update event' };
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete event' };
  }
}

/**
 * Get user's personal events (events they created or registered for)
 */
export async function getUserEvents(
  userId: string,
  limit = 10,
  offset = 0
): Promise<PaginatedResponse<Event & { mosque: { name: string; id: string } }>> {
  try {
    console.log('[API] getUserEvents - Starting request for userId:', userId, 'limit:', limit, 'offset:', offset);
    
    // First, get events the user created
    const { data: createdEvents, error: createdError } = await supabase
      .from('events')
      .select(`
        *,
        creator:user_profiles(full_name),
        mosque:mosques(id, name)
      `)
      .eq('created_by', userId)
      .eq('status', 'published');

    if (createdError) {
      console.error('[API] getUserEvents - Created events error:', createdError);
      throw new Error(createdError.message);
    }

    // Then, get events the user registered for
    const { data: registeredEvents, error: registeredError } = await supabase
      .from('event_registrations')
      .select(`
        event:events(
          *,
          creator:user_profiles(full_name),
          mosque:mosques(id, name)
        )
      `)
      .eq('user_id', userId)
      .eq('event.status', 'published');

    if (registeredError) {
      console.error('[API] getUserEvents - Registered events error:', registeredError);
      throw new Error(registeredError.message);
    }

    // Combine and deduplicate events
    const allEvents = [...(createdEvents || [])];
    const registeredEventData = registeredEvents?.map(reg => reg.event).filter(Boolean) || [];
    
    // Add registered events that aren't already in created events
    registeredEventData.forEach((event: unknown) => {
      if (event && typeof event === 'object' && 'id' in event && !allEvents.find(e => e.id === (event as { id: string }).id)) {
        allEvents.push(event as Event);
      }
    });

    // Sort by event date
    allEvents.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

    // Apply pagination
    const totalCount = allEvents.length;
    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = Math.floor(offset / limit) + 1;
    const paginatedEvents = allEvents.slice(offset, offset + limit);

    console.log('[API] getUserEvents - Success, count:', totalCount, 'data length:', paginatedEvents.length);
    return {
      data: paginatedEvents,
      count: totalCount,
      page: currentPage,
      limit,
      total_pages: totalPages,
      has_next: currentPage < totalPages,
      has_prev: currentPage > 1,
    };
  } catch (error) {
    console.error('[API] getUserEvents - Catch error:', error);
    throw new Error('Failed to fetch user events');
  }
}

// =============================================
// DONATION OPERATIONS
// =============================================

/**
 * Get donation categories for a mosque
 */
export async function getDonationCategories(mosqueId: string) {
  try {
    const { data, error } = await supabase
      .from('donation_categories')
      .select('*')
      .eq('mosque_id', mosqueId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to fetch donation categories' };
  }
}

/**
 * Create a donation
 */
export async function createDonation(donationData: CreateDonation): Promise<ApiResponse<Donation>> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .insert(donationData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to create donation' };
  }
}

/**
 * Get user's donation history
 */
export async function getUserDonations(
  userId: string,
  limit = 10,
  offset = 0
): Promise<PaginatedResponse<Donation>> {
  try {
    const { data, error, count } = await supabase
      .from('donations')
      .select('*, category:donation_categories(name)', { count: 'exact' })
      .eq('donor_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(error.message);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    return {
      data: data || [],
      count: totalCount,
      page: currentPage,
      limit,
      total_pages: totalPages,
      has_next: currentPage < totalPages,
      has_prev: currentPage > 1,
    };
  } catch (error) {
    throw new Error('Failed to fetch donation history');
  }
}

// =============================================
// KHAIRAT OPERATIONS (Dedicated tables)
// =============================================

/**
 * Get khairat programs for a mosque
 */
export async function getKhairatPrograms(
  mosqueId: string
): Promise<ApiResponse<KhairatProgram[]>> {
  try {
    const { data, error } = await supabase
      .from('khairat_programs')
      .select('*')
      .eq('mosque_id', mosqueId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to fetch khairat programs' };
  }
}


/**
 * Create khairat contribution
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
export async function getUserKhairatContributions(
  userId: string,
  limit = 20,
  offset = 0
): Promise<PaginatedResponse<KhairatContribution & { program: KhairatProgram & { mosque: Mosque } }>> {
  try {
    const { data, error, count } = await supabase
      .from('khairat_contributions')
      .select(`
        *,
        program:khairat_programs(
          *,
          mosque:mosques(
            id,
            name,
            address
          )
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
 * Get khairat contributions for a specific program (admin view)
 */
export async function getKhairatContributions(
  programId: string,
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
      .eq('program_id', programId)
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
 * Update khairat program (dedicated table)
 */
export async function updateKhairatProgram(
  programId: string,
  updateData: Partial<Omit<KhairatProgram, 'id' | 'created_at' | 'updated_at' | 'current_amount'>>
): Promise<ApiResponse<KhairatProgram>> {
  try {
    const { data, error } = await supabase
      .from('khairat_programs')
      .update(updateData)
      .eq('id', programId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to update khairat program' };
  }
}

/**
 * Delete khairat program (dedicated table)
 */
export async function deleteKhairatProgram(
  programId: string
): Promise<ApiResponse<{ success: true }>> {
  try {
    const { error } = await supabase
      .from('khairat_programs')
      .delete()
      .eq('id', programId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { success: true } };
  } catch (error) {
    return { success: false, error: 'Failed to delete khairat program' };
  }
}

/**
 * Get all khairat contributions for a mosque (admin view)
 */
export async function getMosqueKhairatContributions(
  mosqueId: string,
  limit = 20,
  offset = 0
): Promise<PaginatedResponse<KhairatContribution & { program: KhairatProgram; contributor?: UserProfile }>> {
  try {
    const { data, error, count } = await supabase
      .from('khairat_contributions')
      .select(`
        *,
        program:khairat_programs!inner(
          id,
          name,
          mosque_id
        ),
        contributor:user_profiles(
          id,
          full_name,
          phone
        )
      `, { count: 'exact' })
      .eq('program.mosque_id', mosqueId)
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
 * Create khairat program (legacy function)
 */
export async function createKhairatProgram(
  programData: Omit<KhairatProgram, 'id' | 'created_at' | 'updated_at' | 'current_amount'>
): Promise<ApiResponse<KhairatProgram>> {
  try {
    const { data, error } = await supabase
      .from('khairat_programs')
      .insert({
        ...programData,
        current_amount: 0
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to create khairat program' };
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

    // Get event counts
    const { count: totalEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('mosque_id', mosqueId);

    const { count: upcomingEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('mosque_id', mosqueId)
      .eq('status', 'published')
      .gte('event_date', new Date().toISOString());

    // Get donation counts and amounts
    const { count: totalDonations } = await supabase
      .from('donations')
      .select('*', { count: 'exact', head: true })
      .eq('mosque_id', mosqueId)
      .eq('status', 'completed');

    // Get total donation amount
    const { data: totalDonationData } = await supabase
      .from('donations')
      .select('amount')
      .eq('mosque_id', mosqueId)
      .eq('status', 'completed');

    const totalDonationAmount = totalDonationData?.reduce((sum, donation) => sum + donation.amount, 0) || 0;

    // Get monthly donation data
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: monthlyDonations } = await supabase
      .from('donations')
      .select('*', { count: 'exact', head: true })
      .eq('mosque_id', mosqueId)
      .eq('status', 'completed')
      .gte('created_at', startOfMonth.toISOString());

    const { data: monthlyDonationData } = await supabase
      .from('donations')
      .select('amount')
      .eq('mosque_id', mosqueId)
      .eq('status', 'completed')
      .gte('created_at', startOfMonth.toISOString());

    const monthlyDonationAmount = monthlyDonationData?.reduce((sum, donation) => sum + donation.amount, 0) || 0;

    // Get previous month donation amount for growth calculation
    const startOfPreviousMonth = new Date(startOfMonth);
    startOfPreviousMonth.setMonth(startOfPreviousMonth.getMonth() - 1);
    const endOfPreviousMonth = new Date(startOfMonth);
    endOfPreviousMonth.setTime(endOfPreviousMonth.getTime() - 1);

    const { data: previousMonthDonationData } = await supabase
      .from('donations')
      .select('amount')
      .eq('mosque_id', mosqueId)
      .eq('status', 'completed')
      .gte('created_at', startOfPreviousMonth.toISOString())
      .lte('created_at', endOfPreviousMonth.toISOString());

    const previousMonthDonationAmount = previousMonthDonationData?.reduce((sum, donation) => sum + donation.amount, 0) || 0;
    const donationTrendPercentage = previousMonthDonationAmount > 0 
      ? ((monthlyDonationAmount - previousMonthDonationAmount) / previousMonthDonationAmount) * 100
      : 0;

    // Get contribution program counts and progress
    const { count: totalKhairatPrograms } = await supabase
      .from('khairat_programs')
      .select('*', { count: 'exact', head: true })
      .eq('mosque_id', mosqueId);

    const { count: activeKhairatPrograms } = await supabase
      .from('khairat_programs')
      .select('*', { count: 'exact', head: true })
      .eq('mosque_id', mosqueId)
      .eq('is_active', true);

    // Get detailed contribution program progress
    const { data: contributionPrograms } = await supabase
      .from('khairat_programs')
      .select('id, name, current_amount, target_amount')
      .eq('mosque_id', mosqueId)
      .eq('is_active', true)
      .limit(5);

    const khairatProgramsProgress = contributionPrograms?.map(program => ({
      id: program.id,
      name: program.name,
      current_amount: program.current_amount,
      target_amount: program.target_amount || 0,
      progress_percentage: program.target_amount > 0 
        ? Math.min((program.current_amount / program.target_amount) * 100, 100)
        : 0
    })) || [];

    // Calculate total khairat amount and monthly contributions
    const totalKhairatAmount = contributionPrograms?.reduce((sum, program) => sum + program.current_amount, 0) || 0;
    
    // Get monthly khairat contributions by joining with khairat_programs
    const { data: monthlyKhairatData } = await supabase
      .from('khairat_contributions')
      .select('amount, khairat_programs!inner(mosque_id)')
      .eq('khairat_programs.mosque_id', mosqueId)
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
      total_contribution_programs: totalKhairatPrograms || 0,
      active_contribution_programs: activeKhairatPrograms || 0,
      total_khairat_programs: totalKhairatPrograms || 0,
      active_khairat_programs: activeKhairatPrograms || 0,
      unread_notifications: 0, // This would be user-specific
      recent_activities: [], // This would require a separate query
      // Enhanced metrics
      total_donation_amount: totalDonationAmount,
      monthly_donation_amount: monthlyDonationAmount,
      previous_month_donation_amount: previousMonthDonationAmount,
      donation_trend_percentage: donationTrendPercentage,
      khairat_programs_progress: khairatProgramsProgress,
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
): Promise<ApiResponse<Array<{ type: 'event'; id: string; title: string; description?: string; event_date: string }>>> {
  try {
    // Search across multiple tables
    const eventsResult = await supabase
      .from('events')
      .select('id, title, description, event_date')
      .eq('mosque_id', mosqueId)
      .ilike('title', `%${query}%`)
      .limit(limit);

    const results = [
      ...(eventsResult.data || []).map(item => ({ ...item, type: 'event' as const }))
    ];

    return { success: true, data: results };
  } catch (error) {
    return { success: false, error: 'Search failed' };
  }
}

// =============================================
// MOSQUE FOLLOWING OPERATIONS
// =============================================

/**
 * Follow a mosque
 */
export async function followMosque(
  userId: string,
  mosqueId: string
): Promise<ApiResponse<MosqueFollower>> {
  try {
    // Check if user is already following this mosque
    const { data: existing, error: checkError } = await supabase
      .from('mosque_followers')
      .select('id')
      .eq('user_id', userId)
      .eq('mosque_id', mosqueId)
      .single();

    if (existing) {
      return { success: false, error: 'You are already following this mosque' };
    }

    const { data, error } = await supabase
      .from('mosque_followers')
      .insert({
        user_id: userId,
        mosque_id: mosqueId,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to follow mosque' };
  }
}

/**
 * Unfollow a mosque
 */
export async function unfollowMosque(
  userId: string,
  mosqueId: string
): Promise<ApiResponse<{ success: true }>> {
  try {
    const { error } = await supabase
      .from('mosque_followers')
      .delete()
      .eq('user_id', userId)
      .eq('mosque_id', mosqueId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { success: true } };
  } catch (error) {
    return { success: false, error: 'Failed to unfollow mosque' };
  }
}

/**
 * Check if user is following a mosque
 */
export async function isUserFollowingMosque(
  userId: string,
  mosqueId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('mosque_followers')
      .select('id')
      .eq('user_id', userId)
      .eq('mosque_id', mosqueId)
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Get mosques that a user is following
 */
export async function getUserFollowedMosques(
  userId: string,
  limit = 20,
  offset = 0
): Promise<PaginatedResponse<Mosque>> {
  try {
    const { data, error, count } = await supabase
      .from('mosque_followers')
      .select(`
        mosques(*)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .range(offset, offset + limit - 1)
      .order('followed_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const mosques = (data?.map(item => item.mosques).filter(Boolean) || []) as unknown as Mosque[];
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    return {
      data: mosques,
      count: totalCount,
      page: currentPage,
      limit,
      total_pages: totalPages,
      has_next: currentPage < totalPages,
      has_prev: currentPage > 1,
    };
  } catch (error) {
    throw new Error('Failed to fetch followed mosques');
  }
}

/**
 * Get follower count for a mosque
 */
export async function getMosqueFollowerCount(mosqueId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('mosque_followers')
      .select('*', { count: 'exact', head: true })
      .eq('mosque_id', mosqueId);

    if (error) {
      console.error('Error fetching mosque follower count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error fetching mosque follower count:', error);
    return 0;
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
    if (filters?.claimant_id) {
      params.append('claimantId', filters.claimant_id);
    }
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
        mosqueId: claimData.mosque_id,
        claimAmount: claimData.requested_amount,
        reason: claimData.title,
        description: claimData.description,
        priority: claimData.priority,
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
    // Build query parameters
    const params = new URLSearchParams();
    params.append('claimantId', userId);
    
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
  uploadedBy: string
): Promise<ApiResponse<any>> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadedBy', uploadedBy);

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