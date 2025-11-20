'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StatsCard, StatsCardColors } from '@/components/ui/stats-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  Heart,
  Target,
  Plus,
  Activity,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  Users,
  Edit,
  Trophy,
  AlertCircle,
  CheckCircle,
  Settings,
} from 'lucide-react';
import { useAdminAccess, useUserMosque } from '@/hooks/useUserRole';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import { KhairatContributionForm } from '@/components/khairat/KhairatContributionForm';
import { KhairatTabContent } from '@/components/khairat/KhairatTabContent';
import { UserPaymentsTable } from '@/components/khairat/UserPaymentsTable';
import { FeatureGate } from '@/components/subscription/FeatureGate';

import { MosqueKhairatContributions } from '@/components/khairat/MosqueKhairatContributions';
import {
  getUserKhairatContributions,
  getMosque,
  getMosqueKhairatContributions,
  getUserClaims,
  getMosqueClaims,
} from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type {
  KhairatContribution,
  Mosque,
  KhairatClaimWithDetails,
} from '@/types/database';
import { ClaimsManagement } from '@/components/admin/ClaimsManagement';
import { KhairatDataDashboard } from '@/components/admin/KhairatDataDashboard';
import { LegacyDataManagement } from '@/components/admin/LegacyDataManagement';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { createClaim } from '@/lib/api';
import Link from 'next/link';
import type { ClaimStatus, ClaimPriority, CreateKhairatClaim } from '@/types/database';
import { checkMosquePaymentGateway, type PaymentGatewayStatus } from '@/lib/payments/payment-gateway-check';

