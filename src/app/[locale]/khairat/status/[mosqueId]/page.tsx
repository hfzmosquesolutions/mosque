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
import { ArrowLeft, CheckCircle2, ClipboardList, Loader2, ShieldCheck, UserPlus, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { getMosque, getUserPaymentHistory } from '@/lib/api';
import type { Mosque } from '@/types/database';
import { toast } from 'sonner';
import { isValidMalaysiaIc, normalizeMalaysiaIc } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { KhairatStandardHeader } from '@/components/khairat/KhairatStandardHeader';
import { KhairatLoadingHeader } from '@/components/khairat/KhairatLoadingHeader';

// Helper function to mask email for privacy
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [username, domain] = email.split('@');
  if (username.length <= 1) {
    return `*@${domain}`;
  }
  const firstChar = username[0];
  const maskedUsername = firstChar + '*'.repeat(Math.min(username.length - 1, 6));
  return `${maskedUsername}@${domain}`;
}

// Helper function to mask name for privacy (shows first name + first letter of last part)
function maskName(name: string): string {
  if (!name || name.trim().length === 0) return name;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return name;
  
  // Show first name fully if it's short, otherwise show first few characters
  const firstName = parts[0];
  if (firstName.length <= 4) {
    // Short first name - show fully
    if (parts.length === 1) return firstName;
    // Show first name + first letter of last part + asterisks
    const lastPart = parts[parts.length - 1];
    return `${firstName} ${lastPart[0]}***`;
  } else {
    // Long first name - show first 4 chars + asterisks
    if (parts.length === 1) return `${firstName.substring(0, 4)}***`;
    const lastPart = parts[parts.length - 1];
    return `${firstName.substring(0, 4)}*** ${lastPart[0]}***`;
  }
}

// Helper function to mask phone number for privacy
function maskPhone(phone: string): string {
  if (!phone || phone.trim().length === 0) return phone;
  // Remove all non-digit characters for processing
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length <= 4) {
    // Very short number - mask all but first digit
    return digitsOnly[0] + '*'.repeat(digitsOnly.length - 1);
  } else if (digitsOnly.length <= 7) {
    // Medium length - show first 2-3 digits, mask rest
    const showLength = Math.floor(digitsOnly.length / 3);
    return digitsOnly.substring(0, showLength) + '*'.repeat(digitsOnly.length - showLength);
  } else {
    // Standard phone number - show first 3-4 digits and last 2-3 digits
    const showStart = Math.min(4, Math.floor(digitsOnly.length / 3));
    const showEnd = Math.min(3, Math.floor(digitsOnly.length / 4));
    const start = digitsOnly.substring(0, showStart);
    const end = digitsOnly.substring(digitsOnly.length - showEnd);
    const masked = '*'.repeat(Math.max(3, digitsOnly.length - showStart - showEnd));
    return `${start}${masked}${end}`;
  }
}

interface KhairatStatusResponse {
  success: boolean;
  registration: {
    found: boolean;
    memberId?: string;
    membershipNumber?: string | null;
    status?: string;
    full_name?: string;
    email?: string;
    phone?: string;
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
  const tDashboard = useTranslations('dashboard');
  const tClaims = useTranslations('claims');
  const { user } = useAuth();

  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [icNumber, setIcNumber] = useState('');
  const [loadingMosque, setLoadingMosque] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusResult, setStatusResult] = useState<KhairatStatusResponse | null>(null);
  const [verifiedICNumber, setVerifiedICNumber] = useState<string | null>(null);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[] | null>(null);

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

      const result = data as KhairatStatusResponse;
      setStatusResult(result);
      // Store verified IC number if registration found
      if (result.registration.found) {
        setVerifiedICNumber(normalizedIc);
      }
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

