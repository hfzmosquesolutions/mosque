import { supabase } from '@/lib/supabase';

/**
 * Get khairat memberships for a user
 */
export async function getKhairatMemberships(params: {
  user_id: string;
  mosque_id?: string;
  status?: string;
  limit?: number;
}) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { user_id, mosque_id, status, limit = 10 } = params;

  let query = supabase
    .from('khairat_memberships')
    .select(`
      *,
      user:user_profiles!khairat_memberships_user_id_fkey(id, full_name, phone),
      mosque:mosques(id, name),
      program:khairat_programs(id, name)
    `)
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (mosque_id) {
    query = query.eq('mosque_id', mosque_id);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data: memberships, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch khairat memberships: ${error.message}`);
  }

  return {
    memberships: memberships || [],
    total: memberships?.length || 0
  };
}

/**
 * Withdraw from khairat membership (change status to inactive)
 */
export async function withdrawKhairatMembership(membershipId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  if (!membershipId) {
    throw new Error('Membership ID is required');
  }

  // Get the membership first to check ownership
  const { data: membership, error: fetchError } = await supabase
    .from('khairat_memberships')
    .select('user_id, mosque_id, status')
    .eq('id', membershipId)
    .single();

  if (fetchError || !membership) {
    throw new Error('Membership not found');
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
    .eq('id', membership.mosque_id)
    .single();

  const isOwner = membership.user_id === user.user.id;
  const isAdmin = userProfile?.role === 'admin';
  const isMosqueAdmin = mosqueAdmin?.user_id === user.user.id;

  if (!isOwner && !isAdmin && !isMosqueAdmin) {
    throw new Error('Forbidden: Cannot withdraw this membership');
  }

  // Only allow withdrawal of active memberships
  if (membership.status !== 'active') {
    throw new Error('Only active memberships can be withdrawn');
  }

  // Additional check: users can only withdraw their own memberships
  if (!isAdmin && !isMosqueAdmin && !isOwner) {
    throw new Error('Forbidden: Cannot withdraw this membership');
  }

  // Update the membership status to inactive
  const { error } = await supabase
    .from('khairat_memberships')
    .update({
      status: 'inactive',
      updated_at: new Date().toISOString()
    })
    .eq('id', membershipId);

  if (error) {
    throw new Error(`Failed to withdraw membership: ${error.message}`);
  }

  return {
    message: 'Membership withdrawn successfully'
  };
}
