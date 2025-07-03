'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  isLoading: boolean;
}

export function LoginPage({ onLogin, isLoading }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const success = await onLogin(email, password);
      if (!success) {
        setError(t('auth.loginFailed'));
      }
    } catch (err) {
      setError(t('auth.loginFailed'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center font-bold">
            {t('auth.digitalMosqueSystem')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('auth.mosqueManagement')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('common.loading') : t('auth.login')}
            </Button>
          </form>

          <div className="mt-6 text-sm text-muted-foreground">
            <p className="font-semibold mb-2">Demo Accounts:</p>
            <ul className="space-y-1">
              <li>Super Admin: superadmin@masjid.gov.my</li>
              <li>Mosque Admin: admin@masjidalnur.my</li>
              <li>AJK: imam@masjidalnur.my</li>
              <li>Member: member@example.com</li>
            </ul>
            <p className="mt-2">Password: any password</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
