import { supabase } from '@/lib/supabase';
import { KhairatMember } from '@/types/database';
import { createNotification } from './notifications';

export interface KhairatMemberFilters {
  mosque_id?: string;
  status?: string;
  user_id?: string;
  ic_passport_number?: string;
}

export interface KhairatMemberCreateData {
  mosque_id: string;
  ic_passport_number?: string;
  application_reason?: string;
  // Member data fields (collected for all users)
  full_name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface KhairatMemberUpdateData {
  status?: 'pending' | 'approved' | 'rejected' | 'under_review' | 'withdrawn' | 'active' | 'inactive' | 'suspended';
  admin_notes?: string;
  notes?: string;
  joined_date?: string;
}

/**
 * Get khairat members with optional filters
 * Can be used with or without authentication
 */
export async function getKhairatMembers(filters: KhairatMemberFilters = {}) {
  const { data: user } = await supabase.auth.getUser();
  const isAuthenticated = !!user.user;

  // If checking by IC number, allow without authentication or with authentication
  // SECURITY: This is only for anonymous registrations (user_id = NULL)
  // Registered users should use their account to access their records
  // We limit what data is returned to prevent information gathering attacks
  if (filters.ic_passport_number) {
    let query = supabase
      .from('khairat_members')
      .select(`
        id,
        mosque_id,
        ic_passport_number,
        status,
        membership_number,
        full_name,
        phone,
        email,
        created_at,
        updated_at
      `) // Limited fields - exclude sensitive data like address, admin_notes, etc.
      .eq('ic_passport_number', filters.ic_passport_number)
      .is('user_id', null); // SECURITY: Only query anonymous registrations
    
    if (filters.mosque_id) {
      query = query.eq('mosque_id', filters.mosque_id);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch khairat members: ${error.message}`);
    }

    // Additional security check: If user is authenticated, also check their own records
    // This allows logged-in users to verify their own membership even if they registered anonymously
    const { data: authUser } = await supabase.auth.getUser();
    if (authUser.user) {
      // Also check for records belonging to the authenticated user
      let userQuery = supabase
        .from('khairat_members')
        .select(`
          id,
          mosque_id,
          ic_passport_number,
          status,
          membership_number,
          full_name,
          phone,
          email,
          created_at,
          updated_at
        `)
        .eq('ic_passport_number', filters.ic_passport_number)
        .eq('user_id', authUser.user.id); // Only their own records
      
      if (filters.mosque_id) {
        userQuery = userQuery.eq('mosque_id', filters.mosque_id);
      }
      
      if (filters.status) {
        userQuery = userQuery.eq('status', filters.status);
      }

      const { data: userData } = await userQuery;
      
      // Combine results (anonymous + own records)
      if (userData && userData.length > 0) {
        return [...(data || []), ...userData] as KhairatMember[];
      }
    }

    return data as KhairatMember[];
  }

  // For authenticated requests without IC filter, require auth
  if (!isAuthenticated) {
    throw new Error('Authentication required');
  }

  // Optimize query: only fetch needed fields and skip dependents for better performance
  // When fetching by user_id (common for my-mosques page), we don't need all fields or dependents
  // This significantly improves load time for the my-mosques page
  const isUserQuery = !!filters.user_id;
  
  let query;
  if (isUserQuery) {
    // Lightweight query for user's own memberships (my-mosques page)
    // Only fetch essential fields - no dependents, no full member details
    query = supabase
      .from('khairat_members')
      .select(`
        id,
        mosque_id,
        user_id,
        status,
        created_at,
        updated_at,
        admin_notes,
        membership_number,
        mosque:mosques(id, name, logo_url, banner_url, address)
      `)
      .order('created_at', { ascending: false });
  } else {
    // Full query for admin/other use cases that need complete member data
    query = supabase
      .from('khairat_members')
      .select(`
        *,
        mosque:mosques(id, name, logo_url, banner_url, address),
        dependents:khairat_member_dependents(*)
      `)
      .order('created_at', { ascending: false });
  }
  
  // Using direct fields from khairat_members table (full_name, phone, email, address)
  // instead of joining with user_profiles

  // Apply filters
  if (filters.mosque_id) {
    query = query.eq('mosque_id', filters.mosque_id);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch khairat members: ${error.message}`);
  }

  return data as KhairatMember[];
}

/**
 * Get khairat member by ID
 */
export async function getKhairatMemberById(memberId: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('Authentication required');
  }

