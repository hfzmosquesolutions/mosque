import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Member = Database['public']['Tables']['members']['Row'];
type MemberInsert = Database['public']['Tables']['members']['Insert'];
type MemberUpdate = Database['public']['Tables']['members']['Update'];

export const membersService = {
  // Get all members for a mosque
  async getMembers(mosqueId: string) {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email,
          phone
        )
      `)
      .eq('mosque_id', mosqueId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get member by ID
  async getMemberById(id: string) {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email,
          phone
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Check if user is already a member of a mosque
  async checkExistingMembership(userId: string, mosqueId: string) {
    const { data, error } = await supabase
      .from('members')
      .select('id, status')
      .eq('user_id', userId)
      .eq('mosque_id', mosqueId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Create new membership application
  async createMembershipApplication(memberData: MemberInsert) {
    const { data, error } = await supabase
      .from('members')
      .insert(memberData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update member
  async updateMember(id: string, updates: MemberUpdate) {
    const { data, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete member
  async deleteMember(id: string) {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get member statistics for a mosque
  async getMemberStats(mosqueId: string) {
    const { data, error } = await supabase
      .from('members')
      .select('status, membership_type, created_at')
      .eq('mosque_id', mosqueId);

    if (error) throw error;

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      total: data.length,
      active: data.filter(m => m.status === 'active').length,
      pending: data.filter(m => m.status === 'inactive').length,
      committee: data.filter(m => m.membership_type === 'ajk' || m.membership_type === 'committee').length,
      newThisMonth: data.filter(m => new Date(m.created_at) >= thisMonth).length,
    };

    return stats;
  },
};