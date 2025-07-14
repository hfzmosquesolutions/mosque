'use client';

import { useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '@/contexts/AuthContext.v2';
import type { AuthContextType, LoginCredentials, SignupCredentials } from '@/contexts/AuthContext.v2';
import { Profile } from '@/types/database';

/**
 * Enhanced useAuth hook with better error handling and state management
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Hook for authentication actions with loading states
 */
export function useAuthActions() {
  const {
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshSession,
    refreshProfile,
    updateProfile,
    updateProfileExtended,
    clearError,
  } = useAuth();

  // Enhanced sign in with better error handling
  const handleSignIn = useCallback(async (credentials: LoginCredentials) => {
    try {
      const result = await signIn(credentials);
      return result;
    } catch (error: any) {
      console.error('Sign in failed:', error);
      return { success: false, error: error.message || 'Sign in failed' };
    }
  }, [signIn]);

  // Enhanced sign up with validation
  const handleSignUp = useCallback(async (credentials: SignupCredentials) => {
    try {
      // Client-side validation
      if (!credentials.email || !credentials.password || !credentials.fullName) {
        return { success: false, error: 'All required fields must be filled' };
      }
      
      if (credentials.password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters long' };
      }
      
      const result = await signUp(credentials);
      return result;
    } catch (error: any) {
      console.error('Sign up failed:', error);
      return { success: false, error: error.message || 'Sign up failed' };
    }
  }, [signUp]);

  // Enhanced sign out
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      return { success: true };
    } catch (error: any) {
      console.error('Sign out failed:', error);
      return { success: false, error: error.message || 'Sign out failed' };
    }
  }, [signOut]);

  // Enhanced password reset
  const handleResetPassword = useCallback(async (email: string) => {
    try {
      if (!email) {
        return { success: false, error: 'Email is required' };
      }
      
      const result = await resetPassword(email);
      return result;
    } catch (error: any) {
      console.error('Password reset failed:', error);
      return { success: false, error: error.message || 'Password reset failed' };
    }
  }, [resetPassword]);

  // Enhanced password update
  const handleUpdatePassword = useCallback(async (password: string) => {
    try {
      if (!password || password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters long' };
      }
      
      const result = await updatePassword(password);
      return result;
    } catch (error: any) {
      console.error('Password update failed:', error);
      return { success: false, error: error.message || 'Password update failed' };
    }
  }, [updatePassword]);

  // Enhanced profile update
  const handleUpdateProfile = useCallback(async (updates: Partial<Profile>) => {
    try {
      const result = await updateProfile(updates);
      return result;
    } catch (error: any) {
      console.error('Profile update failed:', error);
      return { success: false, error: error.message || 'Profile update failed' };
    }
  }, [updateProfile]);

  // Enhanced profile update extended (for onboarding)
  const handleUpdateProfileExtended = useCallback(async (updates: Partial<Profile>) => {
    try {
      const result = await updateProfileExtended(updates);
      return result;
    } catch (error: any) {
      console.error('Profile update extended failed:', error);
      return { success: false, error: error.message || 'Profile update extended failed' };
    }
  }, [updateProfileExtended]);

  return {
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    updatePassword: handleUpdatePassword,
    updateProfile: handleUpdateProfile,
    updateProfileExtended: handleUpdateProfileExtended,
    refreshSession,
    refreshProfile,
    clearError,
  };
}

/**
 * Hook for authentication state with computed values
 */
export function useAuthState() {
  const {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated,
    isInitialized,
    error,
  } = useAuth();

  // Computed values
  const computedValues = useMemo(() => {
    const hasProfile = !!profile;
    const isProfileComplete = !!(profile?.full_name && profile?.phone);
    const userRole = profile?.role || 'member';
    const isAdmin = userRole === 'mosque_admin' || userRole === 'super_admin';
    const isModerator = userRole === 'ajk' || userRole === 'mosque_admin' || userRole === 'super_admin';
    const canManageUsers = isAdmin || isModerator;
    const needsOnboarding = isAuthenticated && (!hasProfile || !isProfileComplete);
    
    return {
      hasProfile,
      isProfileComplete,
      userRole,
      isAdmin,
      isModerator,
      canManageUsers,
      needsOnboarding,
    };
  }, [profile, isAuthenticated]);

  return {
    // Basic state
    user,
    profile,
    session,
    isLoading,
    isAuthenticated,
    isInitialized,
    error,
    
    // Computed values
    ...computedValues,
  };
}

/**
 * Hook for checking specific permissions
 */
export function useAuthPermissions() {
  const { profile } = useAuth();
  
  const permissions = useMemo(() => {
    const role = profile?.role || 'member';
    
    return {
      canViewDashboard: ['super_admin', 'mosque_admin', 'ajk', 'member'].includes(role),
      canManageUsers: ['super_admin', 'mosque_admin', 'ajk'].includes(role),
      canManageContent: ['super_admin', 'mosque_admin', 'ajk'].includes(role),
      canViewReports: ['super_admin', 'mosque_admin', 'ajk'].includes(role),
      canManageFinance: ['super_admin', 'mosque_admin'].includes(role),
      canDeleteUsers: ['super_admin', 'mosque_admin'].includes(role),
      canManageSettings: ['super_admin', 'mosque_admin'].includes(role),
      canViewAllProfiles: ['super_admin', 'mosque_admin', 'ajk'].includes(role),
      canEditOwnProfile: true, // All authenticated users can edit their own profile
    };
  }, [profile?.role]);
  
  return permissions;
}

/**
 * Hook for authentication guards
 */
export function useAuthGuards() {
  const { isAuthenticated, isInitialized, needsOnboarding } = useAuthState();
  
  const guards = useMemo(() => ({
    requireAuth: isAuthenticated,
    requireGuest: !isAuthenticated,
    requireOnboarding: needsOnboarding,
    isReady: isInitialized,
  }), [isAuthenticated, isInitialized, needsOnboarding]);
  
  return guards;
}

/**
 * Hook for form validation helpers
 */
export function useAuthValidation() {
  const validateEmail = useCallback((email: string): { isValid: boolean; error?: string } => {
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    
    return { isValid: true };
  }, []);
  
  const validatePassword = useCallback((password: string): { isValid: boolean; error?: string } => {
    if (!password) {
      return { isValid: false, error: 'Password is required' };
    }
    
    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' };
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' };
    }
    
    return { isValid: true };
  }, []);
  
  const validateFullName = useCallback((fullName: string): { isValid: boolean; error?: string } => {
    if (!fullName || !fullName.trim()) {
      return { isValid: false, error: 'Full name is required' };
    }
    
    if (fullName.trim().length < 2) {
      return { isValid: false, error: 'Full name must be at least 2 characters long' };
    }
    
    return { isValid: true };
  }, []);
  
  const validatePhone = useCallback((phone: string): { isValid: boolean; error?: string } => {
    if (!phone) {
      return { isValid: true }; // Phone is optional
    }
    
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
      return { isValid: false, error: 'Please enter a valid phone number' };
    }
    
    return { isValid: true };
  }, []);
  
  return {
    validateEmail,
    validatePassword,
    validateFullName,
    validatePhone,
  };
}

export default useAuth;