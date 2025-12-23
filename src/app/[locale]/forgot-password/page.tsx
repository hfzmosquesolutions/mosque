'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function ForgotPasswordContent() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error(t('enterEmailAddress'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPassword(email);

      if (error) {
        toast.error(error);
      } else {
        setEmailSent(true);
        toast.success(t('resetLinkSent'));
      }
    } catch (error: any) {
      toast.error(error?.message || t('resetPasswordError'));
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                {t('resetLinkSent')}
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300 mt-2">
                {t('resetLinkSentDescription')}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20">
              <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <AlertDescription className="text-emerald-700 dark:text-emerald-300">
                We sent a reset link to <strong>{email}</strong>
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => setEmailSent(false)}
                variant="outline"
                className="w-full"
              >
                Send Another Link
              </Button>

              <Button
                asChild
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              {t('forgotPasswordTitle')}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300 mt-2">
              {t('forgotPasswordSubtitle')}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              disabled={loading}
            >
              {loading ? t('sendingResetLink') : t('sendResetLink')}
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

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}
