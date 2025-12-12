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
import { Eye, EyeOff, Lock, Mail, ArrowLeft, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { checkOnboardingStatus } from '@/lib/api';

function SignupPageContent() {
  const t = useTranslations('auth');
  const te = useTranslations('errors');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  // Store returnUrl in sessionStorage so ProtectedRoute can access it
  useEffect(() => {
    if (returnUrl && returnUrl !== '/dashboard') {
      sessionStorage.setItem('returnUrl', returnUrl);
    }
  }, [returnUrl]);

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(te('passwordsDoNotMatch'));
      return;
    }

    if (passwordStrength < 3) {
      toast.error(te('strongerPassword'));
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email, password);
      if (result?.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }
      
      toast.success(te('accountCreatedSuccessfully'));
      
      // Get the returnUrl from sessionStorage or query params
      const storedReturnUrl = sessionStorage.getItem('returnUrl') || returnUrl;
      
      // Wait a bit for auth state to update, then check onboarding status
      setTimeout(async () => {
        try {
          // Get the user ID from the auth context
          const { supabase } = await import('@/lib/supabase');
          const { data: { user: authUser } } = await supabase.auth.getUser();
          
          if (authUser?.id) {
            // Check if user needs onboarding
            const onboardingCompleted = await checkOnboardingStatus(authUser.id);
            
            if (!onboardingCompleted) {
              // Store returnUrl for after onboarding completion
              if (storedReturnUrl && storedReturnUrl !== '/dashboard') {
                sessionStorage.setItem('pendingReturnUrl', storedReturnUrl);
              }
              // Clear the regular returnUrl since we're using pendingReturnUrl
              if (sessionStorage.getItem('returnUrl')) {
                sessionStorage.removeItem('returnUrl');
              }
              // Redirect to onboarding
              window.location.href = '/onboarding';
              return;
            }
          }
          
          // Clear sessionStorage
          if (sessionStorage.getItem('returnUrl')) {
            sessionStorage.removeItem('returnUrl');
          }
          
          // Onboarding completed, redirect to returnUrl
          window.location.href = storedReturnUrl;
        } catch (error) {
          console.error('Error checking onboarding:', error);
          // Fallback: just redirect to returnUrl
          if (sessionStorage.getItem('returnUrl')) {
            sessionStorage.removeItem('returnUrl');
          }
          window.location.href = storedReturnUrl;
        }
      }, 200);
    } catch (error: any) {
      toast.error(error?.message || te('failedToCreateAccount'));
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
      <div className="w-full max-w-md space-y-6">
        {/* Signup Card */}
        <Card className="border-emerald-100 dark:border-slate-700 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-semibold text-center text-slate-900 dark:text-slate-100">
              {t('signup')}
            </CardTitle>
            <CardDescription className="text-center text-slate-600 dark:text-slate-400">
              {t('joinPlatform')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  {t('emailAddress')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
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
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('createStrongPassword')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                    minLength={6}
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
                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full ${
                            level <= passwordStrength
                              ? passwordStrength <= 2
                                ? 'bg-red-500'
                                : passwordStrength <= 3
                                ? 'bg-yellow-500'
                                : 'bg-emerald-500'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {t('passwordStrength')}{' '}
                      {passwordStrength <= 2
                        ? t('weak')
                        : passwordStrength <= 3
                        ? t('medium')
                        : t('strong')}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  {t('confirmPassword')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t('confirmYourPassword')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {confirmPassword && (
                  <div className="flex items-center gap-2 text-xs">
                    {password === confirmPassword ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600">
                          {t('passwordsMatch')}
                        </span>
                      </>
                    ) : (
                      <span className="text-red-500">
                        {t('passwordsDontMatch')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                disabled={
                  loading ||
                  password !== confirmPassword ||
                  passwordStrength < 3
                }
              >
                {loading ? t('creatingAccount') : t('signupButton')}
              </Button>

              {/* Divider */}
              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-800 px-3 text-slate-500 dark:text-slate-400 font-medium">
                    {t('orContinueWith')}
                  </span>
                </div>
              </div>

              {/* Google Sign Up Button */}
              <Button
                variant="outline"
                type="button"
                onClick={handleGoogleSignup}
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

            {/* Sign In Link */}
            <div className="mt-6 text-center text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                {t('alreadyHaveAccountText')}{' '}
              </span>
              <Link
                href={`/login${returnUrl !== '/dashboard' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
               
              >
                {t('login')}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Back to home link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
           
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <ProtectedRoute requireAuth={false}>
      <SignupPageContent />
    </ProtectedRoute>
  );
}
