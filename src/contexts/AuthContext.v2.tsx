'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Session,
  AuthError as SupabaseAuthError,
} from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { AuthLoadingScreen } from '@/components/ui/loading';

// Enhanced Auth Types
interface AuthUser extends User {
  profile?: Profile;
}

interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupCredentials {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

interface AuthContextType {
  // State
  user: AuthUser | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  signIn: (
    credentials: LoginCredentials
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    credentials: SignupCredentials
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (
    updates: Partial<Profile>
  ) => Promise<{ success: boolean; error?: string }>;
  updateProfileExtended: (
    updates: Partial<Profile>
  ) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

// Custom Auth Error class
class AuthError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
  }
}

// Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth Provider Props
interface AuthProviderProps {
  children: React.ReactNode;
}

// Auth Provider Component
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    isInitialized: false,
    error: null,
  });

  const router = useRouter();

  // Error handler
  const handleError = useCallback((error: any): string => {
    console.error('Auth error:', error);

    if (error instanceof AuthError) {
      return error.message;
    }

    if (error?.message) {
      return error.message;
    }

    return 'An unexpected error occurred';
  }, []);

  // Set error state
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  // Load user profile
  const loadUserProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
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
        console.error('Error loading user profile:', error);
        throw error;
      }
    },
    []
  );

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      // Get current user (more reliable than getSession)
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        throw new AuthError(error.message);
      }

      if (user) {
        const profile = await loadUserProfile(user.id);

        setState({
          user,
          profile,
          session: null, // We don't rely on session anymore
          isLoading: false,
          isAuthenticated: true,
          isInitialized: true,
          error: null,
        });
      } else {
        setState({
          user: null,
          profile: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
          isInitialized: true,
          error: null,
        });
      }
    } catch (error) {
      const errorMessage = handleError(error);
      setState({
        user: null,
        profile: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        isInitialized: true,
        error: errorMessage,
      });
    }
  }, [loadUserProfile, handleError]);

  // Handle auth state changes
  const handleAuthStateChange = useCallback(
    async (event: string, session: Session | null) => {
      try {
        console.log('Auth state change:', event, session?.user?.id);

        switch (event) {
          case 'SIGNED_IN':
            console.log('isLoading 3', state);
            break;
          case 'TOKEN_REFRESHED':
            if (session?.user) {
              const profile = await loadUserProfile(session.user.id);
              console.log(
                'SIGNED_IN or TOKEN_REFRESHED',
                session.user,
                profile
              );
              setState({
                user: session.user,
                profile,
                session,
                isLoading: false,
                isAuthenticated: true,
                isInitialized: true,
                error: null,
              });
            }
            break;

          case 'SIGNED_OUT':
            console.log('SIGNED_OUT', session);
            setState({
              user: null,
              profile: null,
              session: null,
              isLoading: false,
              isAuthenticated: false,
              isInitialized: true,
              error: null,
            });
            break;

          default:
            // Handle other events if needed
            break;
        }
      } catch (error) {
        const errorMessage = handleError(error);
        console.error('Auth state change error:', error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      }
    },
    [loadUserProfile, handleError]
  );

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Listen for auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange]);

  // Handle browser tab visibility changes and window focus
  useEffect(() => {
    const checkUserValidity = async () => {
      if (state.isAuthenticated) {
        try {
          // Check if user is still valid
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser();

          if (error) {
            console.error('User check error:', error);
            // If user check fails, trigger sign out
            setState({
              user: null,
              profile: null,
              session: null,
              isLoading: false,
              isAuthenticated: false,
              isInitialized: true,
              error: null,
            });
            return;
          }

          if (!user) {
            // No user found, user should be signed out
            setState({
              user: null,
              profile: null,
              session: null,
              isLoading: false,
              isAuthenticated: false,
              isInitialized: true,
              error: null,
            });
          } else if (user.id !== state.user?.id) {
            // User doesn't match current user, refresh auth state
            await initializeAuth();
          }
        } catch (error) {
          console.error('Error checking user validity:', error);
        }
      }
    };

    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        await checkUserValidity();
      }
    };

    const handleWindowFocus = async () => {
      await checkUserValidity();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [state.isAuthenticated, state.user?.id, initializeAuth]);

  // Periodic user check
  useEffect(() => {
    if (!state.isAuthenticated) {
      return;
    }

    const checkUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          console.log('User expired or invalid, signing out user');
          setState({
            user: null,
            profile: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
            isInitialized: true,
            error: null,
          });
        }
      } catch (error) {
        console.error('Error during periodic user check:', error);
      }
    };

    // Check user every 5 minutes
    const interval = setInterval(checkUser, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [state.isAuthenticated]);

  // Sign in
  const signIn = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        clearError();
        setState((prev) => ({ ...prev, isLoading: true }));

        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email.trim().toLowerCase(),
          password: credentials.password,
        });

        if (error) {
          throw new AuthError(error.message);
        }

        if (data.user) {
          const profile = await loadUserProfile(data.user.id);

          // Check if profile is complete and redirect accordingly
          if (profile?.full_name && profile?.phone) {
            router.push('/dashboard');
          } else {
            router.push('/onboarding');
          }
        }

        return { success: true };
      } catch (error) {
        const errorMessage = handleError(error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    [clearError, loadUserProfile, handleError, router]
  );

  // Sign up
  const signUp = useCallback(
    async (credentials: SignupCredentials) => {
      try {
        clearError();
        setState((prev) => ({ ...prev, isLoading: true }));

        const { data, error } = await supabase.auth.signUp({
          email: credentials.email.trim().toLowerCase(),
          password: credentials.password,
          options: {
            data: {
              full_name: credentials.fullName.trim(),
              phone: credentials.phone?.trim() || null,
            },
          },
        });

        if (error) {
          throw new AuthError(error.message);
        }

        if (data.user) {
          // For new signups, redirect to onboarding
          router.push('/onboarding');
        }

        return { success: true };
      } catch (error) {
        const errorMessage = handleError(error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    [clearError, handleError, router]
  );

  // Sign out
  const signOut = useCallback(async () => {
    try {
      clearError();

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new AuthError(error.message);
      }

      router.push('/');
    } catch (error) {
      const errorMessage = handleError(error);
      setError(errorMessage);
    }
  }, [clearError, handleError, setError, router]);

  // Reset password
  const resetPassword = useCallback(
    async (email: string) => {
      try {
        clearError();

        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          {
            redirectTo: `${window.location.origin}/auth/reset-password`,
          }
        );

        if (error) {
          throw new AuthError(error.message);
        }

        return { success: true };
      } catch (error) {
        const errorMessage = handleError(error);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [clearError, handleError, setError]
  );

  // Update password
  const updatePassword = useCallback(
    async (password: string) => {
      try {
        clearError();

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
          throw new AuthError(error.message);
        }

        return { success: true };
      } catch (error) {
        const errorMessage = handleError(error);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [clearError, handleError, setError]
  );

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        throw new AuthError(error.message);
      }

      if (user) {
        const profile = await loadUserProfile(user.id);
        setState((prev) => ({
          ...prev,
          user,
          profile,
          session: null,
        }));
      } else {
        // No user found, sign out user
        setState({
          user: null,
          profile: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
          isInitialized: true,
          error: null,
        });
      }
    } catch (error) {
      const errorMessage = handleError(error);
      setError(errorMessage);
      // If refresh fails, sign out user
      setState({
        user: null,
        profile: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        isInitialized: true,
        error: errorMessage,
      });
    }
  }, [loadUserProfile, handleError, setError]);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    try {
      if (!state.user) {
        throw new AuthError('No authenticated user');
      }

      const profile = await loadUserProfile(state.user.id);
      setState((prev) => ({ ...prev, profile }));
    } catch (error) {
      const errorMessage = handleError(error);
      setError(errorMessage);
    }
  }, [state.user, loadUserProfile, handleError, setError]);

  // Update profile
  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      try {
        clearError();

        if (!state.user) {
          throw new AuthError('No authenticated user');
        }

        const { data, error } = await supabase
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.user.id)
          .select()
          .single();

        if (error) {
          throw new AuthError(error.message, error.code);
        }

        setState((prev) => ({ ...prev, profile: data }));
        return { success: true };
      } catch (error) {
        const errorMessage = handleError(error);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [state.user, clearError, handleError, setError]
  );

  // Update profile extended (for onboarding)
  const updateProfileExtended = useCallback(
    async (updates: Partial<Profile>) => {
      try {
        clearError();
        setState((prev) => ({ ...prev, isLoading: true }));

        if (!state.user) {
          throw new AuthError('No authenticated user');
        }

        const { data, error } = await supabase
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.user.id)
          .select()
          .single();

        if (error) {
          throw new AuthError(error.message, error.code);
        }

        setState((prev) => ({ ...prev, profile: data, isLoading: false }));
        return { success: true };
      } catch (error) {
        const errorMessage = handleError(error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    [state.user, clearError, handleError]
  );

  // Context value
  const value: AuthContextType = {
    // State
    user: state.user,
    profile: state.profile,
    session: state.session,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    isInitialized: state.isInitialized,
    error: state.error,

    // Actions
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshUser,
    refreshProfile,
    updateProfile,
    updateProfileExtended,
    clearError,
  };

  // Show loading screen while initializing
  if (!state.isInitialized) {
    return <AuthLoadingScreen />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
export type {
  AuthContextType,
  AuthUser,
  AuthState,
  LoginCredentials,
  SignupCredentials,
};
