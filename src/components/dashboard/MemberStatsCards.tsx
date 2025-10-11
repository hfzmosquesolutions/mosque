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
  followerCount: number;
  dependentsCount: number;
  recentContributionsCount: number;
  eventsAttended?: number;
  mosquesFollowed?: number;
}

export function MemberStatsCards({ 
  totalContributed, 
  followerCount, 
  dependentsCount, 
  recentContributionsCount,
  eventsAttended = 0,
  mosquesFollowed = 0
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

      <StatsCard
        title="Mosques Followed"
        value={mosquesFollowed}
        subtitle="Communities you follow"
        icon={MapPin}
        {...StatsCardColors.purple}
      />
    </div>
  );
}
