'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { getUserSubscription, getUserSubscriptionInvoices, formatPrice } from '@/lib/subscription';
import { UserSubscription, UserSubscriptionInvoice } from '@/lib/subscription';
import { SubscriptionPlan, type SubscriptionStatus as StripeSubscriptionStatus, STRIPE_CONFIG } from '@/lib/stripe';
import { useTranslations } from 'next-intl';

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

  return (
    <div className="space-y-6">
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
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">
                        {formatDate(invoice.created_at)}
                      </p>
                      {invoice.stripe_invoice_id && (
                        <p className="text-sm text-gray-500">
                          {t('invoices.invoiceShort', { id: invoice.stripe_invoice_id.slice(-8) })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
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

