'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
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
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, ClipboardList, Loader2, ShieldCheck, UserPlus, AlertCircle } from 'lucide-react';
import { getMosque } from '@/lib/api';
import type { Mosque } from '@/types/database';
import { toast } from 'sonner';
import { isValidMalaysiaIc, normalizeMalaysiaIc } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface KhairatStatusResponse {
  success: boolean;
  registration: {
    found: boolean;
    memberId?: string;
    membershipNumber?: string | null;
    status?: string;
  };
  claims: Array<{
    id: string;
    claimId?: string | null;
    status: string;
    createdAt: string;
  }>;
}

function KhairatStatusPageContent() {
  const params = useParams();
  const router = useRouter();
  const mosqueId = params.mosqueId as string;
  const locale = params.locale as string;
  const tKhairat = useTranslations('khairat');
  const tMosquePage = useTranslations('mosquePage');
  const { user } = useAuth();

  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [icNumber, setIcNumber] = useState('');
  const [loadingMosque, setLoadingMosque] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusResult, setStatusResult] = useState<KhairatStatusResponse | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchMosque = async () => {
      try {
        const res = await getMosque(mosqueId);
        if (res.success && res.data) {
          setMosque(res.data);
        }
      } catch (error) {
        console.error('Error loading mosque for khairat status page:', error);
        toast.error('Failed to load mosque information');
      } finally {
        setLoadingMosque(false);
      }
    };

    if (mosqueId) {
      fetchMosque();
    }
  }, [mosqueId]);

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!icNumber || !icNumber.trim()) {
      toast.error(tKhairat('errors.icRequired') || 'Please enter your IC number');
      return;
    }

    const normalizedIc = normalizeMalaysiaIc(icNumber).slice(0, 12);
    if (!isValidMalaysiaIc(normalizedIc)) {
      toast.error('Invalid IC number.');
      return;
    }

    setCheckingStatus(true);
    setStatusResult(null);

    try {
      const response = await fetch('/api/khairat-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mosqueId,
          ic: normalizedIc,
        }),
      });

      const data: KhairatStatusResponse | { error?: string } = await response.json();

      if (!response.ok || !(data as any).success) {
        const message =
          (data as any).error ||
          tKhairat('status.checkFailed') ||
          'Failed to check status. Please try again.';
        toast.error(message);
        return;
      }

      setStatusResult(data as KhairatStatusResponse);
    } catch (error) {
      console.error('Error checking khairat status:', error);
      toast.error(
        tKhairat('status.checkFailed') || 'Failed to check status. Please try again.'
      );
    } finally {
      setCheckingStatus(false);
    }
  };

  const getStatusBadgeVariant = (status?: string) => {
    if (!status) return 'outline' as const;
    const normalized = status.toLowerCase();
    if (['active', 'approved', 'completed', 'paid'].includes(normalized)) {
      return 'default' as const;
    }
    if (['pending', 'under_review', 'processing'].includes(normalized)) {
      return 'secondary' as const;
    }
    if (['rejected', 'withdrawn', 'cancelled', 'inactive', 'suspended', 'failed'].includes(normalized)) {
      return 'destructive' as const;
    }
    return 'outline' as const;
  };

  if (loadingMosque) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {tMosquePage('loadingMosqueProfile', { fallback: 'Loading mosque information...' })}
          </p>
        </div>
      </div>
    );
  }

  if (!mosque) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>{tMosquePage('mosquePage') || 'Mosque Page'}</CardTitle>
            <CardDescription>
              {tMosquePage('loadingMosqueProfile') || 'Unable to load mosque profile.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => router.push(`/${locale}/mosques`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {tMosquePage('backToMosques') || 'Back to Mosques'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/${locale}/mosques/${mosqueId}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {tMosquePage('backToMosques') || 'Back to Mosques'}
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {tKhairat('status.checkTitle') || 'Check Khairat Status'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                {tKhairat('status.checkDescription') ||
                  'Enter your IC number to check your khairat registration and claim status for this mosque. For your privacy, only basic status information is shown.'}
              </p>
            </div>
          </div>
        </div>

        {/* Login Encouragement (only for non-logged in users) */}
        {!user && (
          <Alert className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <strong>{tKhairat('payPage.notLoggedInTitle')}</strong>{' '}
                  {tKhairat('payPage.notLoggedInDescription')}{' '}
                  <Link href={`/${locale}/login?returnUrl=/${locale}/khairat/status/${mosqueId}`} className="underline font-semibold">
                    {tKhairat('payPage.login')}
                  </Link>{' '}
                </div>
                <Link href={`/${locale}/login?returnUrl=/${locale}/khairat/status/${mosqueId}`}>
                  <Button size="sm" variant="outline" className="ml-4">
                    {tKhairat('payPage.login')}
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              {tKhairat('status.icFormTitle') || 'Check by IC Number'}
            </CardTitle>
            <CardDescription>
              {tKhairat('status.icFormDescription') ||
                'Enter your IC number to verify your membership and view your status.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCheckStatus} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ic_status_check">
                  {tKhairat('payPage.icNumberLabel')}{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ic_status_check"
                  value={icNumber}
                  onChange={(e) =>
                    setIcNumber(normalizeMalaysiaIc(e.target.value).slice(0, 12))
                  }
                  placeholder={tKhairat('payPage.icNumberPlaceholder')}
                  maxLength={12}
                  disabled={checkingStatus}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !checkingStatus && icNumber.trim()) {
                      e.preventDefault();
                      const form = e.currentTarget.closest('form');
                      if (form) {
                        handleCheckStatus(e as any);
                      }
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {tKhairat('payPage.icNumberHelp')}
                </p>
              </div>

              <Button
                type="submit"
                disabled={checkingStatus || !icNumber.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {checkingStatus && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {tKhairat('status.checkButton', { fallback: 'Check Status' })}
              </Button>
            </form>

            <div className="pt-4 border-t">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                {tKhairat('payPage.notMemberQuestion')}
              </p>
              <Link href={`/${locale}/khairat/register/${mosqueId}`} className="w-full">
                <Button variant="outline" className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {tKhairat('payPage.registerForKhairat')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {statusResult && (
          <div className="space-y-6">
            {/* Registration Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  {tKhairat('status.registrationTitle') || 'Registration Status'}
                </CardTitle>
                <CardDescription>
                  {tKhairat('status.registrationDescription') ||
                    'Your khairat membership status at this mosque.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!statusResult.registration.found ? (
                  <Alert>
                    <AlertDescription>
                      {tKhairat('status.noRegistrationFound') ||
                        'No khairat registration found for this IC number at this mosque. If you registered recently, please allow some time for processing.'}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {tKhairat('status.registrationFoundLabel') || 'Registration found'}
                      </span>
                      <Badge variant={getStatusBadgeVariant(statusResult.registration.status)}>
                        {statusResult.registration.status || 'unknown'}
                      </Badge>
                    </div>

                    {statusResult.registration.membershipNumber && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {tKhairat('status.membershipNumberLabel') || 'Membership Number:'}{' '}
                        <span className="font-mono">
                          {statusResult.registration.membershipNumber}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Claims Status (limited info) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <ClipboardList className="h-5 w-5 text-emerald-600" />
                  {tKhairat('status.claimsTitle') || 'Khairat Claim Status'}
                </CardTitle>
                <CardDescription>
                  {tKhairat('status.claimsDescription') ||
                    'Your submitted claims and their current status.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(!statusResult.claims || statusResult.claims.length === 0) && (
                  <Alert>
                    <AlertDescription>
                      {tKhairat('status.noClaimsFound') ||
                        'No khairat claims found for this IC number at this mosque, or claims are still being processed.'}
                    </AlertDescription>
                  </Alert>
                )}

                {statusResult.claims && statusResult.claims.length > 0 && (
                  <div className="space-y-3">
                    {statusResult.claims.map((claim) => (
                      <div
                        key={claim.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border rounded-md px-3 py-2 bg-slate-50 dark:bg-slate-900/40"
                      >
                        <div className="space-y-1">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {tKhairat('status.claimIdLabel') || 'Claim ID:'}{' '}
                            <span className="font-mono">
                              {claim.claimId || claim.id.substring(0, 8)}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {tKhairat('status.claimDateLabel') || 'Submitted on:'}{' '}
                            {new Date(claim.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(claim.status)} className="w-fit">
                          {claim.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KhairatStatusPage() {
  return <KhairatStatusPageContent />;
}


