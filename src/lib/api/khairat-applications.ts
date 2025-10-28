// Khairat Registration API Functions
// Handles khairat member registration operations with client-side authentication
// Updated to use the consolidated khairat_members table

import { supabase } from '../supabase';
import { KhairatMember } from '@/types/database';

// Legacy interface for backward compatibility
export interface KhairatApplication extends Omit<KhairatMember, 'joined_date' | 'notes'> {
  status: 'pending' | 'approved' | 'rejected' | 'under_review' | 'withdrawn';
}

export interface KhairatApplicationFilters {
  mosque_id?: string;
  user_id?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Get khairat registrations with filtering and pagination
 */
export async function getKhairatApplications(filters: KhairatApplicationFilters = {}) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const {
    mosque_id,
    user_id,
    status,
    page = 1,
    limit = 10
  } = filters;

  let query = supabase
    .from('khairat_applications')
    .select(`
      *,
      user:user_profiles!khairat_applications_user_id_fkey(id, full_name, phone),
      mosque:mosques(id, name),
      program:khairat_programs(id, name)
    `)
    .order('created_at', { ascending: false });

  // If user_id is provided, get applications for that user
  if (user_id) {
    // Users can only see their own applications unless they're admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.user.id)
      .single();

    if (user.user.id !== user_id && userProfile?.role !== 'admin') {
      throw new Error('Forbidden: Cannot access other user applications');
    }

    query = query.eq('user_id', user_id);
  }
  // If mosque_id is provided, get applications for that mosque (admin only)
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
      throw new Error('Forbidden: Not authorized to access mosque applications');
    }

    query = query.eq('mosque_id', mosque_id);
  }
  // Otherwise, get user's own applications
  else {
    query = query.eq('user_id', user.user.id);
  }

  // Apply status filter
  if (status) {
    query = query.eq('status', status);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: applications, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch khairat registrations: ${error.message}`);
  }

  return {
    applications: applications || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
}

/**
 * Submit a khairat registration
 */
export async function submitKhairatApplication(applicationData: {
  mosque_id: string;
  program_id?: string;
  ic_passport_number?: string;
  application_reason?: string;
}) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { mosque_id, program_id, ic_passport_number, application_reason } = applicationData;
  


  if (!mosque_id) {
    throw new Error('Mosque ID is required');
  }

  // Validate IC/Passport format if provided
  if (ic_passport_number) {
    const { data: isValid } = await supabase
      .rpc('validate_ic_passport', { ic_passport: ic_passport_number });

    if (!isValid) {
      throw new Error('Invalid IC/Passport format');
    }
  }

  // Check if user already has a pending or approved application for this mosque
  const { data: existingApp } = await supabase
    .from('khairat_applications')
    .select('id, status')
    .eq('user_id', user.user.id)
    .eq('mosque_id', mosque_id)
    .in('status', ['pending', 'approved'])
    .single();

  if (existingApp) {
    throw new Error(`You already have a ${existingApp.status} application for this mosque. Please delete your previous application if you want to reapply.`);
  }

  // Check if user has a withdrawn or rejected application - if so, update it to pending instead of creating new
  const { data: existingWithdrawnOrRejectedApp } = await supabase
    .from('khairat_applications')
    .select('id, status')
    .eq('user_id', user.user.id)
    .eq('mosque_id', mosque_id)
    .in('status', ['withdrawn', 'rejected'])
    .single();

  if (existingWithdrawnOrRejectedApp) {
    // Update the withdrawn/rejected application to pending instead of creating new
    const { error: updateError } = await supabase
      .from('khairat_applications')
      .update({
        status: 'pending',
        program_id: program_id || null,
        ic_passport_number: ic_passport_number || null,
        application_reason: application_reason || null,
        admin_notes: null, // Clear any admin notes from previous rejection
        reviewed_by: null, // Clear reviewer info
        reviewed_at: null, // Clear review date
        updated_at: new Date().toISOString()
      })
      .eq('id', existingWithdrawnOrRejectedApp.id);

    if (updateError) {
      throw new Error(`Failed to reactivate application: ${updateError.message}`);
    }

    return {
      message: 'Application reactivated successfully',
      applicationId: existingWithdrawnOrRejectedApp.id
    };
  }

  // Check if user is already a khairat member
  const { data: membership } = await supabase
    .from('khairat_memberships')
    .select('id')
    .eq('user_id', user.user.id)
    .eq('mosque_id', mosque_id)
    .eq('status', 'active')
    .single();

  if (membership) {
    throw new Error('You are already registered as a khairat member of this mosque');
  }

  // Create the application
  const { data: application, error } = await supabase
    .from('khairat_applications')
    .insert({
      user_id: user.user.id,
      mosque_id,
      program_id: program_id || null,
      ic_passport_number: ic_passport_number || null,
      application_reason: application_reason || null,
      status: 'pending'
    })
    .select(`
      *,
      user:user_profiles!khairat_applications_user_id_fkey(id, full_name, phone),
      mosque:mosques(id, name),
      program:khairat_programs(id, name)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to submit registration: ${error.message}`);
  }

  return {
    message: 'Registration submitted successfully',
    application
  };
}

/**
 * Review a khairat registration (admin only)
 */
export async function reviewKhairatApplication(reviewData: {
  application_id: string;
  mosque_id: string;
  status: 'approved' | 'rejected';
  admin_notes?: string;
}) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { application_id, mosque_id, status, admin_notes } = reviewData;

  if (!application_id || !mosque_id || !status) {
    throw new Error('Application ID, mosque ID, and status are required');
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
    .eq('id', mosque_id)
    .single();

  if (userProfile?.role !== 'admin' && mosqueAdmin?.user_id !== user.user.id) {
    throw new Error('Forbidden: Not authorized to review applications for this mosque');
  }



  // Update the application
  const { data: application, error } = await supabase
    .from('khairat_applications')
    .update({
      status,
      admin_notes: admin_notes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.user.id
    })
    .eq('id', application_id)
    .eq('mosque_id', mosque_id)
    .select(`
      *,
      user:user_profiles!khairat_applications_user_id_fkey(id, full_name, phone),
      mosque:mosques(id, name),
      program:khairat_programs(id, name)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to review application: ${error.message}`);
  }

  // If approved, create khairat membership
  if (status === 'approved' && application) {
    console.log('Creating membership for approved application:', {
      user_id: application.user_id,
      mosque_id: application.mosque_id,
      program_id: application.program_id,
      application_id
    });

    const { data: membershipData, error: membershipError } = await supabase
      .from('khairat_memberships')
      .insert({
        user_id: application.user_id,
        mosque_id: application.mosque_id,
        program_id: application.program_id || null,
        status: 'active',
        joined_date: new Date().toISOString().split('T')[0], // Use date format YYYY-MM-DD
        notes: `Approved from application ${application_id}`
      })
      .select();

    if (membershipError) {
      console.error('Error creating membership:', membershipError);
      console.error('Membership creation failed for application:', application_id);
      // Still don't throw error here as the application was successfully reviewed
      // But log more details for debugging
    } else {
      console.log('Membership created successfully:', membershipData);
    }
  }

  return {
    message: `Application ${status} successfully`,
    application
  };
}

/**
 * Get khairat registration by ID
 */
export async function getKhairatApplicationById(applicationId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  if (!applicationId) {
    throw new Error('Application ID is required');
  }

  const { data: application, error } = await supabase
    .from('khairat_applications')
    .select(`
      *,
      user:user_profiles!khairat_applications_user_id_fkey(id, full_name, phone),
      mosque:mosques(id, name, user_id),
      program:khairat_programs(id, name)
    `)
    .eq('id', applicationId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch application: ${error.message}`);
  }

  if (!application) {
    throw new Error('Application not found');
  }

  // Check if user can access this application
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();

  const isOwner = application.user_id === user.user.id;
  const isAdmin = userProfile?.role === 'admin';
  const isMosqueAdmin = application.mosque?.user_id === user.user.id;

  if (!isOwner && !isAdmin && !isMosqueAdmin) {
    throw new Error('Forbidden: Cannot access this application');
  }

  return application;
}

