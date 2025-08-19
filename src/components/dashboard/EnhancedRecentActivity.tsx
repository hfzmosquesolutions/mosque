'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Heart,
  Building,
  DollarSign,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { DashboardStats } from '@/types/database';
import { formatRelativeTime } from '@/utils/formatters';
import Link from 'next/link';

interface EnhancedRecentActivityProps {
  stats: DashboardStats;
}

export function EnhancedRecentActivity({ stats }: EnhancedRecentActivityProps) {
  // Generate recent activities based on real data
  const recentActivities = [];

  // Add khairat program activities if available
  if (
    stats.khairat_programs_progress &&
    stats.khairat_programs_progress.length > 0
  ) {
    stats.khairat_programs_progress.slice(0, 2).forEach((program, index) => {
      recentActivities.push({
        id: `program-${program.id}`,
        type: 'khairat_program',
        title: 'Khairat Program Active',
        description: `${program.name} - ${Math.round(
          program.progress_percentage
        )}% progress`,
        timestamp: new Date(
          Date.now() - (index + 1) * 2 * 60 * 60 * 1000
        ).toISOString(),
        icon: Heart,
        color: 'text-red-600',
      });
    });
  }

  // Add profile completion activity if incomplete
  if (stats.mosque_profile_completion.percentage < 100) {
    recentActivities.push({
      id: 'profile-incomplete',
      type: 'profile_update',
      title: 'Profile Needs Attention',
      description: `${stats.mosque_profile_completion.missing_fields.length} fields missing`,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      icon: Building,
      color: 'text-yellow-600',
    });
  }

  // Add monthly contribution activity if available
  if (stats.monthly_khairat_contributions > 0) {
    recentActivities.push({
      id: 'monthly-contributions',
      type: 'khairat_contribution',
      title: 'Monthly Contributions',
      description: `RM ${stats.monthly_khairat_contributions.toFixed(
        2
      )} collected this month`,
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      icon: DollarSign,
      color: 'text-green-600',
    });
  }

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'khairat_contribution':
        return 'Khairat';
      case 'khairat_program':
        return 'Program';
      case 'profile_update':
        return 'Profile';
      default:
        return 'Activity';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-blue-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentActivities.slice(0, 3).map((activity) => {
            const IconComponent = activity.icon;
            return (
              <div
                key={activity.id}
                className="flex items-start space-x-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div
                  className={`p-1 rounded-full bg-gray-100 dark:bg-gray-800`}
                >
                  <IconComponent className={`h-3 w-3 ${activity.color}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium">{activity.title}</h4>
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {getActivityTypeLabel(activity.type)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2 w-2" />
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {stats.recent_activity_count > 3 && (
          <div className="mt-2 text-center">
            <Button variant="outline" size="sm" className="text-xs h-6">
              View All ({stats.recent_activity_count})
              <ArrowRight className="ml-1 h-2 w-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
