import { supabase } from '@/lib/supabase';
import { Profile, Mosque, Member } from '@/types/database';

export class ProfileService {
  static async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  }

  static async updateProfile(
    userId: string,
    updates: Partial<Profile>
  ): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    return data;
  }

  static async getProfilesByMosque(mosqueId: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('mosque_id', mosqueId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }

    return data;
  }
}

export class MosqueService {
  static async getAllMosques(): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase
      .from('mosques')
      .select('id, name')
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('Error fetching mosques:', error);
      return [];
    }

    return data || [];
  }

  static async createMosque(mosque: Partial<Mosque>): Promise<Mosque | null> {
    const { data, error } = await supabase
      .from('mosques')
      .insert(mosque)
      .select()
      .single();

    if (error) {
      console.error('Error creating mosque:', error);
      throw error;
    }

    return data;
  }

  static async getMosque(mosqueId: string): Promise<Mosque | null> {
    const { data, error } = await supabase
      .from('mosques')
      .select('*')
      .eq('id', mosqueId)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Error fetching mosque:', error);
      return null;
    }

    return data;
  }

  static async updateMosque(
    mosqueId: string,
    updates: Partial<Mosque>
  ): Promise<Mosque | null> {
    const { data, error } = await supabase
      .from('mosques')
      .update(updates)
      .eq('id', mosqueId)
      .select()
      .single();

    if (error) {
      console.error('Error updating mosque:', error);
      throw error;
    }

    return data;
  }

  static async getUserMosques(userId: string): Promise<Mosque[]> {
    const { data, error } = await supabase
      .from('mosques')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user mosques:', error);
      return [];
    }

    return data;
  }
}

export class MemberService {
  static async createMember(member: Partial<Member>): Promise<Member | null> {
    const { data, error } = await supabase
      .from('members')
      .insert(member)
      .select()
      .single();

    if (error) {
      console.error('Error creating member:', error);
      throw error;
    }

    return data;
  }

  static async getMembersByMosque(mosqueId: string): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select(
        `
        *,
        profiles (
          id,
          full_name,
          email,
          phone,
          avatar_url
        )
      `
      )
      .eq('mosque_id', mosqueId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching members:', error);
      return [];
    }

    return data;
  }

  static async updateMember(
    memberId: string,
    updates: Partial<Member>
  ): Promise<Member | null> {
    const { data, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      console.error('Error updating member:', error);
      throw error;
    }

    return data;
  }

  static async deleteMember(memberId: string): Promise<boolean> {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Error deleting member:', error);
      return false;
    }

    return true;
  }
}