function KhairatContent() {
  const t = useTranslations('khairat');
  const { user } = useAuth();
  const { hasAdminAccess, loading: adminLoading } = useAdminAccess();
  const { mosqueId } = useUserMosque();
  const { isCompleted, isLoading: onboardingLoading } = useOnboardingRedirect();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userContributions, setUserContributions] = useState<KhairatContribution[]>([]);
  const [allContributions, setAllContributions] = useState<KhairatContribution[]>([]);
  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [userClaims, setUserClaims] = useState<KhairatClaimWithDetails[]>([]);
  const [adminClaims, setAdminClaims] = useState<KhairatClaimWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [showCreateClaimDialog, setShowCreateClaimDialog] = useState(false);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimForm, setClaimForm] = useState<{
    requested_amount: number;
    title: string;
    description: string;
    priority: ClaimPriority;
  }>({ requested_amount: 0, title: '', description: '', priority: 'medium' });
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [paymentGatewayStatus, setPaymentGatewayStatus] = useState<PaymentGatewayStatus | null>(null);
  const [checkingPaymentGateway, setCheckingPaymentGateway] = useState(false);

  // Redirect normal users away from admin-only khairat page (wait for role + onboarding to resolve)
  useEffect(() => {
    if (!onboardingLoading && isCompleted && !adminLoading && !hasAdminAccess) {
      router.replace('/dashboard');
    }
  }, [hasAdminAccess, adminLoading, onboardingLoading, isCompleted, router]);

  // Handle URL tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'applications', 'payments', 'claims', 'legacy'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const getStatusConfig = (tAny: any): Record<ClaimStatus, { label: string }> => ({
    pending: { label: 'pending' },
    under_review: { label: 'under_review' },
    approved: { label: 'approved' },
    rejected: { label: 'rejected' },
    paid: { label: 'paid' },
    cancelled: { label: 'cancelled' },
  });

  const checkPaymentGateway = async (mosqueId: string) => {
    setCheckingPaymentGateway(true);
    try {
      const status = await checkMosquePaymentGateway(mosqueId);
      setPaymentGatewayStatus(status);
    } catch (error) {
      console.error('Error checking payment gateway:', error);
      setPaymentGatewayStatus({
        hasActiveProvider: false,
        providers: [],
        needsSetup: true,
      });
    } finally {
      setCheckingPaymentGateway(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const contributionsResult = await getUserKhairatContributions(user.id);
      setUserContributions(contributionsResult.data || []);

      if (mosqueId) {
        const mosqueResult = await getMosque(mosqueId);
        if (mosqueResult.success && mosqueResult.data) {
          setMosque(mosqueResult.data);
        }

        // Check payment gateway status for admin users
        if (hasAdminAccess) {
          await checkPaymentGateway(mosqueId);
        }

        // Fetch all contributions for admin users
        if (hasAdminAccess) {
          try {
            const allContributionsResult = await getMosqueKhairatContributions(
              mosqueId,
              1000,
              0
            );
            setAllContributions(allContributionsResult.data || []);
          } catch (error) {
            console.error('Error fetching all contributions:', error);
            setAllContributions([]);
          }

          // Fetch latest claims for admin overview
          try {
            const claimsResult = await getMosqueClaims(mosqueId, undefined, 5, 0);
            setAdminClaims(claimsResult.data || []);
          } catch (e) {
            console.error('Error fetching mosque claims:', e);
            setAdminClaims([]);
          }
        }
        // Regular user claims
        if (!hasAdminAccess) {
          try {
            const userClaimsResult = await getUserClaims(user.id, 50, 0);
            setUserClaims(userClaimsResult.data || []);
          } catch (e) {
            console.error('Error fetching user claims:', e);
            setUserClaims([]);
          }
        }
      } else {
        setMosque(null);
        setAllContributions([]);
      }
    } catch (error) {
      console.error('Error fetching khairat data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, mosqueId, hasAdminAccess]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData, isCompleted, onboardingLoading]);

  if (onboardingLoading || !isCompleted || adminLoading) {
    return null;
  }

  // Do not render anything for non-admin users
  if (!hasAdminAccess) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loadingKhairatData')}</p>
        </div>
      </div>
    );
  }

  // Use allContributions for admin users, userContributions for regular users
  const contributionsToCalculate = hasAdminAccess ? allContributions : userContributions;
  
  const totalContributed = contributionsToCalculate.reduce(
    (sum, contribution) => sum + contribution.amount,
    0
  );
  // Khairat is now mosque-specific, no need for program counts
  const recentContributions = hasAdminAccess
    ? allContributions.slice(0, 5)
    : userContributions.slice(0, 5);
  const averageContribution =
    contributionsToCalculate.length > 0
      ? totalContributed / contributionsToCalculate.length
      : 0;
  // Khairat is now mosque-specific, no need for program counting

  // Admin metrics: total received (completed) and latest payment
  const adminCompletedContributions = hasAdminAccess
    ? allContributions.filter((c) => c.status === 'completed')
    : [];
  const adminTotalReceived = hasAdminAccess
    ? adminCompletedContributions.reduce((sum, c) => sum + c.amount, 0)
    : 0;
  const adminLatestPayment = hasAdminAccess
    ? (adminCompletedContributions[0] || allContributions[0])
    : undefined;
  const adminLatestPayments = hasAdminAccess
    ? adminCompletedContributions.slice(0, 5)
    : [];
  const adminLatestClaims = hasAdminAccess
    ? adminClaims.slice(0, 5)
    : [];

  // Khairat is now mosque-specific, no need for program calculations

  const calculateProgress = (current: number, target?: number) => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };


  return (
    <div className="space-y-6">
      {/* Header with Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {hasAdminAccess ? t('khairatManagement') : t('khairat')}
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-600">
          <TabsTrigger 
            value="overview" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            {t('overview')}
          </TabsTrigger>
          {hasAdminAccess && (
            <TabsTrigger 
              value="applications" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              Applications
            </TabsTrigger>
          )}
          <TabsTrigger 
            value="payments" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            {t('payments')}
          </TabsTrigger>
          <TabsTrigger 
            value="claims" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            Claims
          </TabsTrigger>
          {hasAdminAccess && (
            <TabsTrigger 
              value="legacy" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              Legacy Data
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" forceMount className="space-y-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {t('overview')}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {hasAdminAccess 
                  ? 'View khairat statistics and recent activities'
                  : t('paymentSummaryDescription')
                }
              </p>
            </div>
          </div>

          {/* System Status & Alerts */}
          <div className="space-y-4">
            {/* Payment Gateway Status Alert */}
            {hasAdminAccess && paymentGatewayStatus && (
              <div>
                {paymentGatewayStatus.needsSetup ? (
                  <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-amber-800 dark:text-amber-200">
                          Payment Gateway Not Configured
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          To accept online payments for khairat contributions, you need to set up a payment gateway. 
                          <Link href="/settings?tab=payment-settings" className="ml-1 underline hover:no-underline">
                            Set it up now →
                          </Link>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-green-800 dark:text-green-200">
                          Payment Gateway Ready
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Online payments are enabled with {paymentGatewayStatus.providers.join(', ')}. 
                          Members can contribute to khairat securely online.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title={hasAdminAccess ? 'Total Received' : t('totalContributed')}
              value={`RM ${(hasAdminAccess ? adminTotalReceived : totalContributed).toLocaleString()}`}
              subtitle={hasAdminAccess
                ? `Across ${adminCompletedContributions.length} payments`
                : t('acrossPayments', { count: userContributions.length })}
              icon={DollarSign}
              {...StatsCardColors.emerald}
            />

            <StatsCard
              title={t('recentActivity')}
              value={hasAdminAccess ? Math.min(adminLatestPayments.length, 3) : Math.min(recentContributions.length, 3)}
              subtitle={t('recentPayments')}
              icon={ArrowUpRight}
              {...StatsCardColors.orange}
            />

            <StatsCard
              title={t('averagePayment')}
              value={`RM ${(
                hasAdminAccess
                  ? (adminCompletedContributions.length > 0
                      ? adminTotalReceived / adminCompletedContributions.length
                      : 0)
                  : averageContribution
              ).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              subtitle={t('perPayment')}
              icon={TrendingUp}
              {...StatsCardColors.blue}
            />

            <StatsCard
              title="Average Contribution"
              value=""
              icon={Trophy}
              {...StatsCardColors.yellow}
            >
              {averageContribution > 0 ? (
                <div>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    RM {averageContribution.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {hasAdminAccess ? 'Per contribution' : 'Your average'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No contributions yet</p>
              )}
            </StatsCard>
          </div>

          {/* System Overview & Recent Activity */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Khairat System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  System Status
                </CardTitle>
                <CardDescription>
                  Current status of your mosque's khairat system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">System Status</span>
                    <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Contributors</span>
                    <span className="text-sm font-semibold">
                      {hasAdminAccess 
                        ? new Set(allContributions.map(c => c.contributor_id || c.contributor_name)).size
                        : userContributions.length > 0 ? '1' : '0'
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">This Month</span>
                    <span className="text-sm font-semibold">
                      {hasAdminAccess 
                        ? allContributions.filter(c => {
                            const contributionDate = new Date(c.contributed_at);
                            const now = new Date();
                            return contributionDate.getMonth() === now.getMonth() && 
                                   contributionDate.getFullYear() === now.getFullYear();
                          }).length
                        : userContributions.filter(c => {
                            const contributionDate = new Date(c.contributed_at);
                            const now = new Date();
                            return contributionDate.getMonth() === now.getMonth() && 
                                   contributionDate.getFullYear() === now.getFullYear();
                          }).length
                      } contributions
                    </span>
                  </div>
                  
                  {hasAdminAccess && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Khairat settings can be configured in Settings → Service Management
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest khairat activities and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(hasAdminAccess ? adminLatestPayments : recentContributions).length > 0 ? (
                    (hasAdminAccess ? adminLatestPayments : recentContributions).slice(0, 3).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-b-0 border-gray-100 dark:border-gray-800">
                        <div className="min-w-0 mr-4">
                          <p className="text-sm font-medium truncate">
                            {hasAdminAccess ? (p.contributor_name || 'Anonymous') : 'Your contribution'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(p.contributed_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          RM {p.amount.toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </TabsContent>

        {hasAdminAccess && (
          <TabsContent value="applications" forceMount className="space-y-6 p-6">
            <KhairatDataDashboard 
              mosqueId={mosqueId || ''} 
              mosqueName={mosque?.name || 'Mosque'} 
            />
          </TabsContent>
        )}

        <TabsContent value="payments" forceMount className="space-y-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {t('payments')}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {hasAdminAccess 
                  ? 'View and manage all khairat payment transactions'
                  : 'View your khairat payment history'
                }
              </p>
            </div>
          </div>
          {hasAdminAccess ? (
            mosqueId ? (
              <MosqueKhairatContributions mosqueId={mosqueId} showHeader={false} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No mosque associated</p>
              </div>
            )
          ) : (
            <UserPaymentsTable contributions={userContributions as any} />
          )}
        </TabsContent>

        <TabsContent value="claims" forceMount className="space-y-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Claims
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {hasAdminAccess 
                  ? 'Review and manage khairat claim requests'
                  : 'View and submit your khairat claims'
                }
              </p>
            </div>
          </div>
          {hasAdminAccess ? (
            mosqueId ? (
              <ClaimsManagement mosqueId={mosqueId} showHeader={false} />
            ) : null
          ) : (
            <div className="space-y-4">
              {userClaims.length === 0 ? (
                <div className="text-sm text-muted-foreground">No claims yet.</div>
              ) : (
                userClaims.map((claim) => (
                  <div key={claim.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{claim.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{claim.program?.name || 'Khairat'} • {new Date(claim.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">{claim.status}</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">RM {claim.requested_amount.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
              <div>
                <Button onClick={() => setShowCreateClaimDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" /> New Claim
                </Button>
              </div>
            </div>
          )}

          {/* Create Claim Dialog (user) */}
          {!hasAdminAccess && (
            <Dialog open={showCreateClaimDialog} onOpenChange={setShowCreateClaimDialog}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{t('claims.submitClaim', { fallback: 'Submit New Claim' })}</DialogTitle>
                  <DialogDescription>
                    {t('claims.claimDetails', { fallback: 'Fill in details for your khairat claim' })}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">{t('claims.title', { fallback: 'Title' })} *</Label>
                    <Input
                      id="title"
                      type="text"
                      value={claimForm.title}
                      onChange={(e) => setClaimForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder={t('claims.titlePlaceholder', { fallback: 'Enter claim title...' })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">{t('claims.claimAmount', { fallback: 'Claim Amount (RM)' })} *</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={claimForm.requested_amount || ''}
                      onChange={(e) =>
                        setClaimForm((prev) => ({
                          ...prev,
                          requested_amount: parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">{t('common.priority', { fallback: 'Priority' })}</Label>
                    <Select
                      value={claimForm.priority}
                      onValueChange={(value: ClaimPriority) =>
                        setClaimForm((prev) => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">{t('claims.priority.low', { fallback: 'Low' })}</SelectItem>
                        <SelectItem value="medium">{t('claims.priority.medium', { fallback: 'Medium' })}</SelectItem>
                        <SelectItem value="high">{t('claims.priority.high', { fallback: 'High' })}</SelectItem>
                        <SelectItem value="urgent">{t('claims.priority.urgent', { fallback: 'Urgent' })}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t('claims.description', { fallback: 'Description' })} *</Label>
                    <Textarea
                      id="description"
                      value={claimForm.description}
                      onChange={(e) => setClaimForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder={t('claims.descriptionPlaceholder', { fallback: 'Describe your claim...' })}
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateClaimDialog(false)}
                      disabled={submittingClaim}
                    >
                      {t('claims.cancel', { fallback: 'Cancel' })}
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!user || !mosqueId || !claimForm.title || !claimForm.description || !claimForm.requested_amount) {
                          toast.error(t('claims.messages.fillRequired', { fallback: 'Please fill all required fields' }));
                          return;
                        }
                        try {
                          setSubmittingClaim(true);
                          const payload: CreateKhairatClaim = {
                            claimant_id: user.id,
                            mosque_id: mosqueId,
                            title: claimForm.title,
                            description: claimForm.description,
                            requested_amount: claimForm.requested_amount,
                            priority: claimForm.priority,
                          };
                          await createClaim(payload);
                          toast.success(t('claims.messages.submitSuccess', { fallback: 'Claim submitted successfully' }));
                          setShowCreateClaimDialog(false);
                          setClaimForm({ requested_amount: 0, title: '', description: '', priority: 'medium' });
                          fetchData();
                        } catch (e) {
                          console.error(e);
                          toast.error(t('claims.messages.submitError', { fallback: 'Failed to submit claim' }));
                        } finally {
                          setSubmittingClaim(false);
                        }
                      }}
                      disabled={submittingClaim}
                    >
                      {submittingClaim ? t('claims.submitting', { fallback: 'Submitting...' }) : t('claims.submitClaimButton', { fallback: 'Submit Claim' })}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        {hasAdminAccess && (
          <TabsContent value="legacy" forceMount className="space-y-6 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  Legacy Payment Records
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Import and manage historical payment records from previous systems
                </p>
              </div>
            </div>
            {mosqueId ? (
              <LegacyDataManagement mosqueId={mosqueId} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No mosque associated</p>
              </div>
            )}
          </TabsContent>
        )}

      </Tabs>

      {!hasAdminAccess && (
        <KhairatContributionForm
          isOpen={isContributionModalOpen}
          onClose={() => setIsContributionModalOpen(false)}
          onSuccess={fetchData}
        />
      )}

    </div>
  );
}

export default function KhairatPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Khairat">
        <KhairatContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
