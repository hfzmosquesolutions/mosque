'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { getMosqueSubscription, getSubscriptionInvoices, formatPrice } from '@/lib/subscription';
import { MosqueSubscription, SubscriptionInvoice } from '@/lib/subscription';
import { SubscriptionPlan, SubscriptionStatus } from '@/lib/stripe';

interface SubscriptionStatusProps {
  mosqueId: string;
  onManageBilling?: () => void;
}

export function SubscriptionStatus({ mosqueId, onManageBilling }: SubscriptionStatusProps) {
  const [subscription, setSubscription] = useState<MosqueSubscription | null>(null);
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subData, invoiceData] = await Promise.all([
          getMosqueSubscription(mosqueId),
          getSubscriptionInvoices(mosqueId)
        ]);
        setSubscription(subData);
        setInvoices(invoiceData);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (mosqueId) {
      fetchData();
    }
  }, [mosqueId]);

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

  const getStatusIcon = (status: SubscriptionStatus) => {
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

  const getStatusColor = (status: SubscriptionStatus) => {
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

  const getPlanPrice = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'free':
        return 'Free';
      case 'premium':
        return 'RM 99/month';
      case 'enterprise':
        return 'RM 299/month';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Current Subscription</CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </div>
            <Badge className={getStatusColor(subscription.status)}>
              <div className="flex items-center gap-2">
                {getStatusIcon(subscription.status)}
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </div>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-1">
                Plan
              </h4>
              <p className="text-lg font-semibold capitalize">{subscription.plan}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getPlanPrice(subscription.plan)}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-1">
                Next Billing Date
              </h4>
              <p className="text-lg font-semibold">
                {subscription.current_period_end 
                  ? formatDate(subscription.current_period_end)
                  : 'N/A'
                }
              </p>
              {subscription.cancel_at_period_end && (
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  Cancels at period end
                </p>
              )}
            </div>
          </div>

          {onManageBilling && (
            <div className="pt-4 border-t">
              <Button onClick={onManageBilling} className="w-full md:w-auto">
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Billing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Invoices</CardTitle>
            <CardDescription>
              Your recent billing history
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
                      <p className="text-sm text-gray-500">
                        Invoice #{invoice.stripe_invoice_id.slice(-8)}
                      </p>
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
                      {invoice.status}
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

