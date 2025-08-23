'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Banknote,
  Heart,
  Building,
  Activity,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { DashboardStats } from '@/types/database';
import {
  formatCurrency,
  formatPercentage,
  getTrendIndicator,
  formatCompactNumber,
} from '@/utils/formatters';

interface EnhancedStatsCardsProps {
  stats: DashboardStats;
}

export function EnhancedStatsCards({ stats }: EnhancedStatsCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Khairat Amount */}
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground truncate">
            Total Khairat
          </CardTitle>
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <Heart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
            {formatCurrency(stats.total_khairat_amount)}
          </div>
          <p className="text-sm text-muted-foreground mt-1 truncate">All programs</p>
        </CardContent>
      </Card>

      {/* Monthly Khairat Contributions */}
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground truncate">
            This Month
          </CardTitle>
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Banknote className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 truncate">
            {formatCurrency(stats.monthly_khairat_contributions)}
          </div>
          <p className="text-sm text-muted-foreground mt-1 truncate">Contributions</p>
        </CardContent>
      </Card>

      {/* Khairat Programs Progress */}
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground truncate">
            Programs
          </CardTitle>
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Heart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {stats.active_khairat_programs}
          </div>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {stats.total_khairat_programs} total
          </p>
        </CardContent>
      </Card>

      {/* Mosque Profile Completion */}
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground truncate">
            Profile Status
          </CardTitle>
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Building className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {Math.round(stats.mosque_profile_completion.percentage)}%
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-muted-foreground truncate flex-1 mr-2">
              {stats.mosque_profile_completion.percentage === 100
                ? 'Complete'
                : 'In progress'}
            </p>
            {stats.mosque_profile_completion.percentage === 100 ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
