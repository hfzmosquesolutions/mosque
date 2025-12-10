// Kariah Memberships API Functions
// Handles kariah membership operations with client-side authentication

import { supabase } from '../supabase';

export interface KariahMembership {
  id: string;
  user_id: string;
  mosque_id: string;
  membership_number?: string;
  status: 'active' | 'inactive' | 'suspended';
  joined_date: string;
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

export interface KariahMembershipFilters {
  mosque_id?: string;
  user_id?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Get kariah memberships with filtering and pagination
 */
export async function getKariahMemberships(filters: KariahMembershipFilters = {}) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const {
    mosque_id,
    user_id,
    status,
    search,
    page = 1,
    limit = 10
  } = filters;

  let query = supabase
    .from('kariah_members')
    .select(`
      *,
      user:user_profiles!kariah_members_user_id_fkey(id, full_name, phone, ic_passport_number),
      mosque:mosques(id, name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  // If user_id is provided, get memberships for that user
  if (user_id) {
    // Users can only see their own memberships unless they're admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.user.id)
      .single();

    if (user.user.id !== user_id && userProfile?.role !== 'admin') {
      throw new Error('Forbidden: Cannot access other user memberships');
    }

    query = query.eq('user_id', user_id);
  }
  // If mosque_id is provided, get memberships for that mosque (admin only)
  else if (mosque_id) {
    // Check if user is admin of the mosque
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.user.id)
      .single();

    const { data: mosqueAdmin } = await supabase
      .from('mosques')
      .select('user_id')
      .eq('id', mosque_id)
      .single();

    if (userProfile?.role !== 'admin' && mosqueAdmin?.user_id !== user.user.id) {
      throw new Error('Forbidden: Not authorized to access mosque memberships');
    }

    query = query.eq('mosque_id', mosque_id);
  }
  // Otherwise, get user's own memberships
  else {
    query = query.eq('user_id', user.user.id);
  }

  // Apply status filter
  if (status) {
    query = query.eq('status', status);
  }

  // Apply search filter (for admin views)
  if (search && mosque_id) {
    query = query.or(`user.full_name.ilike.%${search}%,membership_number.ilike.%${search}%`);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: memberships, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch kariah memberships: ${error.message}`);
  }

  return {
    memberships: memberships || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
}

/**
 * Create a kariah membership (admin only)
 */
export async function createKariahMembership(membershipData: {
  user_id: string;
  mosque_id: string;
  notes?: string;
}) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { user_id, mosque_id, notes } = membershipData;

  if (!user_id || !mosque_id) {
    throw new Error('User ID and Mosque ID are required');
  }

  // Check if current user is admin of the mosque
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();

  const { data: mosqueAdmin } = await supabase
    .from('mosques')
    .select('user_id')
    .eq('id', mosque_id)
    .single();

  if (userProfile?.role !== 'admin' && mosqueAdmin?.user_id !== user.user.id) {
    throw new Error('Forbidden: Not authorized to create memberships for this mosque');
  }

  // Check if membership already exists
  const { data: existingMembership } = await supabase
    .from('kariah_members')
    .select('id, status')
    .eq('user_id', user_id)
    .eq('mosque_id', mosque_id)
    .single();

  if (existingMembership) {
    throw new Error(`User already has a ${existingMembership.status} membership`);
  }

  // Create the membership
  const { data: membership, error } = await supabase
    .from('kariah_members')
    .insert({
      user_id,
      mosque_id,
      status: 'active',
      joined_date: new Date().toISOString(),
      notes: notes || null
    })
    .select(`
      *,
      user:user_profiles!kariah_members_user_id_fkey(id, full_name, phone),
      mosque:mosques(id, name)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create membership: ${error.message}`);
  }

  return {
    message: 'Membership created successfully',
    membership
  };
}

/**
 * Get kariah membership by ID
 */
