'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, ArrowUpRight, Users } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { getPlanLimits } from '@/lib/subscription';
import { getKhairatStatistics } from '@/lib/api/khairat-members';
import { cn } from '@/lib/utils';

interface MemberLimitBarProps {
  mosqueId: string;
}

export function MemberLimitBar({ mosqueId }: MemberLimitBarProps) {
  const t = useTranslations('khairatManagement');
  const { plan, loading: subscriptionLoading } = useSubscription(mosqueId);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMemberCount = async () => {
      if (!mosqueId) return;
      
      try {
        const stats = await getKhairatStatistics(mosqueId);
        setMemberCount(stats.total);
      } catch (error) {
        console.error('Error loading member count:', error);
        setMemberCount(null);
      } finally {
        setLoading(false);
      }
    };

    loadMemberCount();
  }, [mosqueId]);

  if (subscriptionLoading || loading || memberCount === null) {
    return null;
  }

  const planLimits = getPlanLimits(plan);
  const memberLimit = planLimits.members;
  
  // If unlimited (memberLimit === -1), don't show the bar
  if (memberLimit === -1) {
    return null;
  }

  // TEST MODE: Set to true to test different UI states
  const TEST_MODE = false; // Change to true to enable test mode
  const TEST_PERCENTAGE = 85; // Change this: 50 = normal, 85 = near limit, 100 = at limit
  
  const displayMemberCount = TEST_MODE 
    ? Math.floor(memberLimit * (TEST_PERCENTAGE / 100))
    : memberCount;

  const usagePercentage = Math.min((displayMemberCount / memberLimit) * 100, 100);
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = usagePercentage >= 100;
  const remaining = Math.max(0, memberLimit - displayMemberCount);

  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-md border text-xs",
      isAtLimit 
        ? "bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-900/30"
        : isNearLimit
        ? "bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/30"
        : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
    )}>
      {/* Khairat Member Icon */}
      <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 bg-slate-100 dark:bg-slate-800">
        <Users className={cn(
          "h-3.5 w-3.5",
          isAtLimit ? "text-red-600 dark:text-red-400" : isNearLimit ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"
        )} />
      </div>

      {isAtLimit || isNearLimit ? (
        <AlertCircle className={cn(
          "h-3.5 w-3.5 flex-shrink-0",
          isAtLimit ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
        )} />
      ) : null}
      
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className={cn(
          "font-medium",
          isAtLimit ? "text-red-900 dark:text-red-100" : isNearLimit ? "text-amber-900 dark:text-amber-100" : "text-slate-600 dark:text-slate-400"
        )}>
          {displayMemberCount.toLocaleString()} / {memberLimit.toLocaleString()}
        </span>
        <Progress 
          value={usagePercentage} 
          className={cn(
            "h-1 flex-1 max-w-[120px]",
            isAtLimit && "[&>div]:bg-red-500",
            isNearLimit && !isAtLimit && "[&>div]:bg-amber-500",
            !isNearLimit && "[&>div]:bg-slate-400 dark:[&>div]:bg-slate-500"
          )}
        />
      </div>

      <Link href="/billing">
        <Button 
          size="sm"
          variant="outline"
          className={cn(
            "h-6 px-2.5 text-xs font-medium shrink-0",
            isAtLimit 
              ? "border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30"
              : isNearLimit
              ? "border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/30"
              : "border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/30"
          )}
        >
          {t('upgrade') || 'Upgrade'}
          <ArrowUpRight className="h-3 w-3 ml-1" />
        </Button>
      </Link>
    </div>
  );
}
