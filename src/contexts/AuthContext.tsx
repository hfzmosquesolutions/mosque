'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: (returnUrl?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitialLoad = useRef(true);
  const previousUserId = useRef<string | null>(null);
  const userCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  // Function to verify if user still exists in database
  const verifyUserExists = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('[AuthContext] Error checking user existence:', error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('[AuthContext] Exception checking user existence:', error);
      return false;
    }
  };

  // Function to handle user deletion - sign out if user doesn't exist
  const handleUserDeletion = async (userId: string) => {
    const userExists = await verifyUserExists(userId);
    if (!userExists) {
      console.log('[AuthContext] User no longer exists in database, signing out...');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      toast.error('Your account has been deleted. You have been signed out.');
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        previousUserId.current = session?.user?.id ?? null;
        
        // Verify user exists on initial load
        if (session?.user?.id) {
          await handleUserDeletion(session.user.id);
        }
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUserId = session?.user?.id ?? null;
      const wasSignedIn = previousUserId.current !== null;
      const isSignedIn = currentUserId !== null;
      const isActualSignIn = !wasSignedIn && isSignedIn;
      const isActualSignOut = wasSignedIn && !isSignedIn;

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Update current user ID ref
      currentUserIdRef.current = session?.user?.id ?? null;

      // Verify user exists when session changes (especially on SIGNED_IN)
      if (session?.user?.id && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        await handleUserDeletion(session.user.id);
      }

      // Clear previous interval if user signed out
      if (!session?.user?.id && userCheckInterval.current) {
        clearInterval(userCheckInterval.current);
        userCheckInterval.current = null;
      }

      // Set up periodic check for user existence (every 30 seconds)
      if (session?.user?.id && !userCheckInterval.current) {
        userCheckInterval.current = setInterval(async () => {
          const userId = currentUserIdRef.current;
          if (userId) {
            await handleUserDeletion(userId);
          }
        }, 30000); // Check every 30 seconds
      }

      // Handle first auth event (including email confirmation links)
      if (isInitialLoad.current) {
        // Detect if this initial sign-in came from an email confirmation/signup link
        if (event === 'SIGNED_IN' && typeof window !== 'undefined') {
          const url = window.location.href;
          const fromSignupLink =
            url.includes('type=signup') ||
            url.includes('#access_token=') ||
            url.includes('token_type=bearer');

          if (fromSignupLink) {
            const locale =
              window.location.pathname.match(/^\/(en|ms)\//)?.[1] || 'ms';
            if (locale === 'en') {
              toast.success(
                'Your email has been confirmed. Your account is now active and you are signed in.'
              );
            } else {
              toast.success(
                'Emel anda telah disahkan. Akaun anda kini aktif dan anda telah log masuk.'
              );
            }
          }
        }

        // Mark initial load as complete after processing the first event
        isInitialLoad.current = false;
        previousUserId.current = currentUserId;
        return; // Don't show generic toast for initial session restoration
      }

      // Only show toast messages for actual auth events
      if (event === 'SIGNED_IN' && isActualSignIn) {
        toast.success('Successfully signed in!');
      } else if (event === 'SIGNED_OUT' && isActualSignOut) {
        toast.success('Successfully signed out!');
      }

      previousUserId.current = currentUserId;
    });

    return () => {
      subscription.unsubscribe();
      if (userCheckInterval.current) {
        clearInterval(userCheckInterval.current);
        userCheckInterval.current = null;
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signInWithGoogle = async (returnUrl?: string) => {
    try {
      const callbackUrl = `${window.location.origin}/auth/callback`;
      const redirectTo = returnUrl 
        ? `${callbackUrl}?returnUrl=${encodeURIComponent(returnUrl)}`
        : callbackUrl;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
      }
    } catch {
      toast.error('An unexpected error occurred');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Use default locale 'ms' for reset password redirect
      // Supabase will append the tokens as query parameters
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const redirectTo = `${appUrl}/ms/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch {
      return { error: 'An unexpected error occurred' };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
