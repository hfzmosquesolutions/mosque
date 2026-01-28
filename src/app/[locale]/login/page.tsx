'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAdminAccess } from '@/hooks/useUserRole';
import { checkOnboardingStatus } from '@/lib/api';

function LoginPageContent() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const { hasAdminAccess, loading: adminLoading } = useAdminAccess();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  // Store returnUrl in sessionStorage so ProtectedRoute can access it
  useEffect(() => {
    if (returnUrl && returnUrl !== '/dashboard') {
      sessionStorage.setItem('returnUrl', returnUrl);
    }
  }, [returnUrl]);

  // Redirect admin users away from login page
  useEffect(() => {
    if (!adminLoading && hasAdminAccess) {
      router.push('/dashboard');
    }
  }, [hasAdminAccess, adminLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (result?.error) {
        // Handle common auth errors with translations
        if (result.error.toLowerCase().includes('email not confirmed')) {
          toast.error(t('emailNotConfirmed'));
        } else {
          toast.error(result.error);
        }
        setLoading(false);
        return;
      }
      
      toast.success(t('loginSuccess'));
      
      // Get the returnUrl from sessionStorage or query params
      const storedReturnUrl = sessionStorage.getItem('returnUrl') || returnUrl;
      
      // Wait a bit for auth state to update, then redirect
      setTimeout(async () => {
        try {
          // Check if user is admin to determine which dashboard
          const { supabase } = await import('@/lib/supabase');
          const { data: { user: authUser } } = await supabase.auth.getUser();
          
          if (!authUser?.id) {
            console.error('No user found after login');
            setLoading(false);
            return;
          }

          // Check onboarding status first
          const onboardingCompleted = await checkOnboardingStatus(authUser.id);
          
          if (!onboardingCompleted) {
            // User hasn't completed onboarding, redirect to onboarding
            const locale = window.location.pathname.match(/^\/(en|ms)\//)?.[1] || 'ms';
            const onboardingUrl = `/${locale}/onboarding`;
            
            // Store returnUrl for after onboarding (only if it's a specific URL, not default dashboard)
            if (storedReturnUrl && storedReturnUrl !== '/dashboard' && storedReturnUrl !== '/my-dashboard') {
              sessionStorage.setItem('pendingReturnUrl', storedReturnUrl);
            }
            
            window.location.href = onboardingUrl;
            return;
          }
          
          let redirectUrl = storedReturnUrl;
          
          // If redirecting to dashboard, check admin status
          if (redirectUrl === '/dashboard' || redirectUrl.includes('/dashboard')) {
            const { data: mosqueData } = await supabase
              .from('mosques')
              .select('id')
              .eq('user_id', authUser.id)
              .maybeSingle();
            
            // Redirect to appropriate dashboard
            redirectUrl = mosqueData ? '/dashboard' : '/my-dashboard';
          }
          
          // Clear sessionStorage
          if (sessionStorage.getItem('returnUrl')) {
            sessionStorage.removeItem('returnUrl');
          }
          
          // Ensure redirectUrl has locale prefix
          const locale = window.location.pathname.match(/^\/(en|ms)\//)?.[1] || 'ms';
          if (!redirectUrl.startsWith(`/${locale}/`) && !redirectUrl.startsWith('/en/') && !redirectUrl.startsWith('/ms/')) {
            redirectUrl = `/${locale}${redirectUrl.startsWith('/') ? redirectUrl : '/' + redirectUrl}`;
          }
          
          // Redirect to appropriate dashboard
          window.location.href = redirectUrl;
        } catch (error) {
          console.error('Error during redirect:', error);
          setLoading(false);
        }
      }, 500);
    } catch (error: any) {
      toast.error(error?.message || t('loginError'));
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await signInWithGoogle(returnUrl);
    
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
    }
    // Note: If successful, the user will be redirected by OAuth flow
    // so we don't need to handle success case here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              {t('login')}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300 mt-2">
              {t('signInToAccount')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {t('emailAddress')}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t('enterEmailAddress')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {t('password')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 h-11 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              disabled={loading}
            >
              {loading ? t('signingIn') : t('signIn')}
            </Button>

            {/* Forgot Password */}
            <div className="flex items-center justify-start text-sm">
              <Link
                href="/forgot-password"
                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
               >
                {t('forgotPassword')}
              </Link>
            </div>

            {/* Divider */}
            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/80 dark:bg-slate-800/80 px-3 text-slate-500 dark:text-slate-400 font-medium">
                  {t('orContinueWith')}
                </span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <Button
              variant="outline"
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full mt-4 h-11 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <svg
                className="mr-2 h-4 w-4"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                ></path>
              </svg>
              {t('continueWithGoogle')}
            </Button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              {t('dontHaveAccount')}{' '}
            </span>
            <Link
              href="/signup"
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
            >
              {t('signUp')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <ProtectedRoute requireAuth={false}>
      <LoginPageContent />
    </ProtectedRoute>
  );
}