export async function getKariahMembershipById(membershipId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  if (!membershipId) {
    throw new Error('Membership ID is required');
  }

  const { data: membership, error } = await supabase
    .from('kariah_members')
    .select(`
      *,
      user:user_profiles!kariah_members_user_id_fkey(id, full_name, phone),
      mosque:mosques(id, name, user_id)
    `)
    .eq('id', membershipId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch membership: ${error.message}`);
  }

  if (!membership) {
    throw new Error('Membership not found');
  }

  // Check if user can access this membership
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();

  const isOwner = membership.user_id === user.user.id;
  const isAdmin = userProfile?.role === 'admin';
  const isMosqueAdmin = membership.mosque?.user_id === user.user.id;

  if (!isOwner && !isAdmin && !isMosqueAdmin) {
    throw new Error('Forbidden: Cannot access this membership');
  }

  return membership;
}

/**
 * Update a kariah membership (admin only)
 */
export async function updateKariahMembership(
  membershipId: string,
  updateData: {
    status?: 'active' | 'inactive' | 'suspended';
    membership_number?: string;
    notes?: string;
  }
) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  if (!membershipId) {
    throw new Error('Membership ID is required');
  }

  // Get the membership first to check mosque admin rights
  const { data: existingMembership, error: fetchError } = await supabase
    .from('kariah_members')
    .select(`
      *,
      mosque:mosques(id, name, user_id)
    `)
    .eq('id', membershipId)
    .single();

  if (fetchError || !existingMembership) {
    throw new Error('Membership not found');
  }

  // Check if user is admin of the mosque
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();

  const isAdmin = userProfile?.role === 'admin';
  const isMosqueAdmin = existingMembership.mosque?.user_id === user.user.id;

  if (!isAdmin && !isMosqueAdmin) {
    throw new Error('Forbidden: Not authorized to update this membership');
  }

  // Update the membership
  const { data: membership, error } = await supabase
    .from('kariah_members')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', membershipId)
    .select(`
      *,
      user:user_profiles!kariah_members_user_id_fkey(id, full_name, phone),
      mosque:mosques(id, name)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to update membership: ${error.message}`);
  }

  return {
    message: 'Membership updated successfully',
    membership
  };
}

/**
 * Delete a kariah membership (admin only)
 */
export async function deleteKariahMembership(membershipId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  if (!membershipId) {
    throw new Error('Membership ID is required');
  }

  // Get the membership first to check mosque admin rights
  const { data: existingMembership, error: fetchError } = await supabase
    .from('kariah_members')
    .select(`
      *,
      mosque:mosques(id, name, user_id)
    `)
    .eq('id', membershipId)
    .single();

  if (fetchError || !existingMembership) {
    throw new Error('Membership not found');
  }

  // Check if user is admin of the mosque
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();

  const isAdmin = userProfile?.role === 'admin';
  const isMosqueAdmin = existingMembership.mosque?.user_id === user.user.id;

  if (!isAdmin && !isMosqueAdmin) {
    throw new Error('Forbidden: Not authorized to delete this membership');
  }

  const { error } = await supabase
    .from('kariah_members')
    .delete()
    .eq('id', membershipId);

  if (error) {
    throw new Error(`Failed to delete membership: ${error.message}`);
  }

  return {
    message: 'Membership deleted successfully'
  };
}

/**
 * Withdraw a kariah membership (user can withdraw their own active membership)
 */
export async function withdrawKariahMembership(membershipId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  if (!membershipId) {
    throw new Error('Membership ID is required');
  }

  // Get the membership first to check ownership and status
  const { data: existingMembership, error: fetchError } = await supabase
    .from('kariah_members')
    .select(`
      *,
      mosque:mosques(id, name)
    `)
    .eq('id', membershipId)
    .single();

  if (fetchError || !existingMembership) {
    throw new Error('Membership not found');
  }

  // Check if user owns this membership
  if (existingMembership.user_id !== user.user.id) {
    throw new Error('Forbidden: You can only withdraw your own membership');
  }

  // Allow withdrawal of membership regardless of status

  // Delete the membership record
  const { error: deleteError } = await supabase
    .from('kariah_members')
    .delete()
    .eq('id', membershipId);

  if (deleteError) {
    throw new Error(`Failed to withdraw membership: ${deleteError.message}`);
  }

  // Delete the corresponding application record if it exists
  const { error: deleteAppError } = await supabase
    .from('kariah_applications')
    .delete()
    .eq('user_id', user.user.id)
    .eq('mosque_id', existingMembership.mosque_id)
    .eq('status', 'approved');

  // Note: We don't throw an error if application deletion fails,
  // as the membership withdrawal is the primary action
  if (deleteAppError) {
    console.warn('Failed to delete application record:', deleteAppError.message);
  }

  return {
    message: 'Membership and application records withdrawn successfully',
    membership: existingMembership
  };
}

/**
 * Get membership statistics for a mosque (admin only)
 */
export async function getMembershipStatistics(mosqueId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  if (!mosqueId) {
    throw new Error('Mosque ID is required');
  }

  // Check if user is admin of the mosque
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();

  const { data: mosqueAdmin } = await supabase
    .from('mosques')
    .select('user_id')
    .eq('id', mosqueId)
    .single();

  if (userProfile?.role !== 'admin' && mosqueAdmin?.user_id !== user.user.id) {
    throw new Error('Forbidden: Not authorized to access mosque statistics');
  }

  // Only count actual memberships (exclude application statuses: pending, rejected, withdrawn, under_review)
  // Membership statuses are: active, inactive, suspended
  const membershipStatuses = ['active', 'inactive', 'suspended'];

  // Get counts for each membership status using count queries
  const [activeCount, inactiveCount, suspendedCount, totalCount] = await Promise.all([
    supabase
      .from('kariah_members')
      .select('id', { count: 'exact', head: true })
      .eq('mosque_id', mosqueId)
      .eq('status', 'active'),
    supabase
      .from('kariah_members')
      .select('id', { count: 'exact', head: true })
      .eq('mosque_id', mosqueId)
      .eq('status', 'inactive'),
    supabase
      .from('kariah_members')
      .select('id', { count: 'exact', head: true })
      .eq('mosque_id', mosqueId)
      .eq('status', 'suspended'),
    supabase
      .from('kariah_members')
      .select('id', { count: 'exact', head: true })
      .eq('mosque_id', mosqueId)
      .in('status', membershipStatuses)
  ]);

  // Check for errors
  if (activeCount.error || inactiveCount.error || suspendedCount.error || totalCount.error) {
    const errors = [activeCount.error, inactiveCount.error, suspendedCount.error, totalCount.error]
      .filter(Boolean)
      .map(e => e?.message)
      .join(', ');
    throw new Error(`Failed to fetch membership statistics: ${errors}`);
  }

  const statistics = {
    total: totalCount.count || 0,
    active: activeCount.count || 0,
    inactive: inactiveCount.count || 0,
    suspended: suspendedCount.count || 0
  };

  return statistics;
}