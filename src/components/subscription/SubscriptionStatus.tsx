'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar, CreditCard, AlertCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { getUserSubscription, getUserSubscriptionInvoices, formatPrice } from '@/lib/subscription';
import { UserSubscription, UserSubscriptionInvoice } from '@/lib/subscription';
import { SubscriptionPlan, type SubscriptionStatus as StripeSubscriptionStatus, STRIPE_CONFIG } from '@/lib/stripe';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';

interface SubscriptionStatusProps {
  userId: string;
  onManageBilling?: () => void;
}

export function SubscriptionStatus({ userId, onManageBilling }: SubscriptionStatusProps) {
  const t = useTranslations('billing');
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [invoices, setInvoices] = useState<UserSubscriptionInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subData, invoiceData] = await Promise.all([
          getUserSubscription(userId),
          getUserSubscriptionInvoices(userId)
        ]);
        setSubscription(subData);
        setInvoices(invoiceData);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  // Listen for real-time subscription updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`subscription_status_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // Refetch subscription data when it changes
          try {
            const subData = await getUserSubscription(userId);
            if (subData) {
              setSubscription(subData);
            }
          } catch (error) {
            console.error('[SubscriptionStatus] Error refetching subscription:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No subscription found</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: StripeSubscriptionStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'trialing':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'past_due':
      case 'unpaid':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'canceled':
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: StripeSubscriptionStatus) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'trialing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'past_due':
      case 'unpaid':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'canceled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlanPrice = (plan: SubscriptionPlan, billingPeriod?: string) => {
    const planConfig = STRIPE_CONFIG.plans[plan];
    
    if (!planConfig) {
      return t('unknown');
    }

    if (plan === 'free') {
      return t('planPrice.free');
    }

    // If yearly/annual, show yearly price
    if (billingPeriod === 'yearly' || billingPeriod === 'annual') {
      if ('price_yearly' in planConfig && planConfig.price_yearly) {
        const yearlyPrice = planConfig.price_yearly / 100; // Convert cents to RM
        // Also show monthly equivalent for clarity
        const monthlyEquivalent = yearlyPrice / 12;
        return `RM ${yearlyPrice.toFixed(2)}/year (RM ${monthlyEquivalent.toFixed(2)}/month)`;
      }
    }

    // Default to monthly price
    const monthlyPrice = planConfig.price / 100; // Convert cents to RM
    return `RM ${monthlyPrice.toFixed(2)}/month`;
  };

  // Check if subscription is scheduled to cancel
  // Don't show notice if subscription is already canceled (status = 'canceled' or plan = 'free')
  const isScheduledToCancel = subscription.cancel_at_period_end === true && 
    subscription.status !== 'canceled' && 
    subscription.plan !== 'free';
  const cancellationDate = subscription.current_period_end 
    ? formatDate(subscription.current_period_end)
    : null;

  return (
    <div className="space-y-6">
      {isScheduledToCancel && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('subscription.cancellationNotice.title') || 'Subscription Scheduled to Cancel'}</AlertTitle>
          <AlertDescription>
            {cancellationDate 
              ? (t('subscription.cancellationNotice.description', { date: cancellationDate }) || 
                 `Your subscription will be canceled on ${cancellationDate}. You will continue to have access until then.`)
              : (t('subscription.cancellationNotice.descriptionNoDate') || 
                 'Your subscription is scheduled to cancel at the end of the current billing period. You will continue to have access until then.')
            }
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{t('subscription.currentTitle')}</CardTitle>
              <CardDescription>
                {t('subscription.currentDescription')}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(subscription.status)}>
              <div className="flex items-center gap-2">
                {getStatusIcon(subscription.status)}
                {t(`subscription.status.${subscription.status}` as any)}
              </div>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-1">
              {t('subscription.planLabel')}
            </h4>
            <p className="text-lg font-semibold capitalize">{subscription.plan}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getPlanPrice(subscription.plan, subscription.billing_period)}
            </p>
          </div>

          {subscription.current_period_end && subscription.plan !== 'free' && (
            <div>
              <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-1">
                {subscription.cancel_at_period_end || subscription.status === 'canceled'
                  ? (t('subscription.periodEndLabel') || 'Current Period Ends')
                  : (t('subscription.nextBillingDate') || 'Next Billing Date')
                }
              </h4>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {formatDate(subscription.current_period_end)}
              </p>
            </div>
          )}

          {onManageBilling && (
            <div className="pt-4 border-t">
              <Button onClick={onManageBilling} className="w-full md:w-auto">
                <CreditCard className="h-4 w-4 mr-2" />
                {t('subscription.manageBilling')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t('invoices.title')}</CardTitle>
            <CardDescription>
              {t('invoices.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {formatDate(invoice.created_at)}
                          </p>
                          {invoice.is_final_invoice && (
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800">
                              Final Invoice
                            </Badge>
                          )}
                        </div>
                        {invoice.stripe_invoice_id && (
                          <p className="text-sm text-gray-500">
                            {t('invoices.invoiceShort', { id: invoice.stripe_invoice_id.slice(-8) })}
                          </p>
                        )}
                        {invoice.description && (
                          <p className="text-sm text-orange-600 dark:text-orange-400 mt-1 font-medium">
                            {invoice.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-semibold">
                      {formatPrice(invoice.amount_paid)}
                    </p>
                    <Badge 
                      variant={invoice.status === 'paid' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {t(`invoices.status.${invoice.status}` as any)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

