'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AuthService } from '@/services/auth';
import {
  AuthUser,
  AuthState,
  AuthContextType,
  LoginCredentials,
  SignupCredentials,
} from '@/types/auth';
import { Profile } from '@/types/database';
import { AuthLoadingScreen } from '@/components/ui/loading';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const router = useRouter();

  // Listen for auth changes only
  useEffect(() => {
    let mounted = true;

    // Set initial loading to false since we'll rely on auth state changes
    setState((prev) => ({ ...prev, isLoading: false }));

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      try {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          await loadUserProfile(session.user);
        }
      } catch (error: any) {
        console.error('Auth state change error:', error);

        // Handle refresh token errors by signing out
        if (
          error.message?.includes('Invalid Refresh Token') ||
          error.message?.includes('Refresh Token Not Found')
        ) {
          console.log('Invalid refresh token, signing out user');
          setState({
            user: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (user: AuthUser) => {
    try {
      const profile = await AuthService.getUserProfile(user.id);

      setState({
        user,
        profile,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error: any) {
      console.error('Error loading user profile:', error);

      // If it's an auth error, sign out the user
      if (
        error.message?.includes('Invalid Refresh Token') ||
        error.message?.includes('Refresh Token Not Found') ||
        error.message?.includes('JWT expired')
      ) {
        console.log('Auth error in profile loading, signing out user');
        setState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
        });
        return;
      }

      // For other errors, keep user signed in but without profile
      setState({
        user,
        profile: null,
        isLoading: false,
        isAuthenticated: true,
      });
    }
  };

  const signIn = async (credentials: LoginCredentials) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const { user } = await AuthService.signIn(credentials);

      if (user) {
        await loadUserProfile(user);
        // Check if profile is complete before redirecting
        const profile = await AuthService.getUserProfile(user.id);
        if (profile && profile.full_name && profile.phone) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
      }
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signUp = async (credentials: SignupCredentials) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const { user } = await AuthService.signUp(credentials);

      if (user && user.email) {
        // Profile will be created by database trigger
        // Load the profile after a brief delay to ensure trigger has executed
        setTimeout(async () => {
          await loadUserProfile(user);
          // Redirect new users to onboarding
          router.push('/onboarding');
        }, 100);
      }
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AuthService.signOut();
      setState({
        user: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false,
      });
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await AuthService.resetPassword(email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!state.user) {
        throw new Error('No user authenticated');
      }

      const updatedProfile = await AuthService.updateUserProfile(
        state.user.id,
        updates
      );

      setState((prev) => ({
        ...prev,
        profile: updatedProfile,
      }));
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const updateProfileExtended = async (updates: {
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
  }) => {
    try {
      if (!state.user) {
        throw new Error('No user authenticated');
      }

      const updatedProfile = await AuthService.updateUserProfileExtended(
        state.user.id,
        updates
      );

      setState((prev) => ({
        ...prev,
        profile: updatedProfile,
      }));
    } catch (error) {
      console.error('Update extended profile error:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    try {
      if (!state.user) {
        throw new Error('No user authenticated');
      }

      const profile = await AuthService.getUserProfile(state.user.id);
      setState((prev) => ({
        ...prev,
        profile,
      }));
    } catch (error) {
      console.error('Refresh profile error:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      await AuthService.deleteOwnAccount();

      // Clear state and redirect
      setState({
        user: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false,
      });

      router.push('/');
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      console.error('Delete account error:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await AuthService.deleteUserAccount(userId);

      // If deleting own account, handle state cleanup
      if (state.user?.id === userId) {
        setState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
        });
        router.push('/');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user: state.user,
    profile: state.profile,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    updateProfileExtended,
    refreshProfile,
    deleteAccount,
    deleteUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
