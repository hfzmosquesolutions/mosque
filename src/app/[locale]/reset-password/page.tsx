'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Password strength checker
function getPasswordStrength(password: string): number {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
}

function ResetPasswordContent() {
  const t = useTranslations('auth');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const { session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  useEffect(() => {
    // Check if we have a valid session (user clicked reset link)
    if (session) {
      setIsValidSession(true);
    } else {
      // Check for access_token and refresh_token in URL params
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');

      if (accessToken && refreshToken) {
        // Set the session using the tokens from the reset link
        const setSessionFromTokens = async () => {
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Error setting session:', error);
              toast.error(t('invalidResetLink'));
              setTimeout(() => {
                router.push('/forgot-password');
              }, 3000);
            } else if (data.session) {
              setIsValidSession(true);
            }
          } catch (error) {
            console.error('Error setting session:', error);
            toast.error(t('invalidResetLink'));
            setTimeout(() => {
              router.push('/forgot-password');
            }, 3000);
          }
        };

        setSessionFromTokens();
      } else {
        // Invalid or expired link
        toast.error(t('invalidResetLink'));
        setTimeout(() => {
          router.push('/forgot-password');
        }, 3000);
      }
    }
  }, [session, searchParams, router, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }

    if (passwordStrength < 3) {
      toast.error('Please choose a stronger password');
      return;
    }

    setLoading(true);
    try {
      // Password update functionality not implemented yet
      toast.error('Password update is not available yet');
      return;
    } catch (error: any) {
      toast.error(error?.message || t('passwordUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                {t('invalidResetLink')}
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300 mt-2">
                This reset link is invalid or has expired. Please request a new
                one.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Link href="/forgot-password">Request New Reset Link</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (passwordUpdated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                {t('passwordUpdated')}
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300 mt-2">
                Your password has been successfully updated. You can now sign in
                with your new password.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 mb-4">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <AlertDescription className="text-emerald-700 dark:text-emerald-300">
                Redirecting to login page in a few seconds...
              </AlertDescription>
            </Alert>

            <Button
              asChild
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Link href="/login">{t('backToLogin')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              {t('resetPasswordTitle')}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300 mt-2">
              {t('resetPasswordSubtitle')}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {t('newPassword')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('newPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400 pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength <= 2
                            ? 'bg-red-500'
                            : passwordStrength <= 3
                            ? 'bg-yellow-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('passwordStrength')}{' '}
                      <span
                        className={`font-medium ${
                          passwordStrength <= 2
                            ? 'text-red-600 dark:text-red-400'
                            : passwordStrength <= 3
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {passwordStrength <= 2
                          ? t('weak')
                          : passwordStrength <= 3
                          ? t('medium')
                          : t('strong')}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {t('confirmNewPassword')}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('confirmNewPassword')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400 pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Password Match Indicator */}
              {confirmPassword && (
                <div className="flex items-center gap-2 text-xs">
                  {passwordsMatch ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {t('passwordsMatch')}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        {t('passwordsDontMatch')}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              disabled={loading || !passwordsMatch || passwordStrength < 3}
            >
              {loading ? t('updatingPassword') : t('updatePassword')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              asChild
              variant="ghost"
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
            >
              <Link href="/login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('backToLogin')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <ResetPasswordContent />;
}
