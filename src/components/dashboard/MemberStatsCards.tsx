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
  FileText,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MemberStatsCardsProps {
  totalContributed: number;
  dependentsCount: number;
  activeClaimsAmount?: number;
}

export function MemberStatsCards({ 
  totalContributed, 
  dependentsCount, 
  activeClaimsAmount = 0
}: MemberStatsCardsProps) {
  const t = useTranslations('dashboard');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatsCard
        title={t('memberStatsCards.totalContributed')}
        value={`RM ${totalContributed.toLocaleString()}`}
        subtitle={t('memberStatsCards.totalContributedSubtitle')}
        icon={Heart}
        {...StatsCardColors.emerald}
      />

      <StatsCard
        title={t('memberStatsCards.approvedClaims')}
        value={`RM ${activeClaimsAmount.toLocaleString()}`}
        subtitle={t('memberStatsCards.approvedClaimsSubtitle')}
        icon={FileText}
        {...StatsCardColors.purple}
      />

      <StatsCard
        title={t('memberStatsCards.familyMembers')}
        value={dependentsCount}
        subtitle={t('memberStatsCards.familyMembersSubtitle')}
        icon={Users}
        {...StatsCardColors.blue}
      />
    </div>
  );
}
