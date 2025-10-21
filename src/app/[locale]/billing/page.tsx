'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Settings, FileText } from 'lucide-react';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { getMosqueSubscription, getUserSubscription, getFeaturesForPlan } from '@/lib/subscription';
import { MosqueSubscription, UserSubscription } from '@/lib/subscription';
import { SubscriptionPlan, SubscriptionFeatures } from '@/lib/stripe';
import { useUserMosque, useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function BillingContent() {
  const t = useTranslations('billing');
  const tNav = useTranslations();
  const { user } = useAuth();
  const { mosqueId } = useUserMosque();
  const { isAdmin } = useUserRole();
  const { isCompleted, isLoading } = useOnboardingRedirect();
  
  // All hooks must be called before any conditional returns
  const [subscription, setSubscription] = useState<MosqueSubscription | UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<SubscriptionPlan | null>(null);
  const searchParams = useSearchParams();
  const isSuccess = searchParams?.get('success') === 'true';
  const isCanceled = searchParams?.get('canceled') === 'true';

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user?.id && !mosqueId) return;
      
      try {
        // Prefer user-linked subscription, fallback to mosque-linked
        if (user?.id) {
          const userSub = await getUserSubscription(user.id);
          if (userSub) {
            setSubscription(userSub as any);
          } else if (mosqueId) {
            const mosqueSub = await getMosqueSubscription(mosqueId);
            setSubscription(mosqueSub);
          } else {
            setSubscription(null);
          }
        } else if (mosqueId) {
          const mosqueSub = await getMosqueSubscription(mosqueId);
          setSubscription(mosqueSub);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isCompleted && !isLoading) {
      fetchSubscription();
    }
  }, [user?.id, mosqueId, isCompleted, isLoading]);
  
  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This page is only available to mosque administrators.
          </p>
        </div>
      </div>
    );
  }

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if ((!user?.id && !mosqueId) || plan === 'free') return;

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

  if (isLoading || !isCompleted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const currentPlan = subscription?.plan || 'free';
  const features = getFeaturesForPlan(currentPlan);

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
          {t('pageTitle')}
        </h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-600">
          <TabsTrigger 
            value="overview" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            <CreditCard className="h-4 w-4" />
            {t('tabs.overview')}
          </TabsTrigger>
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

        <TabsContent value="overview" forceMount className="space-y-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {t('tabs.overview')}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                View your current subscription status and billing information
              </p>
            </div>
          </div>
          <SubscriptionStatus 
            userId={user?.id || ''} 
            onManageBilling={handleManageBilling}
          />
        </TabsContent>

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SubscriptionCard
              plan="free"
              currentPlan={currentPlan}
              features={getFeaturesForPlan('free')}
              onSelectPlan={handleUpgrade}
              loading={upgrading === 'free'}
              isCurrentPlan={currentPlan === 'free'}
            />
            <SubscriptionCard
              plan="standard"
              currentPlan={currentPlan}
              features={getFeaturesForPlan('standard')}
              onSelectPlan={handleUpgrade}
              loading={upgrading === 'standard'}
              isCurrentPlan={currentPlan === 'standard'}
            />
            <SubscriptionCard
              plan="pro"
              currentPlan={currentPlan}
              features={getFeaturesForPlan('pro')}
              onSelectPlan={handleUpgrade}
              loading={upgrading === 'pro'}
              isCurrentPlan={currentPlan === 'pro'}
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
                View and manage your billing history and invoices
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

