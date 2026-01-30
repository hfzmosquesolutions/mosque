'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useSafeAsync } from '@/hooks/useSafeAsync';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, FileText } from 'lucide-react';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { PricingPlanCard } from '@/components/subscription/PricingPlanCard';
import { getEffectiveSubscription, getUserSubscription, getFeaturesForPlan } from '@/lib/subscription';
import { MosqueSubscription, UserSubscription } from '@/lib/subscription';
import { SubscriptionPlan, SubscriptionFeatures } from '@/lib/stripe';
import { useUserMosque, useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PageLoading } from '@/components/ui/page-loading';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function BillingContent() {
  const t = useTranslations('billing');
  const tNav = useTranslations();
  const { user } = useAuth();
  const { mosqueId, loading: mosqueLoading } = useUserMosque();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { isCompleted, isLoading: onboardingLoading } = useOnboardingRedirect();
  
  // All hooks must be called before any conditional returns
  const [subscription, setSubscription] = useState<MosqueSubscription | UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<SubscriptionPlan | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const searchParams = useSearchParams();
  const isSuccess = searchParams?.get('success') === 'true';
  const isCanceled = searchParams?.get('canceled') === 'true';
  const defaultTab = searchParams?.get('tab') || 'plans';
  const { safeSetState, isMounted } = useSafeAsync();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchSubscription = async () => {
      if (!user?.id && !mosqueId || abortController.signal.aborted) return;
      
      try {
        // Prefer user-linked subscription, fallback to mosque-linked
        if (user?.id) {
          const userSub = await getUserSubscription(user.id);
          if (abortController.signal.aborted || !isMounted()) return;
          
          if (userSub) {
            safeSetState(setSubscription, userSub as any);
          } else if (mosqueId) {
            const mosqueSub = await getEffectiveSubscription(mosqueId);
            if (!abortController.signal.aborted && isMounted()) {
              safeSetState(setSubscription, mosqueSub as MosqueSubscription | UserSubscription | null);
            }
          } else {
            safeSetState(setSubscription, null as MosqueSubscription | UserSubscription | null);
          }
        } else if (mosqueId) {
          const mosqueSub = await getEffectiveSubscription(mosqueId);
          if (!abortController.signal.aborted && isMounted()) {
            safeSetState(setSubscription, mosqueSub as MosqueSubscription | UserSubscription | null);
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted && isMounted()) {
          console.error('Error fetching subscription:', error);
        }
      } finally {
        if (!abortController.signal.aborted && isMounted()) {
          safeSetState(setLoading, false as boolean);
        }
      }
    };

    if (isCompleted && !onboardingLoading) {
      fetchSubscription();
    }

    return () => {
      abortController.abort();
    };
  }, [user?.id, mosqueId, isCompleted, onboardingLoading, safeSetState, isMounted]);
  
  // ProtectedRoute already handles access control
  // If we reach here, user is authenticated and has admin access
  // Wait for loading to complete before rendering
  const isLoading = onboardingLoading || !isCompleted || roleLoading || mosqueLoading || loading;

  // Show header with loading indicator in content area
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('title')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t('description')}
          </p>
        </div>
        <PageLoading />
      </div>
    );
  }

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if ((!user?.id && !mosqueId) || plan === 'free') return;

    // Check if user already has an active subscription
    const hasActiveSubscription = subscription && 
      (subscription.status === 'active' || subscription.status === 'trialing');

    // If user has active subscription, redirect to Stripe Customer Portal to change plan
    if (hasActiveSubscription) {
      await handleManageBilling();
      return;
    }

    setUpgrading(plan);
    
    try {
      const adminEmail = user?.email || '';
      let adminName = '';

      if (!adminEmail) {
        throw new Error('Missing admin email');
      }

      // Prefer full_name from user_profiles
      if (user?.id) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if ((profile as any)?.full_name) {
          adminName = (profile as any).full_name as string;
        }
      }

      // Fallbacks if profile full_name is not found
      if (!adminName) {
        adminName =
          (user as any)?.user_metadata?.full_name ||
          (user as any)?.user_metadata?.name ||
          (adminEmail ? adminEmail.split('@')[0] : '');
      }
     
      const response = await fetch('/api/subscriptions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mosqueId,
          userId: user?.id,
          plan,
          billing,
          adminEmail,
          adminName
        }),
      });

      const { url, sessionId } = await response.json();
      
      if (url) {
        window.location.href = url as string;
        return;
      }
      
      // Fallback for older sessions: construct client-side redirect if url missing
      if (sessionId) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
        const fallback = `${appUrl}/billing?success=true&session_id=${encodeURIComponent(sessionId)}`;
        window.location.href = fallback;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setUpgrading(null);
    }
  };

  const handleManageBilling = async () => {
    if (!user?.id && !mosqueId) return;

    try {
      const response = await fetch('/api/subscriptions/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mosqueId, userId: user?.id }),
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
    }
  };


  const currentPlan = subscription?.plan || 'free';
  const features = getFeaturesForPlan(currentPlan);
  const hasActiveSubscription = subscription && 
    (subscription.status === 'active' || subscription.status === 'trialing');

  return (
    <div className="space-y-6">
      {(isSuccess || isCanceled) && (
        <Alert variant={isCanceled ? 'destructive' : 'default'}>
          <AlertTitle>
            {isCanceled
              ? t('alerts.checkoutCanceled.title')
              : t('alerts.checkoutSuccess.title')}
          </AlertTitle>
          <AlertDescription>
            {isCanceled
              ? t('alerts.checkoutCanceled.description')
              : t('alerts.checkoutSuccess.description')}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Header with Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('title')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {t('description')}
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-600">
          <TabsTrigger 
            value="plans" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            <Settings className="h-4 w-4" />
            {t('tabs.plans')}
          </TabsTrigger>
          <TabsTrigger 
            value="invoices" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            <FileText className="h-4 w-4" />
            {t('tabs.invoices')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" forceMount className="space-y-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {t('tabs.plans')}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('choosePlanSubtitle')}
              </p>
            </div>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1.5 shadow-sm border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setBilling('monthly')}
                className={`relative z-10 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap w-[140px] ${
                  billing === 'monthly'
                    ? 'text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                aria-pressed={billing === 'monthly'}
              >
                <span className="relative z-10">{t('monthly') || 'Monthly'}</span>
              </button>
              <button
                type="button"
                onClick={() => setBilling('annual')}
                className={`relative z-10 px-4 py-3 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap w-[160px] ${
                  billing === 'annual'
                    ? 'text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                aria-pressed={billing === 'annual'}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>{t('annual') || 'Annual'}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-300 ${
                    billing === 'annual' 
                      ? 'bg-white/25 text-white' 
                      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {t('savePercentage') || '20% off'}
                  </span>
                </span>
              </button>
              {/* Sliding indicator */}
              <div
                className={`absolute top-1.5 bottom-1.5 rounded-full bg-emerald-600 shadow-md transition-all duration-300 ease-in-out z-0 ${
                  billing === 'monthly' 
                    ? 'left-1.5 w-[140px]' 
                    : 'right-1.5 w-[160px]'
                }`}
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PricingPlanCard
              plan="free"
              currentPlan={currentPlan}
              billing={billing}
              onSelectPlan={hasActiveSubscription && currentPlan === 'free' ? undefined : handleUpgrade}
              onManageSubscription={hasActiveSubscription && currentPlan === 'free' ? handleManageBilling : undefined}
              loading={upgrading === 'free'}
              showRecommended={false}
            />
            <PricingPlanCard
              plan="standard"
              currentPlan={currentPlan}
              billing={billing}
              onSelectPlan={hasActiveSubscription && currentPlan === 'standard' ? undefined : handleUpgrade}
              onManageSubscription={hasActiveSubscription && currentPlan === 'standard' ? handleManageBilling : undefined}
              loading={upgrading === 'standard'}
              showRecommended={true}
            />
            <PricingPlanCard
              plan="pro"
              currentPlan={currentPlan}
              billing={billing}
              onSelectPlan={hasActiveSubscription && currentPlan === 'pro' ? undefined : handleUpgrade}
              onManageSubscription={hasActiveSubscription && currentPlan === 'pro' ? handleManageBilling : undefined}
              loading={upgrading === 'pro'}
              showRecommended={false}
            />
          </div>
        </TabsContent>

        <TabsContent value="invoices" forceMount className="space-y-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {t('tabs.invoices')}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('invoicesSubtitle')}
              </p>
            </div>
          </div>
          <SubscriptionStatus 
            userId={user?.id || ''} 
            onManageBilling={handleManageBilling}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function BillingPage() {
  const tNav = useTranslations();
  return (
    <ProtectedRoute>
      <DashboardLayout title={tNav('sidebar.billing')}>
        <BillingContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

