'use client';

import { useTranslations, useLocale } from 'next-intl';
import { DocsLayout } from '@/components/layout/DocsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, Users, Shield, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';

export default function DocumentationPage() {
  const t = useTranslations('docs');
  const locale = useLocale();

  const userGuides = [
    {
      title: t('guides.aboutTitle'),
      description: t('guides.aboutDesc'),
      href: `/${locale}/docs/about`,
      icon: Book,
    },
    {
      title: t('guides.gettingStartedTitle'),
      description: t('guides.gettingStartedDesc'),
      href: `/${locale}/docs/user/getting-started`,
      icon: Home,
    },
    {
      title: t('guides.myMosquesTitle'),
      description: t('guides.myMosquesDesc'),
      href: `/${locale}/docs/user/my-mosques`,
      icon: Book,
    },
    {
      title: t('guides.khairatTitle'),
      description: t('guides.khairatDesc'),
      href: `/${locale}/docs/user/khairat`,
      icon: Users,
    },
    {
      title: t('guides.dependentsTitle'),
      description: t('guides.dependentsDesc'),
      href: `/${locale}/docs/user/dependents`,
      icon: Users,
    },
    {
      title: t('guides.profileTitle'),
      description: t('guides.profileDesc'),
      href: `/${locale}/docs/user/profile`,
      icon: Users,
    },
  ];

  const adminGuides = [
    {
      title: t('guides.adminGettingStartedTitle'),
      description: t('guides.adminGettingStartedDesc'),
      href: `/${locale}/docs/admin/getting-started`,
      icon: Shield,
    },
    {
      title: t('guides.mosqueProfileTitle'),
      description: t('guides.mosqueProfileDesc'),
      href: `/${locale}/docs/admin/mosque-profile`,
      icon: Shield,
    },
    {
      title: t('guides.khairatManagementTitle'),
      description: t('guides.khairatManagementDesc'),
      href: `/${locale}/docs/admin/khairat`,
      icon: Shield,
    },
    {
      title: t('guides.memberManagementTitle'),
      description: t('guides.memberManagementDesc'),
      href: `/${locale}/docs/admin/members`,
      icon: Shield,
    },
    {
      title: t('guides.paymentsTitle'),
      description: t('guides.paymentsDesc'),
      href: `/${locale}/docs/admin/payments`,
      icon: Shield,
    },
    {
      title: t('guides.legacyDataTitle'),
      description: t('guides.legacyDataDesc'),
      href: `/${locale}/docs/admin/legacy-data`,
      icon: Shield,
    },
  ];


  return (
    <DocsLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              {t('title')}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {t('subtitle')}
            </p>
          </div>

          {/* Documentation Sections */}
          <Tabs defaultValue="user" className="space-y-6">
            <TabsList>
              <TabsTrigger value="user">{t('userGuides')}</TabsTrigger>
              <TabsTrigger value="admin">{t('adminGuides')}</TabsTrigger>
            </TabsList>

            <TabsContent value="user" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userGuides.map((guide) => {
                  const Icon = guide.icon;
                  return (
                    <Link key={guide.href} href={guide.href}>
                      <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 h-full flex flex-col">
                        <CardHeader className="flex-1 flex flex-col">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                              <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <CardTitle className="text-lg">{guide.title}</CardTitle>
                          </div>
                          <CardDescription className="flex-1">{guide.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 mt-auto">
                          <Button variant="ghost" size="sm" className="w-full">
                            {t('readGuide')} <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="admin" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {adminGuides.map((guide) => {
                  const Icon = guide.icon;
                  return (
                    <Link key={guide.href} href={guide.href}>
                      <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 h-full flex flex-col">
                        <CardHeader className="flex-1 flex flex-col">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                              <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <CardTitle className="text-lg">{guide.title}</CardTitle>
                          </div>
                          <CardDescription className="flex-1">{guide.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 mt-auto">
                          <Button variant="ghost" size="sm" className="w-full">
                            {t('readGuide')} <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DocsLayout>
  );
}

