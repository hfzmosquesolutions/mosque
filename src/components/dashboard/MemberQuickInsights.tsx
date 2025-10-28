'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Lightbulb,
  Target,
  Award,
  TrendingUp,
  Heart,
  Users,
  Calendar,
  MapPin,
  ArrowRight,
  CheckCircle,
  Star,
  BookOpen,
  UserPlus,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface MemberQuickInsightsProps {
  totalContributed: number;
  contributionsCount: number;
  dependentsCount: number;
}

export function MemberQuickInsights({ 
  totalContributed, 
  contributionsCount, 
  dependentsCount 
}: MemberQuickInsightsProps) {
  const t = useTranslations('dashboard');

  const insights = [
    {
      id: 'first-contribution',
      title: 'Make Your First Contribution',
      description: 'Start supporting your community by contributing to khairat programs',
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      action: 'Contribute Now',
      href: '/khairat',
      show: contributionsCount === 0,
    },
    {
      id: 'add-dependents',
      title: 'Add Family Members',
      description: 'Register your dependents to extend khairat coverage to your family',
      icon: UserPlus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      action: 'Add Dependents',
      href: '/dependents',
      show: dependentsCount === 0,
    },
    {
      id: 'manage-mosques',
      title: 'Manage My Mosques',
      description: 'View and manage your mosque memberships and applications',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      action: 'View Mosques',
      href: '/my-mosques',
      show: true,
    },
    {
      id: 'find-mosques',
      title: 'Discover Local Mosques',
      description: 'Find and connect with other mosques in your area',
      icon: MapPin,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
      action: 'Find Mosques',
      href: '/mosques',
      show: true,
    },
  ];

  const achievements = [
    {
      id: 'contributor',
      title: 'Contributor',
      description: 'Made your first contribution',
      icon: Heart,
      achieved: contributionsCount > 0,
      color: 'text-red-600',
    },
    {
      id: 'family-manager',
      title: 'Family Manager',
      description: 'Added family members',
      icon: Users,
      achieved: dependentsCount > 0,
      color: 'text-blue-600',
    },
    {
      id: 'generous',
      title: 'Generous',
      description: 'Contributed over RM 100',
      icon: Star,
      achieved: totalContributed >= 100,
      color: 'text-yellow-600',
    },
    {
      id: 'community-member',
      title: 'Community Member',
      description: 'Active in community',
      icon: Award,
      achieved: contributionsCount >= 3,
      color: 'text-purple-600',
    },
  ];

  const visibleInsights = insights.filter(insight => insight.show);

  return (
    <div className="space-y-6">


    </div>
  );
}
