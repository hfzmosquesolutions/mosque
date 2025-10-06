"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Star } from "lucide-react";

type BillingPeriod = "monthly" | "annual";

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingPeriod>("monthly");

  const prices = useMemo(
    () => ({
      monthly: { free: 0, standard: 29, pro: 69 },
      annual: { free: 0, standard: 24, pro: 54 }, // billed monthly equivalent
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
            <span className="text-xs font-medium">For Mosque Admins</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Simple, transparent pricing
          </h1>
          <p className="mt-3 text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Pick a plan that fits your community. Upgrade or cancel anytime.
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
            Monthly
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
            Annual <span className="ml-1 text-emerald-700 dark:text-emerald-300">(save ~20%)</span>
          </button>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <Card className="border-emerald-100 dark:border-slate-700">
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Get started with essentials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">${prices[billing].free}</div>
                <div className="text-slate-500 text-sm">{periodSuffix}</div>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> Public mosque profile</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> Events and classes</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> Community directory</li>
              </ul>
              <div className="mt-6">
                <Link href="/signup">
                  <Button className="w-full">Get started</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Standard (Recommended) */}
          <Card className="relative border-emerald-300 ring-2 ring-emerald-300/60 dark:border-emerald-700/60">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs rounded-full bg-emerald-600 text-white shadow">
              Recommended
            </div>
            <CardHeader>
              <CardTitle>Standard</CardTitle>
              <CardDescription>Best for growing communities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">${prices[billing].standard}</div>
                <div className="text-slate-500 text-sm">{periodSuffix}</div>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> Everything in Free</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> Khairat program management</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> Donations & payments</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> Priority email support</li>
              </ul>
              <div className="mt-6">
                <Link href="/signup">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Start Standard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className="border-emerald-100 dark:border-slate-700">
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>Advanced features and support</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">${prices[billing].pro}</div>
                <div className="text-slate-500 text-sm">{periodSuffix}</div>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> Everything in Standard</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> Advanced analytics</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> Priority support</li>
              </ul>
              <div className="mt-6">
                <Link href="/signup">
                  <Button className="w-full" variant="outline">Start Pro</Button>
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
            Compare features
          </div>
          <div className="grid grid-cols-4 px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="font-medium">Feature</div>
            <div className="text-center">Free</div>
            <div className="text-center">Standard</div>
            <div className="text-center">Pro</div>
          </div>
          {[
            { label: "Mosque profile", f: true, s: true, p: true },
            { label: "Events & classes", f: true, s: true, p: true },
            { label: "Khairat management", f: false, s: true, p: true },
            { label: "Donations & payments", f: false, s: true, p: true },
            { label: "Advanced analytics", f: false, s: false, p: true },
            { label: "Priority support", f: false, s: true, p: true },
          ].map((row) => (
            <div key={row.label} className="grid grid-cols-4 px-6 py-3 border-t border-emerald-100/50 dark:border-slate-800 text-sm">
              <div className="text-slate-700 dark:text-slate-300">{row.label}</div>
              <div className="text-center">{row.f ? "✔" : "—"}</div>
              <div className="text-center">{row.s ? "✔" : "—"}</div>
              <div className="text-center">{row.p ? "✔" : "—"}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[{
            q: "Can I switch plans later?",
            a: "Yes. You can upgrade or downgrade at any time from your settings.",
          }, {
            q: "Do you offer discounts for annual billing?",
            a: "Yes. Annual pricing saves about 20% compared to monthly.",
          }, {
            q: "Is there a free trial?",
            a: "Standard and Pro include a 14‑day free trial. No credit card required to start.",
          }, {
            q: "How does payments work?",
            a: "We use trusted providers to process donations and fees securely.",
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
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Ready to set up your mosque?</h2>
          <p className="text-emerald-100 mb-8">Create your profile and get set up in minutes.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50">Get started</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}


