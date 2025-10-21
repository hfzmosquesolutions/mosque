'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard, StatsCardColors } from '@/components/ui/stats-card';
import {
  DollarSign,
  Users,
  Heart,
  TrendingUp,
  UserPlus,
  Target,
  Award,
  Activity,
  Calendar,
  MapPin,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MemberStatsCardsProps {
  totalContributed: number;
  dependentsCount: number;
  recentContributionsCount: number;
  eventsAttended?: number;
}

export function MemberStatsCards({ 
  totalContributed, 
  dependentsCount, 
  recentContributionsCount,
  eventsAttended = 0
}: MemberStatsCardsProps) {
  const t = useTranslations('dashboard');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Contributed"
        value={`RM ${totalContributed.toLocaleString()}`}
        subtitle="Your khairat contributions"
        icon={Heart}
        {...StatsCardColors.emerald}
      />

      <StatsCard
        title="Family Members"
        value={dependentsCount}
        subtitle="Dependents registered"
        icon={Users}
        {...StatsCardColors.blue}
      />

      <StatsCard
        title="Events Attended"
        value={eventsAttended}
        subtitle="Mosque events joined"
        icon={Calendar}
        {...StatsCardColors.orange}
      />

    </div>
  );
}