  const { data, error } = await supabase
    .from('khairat_members')
    .select(`
      *,
      mosque:mosques(id, name),
      dependents:khairat_member_dependents(*)
    `)
    .eq('id', memberId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch khairat member: ${error.message}`);
  }

  return data as KhairatMember;
}

/**
 * Submit a khairat application/registration
 */
export async function submitKhairatApplication(applicationData: KhairatMemberCreateData) {
  const { data: user } = await supabase.auth.getUser();
  const userId = user.user?.id || null; // Allow null for non-logged in users

  const { 
    mosque_id, 
    ic_passport_number, 
    application_reason,
    full_name,
    phone,
    email,
    address
  } = applicationData;

  // Validate IC number is provided (required for uniqueness check)
  if (!ic_passport_number || ic_passport_number.trim() === '') {
    throw new Error('IC / Passport number is required');
  }

  // Check for existing records by IC number and mosque (more important than user_id)
  const { data: existingByIC } = await supabase
    .from('khairat_members')
    .select('id, status, user_id')
    .eq('ic_passport_number', ic_passport_number.trim())
    .eq('mosque_id', mosque_id)
    .order('created_at', { ascending: false });

  // If user is logged in, also check by user_id
  let existingByUser: any[] = [];
  if (userId) {
    const { data: userRecords } = await supabase
      .from('khairat_members')
      .select('id, status')
      .eq('user_id', userId)
      .eq('mosque_id', mosque_id)
      .order('created_at', { ascending: false });
    existingByUser = userRecords || [];
  }

  // Use IC-based check as primary (since IC is unique identifier)
  const existingRecords = existingByIC || [];

  if (existingRecords && existingRecords.length > 0) {
    // Check for active/pending/approved records
    const activeRecords = existingRecords.filter(record => 
      ['pending', 'approved', 'active'].includes(record.status)
    );

    if (activeRecords.length > 0) {
      const latestActive = activeRecords[0];
      if (latestActive.status === 'pending' || latestActive.status === 'approved') {
        throw new Error('You already have a pending or approved application for this mosque');
      }
      if (latestActive.status === 'active') {
        throw new Error('You are already a khairat member of this mosque');
      }
    }

    // Check for withdrawn/rejected records that can be reactivated
    const withdrawnOrRejectedRecords = existingRecords.filter(record => 
      ['withdrawn', 'rejected'].includes(record.status)
    );

    if (withdrawnOrRejectedRecords.length > 0) {
      const latestWithdrawnOrRejected = withdrawnOrRejectedRecords[0];

      // Update the withdrawn/rejected application to pending instead of creating new
      const { error: updateError } = await supabase
        .from('khairat_members')
        .update({
          status: 'pending',
          ic_passport_number: ic_passport_number || null,
          application_reason: application_reason || null,
          full_name: full_name || null,
          phone: phone || null,
          email: email || null,
          address: address || null,
          admin_notes: null, // Clear any admin notes from previous rejection
          reviewed_by: null, // Clear reviewer info
          reviewed_at: null, // Clear review date
          updated_at: new Date().toISOString()
        })
        .eq('id', latestWithdrawnOrRejected.id);

      if (updateError) {
        throw new Error(`Failed to reactivate application: ${updateError.message}`);
      }

      return {
        message: 'Application reactivated successfully',
        memberId: latestWithdrawnOrRejected.id
      };
    }
  }

  // Create the application
  const { data: member, error } = await supabase
    .from('khairat_members')
    .insert({
      user_id: userId, // Can be null for non-logged in users
      mosque_id,
      ic_passport_number: ic_passport_number || null,
      application_reason: application_reason || null,
      full_name: full_name || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      status: 'pending'
    })
    .select(`
      *,
      user:user_profiles!khairat_members_user_id_fkey(id, full_name, phone),
      mosque:mosques(id, name)
    `)
    .single();

  if (error) {
    // Handle unique constraint violations
    if (error.code === '23505') {
      if (error.message.includes('khairat_members_user_mosque_unique')) {
        throw new Error('You already have a khairat record for this mosque. Please check your existing application or membership.');
      }
      if (error.message.includes('khairat_members_ic_mosque_unique') || error.message.includes('ic_passport_number')) {
        throw new Error('This IC / Passport number is already registered for this mosque. Please use a different IC number or contact the mosque administrator.');
      }
    }
    throw new Error(`Failed to submit registration: ${error.message}`);
  }

  // Create notification for the user (only if logged in)
  if (userId) {
    try {
      await createNotification({
        user_id: userId,
        mosque_id: mosque_id,
        title: 'Khairat Application Submitted',
        message: `Your Khairat application for ${member.mosque?.name} has been submitted and is pending review.`,
        type: 'info',
        action_url: `/mosques/${mosque_id}`,
        metadata: {
          khairat_member_id: member.id,
          action: 'application_submitted'
        }
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't throw error for notification failure
    }
  }

  return {
    message: 'Registration submitted successfully',
    member,
    memberId: member.id
  };
}

/**
 * Review a khairat application (admin only)
 */
export async function reviewKhairatApplication(reviewData: {
  member_id: string;
  mosque_id: string;
  status: 'approved' | 'rejected';
  admin_notes?: string;
}) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('Authentication required');
  }

  const { member_id, mosque_id, status, admin_notes } = reviewData;

  // Check if user is mosque admin or system admin
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

  const isAdmin = userProfile?.role === 'admin';
  const isMosqueAdmin = mosqueAdmin?.user_id === user.user.id;

  if (!isAdmin && !isMosqueAdmin) {
    throw new Error('Forbidden: Only mosque admins or system admins can review applications');
  }

  // Get the current member record
  const { data: member } = await supabase
    .from('khairat_members')
    .select('*')
    .eq('id', member_id)
    .eq('mosque_id', mosque_id)
    .single();

  if (!member) {
    throw new Error('Khairat member not found');
  }

  if (member.status !== 'pending' && member.status !== 'under_review') {
    throw new Error('Only pending or under review applications can be reviewed');
  }

  // Update the member record
  const { data: updatedMember, error } = await supabase
    .from('khairat_members')
    .update({
      status: status === 'approved' ? 'active' : 'rejected',
      admin_notes: admin_notes || null,
      reviewed_by: user.user.id,
      reviewed_at: new Date().toISOString(),
      joined_date: status === 'approved' ? new Date().toISOString().split('T')[0] : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', member_id)
    .select(`
      *,
      user:user_profiles!khairat_members_user_id_fkey(id, full_name, phone),
      mosque:mosques(id, name)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to review application: ${error.message}`);
  }

  // Create notification for the user
  try {
    const notificationTitle = status === 'approved' 
      ? 'Khairat Application Approved' 
      : 'Khairat Application Rejected';
    
    const notificationMessage = status === 'approved'
      ? `Your Khairat application for ${updatedMember.mosque?.name} has been approved. You are now a member!`
      : `Your Khairat application for ${updatedMember.mosque?.name} has been rejected.${admin_notes ? ` Reason: ${admin_notes}` : ''}`;

    await createNotification({
      user_id: updatedMember.user_id,
      mosque_id: mosque_id,
      title: notificationTitle,
      message: notificationMessage,
      type: status === 'approved' ? 'success' : 'error',
      action_url: `/mosques/${mosque_id}`,
      metadata: {
        khairat_member_id: member_id,
        action: 'application_reviewed',
        status: status
      }
    });
  } catch (notificationError) {
    console.error('Failed to create notification:', notificationError);
    // Don't throw error for notification failure
  }

  return {
    message: `Application ${status} successfully`,
    member: updatedMember
  };
}

/**
 * Withdraw a khairat membership
 */
export async function withdrawKhairatMembership(memberId: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('Authentication required');
  }

  // Get the member record
  const { data: member } = await supabase
    .from('khairat_members')
    .select('*')
    .eq('id', memberId)
    .single();

  if (!member) {
    throw new Error('Khairat member not found');
  }

  // Check if user can withdraw this membership
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();

  const { data: mosqueAdmin } = await supabase
    .from('mosques')
    .select('user_id')
    .eq('id', member.mosque_id)
    .single();

  const isOwner = member.user_id === user.user.id;
  const isAdmin = userProfile?.role === 'admin';
  const isMosqueAdmin = mosqueAdmin?.user_id === user.user.id;

  if (!isOwner && !isAdmin && !isMosqueAdmin) {
    throw new Error('Forbidden: Cannot withdraw this membership');
  }

  // Only allow withdrawal of active memberships
  if (member.status !== 'active') {
    throw new Error('Only active memberships can be withdrawn');
  }

  // Update the membership status to inactive
  const { error } = await supabase
    .from('khairat_members')
    .update({
      status: 'inactive',
      updated_at: new Date().toISOString()
    })
    .eq('id', memberId);

  if (error) {
    throw new Error(`Failed to withdraw membership: ${error.message}`);
  }

  // Create notification for the user
  try {
    await createNotification({
      user_id: member.user_id,
      mosque_id: member.mosque_id,
      title: 'Khairat Membership Withdrawn',
      message: `Your Khairat membership for ${member.mosque?.name} has been withdrawn.`,
      type: 'warning',
      action_url: `/mosques/${member.mosque_id}`,
      metadata: {
        khairat_member_id: memberId,
        action: 'membership_withdrawn'
      }
    });
  } catch (notificationError) {
    console.error('Failed to create notification:', notificationError);
    // Don't throw error for notification failure
  }

  return {
    message: 'Membership withdrawn successfully'
  };
}

/**
 * Update khairat member (admin only)
 */
export async function updateKhairatMember(memberId: string, updateData: KhairatMemberUpdateData) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('Authentication required');
  }

  // Check if user is mosque admin or system admin
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();

  const { data: member } = await supabase
    .from('khairat_members')
    .select('mosque_id')
    .eq('id', memberId)
    .single();

  if (!member) {
    throw new Error('Khairat member not found');
  }

  const { data: mosqueAdmin } = await supabase
    .from('mosques')
    .select('user_id')
    .eq('id', member.mosque_id)
    .single();

  const isAdmin = userProfile?.role === 'admin';
  const isMosqueAdmin = mosqueAdmin?.user_id === user.user.id;

  if (!isAdmin && !isMosqueAdmin) {
    throw new Error('Forbidden: Only mosque admins or system admins can update members');
  }

  const { data: updatedMember, error } = await supabase
    .from('khairat_members')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', memberId)
    .select(`
      *,
      user:user_profiles!khairat_members_user_id_fkey(id, full_name, phone),
      mosque:mosques(id, name)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to update khairat member: ${error.message}`);
  }

  // Create notification for status changes
  try {
    if (updateData.status === 'inactive') {
      await createNotification({
        user_id: updatedMember.user_id,
        mosque_id: updatedMember.mosque_id,
        title: 'Khairat Membership Inactivated',
        message: `Your Khairat membership for ${updatedMember.mosque?.name} has been inactivated by the mosque admin.`,
        type: 'warning',
        action_url: `/mosques/${updatedMember.mosque_id}`,
        metadata: {
          khairat_member_id: memberId,
          action: 'membership_inactivated'
        }
      });
    } else if (updateData.status === 'active') {
      await createNotification({
        user_id: updatedMember.user_id,
        mosque_id: updatedMember.mosque_id,
        title: 'Khairat Membership Reactivated',
        message: `Your Khairat membership for ${updatedMember.mosque?.name} has been reactivated by the mosque admin.`,
        type: 'success',
        action_url: `/mosques/${updatedMember.mosque_id}`,
        metadata: {
          khairat_member_id: memberId,
          action: 'membership_reactivated'
        }
      });
    }
  } catch (notificationError) {
    console.error('Failed to create notification:', notificationError);
    // Don't throw error for notification failure
  }

  return updatedMember;
}

/**
 * Delete khairat member (admin only)
 */
export async function deleteKhairatMember(memberId: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('Authentication required');
  }

  // Get the member record to check ownership and status
  const { data: member } = await supabase
    .from('khairat_members')
    .select('mosque_id, user_id, status')
    .eq('id', memberId)
    .single();

  if (!member) {
    throw new Error('Khairat member not found');
  }

  // Check if user is the owner of this record
  const isOwner = member.user_id === user.user.id;
  
  // Check if user is mosque admin
  const { data: mosqueAdmin } = await supabase
    .from('mosques')
    .select('user_id')
    .eq('id', member.mosque_id)
    .single();

  const isMosqueAdmin = mosqueAdmin?.user_id === user.user.id;

  // Check if user is system admin
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();

  const isSystemAdmin = userProfile?.role === 'admin';

  // Allow deletion if:
  // 1. User is the owner AND status is deletable (pending, rejected, withdrawn)
  // 2. User is mosque admin
  // 3. User is system admin
  const deletableStatuses = ['pending', 'rejected', 'withdrawn'];
  const canDeleteAsOwner = isOwner && deletableStatuses.includes(member.status);

  if (!canDeleteAsOwner && !isMosqueAdmin && !isSystemAdmin) {
    if (isOwner) {
      throw new Error(`You can only delete applications with status: ${deletableStatuses.join(', ')}`);
    }
    throw new Error('Forbidden: Only mosque admins or system admins can delete members');
  }

  // Store user_id and mosque_id before deletion for notification
  const memberUserId = member.user_id;
  const memberMosqueId = member.mosque_id;

  const { error } = await supabase
    .from('khairat_members')
    .delete()
    .eq('id', memberId);

  if (error) {
    throw new Error(`Failed to delete khairat member: ${error.message}`);
  }

  // Create notification for the user (only if deleted by admin, not by owner)
  if (!isOwner && memberUserId) {
    try {
      await createNotification({
        user_id: memberUserId,
        mosque_id: memberMosqueId,
        title: 'Khairat Record Deleted',
        message: `Your Khairat record has been deleted by the mosque admin.`,
        type: 'error',
        action_url: `/mosques/${memberMosqueId}`,
        metadata: {
          khairat_member_id: memberId,
          action: 'record_deleted'
        }
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't throw error for notification failure
    }
  }

  return {
    message: 'Khairat member deleted successfully'
  };
}

/**
 * Get khairat membership statistics for a mosque (admin only)
 */
export async function getKhairatStatistics(mosqueId: string) {
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
      .from('khairat_members')
      .select('id', { count: 'exact', head: true })
      .eq('mosque_id', mosqueId)
      .eq('status', 'active'),
    supabase
      .from('khairat_members')
      .select('id', { count: 'exact', head: true })
      .eq('mosque_id', mosqueId)
      .eq('status', 'inactive'),
    supabase
      .from('khairat_members')
      .select('id', { count: 'exact', head: true })
      .eq('mosque_id', mosqueId)
      .eq('status', 'suspended'),
    supabase
      .from('khairat_members')
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
    throw new Error(`Failed to fetch khairat statistics: ${errors}`);
  }

  const statistics = {
    total: totalCount.count || 0,
    active: activeCount.count || 0,
    inactive: inactiveCount.count || 0,
    suspended: suspendedCount.count || 0
  };

  return statistics;
}
