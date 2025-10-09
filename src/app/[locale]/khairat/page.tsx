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
} from 'lucide-react';
import { useAdminAccess, useUserMosque } from '@/hooks/useUserRole';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import { KhairatContributionForm } from '@/components/khairat/KhairatContributionForm';
import { KhairatTabContent } from '@/components/khairat/KhairatTabContent';
import { UserPaymentsTable } from '@/components/khairat/UserPaymentsTable';
import { FeatureGate } from '@/components/subscription/FeatureGate';

import { ProgramManagement } from '@/components/khairat/ProgramManagement';
import {
  getUserKhairatContributions,
  getKhairatPrograms,
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
import { EditProgramForm } from '@/components/khairat/EditProgramForm';
import type {
  KhairatContribution,
  KhairatProgram,
  Mosque,
  KhairatClaimWithDetails,
} from '@/types/database';
import { ClaimsManagement } from '@/components/admin/ClaimsManagement';
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
  const [userContributions, setUserContributions] = useState<
    (KhairatContribution & { program: KhairatProgram & { mosque: Mosque } })[]
  >([]);
  const [allContributions, setAllContributions] = useState<
    (KhairatContribution & { program: any; contributor?: any })[]
  >([]);
  const [programs, setPrograms] = useState<KhairatProgram[]>([]);
  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [userClaims, setUserClaims] = useState<KhairatClaimWithDetails[]>([]);
  const [adminClaims, setAdminClaims] = useState<KhairatClaimWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [isProgramManagementOpen, setIsProgramManagementOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] =
    useState<KhairatProgram | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [programToEdit, setProgramToEdit] =
    useState<KhairatProgram | null>(null);
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
    if (tabParam && ['overview', 'programs', 'payments', 'claims'].includes(tabParam)) {
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
        const programsResult = await getKhairatPrograms(
          mosqueId
        );
        if (programsResult.success && programsResult.data) {
          setPrograms(programsResult.data);
        }

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
        setPrograms([]);
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
  const activePrograms = programs.filter((p) => p.is_active).length;
  const recentContributions = hasAdminAccess
    ? allContributions.slice(0, 5)
    : userContributions.slice(0, 5);
  const averageContribution =
    contributionsToCalculate.length > 0
      ? totalContributed / contributionsToCalculate.length
      : 0;
  const programsSupported = hasAdminAccess 
    ? new Set(allContributions.map((c) => c.program_id)).size
    : new Set(userContributions.map((c) => c.program_id)).size;

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

  // Top paid program (overall for admin, per-user for regular users)
  const topProgramOverall = programs.length > 0
    ? [...programs].sort((a, b) => (b.current_amount || 0) - (a.current_amount || 0))[0]
    : null;
  const topProgramForUser = (() => {
    const amountByProgram: Record<string, { amount: number; name: string }> = {};
    for (const c of userContributions) {
      const programName = (c as any).program?.name || programs.find(p => p.id === c.program_id)?.name || 'Khairat';
      amountByProgram[c.program_id] = amountByProgram[c.program_id]
        ? { amount: amountByProgram[c.program_id].amount + c.amount, name: programName }
        : { amount: c.amount, name: programName };
    }
    const entries = Object.entries(amountByProgram);
    if (entries.length === 0) return null;
    entries.sort((a, b) => b[1].amount - a[1].amount);
    const [programId, data] = entries[0];
    return { id: programId, name: data.name, amount: data.amount };
  })();

  const calculateProgress = (current: number, target?: number) => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const programColumns: ColumnDef<KhairatProgram>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Program" />
      ),
      cell: ({ row }) => {
        const program = row.original as KhairatProgram;
        return (
          <div className="space-y-1">
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {program.name}
            </div>
            {program.description && (
              <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                {program.description}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const program = row.original as KhairatProgram;
        const isActive = program.is_active;
        const hasEnded = program.end_date && new Date(program.end_date) < new Date();
        return (
          <Badge variant={isActive && !hasEnded ? 'default' : 'secondary'}>
            {hasEnded ? 'Ended' : isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      id: 'progress',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Progress" />
      ),
      cell: ({ row }) => {
        const program = row.original as KhairatProgram;
        const progress = calculateProgress(program.current_amount, program.target_amount);
        return (
          <div className="space-y-2 min-w-[140px]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                {program.target_amount ? `${progress.toFixed(1)}%` : (
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">No Target</span>
                )}
              </span>
              <span className="font-medium text-emerald-600">
                RM {program.current_amount.toLocaleString()}
              </span>
            </div>
            {program.target_amount ? (
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400">Ongoing contributions</div>
            )}
          </div>
        );
      },
    },
    ...(hasAdminAccess
      ? [
          {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
              const program = row.original as KhairatProgram;
              return (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setProgramToEdit(program);
                    setIsEditDialogOpen(true);
                  }}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              );
            },
          } as ColumnDef<KhairatProgram>,
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header with Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {hasAdminAccess ? t('khairatManagement') : t('khairat')}
        </h1>
        <p className="text-muted-foreground">
          {hasAdminAccess 
            ? t('manageKhairatProgramsDescription', { mosqueName: mosque?.name || 'Mosque' })
            : t('contributeToKhairatDescription')
          }
        </p>
      </div>


      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-600">
          <TabsTrigger 
            value="overview" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            {t('overview')}
          </TabsTrigger>
          <TabsTrigger 
            value="programs" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            Programs
          </TabsTrigger>
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
        </TabsList>

        <TabsContent value="overview" forceMount className="space-y-8">
          {/* Enhanced Header */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {t('khairatOverview')}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {t('paymentSummaryDescription')}
                </p>
              </div>
            </div>

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
                          To accept online payments for khairat programs, you need to set up a payment gateway. 
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
                          Members can contribute to khairat programs securely online.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Unified Stats Grid */}
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
              title="Top Paid Program"
              value={hasAdminAccess ? (
                topProgramOverall ? (
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {topProgramOverall.name}
                    </div>
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      RM {topProgramOverall.current_amount.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Total collected</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No programs yet</p>
                )
              ) : topProgramForUser ? (
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {topProgramForUser.name}
                  </div>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    RM {topProgramForUser.amount.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Your total paid</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No payments yet</p>
              )}
              icon={Trophy}
              {...StatsCardColors.yellow}
            />
          </div>

          {/* Programs overview */}
          <div>
              {programs.length === 0 ? (
                hasAdminAccess ? (
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle>Create your first Khairat program</CardTitle>
                      <CardDescription>
                        Follow these steps to get started. You can edit details anytime.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-semibold">1</div>
                          <div>
                            <div className="text-sm font-medium">Open Create Program</div>
                            <div className="text-xs text-muted-foreground">Click the button below to start a new program.</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-semibold">2</div>
                          <div>
                            <div className="text-sm font-medium">Fill in details</div>
                            <div className="text-xs text-muted-foreground">Name, description, fixed price or target amount, and dates (optional).</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-semibold">3</div>
                          <div>
                            <div className="text-sm font-medium">Create and activate</div>
                            <div className="text-xs text-muted-foreground">Save to make it available for payments and claims.</div>
                          </div>
                        </div>
                        <div className="pt-2">
                          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsProgramManagementOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Create Program
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground">No programs yet.</p>
                )
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Khairat Programs
                    </CardTitle>
                    <CardDescription>
                      Current khairat programs and their progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col h-full">
                    <div className="flex-1">
                      <div className="space-y-4">
                        {([...programs]
                          .sort((a, b) => (b.current_amount || 0) - (a.current_amount || 0))
                          .slice(0, 3)
                        ).map((p) => {
                          const progress = calculateProgress(p.current_amount, p.target_amount);
                          return (
                            <div key={p.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="font-medium truncate">{p.name}</div>
                                <div className="text-xs text-muted-foreground whitespace-nowrap">RM {p.current_amount.toLocaleString()}</div>
                              </div>
                              {p.target_amount ? (
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                  <div className="bg-emerald-600 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(progress, 100)}%` }} />
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground">Ongoing (no target)</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {programs.length > 3 && (
                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            setActiveTab('programs');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          View All Programs
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

          {/* Recent payments and claims */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Payments
                  </CardTitle>
                  <CardDescription>
                    Latest khairat payment activities
                  </CardDescription>
                </CardHeader>
                  <CardContent className="flex flex-col h-full">
                    <div className="flex-1">
                      {(hasAdminAccess ? adminLatestPayments : recentContributions).length > 0 ? (
                        <div className="space-y-3">
                          {(hasAdminAccess ? adminLatestPayments : recentContributions).slice(0, 3).map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between py-1 border-b last:border-b-0 border-gray-100 dark:border-gray-800">
                              <div className="min-w-0 mr-4">
                                <p className="text-sm font-medium truncate">
                                  {p.program?.name || 'Khairat'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(p.contributed_at).toLocaleString()}
                                </p>
                              </div>
                              <div className="text-sm font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                RM {p.amount.toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No payments yet.</p>
                      )}
                    </div>
                    {(hasAdminAccess ? adminLatestPayments : recentContributions).length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            setActiveTab('payments');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          View All Payments
                        </Button>
                      </div>
                    )}
                  </CardContent>
              </Card>

            {hasAdminAccess && (
              <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Latest Claims
                    </CardTitle>
                    <CardDescription>
                      Recent khairat claim submissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col h-full">
                    <div className="flex-1">
                      {adminLatestClaims.length > 0 ? (
                        <div className="space-y-4">
                          {adminLatestClaims.slice(0, 3).map((cl) => (
                            <div key={cl.id} className="flex items-start justify-between py-3 border-b last:border-b-0 border-gray-100 dark:border-gray-800">
                              <div className="min-w-0 mr-4 flex-1">
                                <p className="text-sm font-medium truncate mb-1">{cl.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{(cl.program?.name || 'Khairat')} • {new Date(cl.created_at).toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">{cl.status}</span>
                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">RM {cl.requested_amount.toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No claims yet.</p>
                      )}
                    </div>
                    {adminLatestClaims.length > 3 && (
                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            setActiveTab('claims');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          View All Claims
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
          </div>
        </TabsContent>

        <TabsContent value="programs" forceMount className="space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Programs
                </h2>
                <p className="text-muted-foreground mt-1">
                  {t('supportWelfareInitiatives')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {programs.filter((p) => p.is_active).length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {programs.filter((p) => p.is_active).length} {t('active')}
                  </Badge>
                )}
                {hasAdminAccess && (
                  <Button
                    onClick={() => setIsProgramManagementOpen(true)}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Program
                  </Button>
                )}
              </div>
            </div>

            <div>
              {programs.length === 0 ? (
                hasAdminAccess ? (
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle>Get started with Khairat</CardTitle>
                      <CardDescription>Set up your first program so kariah can contribute.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-semibold">1</div>
                          <div>
                            <div className="text-sm font-medium">Create a program</div>
                            <div className="text-xs text-muted-foreground">Choose a clear name and optional description.</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-semibold">2</div>
                          <div>
                            <div className="text-sm font-medium">Configure amount</div>
                            <div className="text-xs text-muted-foreground">Use fixed price or set a target amount and timeline.</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-semibold">3</div>
                          <div>
                            <div className="text-sm font-medium">Publish</div>
                            <div className="text-xs text-muted-foreground">Activate so members can start contributing.</div>
                          </div>
                        </div>
                        <div className="pt-2">
                          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsProgramManagementOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Create Program
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Target className="h-8 w-8 text-muted-foreground mb-3" />
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                      {t('noActiveKhairatPrograms')}
                    </h3>
                    <p className="text-muted-foreground text-center text-xs">
                      {t('checkBackLaterPrograms')}
                    </p>
                  </div>
                )
              ) : (
                <DataTable
                  columns={programColumns}
                  data={programs}
                  searchKey="name"
                  searchPlaceholder={t('searchPrograms') || 'Search programs...'}
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payments" forceMount className="space-y-6">
          {hasAdminAccess ? (
            <KhairatTabContent programs={programs as any} />
          ) : (
            <UserPaymentsTable contributions={userContributions as any} />
          )}
        </TabsContent>

        <TabsContent value="claims" forceMount className="space-y-6">
          {hasAdminAccess ? (
            mosqueId ? (
              <ClaimsManagement mosqueId={mosqueId} />
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
      </Tabs>

      {hasAdminAccess && (
        <ProgramManagement
          filterType="khairat"
          onProgramsUpdate={fetchData}
          isCreateDialogOpen={isProgramManagementOpen}
          onCreateDialogOpenChange={setIsProgramManagementOpen}
        />
      )}

      {!hasAdminAccess && (
        <KhairatContributionForm
          isOpen={isContributionModalOpen}
          onClose={() => setIsContributionModalOpen(false)}
          onSuccess={fetchData}
        />
      )}

      {/* Edit Program Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Program
            </DialogTitle>
            <DialogDescription>
              Update the details of this khairat program
            </DialogDescription>
          </DialogHeader>

          {programToEdit && (
            <EditProgramForm
              program={programToEdit}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setProgramToEdit(null);
                fetchData();
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setProgramToEdit(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
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
