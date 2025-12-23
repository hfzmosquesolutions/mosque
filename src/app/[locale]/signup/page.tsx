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
import { Mail, Eye, EyeOff, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useAdminAccess } from '@/hooks/useUserRole';

function SignupPageContent() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const { hasAdminAccess, loading: adminLoading } = useAdminAccess();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/onboarding';

  // Store returnUrl in sessionStorage so ProtectedRoute can access it
  useEffect(() => {
    if (returnUrl && returnUrl !== '/onboarding') {
      sessionStorage.setItem('returnUrl', returnUrl);
    }
  }, [returnUrl]);

  // Redirect admin users away from signup page
  useEffect(() => {
    if (!adminLoading && hasAdminAccess) {
      router.push('/dashboard');
    }
  }, [hasAdminAccess, adminLoading, router]);

  // Password strength checker
  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { strength: 'none', score: 0 };
    if (pwd.length < 6) return { strength: 'weak', score: 1 };
    
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 2) return { strength: 'weak', score };
    if (score <= 3) return { strength: 'medium', score };
    return { strength: 'strong', score };
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error(t('passwordsDontMatch'));
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
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
      
      toast.success(t('signupSuccess') || 'Account created successfully! Please check your email to verify your account.');
      
      // Store returnUrl for after onboarding
      if (returnUrl && returnUrl !== '/onboarding') {
        sessionStorage.setItem('pendingReturnUrl', returnUrl);
      }
      
      // Redirect to onboarding after successful signup
      setTimeout(() => {
        router.push('/onboarding');
      }, 1500);
    } catch (error: any) {
      toast.error(error?.message || t('signupError'));
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              {t('signUp')}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300 mt-2">
              {t('createNewAccount')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-6">
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
                  placeholder={t('createStrongPassword')}
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
                {password && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">
                        {t('passwordStrength')}:
                      </span>
                      <span
                        className={`font-medium ${
                          passwordStrength.strength === 'weak'
                            ? 'text-red-600 dark:text-red-400'
                            : passwordStrength.strength === 'medium'
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {t(passwordStrength.strength)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          passwordStrength.strength === 'weak'
                            ? 'bg-red-500 w-1/3'
                            : passwordStrength.strength === 'medium'
                            ? 'bg-yellow-500 w-2/3'
                            : 'bg-green-500 w-full'
                        }`}
                      />
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
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('confirmYourPassword')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10 h-11 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400"
                  required
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
                    {passwordsMatch ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {t('passwordsMatch')}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          {t('passwordsDontMatch')}
                        </span>
                      </>
                    )}
                  </div>
                )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              disabled={loading || !passwordsMatch || password.length < 6}
            >
              {loading ? t('creatingAccount') : t('signupButton')}
            </Button>

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

          {/* Login Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              {t('alreadyHaveAccountText')}{' '}
            </span>
            <Link
              href="/login"
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
            >
              {t('signIn')}
            </Link>
          </div>
        </CardContent>
      </Card>
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

