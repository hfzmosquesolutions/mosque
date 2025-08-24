'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  Users,
  Calendar,
  Heart,
  CheckCircle,
  ArrowRight,
  Star,
  Shield,
  Clock,
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const t = useTranslations('homepage');
  const tCommon = useTranslations('common');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          <div className="space-y-6">
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 px-4 py-2">
              {t('trustedByMosques')}
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t('modernMosque')}
              <span className="text-emerald-600 block">
                {t('managementPlatform')}
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-4xl mx-auto leading-relaxed">
              {t('heroDescription')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!user ? (
              <>
                <Link href="signup">
                  <Button
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 px-8 py-3 text-lg"
                  >
                    {t('startFreeTrial')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="mosques">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 py-3 text-lg"
                  >
                    {t('browseMosques')}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="dashboard">
                  <Button
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 px-8 py-3 text-lg"
                  >
                    {tCommon('goToDashboard')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="mosques">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 py-3 text-lg"
                  >
                    {t('exploreMosques')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 pt-8 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium">
                {t('secureCompliant')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium">{t('rating')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium">{t('support24x7')}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            {t('powerfuFeaturesTitle')}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            {t('featuresDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-emerald-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle className="text-xl">
                {t('mosqueManagementTitle')}
              </CardTitle>
              <CardDescription className="text-base">
                {t('mosqueManagementDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  {t('publicPrivateSettings')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  {t('prayerTimesManagement')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  {t('contactLocationDetails')}
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">
                {t('eventsProgramsTitle')}
              </CardTitle>
              <CardDescription className="text-base">
                {t('eventsProgramsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  {t('eventCreationManagement')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  {t('publicEventListings')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  {t('communityEngagement')}
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl">
                {t('contributionManagementTitle')}
              </CardTitle>
              <CardDescription className="text-base">
                {t('contributionManagementDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                  {t('khairatProgramManagement')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                  {t('securePaymentProcessing')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                  {t('contributionTracking')}
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-rose-600" />
              </div>
              <CardTitle className="text-xl">
                {t('communityFeaturesTitle')}
              </CardTitle>
              <CardDescription className="text-base">
                {t('communityFeaturesDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-rose-600" />
                  {t('userProfileManagement')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-rose-600" />
                  {t('familyDependentTracking')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-rose-600" />
                  {t('communityDirectory')}
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle className="text-xl">
                {t('securityPrivacyTitle')}
              </CardTitle>
              <CardDescription className="text-base">
                {t('securityPrivacyDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-amber-600" />
                  {t('roleBasedPermissions')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-amber-600" />
                  {t('dataEncryption')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-amber-600" />
                  {t('privacyControls')}
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-teal-600" />
              </div>
              <CardTitle className="text-xl">24/7 Support</CardTitle>
              <CardDescription className="text-base">
                Comprehensive support and training resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  Technical support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  Training & onboarding
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  Documentation library
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Testimonials/Stats Section */}
      <div className="bg-slate-50 dark:bg-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {t('testimonialsTitle')}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              {t('testimonialsDescription')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">
                500+
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                {t('registeredMosques')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">
                10K+
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                {t('communityMembers')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">
                99.9%
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                {t('uptimeGuarantee')}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Call to Action */}
      <div className="bg-emerald-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('ctaTitle')}
          </h2>
          <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">
            {t('ctaDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link href="dashboard">
                <Button
                  size="lg"
                  className="bg-white text-emerald-600 hover:bg-emerald-50"
                >
                  <ArrowRight className="mr-2 h-5 w-5" />
                  {tCommon('goToDashboard')}
                </Button>
              </Link>
            ) : (
              <Link href="signup">
                <Button
                  size="lg"
                  className="bg-white text-emerald-600 hover:bg-emerald-50"
                >
                  <ArrowRight className="mr-2 h-5 w-5" />
                  {t('startFreeTrial')}
                </Button>
              </Link>
            )}
            <Link href="/mosques">
              <Button
                size="lg"
                className="bg-white text-emerald-600 hover:bg-emerald-50"
              >
                <Building2 className="mr-2 h-5 w-5" />
                {t('browseMosques')}
              </Button>
            </Link>
          </div>
          <p className="text-emerald-100 text-sm mt-6">{t('ctaNoCredit')}</p>
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Image
                src="/logo-kariah-masjid.png"
                alt="Kariah Masjid Logo"
                width={128}
                height={32}
                className="rounded-md"
              />
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              {t('brandTagline')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
