// Kariah Applications API Functions
// Handles kariah application operations with client-side authentication

import { supabase } from '../supabase';

export interface KariahApplication {
  id: string;
  user_id: string;
  mosque_id: string;
  ic_passport_number: string;
  status: 'pending' | 'approved' | 'rejected';
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

export interface KariahApplicationFilters {
  mosque_id?: string;
  user_id?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Get kariah applications with filtering and pagination
 */
export async function getKariahApplications(filters: KariahApplicationFilters = {}) {
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
    .from('kariah_applications')
    .select(`
      *,
      user:user_profiles!kariah_applications_user_id_fkey(id, full_name, phone),
      mosque:mosques(id, name)
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
    throw new Error(`Failed to fetch kariah applications: ${error.message}`);
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
 * Submit a kariah application
 */
export async function submitKariahApplication(applicationData: {
  mosque_id: string;
  ic_passport_number: string;
  notes?: string;
}) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { mosque_id, ic_passport_number, notes } = applicationData;

  if (!mosque_id || !ic_passport_number) {
    throw new Error('Mosque ID and IC/Passport number are required');
  }

  // Validate IC/Passport format
  const { data: isValid } = await supabase
    .rpc('validate_ic_passport', { ic_passport: ic_passport_number });

  if (!isValid) {
    throw new Error('Invalid IC/Passport format');
  }

  // Check if user already has a pending or approved application for this mosque
  // Note: rejected applications are allowed to be overwritten by reapplication
  const { data: existingApp } = await supabase
    .from('kariah_applications')
    .select('id, status')
    .eq('user_id', user.user.id)
    .eq('mosque_id', mosque_id)
    .in('status', ['pending', 'approved'])
    .single();

  if (existingApp) {
    throw new Error(`You already have a ${existingApp.status} application for this mosque. Please delete your previous application if you want to reapply.`);
  }

  // Check if user is already a kariah member
  const { data: membership } = await supabase
    .from('kariah_memberships')
    .select('id')
    .eq('user_id', user.user.id)
    .eq('mosque_id', mosque_id)
    .eq('status', 'active')
    .single();

  if (membership) {
    throw new Error('You are already a kariah member of this mosque');
  }

  // Create the application
  const { data: application, error } = await supabase
    .from('kariah_applications')
    .insert({
      user_id: user.user.id,
      mosque_id,
      ic_passport_number,
      notes: notes || null,
      status: 'pending'
    })
    .select(`
      *,
      user:user_profiles!kariah_applications_user_id_fkey(id, full_name, phone),
      mosque:mosques(id, name)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to submit application: ${error.message}`);
  }

  return {
    message: 'Application submitted successfully',
    application
  };
}

/**
 * Review a kariah application (admin only)
 */
export async function reviewKariahApplication(reviewData: {
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
    .from('kariah_applications')
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
      user:user_profiles!kariah_applications_user_id_fkey(id, full_name, phone),
      mosque:mosques(id, name)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to review application: ${error.message}`);
  }

  // If approved, create kariah membership
  if (status === 'approved' && application) {
    console.log('Creating membership for approved application:', {
      user_id: application.user_id,
      mosque_id: application.mosque_id,
      application_id
    });

    const { data: membershipData, error: membershipError } = await supabase
      .from('kariah_memberships')
      .insert({
        user_id: application.user_id,
        mosque_id: application.mosque_id,
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
 * Get kariah application by ID
 */
export async function getKariahApplicationById(applicationId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  if (!applicationId) {
    throw new Error('Application ID is required');
  }

  const { data: application, error } = await supabase
    .from('kariah_applications')
    .select(`
      *,
      user:user_profiles!kariah_applications_user_id_fkey(id, full_name, phone),
      mosque:mosques(id, name, user_id)
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
 * Delete a kariah application
 */
export async function deleteKariahApplication(applicationId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  if (!applicationId) {
    throw new Error('Application ID is required');
  }

  // Get the application first to check ownership
  const { data: application, error: fetchError } = await supabase
    .from('kariah_applications')
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
    .from('kariah_applications')
    .delete()
    .eq('id', applicationId);

  if (error) {
    throw new Error(`Failed to delete application: ${error.message}`);
  }

  return {
    message: 'Application deleted successfully'
  };
}