/**
 * Delete a khairat registration
 */
export async function deleteKhairatApplication(applicationId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  if (!applicationId) {
    throw new Error('Application ID is required');
  }

  // Get the application first to check ownership
  const { data: application, error: fetchError } = await supabase
    .from('khairat_applications')
    .select('user_id, mosque_id, status')
    .eq('id', applicationId)
    .single();

  if (fetchError || !application) {
    throw new Error('Application not found');
  }

  // Check if user can delete this application
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();

  const { data: mosqueAdmin } = await supabase
    .from('mosques')
    .select('user_id')
    .eq('id', application.mosque_id)
    .single();

  const isOwner = application.user_id === user.user.id;
  const isAdmin = userProfile?.role === 'admin';
  const isMosqueAdmin = mosqueAdmin?.user_id === user.user.id;

  if (!isOwner && !isAdmin && !isMosqueAdmin) {
    throw new Error('Forbidden: Cannot delete this application');
  }

  // Only allow deletion of pending or rejected applications
  // Users can delete rejected applications to reapply
  if (application.status !== 'pending' && application.status !== 'rejected') {
    throw new Error('Only pending or rejected applications can be deleted');
  }

  // Additional check: users can only delete their own rejected applications
  if (application.status === 'rejected' && !isOwner) {
    throw new Error('Only the applicant can delete their own rejected application');
  }

  const { error } = await supabase
    .from('khairat_applications')
    .delete()
    .eq('id', applicationId);

  if (error) {
    throw new Error(`Failed to delete application: ${error.message}`);
  }

  return {
    message: 'Application deleted successfully'
  };
}

/**
 * Withdraw a khairat registration (change status to withdrawn)
 */
export async function withdrawKhairatApplication(applicationId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  if (!applicationId) {
    throw new Error('Application ID is required');
  }

  // Get the application first to check ownership and status
  const { data: application, error: fetchError } = await supabase
    .from('khairat_applications')
    .select('user_id, mosque_id, status')
    .eq('id', applicationId)
    .single();

  if (fetchError || !application) {
    throw new Error('Application not found');
  }

  // Check if user can withdraw this application
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();

  const { data: mosqueAdmin } = await supabase
    .from('mosques')
    .select('user_id')
    .eq('id', application.mosque_id)
    .single();

  const isOwner = application.user_id === user.user.id;
  const isAdmin = userProfile?.role === 'admin';
  const isMosqueAdmin = mosqueAdmin?.user_id === user.user.id;

  if (!isOwner && !isAdmin && !isMosqueAdmin) {
    throw new Error('Forbidden: Cannot withdraw this application');
  }

  // Only allow withdrawal of pending applications
  if (application.status !== 'pending') {
    throw new Error('Only pending applications can be withdrawn');
  }

  // Additional check: users can only withdraw their own applications
  if (!isOwner) {
    throw new Error('Only the applicant can withdraw their own application');
  }

  const { error } = await supabase
    .from('khairat_applications')
    .update({ 
      status: 'withdrawn',
      updated_at: new Date().toISOString()
    })
    .eq('id', applicationId);

  if (error) {
    throw new Error(`Failed to withdraw application: ${error.message}`);
  }

  return {
    message: 'Application withdrawn successfully'
  };
}
