import { supabase } from '@/lib/supabase';
import { KhairatMember } from '@/types/database';
import { createNotification } from './notifications';

export interface KhairatMemberFilters {
  mosque_id?: string;
  status?: string;
  user_id?: string;
}

export interface KhairatMemberCreateData {
  mosque_id: string;
  ic_passport_number?: string;
  application_reason?: string;
}

export interface KhairatMemberUpdateData {
  status?: 'pending' | 'approved' | 'rejected' | 'under_review' | 'withdrawn' | 'active' | 'inactive' | 'suspended';
  admin_notes?: string;
  notes?: string;
  joined_date?: string;
}

/**
 * Get khairat members with optional filters
 */
export async function getKhairatMembers(filters: KhairatMemberFilters = {}) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('Authentication required');
  }

  let query = supabase
    .from('khairat_members')
    .select(`
      *,
      user:user_profiles!khairat_members_user_id_fkey(id, full_name, phone),
      mosque:mosques(id, name, logo_url, banner_url, address)
    `)
    .order('created_at', { ascending: false });

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
      user:user_profiles!khairat_members_user_id_fkey(id, full_name, phone),
      mosque:mosques(id, name)
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
  if (!user.user) {
    throw new Error('Authentication required');
  }

  const { mosque_id, ic_passport_number, application_reason } = applicationData;

  // Get all existing records for this user and mosque
  const { data: existingRecords } = await supabase
    .from('khairat_members')
    .select('id, status')
    .eq('user_id', user.user.id)
    .eq('mosque_id', mosque_id)
    .order('created_at', { ascending: false });

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
      user_id: user.user.id,
      mosque_id,
      ic_passport_number: ic_passport_number || null,
      application_reason: application_reason || null,
      status: 'pending'
    })
    .select(`
      *,
      user:user_profiles!khairat_members_user_id_fkey(id, full_name, phone),
      mosque:mosques(id, name)
    `)
    .single();

  if (error) {
    // Handle unique constraint violation
    if (error.code === '23505' && error.message.includes('khairat_members_user_mosque_unique')) {
      throw new Error('You already have a khairat record for this mosque. Please check your existing application or membership.');
    }
    throw new Error(`Failed to submit registration: ${error.message}`);
  }

  // Create notification for the user
  try {
    await createNotification({
      user_id: user.user.id,
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

  return {
    message: 'Registration submitted successfully',
    member
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
    throw new Error('Forbidden: Only mosque admins or system admins can delete members');
  }

  const { error } = await supabase
    .from('khairat_members')
    .delete()
    .eq('id', memberId);

  if (error) {
    throw new Error(`Failed to delete khairat member: ${error.message}`);
  }

  // Create notification for the user (we need to get user_id first)
  try {
    const { data: memberForNotification } = await supabase
      .from('khairat_members')
      .select('user_id, mosque_id')
      .eq('id', memberId)
      .single();

    if (memberForNotification) {
      await createNotification({
        user_id: memberForNotification.user_id,
        mosque_id: memberForNotification.mosque_id,
        title: 'Khairat Record Deleted',
        message: `Your Khairat record has been deleted by the mosque admin.`,
        type: 'error',
        action_url: `/mosques/${memberForNotification.mosque_id}`,
        metadata: {
          khairat_member_id: memberId,
          action: 'record_deleted'
        }
      });
    }
  } catch (notificationError) {
    console.error('Failed to create notification:', notificationError);
    // Don't throw error for notification failure
  }

  return {
    message: 'Khairat member deleted successfully'
  };
}