  const translateStatus = (status?: string): string => {
    if (!status) return '';
    const normalized = status.toLowerCase();
    
    // Payment-related statuses (completed, failed)
    const paymentStatuses = ['completed', 'failed'];
    if (paymentStatuses.includes(normalized)) {
      try {
        const paymentTranslated = tKhairat(`paymentsTable.${normalized}` as any);
        // Check if it's a valid translation (not containing the key path or namespace indicators)
        if (paymentTranslated && typeof paymentTranslated === 'string' && 
            !paymentTranslated.toLowerCase().includes('payment') && 
            !paymentTranslated.toLowerCase().includes('table') &&
            paymentTranslated.length < 50) {
          return paymentTranslated;
        }
      } catch (e) {
        // Translation not found, use fallback
      }
      // Explicit fallbacks for payment statuses
      if (normalized === 'completed') {
        return locale === 'ms' ? 'Selesai' : 'Completed';
      }
      if (normalized === 'failed') {
        return locale === 'ms' ? 'Gagal' : 'Failed';
      }
    }
    
    // Try khairat namespace directly (active, approved, inactive, pending, suspended, under_review, rejected, withdrawn)
    const khairatStatuses = ['active', 'approved', 'inactive', 'pending', 'suspended', 'under_review', 'rejected', 'withdrawn'];
    if (khairatStatuses.includes(normalized)) {
      try {
        const khairatTranslated = tKhairat(normalized as any);
        // Check if it's a valid translation (not containing the key path or namespace indicators)
        if (khairatTranslated && typeof khairatTranslated === 'string' && 
            !khairatTranslated.toLowerCase().includes('khairat') && 
            !khairatTranslated.toLowerCase().includes('status') &&
            khairatTranslated.length < 50) { // Valid translations are usually short
          return khairatTranslated;
        }
      } catch (e) {
        // Translation not found, use fallback
      }
      // Explicit fallbacks for common statuses
      const fallbacks: Record<string, { ms: string; en: string }> = {
        active: { ms: 'Aktif', en: 'Active' },
        approved: { ms: 'Diluluskan', en: 'Approved' },
        inactive: { ms: 'Tidak Aktif', en: 'Inactive' },
        pending: { ms: 'Menunggu', en: 'Pending' },
        suspended: { ms: 'Digantung', en: 'Suspended' },
        under_review: { ms: 'Dalam Semakan', en: 'Under Review' },
        rejected: { ms: 'Ditolak', en: 'Rejected' },
        withdrawn: { ms: 'Ditarik balik', en: 'Withdrawn' },
      };
      if (fallbacks[normalized]) {
        return locale === 'ms' ? fallbacks[normalized].ms : fallbacks[normalized].en;
      }
    }
    
    // Try to get translation from claims.status namespace (for claim-specific statuses like paid, cancelled)
    const claimStatuses = ['paid', 'cancelled'];
    if (claimStatuses.includes(normalized)) {
      try {
        const claimsTranslated = tClaims(`status.${normalized}` as any);
        // Check if it's a valid translation (not containing the key path or namespace indicators)
        if (claimsTranslated && typeof claimsTranslated === 'string' && 
            !claimsTranslated.toLowerCase().includes('claims') && 
            !claimsTranslated.toLowerCase().includes('status') &&
            claimsTranslated.length < 50) {
          return claimsTranslated;
        }
      } catch (e) {
        // Translation not found, use fallback
      }
      // Explicit fallbacks for claim statuses
      if (normalized === 'paid') {
        return locale === 'ms' ? 'Dibayar' : 'Paid';
      }
      if (normalized === 'cancelled') {
        return locale === 'ms' ? 'Dibatalkan' : 'Cancelled';
      }
    }
    
    // Fallback: return capitalized status
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  };

