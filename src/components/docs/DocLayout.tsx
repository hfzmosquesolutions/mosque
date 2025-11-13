'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Book, Users, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

interface DocLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const getDocNavigation = (t: any) => ({
  user: [
    { title: t('guides.aboutTitle'), href: '/docs/about' },
    { title: t('guides.gettingStartedTitle'), href: '/docs/user/getting-started' },
    { title: t('guides.myMosquesTitle'), href: '/docs/user/my-mosques' },
    { title: t('guides.khairatTitle'), href: '/docs/user/khairat' },
    { title: t('guides.dependentsTitle'), href: '/docs/user/dependents' },
    { title: t('guides.profileTitle'), href: '/docs/user/profile' },
  ],
  admin: [
    { title: t('guides.adminGettingStartedTitle'), href: '/docs/admin/getting-started' },
    { title: t('guides.mosqueProfileTitle'), href: '/docs/admin/mosque-profile' },
    { title: t('guides.khairatManagementTitle'), href: '/docs/admin/khairat' },
    { title: t('guides.memberManagementTitle'), href: '/docs/admin/members' },
    { title: t('guides.paymentsTitle'), href: '/docs/admin/payments' },
    { title: t('guides.legacyDataTitle'), href: '/docs/admin/legacy-data' },
  ],
});

export function DocLayout({ children, title, description }: DocLayoutProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('docs');
  const isUserDoc = pathname?.includes('/docs/user') || pathname?.includes('/docs/about');
  const isAdminDoc = pathname?.includes('/docs/admin');
  const docNavigation = getDocNavigation(t);
  const navItems = isUserDoc ? docNavigation.user : docNavigation.admin;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Link href={`/${locale}/docs`}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('backToDocs')}
                  </Button>
                </Link>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                    {isUserDoc ? (
                      <>
                        <Users className="h-4 w-4" />
                        User Guides
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        Admin Guides
                      </>
                    )}
                  </div>
                  <nav className="space-y-1">
                    {navItems.map((item) => {
                      const fullHref = `/${locale}${item.href}`;
                      const isActive = pathname === fullHref;
                      return (
                        <Link key={item.href} href={fullHref} className="block">
                          <Button
                            variant={isActive ? 'secondary' : 'ghost'}
                            size="sm"
                            className={`w-full justify-start relative transition-colors ${
                              isActive 
                                ? 'bg-primary/10 dark:bg-primary/20 text-primary font-semibold border-l-4 border-primary pl-3' 
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-l-4 border-transparent'
                            }`}
                          >
                            {item.title}
                          </Button>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h1 className="text-4xl font-bold mb-4">{title}</h1>
                {description && (
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                    {description}
                  </p>
                )}
                <div className="mt-8">{children}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

