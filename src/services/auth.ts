import { supabase } from '@/lib/supabase';
import { LoginCredentials, SignupCredentials } from '@/types/auth';
import { Profile } from '@/types/database';

export class AuthService {
  /**
   * Sign in user with email and password
   */
  static async signIn(credentials: LoginCredentials) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw new AuthError(error.message, error.name);
      }

      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign up new user with email and password
   */
  static async signUp(credentials: SignupCredentials) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.fullName,
            phone: credentials.phone || null,
          },
        },
      });

      if (error) {
        throw new AuthError(error.message, error.name);
      }

      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new AuthError(error.message, error.name);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Reset password for user
   */
  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw new AuthError(error.message, error.name);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(password: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw new AuthError(error.message, error.name);
      }
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  }

  /**
   * Get current user session
   */
  static async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw new AuthError(error.message, error.name);
      }

      return data.session;
    } catch (error) {
      console.error('Get session error:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  static async getUser() {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        throw new AuthError(error.message, error.name);
      }

      return data.user;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  /**
   * Get user profile from database
   */
  static async getUserProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist yet
          return null;
        }
        throw new AuthError(error.message, error.code);
      }

      return data;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  /**
   * Create user profile in database
   */
  static async createUserProfile(
    userId: string,
    email: string,
    fullName: string,
    phone?: string
  ): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          full_name: fullName,
          phone,
          role: 'member', // Default role
          username: email.split('@')[0], // Use email prefix as username
        })
        .select()
        .single();

      if (error) {
        throw new AuthError(error.message, error.code);
      }

      return data;
    } catch (error) {
      console.error('Create user profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile in database
   */
  static async updateUserProfile(
    userId: string,
    updates: Partial<Profile>
  ): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new AuthError(error.message, error.code);
      }

      return data;
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }
  /**
   * Update user profile with extended onboarding data
   */
  static async updateUserProfileExtended(
    userId: string,
    updates: {
      fullName?: string;
      username?: string;
      phone?: string;
      address?: string;
      dateOfBirth?: string;
      gender?: string;
      maritalStatus?: string;
      occupation?: string;
      education?: string;
      emergencyContact?: string;
      emergencyPhone?: string;
      interests?: string;
    }
  ): Promise<Profile> {
    try {
      // Prepare updates object with all fields
      const profileUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      // Core profile fields
      if (updates.fullName) profileUpdates.full_name = updates.fullName;
      if (updates.username) profileUpdates.username = updates.username;
      if (updates.phone) profileUpdates.phone = updates.phone;

      // Extended fields (will be available after migration)
      if (updates.address) profileUpdates.address = updates.address;
      if (updates.dateOfBirth)
        profileUpdates.date_of_birth = updates.dateOfBirth;
      if (updates.gender) profileUpdates.gender = updates.gender;
      if (updates.maritalStatus)
        profileUpdates.marital_status = updates.maritalStatus;
      if (updates.occupation) profileUpdates.occupation = updates.occupation;
      if (updates.education) profileUpdates.education = updates.education;
      if (updates.emergencyContact)
        profileUpdates.emergency_contact = updates.emergencyContact;
      if (updates.emergencyPhone)
        profileUpdates.emergency_phone = updates.emergencyPhone;
      if (updates.interests) profileUpdates.interests = updates.interests;

      // Mark profile as completed
      if (updates.fullName && updates.phone) {
        profileUpdates.profile_completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new AuthError(error.message, error.code);
      }

      return data;
    } catch (error) {
      console.error('Update extended user profile error:', error);
      throw error;
    }
  }

  /**
   * Delete user account (calls the database function)
   */
  static async deleteUserAccount(userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('delete_user_account', {
        user_id: userId,
      });

      if (error) {
        throw new AuthError(error.message, error.code);
      }
    } catch (error) {
      console.error('Delete user account error:', error);
      throw error;
    }
  }

  /**
   * Delete current user's own account
   */
  static async deleteOwnAccount(): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new AuthError('No authenticated user found');
      }

      await this.deleteUserAccount(user.id);
    } catch (error) {
      console.error('Delete own account error:', error);
      throw error;
    }
  }
}

// Custom Auth Error class
class AuthError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}
