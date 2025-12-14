import { supabase } from '@/lib/supabase';
import { KhairatMemberDependent, CreateKhairatMemberDependent } from '@/types/database';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get dependents for a khairat member
 */
export async function getKhairatMemberDependents(
  khairatMemberId: string
): Promise<ApiResponse<KhairatMemberDependent[]>> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    return { success: false, error: 'Authentication required' };
  }

  const { data, error } = await supabase
    .from('khairat_member_dependents')
    .select('*')
    .eq('khairat_member_id', khairatMemberId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching khairat member dependents:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data || [] };
}

/**
 * Create a dependent for a khairat member
 */
export async function createKhairatMemberDependent(
  dependentData: CreateKhairatMemberDependent
): Promise<ApiResponse<KhairatMemberDependent>> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    return { success: false, error: 'Authentication required' };
  }

  const { data, error } = await supabase
    .from('khairat_member_dependents')
    .insert(dependentData)
    .select()
    .single();

  if (error) {
    console.error('Error creating khairat member dependent:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Update a khairat member dependent
 */
export async function updateKhairatMemberDependent(
  dependentId: string,
  updateData: Partial<CreateKhairatMemberDependent>
): Promise<ApiResponse<KhairatMemberDependent>> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    return { success: false, error: 'Authentication required' };
  }

  const { data, error } = await supabase
    .from('khairat_member_dependents')
    .update(updateData)
    .eq('id', dependentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating khairat member dependent:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Delete a khairat member dependent
 */
export async function deleteKhairatMemberDependent(
  dependentId: string
): Promise<ApiResponse<void>> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    return { success: false, error: 'Authentication required' };
  }

  const { error } = await supabase
    .from('khairat_member_dependents')
    .delete()
    .eq('id', dependentId);

  if (error) {
    console.error('Error deleting khairat member dependent:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Bulk create dependents for a khairat member
 */
export async function bulkCreateKhairatMemberDependents(
  khairatMemberId: string,
  dependents: Omit<CreateKhairatMemberDependent, 'khairat_member_id'>[]
): Promise<ApiResponse<KhairatMemberDependent[]>> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    return { success: false, error: 'Authentication required' };
  }

  const dependentsWithMemberId = dependents.map(dep => ({
    ...dep,
    khairat_member_id: khairatMemberId,
  }));

  const { data, error } = await supabase
    .from('khairat_member_dependents')
    .insert(dependentsWithMemberId)
    .select();

  if (error) {
    console.error('Error bulk creating khairat member dependents:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data || [] };
}

