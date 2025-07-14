import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type MosqueRow = Database['public']['Tables']['mosques']['Row'];
type MosqueInsert = Database['public']['Tables']['mosques']['Insert'];
type MosqueUpdate = Database['public']['Tables']['mosques']['Update'];

export interface MosqueProfile {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  capacity?: number;
  facilities?: string[];
  created_at: string;
  updated_at?: string;
  created_by?: string;
}

export class MosqueProfileService {
  /**
   * Get mosque profile by ID
   */
  static async getMosqueProfile(
    mosqueId: string
  ): Promise<MosqueProfile | null> {
    try {
      const { data, error } = await supabase
        .from('mosques')
        .select('*')
        .eq('id', mosqueId)
        .single();

      if (error) {
        console.error('Error fetching mosque profile:', error);
        return null;
      }

      return data as MosqueProfile;
    } catch (error) {
      console.error('Error fetching mosque profile:', error);
      return null;
    }
  }

  /**
   * Get mosque profile for current user (mosque admin)
   */
  static async getUserMosqueProfile(
    userId: string
  ): Promise<MosqueProfile | null> {
    try {
      // Find mosque where profile_id matches the user's ID
      const { data, error } = await supabase
        .from('mosques')
        .select('*')
        .eq('profile_id', userId)
        .single();

      if (error) {
        console.error(
          'Error fetching user mosque profile or no mosque assigned:',
          error
        );
        return null;
      }

      return data as MosqueProfile;
    } catch (error) {
      console.error('Error fetching user mosque profile:', error);
      return null;
    }
  }

  /**
   * Create a new mosque profile
   */
  static async createMosqueProfile(
    profileData: Omit<MosqueProfile, 'id' | 'created_at' | 'updated_at'>,
    userId: string
  ): Promise<MosqueProfile | null> {
    try {
      const mosqueData: MosqueInsert = {
        name: profileData.name,
        description: profileData.description,
        address: profileData.address,
        phone: profileData.phone,
        email: profileData.email,
        website: profileData.website,
        capacity: profileData.capacity,
        facilities: profileData.facilities,
        created_by: userId,
        profile_id: userId, // Link the mosque to the user's profile
      };

      const { data, error } = await supabase
        .from('mosques')
        .insert([mosqueData])
        .select()
        .single();

      if (error) {
        console.error('Error creating mosque profile:', error);
        return null;
      }

      // No need to update user profile since mosque now links to profile via profile_id

      return data as MosqueProfile;
    } catch (error) {
      console.error('Error creating mosque profile:', error);
      return null;
    }
  }

  /**
   * Update mosque profile
   */
  static async updateMosqueProfile(
    mosqueId: string,
    profileData: Partial<
      Omit<MosqueProfile, 'id' | 'created_at' | 'created_by'>
    >,
    userId: string
  ): Promise<MosqueProfile | null> {
    try {
      // Verify user has permission to update this mosque
      const hasPermission = await this.verifyUserPermission(userId, mosqueId);
      if (!hasPermission) {
        console.error('User does not have permission to update this mosque');
        return null;
      }

      const updateData: MosqueUpdate = {
        ...profileData,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('mosques')
        .update(updateData)
        .eq('id', mosqueId)
        .select()
        .single();

      if (error) {
        console.error('Error updating mosque profile:', error);
        return null;
      }

      return data as MosqueProfile;
    } catch (error) {
      console.error('Error updating mosque profile:', error);
      return null;
    }
  }

  /**
   * Delete mosque profile
   */
  static async deleteMosqueProfile(
    mosqueId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Verify user has permission to delete this mosque
      const hasPermission = await this.verifyUserPermission(userId, mosqueId);
      if (!hasPermission) {
        console.error('User does not have permission to delete this mosque');
        return false;
      }

      const { error } = await supabase
        .from('mosques')
        .delete()
        .eq('id', mosqueId);

      if (error) {
        console.error('Error deleting mosque profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting mosque profile:', error);
      return false;
    }
  }

  /**
   * Get all mosques (for super admin)
   */
  static async getAllMosques(): Promise<MosqueProfile[]> {
    try {
      const { data, error } = await supabase
        .from('mosques')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all mosques:', error);
        return [];
      }

      return (data as MosqueProfile[]) || [];
    } catch (error) {
      console.error('Error fetching all mosques:', error);
      return [];
    }
  }

  /**
   * Verify if user has permission to modify a mosque
   */
  private static async verifyUserPermission(
    userId: string,
    mosqueId: string
  ): Promise<boolean> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return false;
      }

      // Super admin can modify any mosque
      if (profile.role === 'super_admin') {
        return true;
      }

      // Mosque admin can only modify their own mosque (check if profile_id matches)
      if (profile.role === 'mosque_admin') {
        const { data: mosque, error: mosqueError } = await supabase
          .from('mosques')
          .select('profile_id')
          .eq('id', mosqueId)
          .single();

        if (!mosqueError && mosque?.profile_id === userId) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error verifying user permission:', error);
      return false;
    }
  }

  /**
   * Check if user can create a mosque profile
   */
  static async canCreateMosque(userId: string): Promise<boolean> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return false;
      }

      // Super admin can always create mosques
      if (profile.role === 'super_admin') {
        return true;
      }

      // Mosque admin can create if they don't have a mosque yet
      if (profile.role === 'mosque_admin') {
        // Check if user already has a mosque
        const { data: existingMosque, error: mosqueError } = await supabase
          .from('mosques')
          .select('id')
          .eq('profile_id', userId)
          .single();

        const canCreate = !existingMosque;

        return canCreate;
      }

      return false;
    } catch (error) {
      return false;
    }
  }
}
