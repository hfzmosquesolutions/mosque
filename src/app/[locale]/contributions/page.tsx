'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Heart,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Target,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import {
  getContributions,
  getUserContributions,
} from '@/lib/api';
import type { Contribution, ContributionProgram, Mosque } from '@/types/database';

function ContributionsContent() {
  const t = useTranslations('contributions');
  const tCommon = useTranslations('common');
  const { user } = useAuth();
  const { isCompleted, isLoading: onboardingLoading } = useOnboardingRedirect();
  const [loading, setLoading] = useState(true);
  const [userContributions, setUserContributions] = useState<(Contribution & { program: ContributionProgram & { mosque: Mosque } })[]>([]);
  const [programs, setPrograms] = useState<ContributionProgram[]>([]);
  const [stats, setStats] = useState({
    totalContributed: 0,
    activePrograms: 0,
    contributionsMade: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const contributionsResponse = await getUserContributions(user.id);

        setUserContributions(contributionsResponse.data || []);
        
        // Extract unique programs from user contributions
        const uniquePrograms = contributionsResponse.data?.reduce((acc: ContributionProgram[], contribution: any) => {
          if (contribution.program && !acc.find(p => p.id === contribution.program.id)) {
            acc.push(contribution.program);
          }
          return acc;
        }, []) || [];
        
        setPrograms(uniquePrograms);

        // Calculate stats
        const totalContributed = contributionsResponse.data?.reduce(
          (sum: number, contribution: Contribution & { program: ContributionProgram & { mosque: Mosque } }) => sum + contribution.amount,
          0
        ) || 0;

        setStats({
          totalContributed,
          activePrograms: uniquePrograms.filter(
            (program: ContributionProgram) => program.is_active
          ).length || 0,
          contributionsMade: contributionsResponse.data?.length || 0,
        });
      } catch (error) {
        console.error('Failed to fetch contributions data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isCompleted, onboardingLoading]);

  if (onboardingLoading || !isCompleted) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">{tCommon('loading')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {t('description')}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('totalContributed')}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                RM {stats.totalContributed.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('acrossContributions', { count: userContributions.length })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('activePrograms')}
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePrograms}</div>
              <p className="text-xs text-muted-foreground">
                {t('availableForContribution')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('contributionsMade')}
              </CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.contributionsMade}</div>
              <p className="text-xs text-muted-foreground">
                {t('supportingCommunity')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
            <TabsTrigger value="programs">{t('programs')}</TabsTrigger>
            <TabsTrigger value="contributions">{t('contributions')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Contributions */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('recentContributions')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {userContributions.length > 0 ? (
                    <div className="space-y-4">
                      {userContributions.slice(0, 5).map((contribution) => (
                        <div
                          key={contribution.id}
                          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {contribution.program?.name || t('unknownProgram')}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {new Date(contribution.contributed_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-emerald-600">
                              RM {contribution.amount.toFixed(2)}
                            </p>
                            <Badge
                              variant={contribution.status === 'completed' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {contribution.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                      {t('noContributionsYet')}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Active Programs */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('activePrograms')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {programs.filter(program => program.is_active).length > 0 ? (
                    <div className="space-y-4">
                      {programs
                        .filter(program => program.is_active)
                        .slice(0, 3)
                        .map((program) => (
                        <div
                          key={program.id}
                          className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-slate-900 dark:text-slate-100">
                              {program.name}
                            </h4>
                            <Button size="sm">
                              {t('makePayment')}
                            </Button>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {program.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{t('target')}: RM {program.target_amount?.toFixed(2) || '0.00'}</span>
                            <span>{t('raised')}: RM {program.current_amount?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                      {t('noActiveProgramsAvailable')}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="programs" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program) => (
                <Card key={program.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                      <Badge
                        variant={program.is_active ? 'default' : 'secondary'}
                      >
                        {program.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardDescription>{program.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{t('raised')}</span>
                          <span>RM {program.current_amount?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{t('target')}</span>
                          <span>RM {program.target_amount?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-emerald-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(
                                ((program.current_amount || 0) / (program.target_amount || 1)) * 100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      {program.is_active && (
                        <Button className="w-full">
                          {t('contribute')}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="contributions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('myContributions')}</CardTitle>
                <CardDescription>
                  {t('contributionHistory')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userContributions.length > 0 ? (
                  <div className="space-y-4">
                    {userContributions.map((contribution) => (
                      <div
                        key={contribution.id}
                        className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {contribution.program?.name || t('unknownProgram')}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                              {new Date(contribution.contributed_at).toLocaleDateString()} •{' '}
                              {new Date(contribution.contributed_at).toLocaleTimeString()}
                            </p>
                          {contribution.notes && (
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {contribution.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-semibold text-emerald-600">
                            RM {contribution.amount.toFixed(2)}
                          </p>
                          <Badge
                            variant={contribution.status === 'completed' ? 'default' : 'secondary'}
                          >
                            {contribution.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400 mb-2">
                      {t('noContributionsYet')}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t('startContributing')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

export default function ContributionsPage() {
  return (
    <ProtectedRoute>
      <ContributionsContent />
    </ProtectedRoute>
  );
}
