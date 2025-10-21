'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Loader2 } from 'lucide-react';
import { STRIPE_CONFIG, SubscriptionPlan, SubscriptionFeatures } from '@/lib/stripe';
import { formatPrice } from '@/lib/subscription';
import { useTranslations } from 'next-intl';

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  currentPlan?: SubscriptionPlan;
  features: SubscriptionFeatures;
  onSelectPlan: (plan: SubscriptionPlan) => void;
  loading?: boolean;
  isCurrentPlan?: boolean;
}

export function SubscriptionCard({
  plan,
  currentPlan,
  features,
  onSelectPlan,
  loading = false,
  isCurrentPlan = false
}: SubscriptionCardProps) {
  const t = useTranslations('billing');
  const planConfig = STRIPE_CONFIG.plans[plan];
  const isPopular = plan === 'standard';

  return (
    <Card className={`relative ${isPopular ? 'border-emerald-500 shadow-lg' : 'border-gray-200'} ${isCurrentPlan ? 'bg-emerald-50 dark:bg-emerald-950' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-emerald-500 text-white px-3 py-1">
            {t('mostPopular')}
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold">{t(`plans.${plan}.name` as any)}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold">
            {plan === 'free' ? t('planPrice.free') : formatPrice(planConfig.price)}
          </span>
          {plan !== 'free' && (
            <span className="text-gray-500 dark:text-gray-400">{t('perMonth')}</span>
          )}
        </div>
        <CardDescription className="mt-2">
          {t(`plans.${plan}.tagline` as any)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {planConfig.features.map((_, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t(`plans.${plan}.features.${index}` as any)}
              </span>
            </li>
          ))}
        </ul>

        <div className="pt-4">
          {isCurrentPlan ? (
            <Button disabled className="w-full">
              {t('cta.currentPlan')}
            </Button>
          ) : (
            <Button
              onClick={() => onSelectPlan(plan)}
              disabled={loading}
              className={`w-full ${isPopular ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('processing')}
                </>
              ) : (
                <>
                  {plan === 'free' ? t('cta.getStarted') : t('cta.upgrade')}
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

