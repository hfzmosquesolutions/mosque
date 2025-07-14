import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { User, Session, AuthError as SupabaseAuthError } from '@supabase/supabase-js';

// Enhanced Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface AuthResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface SessionResult {
  user: User | null;
  session: Session | null;
}

// Custom Auth Error class
export class AuthError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
  }
}

// Auth Service Class
export class AuthService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Retry wrapper for auth operations
   */
  private static async withRetry<T>(
    operation: () => Promise<T>,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      if (retries > 0 && this.isRetryableError(error)) {
        await this.delay(this.RETRY_DELAY);
        return this.withRetry(operation, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private static isRetryableError(error: any): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'CONNECTION_ERROR',
      'TEMPORARY_FAILURE'
    ];
    
    return retryableCodes.includes(error?.code) || 
           error?.message?.includes('network') ||
           error?.message?.includes('timeout');
  }

  /**
   * Delay utility
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Normalize and validate email
   */
  private static normalizeEmail(email: string): string {
    const normalized = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(normalized)) {
      throw new AuthError('Invalid email format');
    }
    
    return normalized;
  }

  /**
   * Validate password strength
   */
  private static validatePassword(password: string): void {
    if (password.length < 8) {
      throw new AuthError('Password must be at least 8 characters long');
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new AuthError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }
  }

  /**
   * Handle Supabase errors
   */
  private static handleSupabaseError(error: any): AuthError {
    if (error instanceof AuthError) {
      return error;
    }

    // Map common Supabase errors to user-friendly messages
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Invalid email or password',
      'Email not confirmed': 'Please check your email and click the confirmation link',
      'User already registered': 'An account with this email already exists',
      'Password should be at least 6 characters': 'Password must be at least 6 characters long',
      'Invalid email': 'Please enter a valid email address',
      'Signup disabled': 'Account registration is currently disabled',
      'Email rate limit exceeded': 'Too many emails sent. Please wait before trying again',
      'Invalid refresh token': 'Your session has expired. Please sign in again',
      'JWT expired': 'Your session has expired. Please sign in again',
    };

    const message = errorMap[error?.message] || error?.message || 'An unexpected error occurred';
    return new AuthError(message, error?.code, error?.status);
  }

  /**
   * Get current session
   */
  static async getSession(): Promise<AuthResult<SessionResult>> {
    try {
      const result = await this.withRetry(async () => {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw this.handleSupabaseError(error);
        }
        
        return {
          user: data.session?.user || null,
          session: data.session,
        };
      });

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      const authError = this.handleSupabaseError(error);
      return {
        success: false,
        error: authError.message,
        code: authError.code,
      };
    }
  }

  /**
   * Get current user
   */
  static async getUser(): Promise<AuthResult<User>> {
    try {
      const result = await this.withRetry(async () => {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          throw this.handleSupabaseError(error);
        }
        
        return data.user;
      });

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      const authError = this.handleSupabaseError(error);
      return {
        success: false,
        error: authError.message,
        code: authError.code,
      };
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(credentials: LoginCredentials): Promise<AuthResult<SessionResult>> {
    try {
      const email = this.normalizeEmail(credentials.email);
      
      const result = await this.withRetry(async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: credentials.password,
        });

        if (error) {
          throw this.handleSupabaseError(error);
        }

        return {
          user: data.user,
          session: data.session,
        };
      });

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      const authError = this.handleSupabaseError(error);
      return {
        success: false,
        error: authError.message,
        code: authError.code,
      };
    }
  }

  /**
   * Sign up with email and password
   */
  static async signUp(credentials: SignupCredentials): Promise<AuthResult<SessionResult>> {
    try {
      const email = this.normalizeEmail(credentials.email);
      this.validatePassword(credentials.password);
      
      const fullName = credentials.fullName.trim();
      if (!fullName) {
        throw new AuthError('Full name is required');
      }

      const result = await this.withRetry(async () => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: credentials.password,
          options: {
            data: {
              full_name: fullName,
              phone: credentials.phone?.trim() || null,
            },
          },
        });

        if (error) {
          throw this.handleSupabaseError(error);
        }

        return {
          user: data.user,
          session: data.session,
        };
      });

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      const authError = this.handleSupabaseError(error);
      return {
        success: false,
        error: authError.message,
        code: authError.code,
      };
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<AuthResult<void>> {
    try {
      await this.withRetry(async () => {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          throw this.handleSupabaseError(error);
        }
      });

      return { success: true };
    } catch (error: any) {
      const authError = this.handleSupabaseError(error);
      return {
        success: false,
        error: authError.message,
        code: authError.code,
      };
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string): Promise<AuthResult<void>> {
    try {
      const normalizedEmail = this.normalizeEmail(email);
      
      await this.withRetry(async () => {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (error) {
          throw this.handleSupabaseError(error);
        }
      });

      return { success: true };
    } catch (error: any) {
      const authError = this.handleSupabaseError(error);
      return {
        success: false,
        error: authError.message,
        code: authError.code,
      };
    }
  }

  /**
   * Update password
   */
  static async updatePassword(password: string): Promise<AuthResult<void>> {
    try {
      this.validatePassword(password);
      
      await this.withRetry(async () => {
        const { error } = await supabase.auth.updateUser({ password });
        
        if (error) {
          throw this.handleSupabaseError(error);
        }
      });

      return { success: true };
    } catch (error: any) {
      const authError = this.handleSupabaseError(error);
      return {
        success: false,
        error: authError.message,
        code: authError.code,
      };
    }
  }

  /**
   * Refresh session
   */
  static async refreshSession(): Promise<AuthResult<SessionResult>> {
    try {
      const result = await this.withRetry(async () => {
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          throw this.handleSupabaseError(error);
        }
        
        return {
          user: data.user,
          session: data.session,
        };
      });

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      const authError = this.handleSupabaseError(error);
      return {
        success: false,
        error: authError.message,
        code: authError.code,
      };
    }
  }

  /**
   * Get user profile
   */
  static async getUserProfile(userId: string): Promise<AuthResult<Profile>> {
    try {
      if (!userId) {
        throw new AuthError('User ID is required');
      }

      const result = await this.withRetry(async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Profile doesn't exist
            return null;
          }
          throw this.handleSupabaseError(error);
        }

        return data;
      });

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      const authError = this.handleSupabaseError(error);
      return {
        success: false,
        error: authError.message,
        code: authError.code,
      };
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    userId: string,
    updates: Partial<Profile>
  ): Promise<AuthResult<Profile>> {
    try {
      if (!userId) {
        throw new AuthError('User ID is required');
      }

      const result = await this.withRetry(async () => {
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
          throw this.handleSupabaseError(error);
        }

        return data;
      });

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      const authError = this.handleSupabaseError(error);
      return {
        success: false,
        error: authError.message,
        code: authError.code,
      };
    }
  }

  /**
   * Create user profile
   */
  static async createUserProfile(
    userId: string,
    email: string,
    fullName: string,
    phone?: string
  ): Promise<AuthResult<Profile>> {
    try {
      if (!userId || !email || !fullName) {
        throw new AuthError('User ID, email, and full name are required');
      }

      const normalizedEmail = this.normalizeEmail(email);
      const trimmedFullName = fullName.trim();
      
      const result = await this.withRetry(async () => {
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: normalizedEmail,
            full_name: trimmedFullName,
            phone: phone?.trim() || null,
            role: 'member',
            username: normalizedEmail.split('@')[0],
          })
          .select()
          .single();

        if (error) {
          throw this.handleSupabaseError(error);
        }

        return data;
      });

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      const authError = this.handleSupabaseError(error);
      return {
        success: false,
        error: authError.message,
        code: authError.code,
      };
    }
  }

  /**
   * Delete user account
   */
  static async deleteUserAccount(userId: string): Promise<AuthResult<void>> {
    try {
      if (!userId) {
        throw new AuthError('User ID is required');
      }

      await this.withRetry(async () => {
        const { error } = await supabase.rpc('delete_user_account', {
          user_id: userId,
        });

        if (error) {
          throw this.handleSupabaseError(error);
        }
      });

      return { success: true };
    } catch (error: any) {
      const authError = this.handleSupabaseError(error);
      return {
        success: false,
        error: authError.message,
        code: authError.code,
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const { data } = await this.getSession();
      return !!(data?.session && data?.user);
    } catch {
      return false;
    }
  }

  /**
   * Get auth headers for API requests
   */
  static async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const { data } = await this.getSession();
      
      if (data?.session?.access_token) {
        return {
          'Authorization': `Bearer ${data.session.access_token}`,
        };
      }
      
      return {};
    } catch {
      return {};
    }
  }
}

export default AuthService;