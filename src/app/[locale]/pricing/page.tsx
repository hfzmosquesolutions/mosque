"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Star } from "lucide-react";
import { PricingPlanCard } from "@/components/subscription/PricingPlanCard";

type BillingPeriod = "monthly" | "annual";

export default function PricingPage() {
  const t = useTranslations('billing.pricing');
  const [billing, setBilling] = useState<BillingPeriod>("monthly");

  const prices = useMemo(
    () => ({
      monthly: { free: 0, standard: 79, pro: 399 },
      annual: { free: 0, standard: 39, pro: 319 }, // billed monthly equivalent (20% discount)
    }),
    []
  );

  const periodSuffix = billing === "monthly" ? "/mo" : "/mo (billed yearly)";

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-emerald-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Hero / Toggle */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3 rounded-full border border-emerald-200/60 bg-white/70 dark:bg-slate-900/40 px-3 py-1 text-emerald-700 dark:text-emerald-300">
            <Star className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{t('forMosqueAdmins')}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('simpleTransparentPricing')}
          </h1>
          <p className="mt-3 text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {t('pickPlanDescription')}
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={`px-4 py-2 rounded-md border text-sm transition ${
              billing === "monthly"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
            aria-pressed={billing === "monthly"}
          >
            {t('monthly')}
          </button>
          <button
            type="button"
            onClick={() => setBilling("annual")}
            className={`px-4 py-2 rounded-md border text-sm transition ${
              billing === "annual"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
            aria-pressed={billing === "annual"}
          >
            {t('annual')} <span className="ml-1 text-emerald-700 dark:text-emerald-300">{t('savePercentage')}</span>
          </button>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PricingPlanCard
            plan="free"
            billing={billing}
            buttonText={t('getStarted')}
            buttonClassName="w-full"
            onSelectPlan={(plan) => {
              window.location.href = '/signup';
            }}
          />
          <PricingPlanCard
            plan="standard"
            billing={billing}
            showRecommended={true}
            buttonText={t('startStandard')}
            buttonClassName="w-full bg-emerald-600 hover:bg-emerald-700"
            onSelectPlan={(plan) => {
              window.location.href = '/signup';
            }}
          />
          <PricingPlanCard
            plan="pro"
            billing={billing}
            buttonText={t('startPro')}
            buttonVariant="outline"
            buttonClassName="w-full"
            onSelectPlan={(plan) => {
              window.location.href = '/signup';
            }}
          />
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[{
            q: t('faqs.canSwitchPlans'),
            a: t('faqs.canSwitchPlansAnswer'),
          }, {
            q: t('faqs.annualDiscounts'),
            a: t('faqs.annualDiscountsAnswer'),
          }, {
            q: t('faqs.paymentMethods'),
            a: t('faqs.paymentMethodsAnswer'),
          }, {
            q: t('faqs.cancelSubscription'),
            a: t('faqs.cancelSubscriptionAnswer'),
          }, {
            q: t('faqs.dataSecurity'),
            a: t('faqs.dataSecurityAnswer'),
          }, {
            q: t('faqs.multipleMosques'),
            a: t('faqs.multipleMosquesAnswer'),
          }, {
            q: t('faqs.exceedMemberLimit'),
            a: t('faqs.exceedMemberLimitAnswer'),
          }].map((f) => (
            <Card key={f.q} className="border-emerald-100 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-base">{f.q}</CardTitle>
                <CardDescription className="text-sm">{f.a}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-emerald-600">
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">{t('readyToSetup')}</h2>
          <p className="text-emerald-100 mb-8">{t('createProfileDescription')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50">{t('getStarted')}</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}