  const handleEditIc = () => {
    setStatusResult(null);
    setVerifiedICNumber(null);
    setIcNumber('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchPayments = async () => {
      if (!mosqueId || !statusResult?.registration.found) return;
      setLoadingPayments(true);
      try {
        // Prefer logged-in user
        if (user?.id) {
          const res = await getUserPaymentHistory(user.id, mosqueId);
          setPaymentHistory(res.success ? (res.data || []) : []);
          return;
        }
        // Fallback: resolve user by verified IC number
        if (verifiedICNumber) {
          try {
            const { supabase } = await import('@/lib/supabase');
            const { data: profile, error } = await supabase
              .from('user_profiles')
              .select('id')
              .eq('ic_passport_number', verifiedICNumber)
              .limit(1)
              .maybeSingle();
            if (!error && profile?.id) {
              const res = await getUserPaymentHistory(profile.id, mosqueId);
              setPaymentHistory(res.success ? (res.data || []) : []);
              return;
            }
          } catch {
            // ignore and show empty
          }
        }
        setPaymentHistory([]);
      } catch {
        setPaymentHistory([]);
      } finally {
        setLoadingPayments(false);
      }
    };
    fetchPayments();
  }, [statusResult?.registration.found, verifiedICNumber, user?.id, mosqueId]);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user?.id || !mosqueId) return;
      setLoadingPayments(true);
      try {
        const res = await getUserPaymentHistory(user.id, mosqueId);
        if (res.success) {
          setPaymentHistory(res.data || []);
        } else {
          setPaymentHistory([]);
        }
      } catch {
        setPaymentHistory([]);
      } finally {
        setLoadingPayments(false);
      }
    };
    if (statusResult?.registration.found && user) {
      fetchPayments();
    } else {
      setPaymentHistory(null);
    }
  }, [statusResult?.registration.found, user, mosqueId]);
  if (loadingMosque) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <KhairatLoadingHeader
          locale={locale}
          mosqueId={mosqueId}
          title={tKhairat('status.checkTitle') || 'Check Khairat Status'}
          subtitle={undefined}
          icon={Search}
          iconBgColor="bg-purple-50 dark:bg-purple-950/20"
          iconColor="text-purple-600 dark:text-purple-400"
        />
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {tMosquePage('loadingMosqueProfile', { fallback: 'Loading mosque information...' })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!mosque) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <KhairatStandardHeader
          mosque={null}
          locale={locale}
          mosqueId={mosqueId}
          title={tKhairat('status.checkTitle') || 'Check Khairat Status'}
          icon={Search}
          iconBgColor="bg-emerald-50 dark:bg-emerald-950/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <div className="flex items-center justify-center py-12 px-4">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <KhairatStandardHeader
        mosque={mosque}
        locale={locale}
        mosqueId={mosqueId}
        title={tKhairat('status.checkTitle') || 'Check Khairat Status'}
        subtitle={mosque?.name ? `Check your khairat status at ${mosque.name}` : undefined}
        icon={Search}
        iconBgColor="bg-purple-50 dark:bg-purple-950/20"
        iconColor="text-purple-600 dark:text-purple-400"
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">
        {statusResult && (
          <div className="flex justify-end mb-4">
            <Button variant="link" size="sm" onClick={handleEditIc}>
              {tKhairat('status.editIcButton', { fallback: 'Back to IC Check' })}
            </Button>
          </div>
        )}

        {/* Membership Verification Status */}
        {statusResult && statusResult.registration.found && verifiedICNumber && (
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <strong className="text-slate-900 dark:text-slate-100">{tKhairat('payPage.membershipVerifiedTitle')}</strong>
              </div>
              {verifiedICNumber && (
                <div className="flex items-center gap-2 ml-6">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {tKhairat('payPage.icNumberLabel') || 'IC Number'}: <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {verifiedICNumber.slice(0, 6) + '******'}
                    </span>
                  </p>
                  {statusResult.registration.status && (
                    <Badge 
                      variant={
                        statusResult.registration.status === 'active' || statusResult.registration.status === 'approved' ? 'default' :
                        statusResult.registration.status === 'inactive' ? 'secondary' :
                        statusResult.registration.status === 'pending' ? 'secondary' :
                        'outline'
                      }
                      className="capitalize"
                    >
                      {translateStatus(statusResult.registration.status) || (locale === 'ms' ? 'Aktif' : 'Active')}
                    </Badge>
                  )}
                </div>
              )}
              {(statusResult.registration.memberId || statusResult.registration.membershipNumber) && (
                <p className="text-sm text-slate-600 dark:text-slate-400 ml-6">
                  {tKhairat('payPage.memberIdLabel') || 'Member ID'}: <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{statusResult.registration.membershipNumber || statusResult.registration.memberId?.slice(0, 8).toUpperCase()}</span>
                </p>
              )}
              
              {/* Display Name, Email, and Phone (Masked for Privacy) */}
              {(statusResult.registration.full_name || statusResult.registration.email || statusResult.registration.phone) && (
                <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 ml-6 space-y-2">
                  {statusResult.registration.full_name && (
                    <div className="flex items-start gap-3">
                      <span className="font-medium text-slate-600 dark:text-slate-400 min-w-[100px] text-sm">
                        {tKhairat('payPage.payerNameLabel')}:
                      </span>
                      <span className="text-slate-900 dark:text-slate-100 flex-1 text-sm">
                        {maskName(statusResult.registration.full_name)}
                      </span>
                    </div>
                  )}
                  {statusResult.registration.email && (
                    <div className="flex items-start gap-3">
                      <span className="font-medium text-slate-600 dark:text-slate-400 min-w-[100px] text-sm">
                        {tKhairat('payPage.emailLabel')}:
                      </span>
                      <span className="text-slate-900 dark:text-slate-100 flex-1 break-all text-sm">
                        {maskEmail(statusResult.registration.email)}
                      </span>
                    </div>
                  )}
                  {statusResult.registration.phone && (
                    <div className="flex items-start gap-3">
                      <span className="font-medium text-slate-600 dark:text-slate-400 min-w-[100px] text-sm">
                        {tKhairat('payPage.mobileNumberLabel')}:
                      </span>
                      <span className="text-slate-900 dark:text-slate-100 flex-1 text-sm">
                        {maskPhone(statusResult.registration.phone)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* IC Form Card - Only show when no status result yet */}
        {!statusResult && (
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
        )}

        {statusResult && (
          <div className="space-y-6">
            {/* Registration Status - Only show if not found */}
            {!statusResult.registration.found && (
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
                  <Alert>
                    <AlertDescription>
                      {tKhairat('status.noRegistrationFound') ||
                        'No khairat registration found for this IC number at this mosque. If you registered recently, please allow some time for processing.'}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

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
                          {translateStatus(claim.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  {tKhairat('paymentHistory') || 'Payment History'}
                </CardTitle>
                <CardDescription>
                  {tKhairat('paymentHistoryDescription') || 'Your khairat payments at this mosque.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingPayments && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {tKhairat('loadingKhairatData') || 'Loading khairat data...'}
                  </div>
                )}
                {!loadingPayments && (!paymentHistory || paymentHistory.length === 0) && (
                  <Alert>
                    <AlertDescription>
                      {tDashboard('noPaymentsYet') || 'No payments yet'}
                    </AlertDescription>
                  </Alert>
                )}
                {!loadingPayments && paymentHistory && paymentHistory.length > 0 && (
                  <div className="space-y-3">
                    {paymentHistory.map((p) => (
                      <div
                        key={p.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border rounded-md px-3 py-2 bg-slate-50 dark:bg-slate-900/40"
                      >
                        <div className="space-y-1">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {tKhairat('userPaymentsTable.amount') || 'Amount'}:{' '}
                            <span className="font-mono">RM {p.amount}</span>
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {tKhairat('userPaymentsTable.date') || 'Date'}:{' '}
                            {new Date(p.contributed_at).toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {tKhairat('userPaymentsTable.paymentMethod') || 'Payment Method'}:{' '}
                            {p.payment_method || (tKhairat('userPaymentsTable.notAvailable') || 'N/A')}
                          </p>
                          {p.payment_reference && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {tKhairat('userPaymentsTable.reference') || 'Reference'}:{' '}
                              <span className="font-mono">{p.payment_reference}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {p.payment_type === 'legacy' && (
                            <Badge variant="secondary">
                              {tKhairat('userPaymentsTable.legacy') || 'Legacy'}
                            </Badge>
                          )}
                          <Badge variant={getStatusBadgeVariant(p.status)} className="capitalize">
                            {translateStatus(p.status)}
                          </Badge>
                        </div>
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
