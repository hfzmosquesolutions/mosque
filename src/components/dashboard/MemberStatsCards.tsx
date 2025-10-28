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
        title="Total Contributed"
        value={`RM ${totalContributed.toLocaleString()}`}
        subtitle="Your khairat contributions"
        icon={Heart}
        {...StatsCardColors.emerald}
      />

      <StatsCard
        title="Approved Claims"
        value={`RM ${activeClaimsAmount.toLocaleString()}`}
        subtitle="Total amount from approved claims"
        icon={FileText}
        {...StatsCardColors.purple}
      />

      <StatsCard
        title="Family Members"
        value={dependentsCount}
        subtitle="Dependents registered"
        icon={Users}
        {...StatsCardColors.blue}
      />
    </div>
  );
}
