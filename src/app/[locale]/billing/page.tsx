'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Settings, FileText } from 'lucide-react';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { getMosqueSubscription, getFeaturesForPlan } from '@/lib/subscription';
import { MosqueSubscription } from '@/lib/subscription';
import { SubscriptionPlan, SubscriptionFeatures } from '@/lib/stripe';
import { useUserMosque } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function BillingContent() {
  const t = useTranslations('billing');
  const { user } = useAuth();
  const { mosqueId } = useUserMosque();
  const { isCompleted, onboardingLoading } = useOnboardingRedirect();
  
  const [subscription, setSubscription] = useState<MosqueSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!mosqueId) return;
      
      try {
        const subData = await getMosqueSubscription(mosqueId);
        setSubscription(subData);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isCompleted && !onboardingLoading) {
      fetchSubscription();
    }
  }, [mosqueId, isCompleted, onboardingLoading]);

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (!mosqueId || plan === 'free') return;

    setUpgrading(plan);
    
    try {
      const response = await fetch('/api/subscriptions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mosqueId,
          plan
        }),
      });

      const { sessionId } = await response.json();
      
      if (sessionId) {
        const stripe = await stripePromise;
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId });
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setUpgrading(null);
    }
  };

  const handleManageBilling = async () => {
    if (!mosqueId) return;

    try {
      const response = await fetch('/api/subscriptions/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mosqueId }),
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
    }
  };

  if (onboardingLoading || !isCompleted) {
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Billing & Subscription
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your subscription and billing preferences
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SubscriptionStatus 
            mosqueId={mosqueId || ''} 
            onManageBilling={handleManageBilling}
          />
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Choose Your Plan
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Select the plan that best fits your mosque's needs
            </p>
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
              plan="premium"
              currentPlan={currentPlan}
              features={getFeaturesForPlan('premium')}
              onSelectPlan={handleUpgrade}
              loading={upgrading === 'premium'}
              isCurrentPlan={currentPlan === 'premium'}
            />
            <SubscriptionCard
              plan="enterprise"
              currentPlan={currentPlan}
              features={getFeaturesForPlan('enterprise')}
              onSelectPlan={handleUpgrade}
              loading={upgrading === 'enterprise'}
              isCurrentPlan={currentPlan === 'enterprise'}
            />
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <SubscriptionStatus 
            mosqueId={mosqueId || ''} 
            onManageBilling={handleManageBilling}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function BillingPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <BillingContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

