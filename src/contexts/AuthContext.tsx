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

      // Mark initial load as complete after processing the first event
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        previousUserId.current = currentUserId;
        return; // Don't show toast for initial session restoration
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
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
