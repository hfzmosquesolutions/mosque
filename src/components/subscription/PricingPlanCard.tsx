'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, CreditCard, Building2, Banknote } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SubscriptionPlan, STRIPE_CONFIG } from '@/lib/stripe';

interface PricingPlanCardProps {
  plan: SubscriptionPlan;
  currentPlan?: SubscriptionPlan;
  onSelectPlan?: (plan: SubscriptionPlan) => void;
  loading?: boolean;
  billing?: 'monthly' | 'annual';
  showRecommended?: boolean;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline';
  buttonClassName?: string;
}

const getPrice = (plan: SubscriptionPlan, billing: 'monthly' | 'annual') => {
  const planConfig = STRIPE_CONFIG.plans[plan];
  if (billing === 'annual' && 'price_yearly' in planConfig) {
    return planConfig.price_yearly / 100; // Convert cents to RM
  }
  return planConfig.price / 100; // Convert cents to RM
};

export function PricingPlanCard({
  plan,
  currentPlan,
  onSelectPlan,
  loading = false,
  billing = 'monthly',
  showRecommended = false,
  buttonText,
  buttonVariant,
  buttonClassName,
}: PricingPlanCardProps) {
  const t = useTranslations('billing.pricing');
  const isCurrentPlan = currentPlan === plan;
  const periodSuffix = billing === 'monthly' ? '/mo' : '/year';
  const isPopular = plan === 'standard' && showRecommended;

  const getMemberCount = () => {
    if (plan === 'free') return t('upToMembers', { count: 50 });
    if (plan === 'standard') return t('upToMembers', { count: 500 });
    return t('unlimitedMembers');
  };

  const tBilling = useTranslations('billing');
  
  const getButtonText = () => {
    if (buttonText) return buttonText;
    if (isCurrentPlan) return tBilling('cta.currentPlan') || 'Current Plan';
    if (plan === 'free') return t('getStarted');
    if (plan === 'standard') return t('startStandard');
    return t('startPro');
  };

  const getButtonVariant = () => {
    if (buttonVariant) return buttonVariant;
    if (isCurrentPlan) return 'outline';
    if (plan === 'standard') return 'default';
    return 'outline';
  };

  const getButtonClassName = () => {
    if (buttonClassName) return buttonClassName;
    if (plan === 'standard' && !isCurrentPlan) {
      return 'w-full bg-emerald-600 hover:bg-emerald-700';
    }
    return 'w-full';
  };

  return (
    <Card
      className={`relative flex flex-col ${
        isPopular
          ? 'border-emerald-300 ring-2 ring-emerald-300/60 dark:border-emerald-700/60'
          : 'border-emerald-100 dark:border-slate-700'
      } ${isCurrentPlan ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''}`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs rounded-full bg-emerald-600 text-white shadow">
          {t('recommended')}
        </div>
      )}
      <CardHeader>
        <CardTitle>{t(plan)}</CardTitle>
        <CardDescription>{t(`mosqueSizeDescriptions.${plan}`)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow">
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            RM{getPrice(plan, billing)}
          </div>
          <div className="text-slate-500 text-sm">{periodSuffix}</div>
        </div>
        <ul className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" /> {getMemberCount()}
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" /> {t('mosquePage')}
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" /> {t('emailNotifications')}
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" /> {t('khairatRegistration')}
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" /> {t('khairatPayment')}
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" /> {t('claimKhairat')}
          </li>
        </ul>
        
        {/* Payment Methods Section */}
        {plan !== 'free' && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
              {t('paymentMethodsSupported')}
            </p>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
                <CreditCard className="h-3.5 w-3.5" />
                <span>{t('onlinePayment')}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
                <Building2 className="h-3.5 w-3.5" />
                <span>{t('bankTransfer')}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
                <Banknote className="h-3.5 w-3.5" />
                <span>{t('cash')}</span>
              </div>
            </div>
          </div>
        )}
        {plan === 'free' && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
              {t('paymentMethodsSupported')}
            </p>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
                <Building2 className="h-3.5 w-3.5" />
                <span>{t('bankTransfer')}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
                <Banknote className="h-3.5 w-3.5" />
                <span>{t('cash')}</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-auto pt-6">
          <Button
            onClick={onSelectPlan ? () => onSelectPlan(plan) : undefined}
            disabled={loading || (isCurrentPlan && !onSelectPlan)}
            variant={getButtonVariant()}
            className={getButtonClassName()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              isCurrentPlan && !onSelectPlan ? (tBilling('cta.currentPlan') || 'Current Plan') : getButtonText()
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

