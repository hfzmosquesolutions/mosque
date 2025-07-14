import { User as SupabaseUser } from '@supabase/supabase-js';
import { Profile, UserRole } from './database';

export interface AuthUser extends SupabaseUser {
  profile?: Profile;
}

export interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

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

export interface AuthError {
  message: string;
  code?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: SignupCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updateProfileExtended: (updates: {
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
  }) => Promise<void>;
  refreshProfile: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}
