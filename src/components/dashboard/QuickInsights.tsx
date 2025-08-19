'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  Heart,
  Building,
  ArrowRight,
  Info,
} from 'lucide-react';
import { DashboardStats } from '@/types/database';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import Link from 'next/link';

interface QuickInsightsProps {
  stats: DashboardStats;
}

export function QuickInsights({ stats }: QuickInsightsProps) {
  // Generate insights based on the data
  const insights = [];

  // Profile completion insight
  if (
    stats.mosque_profile_completion &&
    stats.mosque_profile_completion.percentage < 100
  ) {
    insights.push({
      type: 'warning' as const,
      title: 'Complete Mosque Profile',
      description: `Your profile is ${Math.round(
        stats.mosque_profile_completion.percentage
      )}% complete. Missing: ${stats.mosque_profile_completion.missing_fields.join(
        ', '
      )}.`,
      action: 'Complete Profile',
      href: '/mosque-profile',
      priority: 'high' as const,
    });
  }

  // Programs needing attention (check if any programs have low progress)
  const lowProgressPrograms =
    stats.khairat_programs_progress?.filter(
      (p) => p.progress_percentage < 50
    ) || [];
  if (lowProgressPrograms.length > 0) {
    insights.push({
      type: 'warning' as const,
      title: 'Programs Need Attention',
      description: `${lowProgressPrograms.length} khairat programs have low contribution progress.`,
      action: 'Review Programs',
      href: '/khairat',
      priority: 'medium' as const,
    });
  }

  // Khairat contribution growth insight
  if (stats.monthly_khairat_contributions > stats.total_khairat_amount * 0.1) {
    insights.push({
      type: 'success' as const,
      title: 'Strong Khairat Activity',
      description: `Good contribution activity this month with ${formatCurrency(
        stats.monthly_khairat_contributions
      )} collected.`,
      action: 'View Programs',
      href: '/khairat',
      priority: 'low' as const,
    });
  } else if (stats.monthly_khairat_contributions === 0) {
    insights.push({
      type: 'warning' as const,
      title: 'No Contributions This Month',
      description:
        'No khairat contributions received this month. Consider promoting active programs.',
      action: 'Review Programs',
      href: '/khairat',
      priority: 'high' as const,
    });
  }

  // No active programs insight
  if (stats.active_khairat_programs === 0) {
    insights.push({
      type: 'info' as const,
      title: 'Start Your First Khairat Program',
      description: 'Create khairat programs to help community members in need.',
      action: 'Create Program',
      href: '/khairat',
      priority: 'medium' as const,
    });
  }

  // Monthly performance summary
  const monthlyPerformance = {
    contributions: stats.monthly_khairat_contributions,
    programs: stats.active_khairat_programs,
    activities: stats.recent_activity_count,
  };

  return (
    <div className="space-y-6">
      {/* Quick Insights */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-blue-600" />
            Quick Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-green-600 mb-1">
                All Good!
              </h3>
              <p className="text-xs text-muted-foreground">
                Everything is running smoothly.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {insights.slice(0, 2).map((insight, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    insight.type === 'success'
                      ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                      : insight.type === 'warning'
                      ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
                      : 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {insight.type === 'success' && (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        )}
                        {insight.type === 'warning' && (
                          <AlertTriangle className="h-3 w-3 text-yellow-600" />
                        )}
                        {insight.type === 'info' && (
                          <Info className="h-3 w-3 text-blue-600" />
                        )}
                        <h4 className="font-semibold text-xs">
                          {insight.title}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {insight.description}
                      </p>
                      <Link href={insight.href}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-6"
                        >
                          {insight.action}
                          <ArrowRight className="h-2 w-2 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {insights.length > 2 && (
                <div className="text-center pt-1">
                  <p className="text-xs text-muted-foreground">
                    +{insights.length - 2} more
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Monthly Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(monthlyPerformance.contributions)}
              </div>
              <p className="text-sm text-muted-foreground">
                Khairat Contributions
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center mb-2">
                <Heart className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold">
                {monthlyPerformance.programs}
              </div>
              <p className="text-sm text-muted-foreground">Active Programs</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center mb-2">
                <Building className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold">
                {monthlyPerformance.activities}
              </div>
              <p className="text-sm text-muted-foreground">Recent Activities</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
