"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Star } from "lucide-react";

type BillingPeriod = "monthly" | "annual";

export default function PricingPage() {
  const t = useTranslations('billing.pricing');
  const [billing, setBilling] = useState<BillingPeriod>("monthly");

  const prices = useMemo(
    () => ({
      monthly: { free: 0, standard: 49, pro: 399 },
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
          {/* Free */}
          <Card className="border-emerald-100 dark:border-slate-700">
            <CardHeader>
              <CardTitle>{t('free')}</CardTitle>
              <CardDescription>{t('getStartedEssentials')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">RM{prices[billing].free}</div>
                <div className="text-slate-500 text-sm">{periodSuffix}</div>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> {t('publicMosqueProfile')}</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> {t('communityDirectory')}</li>
              </ul>
              <div className="mt-6">
                <Link href="/signup">
                  <Button className="w-full">{t('getStarted')}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Standard (Recommended) */}
          <Card className="relative border-emerald-300 ring-2 ring-emerald-300/60 dark:border-emerald-700/60">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs rounded-full bg-emerald-600 text-white shadow">
              {t('recommended')}
            </div>
            <CardHeader>
              <CardTitle>{t('standard')}</CardTitle>
              <CardDescription>{t('bestForGrowingCommunities')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">RM{prices[billing].standard}</div>
                <div className="text-slate-500 text-sm">{periodSuffix}</div>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> {t('everythingInFree')}</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> {t('khairatProgramManagement')}</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> {t('priorityEmailSupport')}</li>
              </ul>
              <div className="mt-6">
                <Link href="/signup">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">{t('startStandard')}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className="border-emerald-100 dark:border-slate-700">
            <CardHeader>
              <CardTitle>{t('pro')}</CardTitle>
              <CardDescription>{t('advancedFeaturesSupport')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">RM{prices[billing].pro}</div>
                <div className="text-slate-500 text-sm">{periodSuffix}</div>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> {t('everythingInStandard')}</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> {t('advancedAnalytics')}</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> {t('prioritySupport')}</li>
              </ul>
              <div className="mt-6">
                <Link href="/signup">
                  <Button className="w-full" variant="outline">{t('startPro')}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Feature comparison */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="rounded-xl border border-emerald-100/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 overflow-hidden">
          <div className="px-6 py-4 border-b border-emerald-100/60 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold">
            {t('compareFeatures')}
          </div>
          <div className="grid grid-cols-4 px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="font-medium">{t('feature')}</div>
            <div className="text-center">{t('free')}</div>
            <div className="text-center">{t('standard')}</div>
            <div className="text-center">{t('pro')}</div>
          </div>
            {[
            { label: t('mosqueProfile'), f: true, s: true, p: true },
            { label: t('khairatManagement'), f: false, s: true, p: true },
            { label: t('memberCount'), f: t('upToMembers', { count: 50 }), s: t('upToMembers', { count: 500 }), p: t('unlimitedMembers') },
            { label: t('advancedAnalytics'), f: false, s: false, p: true },
            { label: t('prioritySupport'), f: false, s: true, p: true },
          ].map((row) => (
            <div key={row.label} className="grid grid-cols-4 px-6 py-3 border-t border-emerald-100/50 dark:border-slate-800 text-sm">
              <div className="text-slate-700 dark:text-slate-300">{row.label}</div>
              <div className="text-center">{typeof row.f === 'boolean' ? (row.f ? "✔" : "—") : row.f}</div>
              <div className="text-center">{typeof row.s === 'boolean' ? (row.s ? "✔" : "—") : row.s}</div>
              <div className="text-center">{typeof row.p === 'boolean' ? (row.p ? "✔" : "—") : row.p}</div>
            </div>
          ))}
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
            q: t('faqs.freeTrial'),
            a: t('faqs.freeTrialAnswer'),
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


