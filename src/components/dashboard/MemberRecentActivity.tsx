'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Heart,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Calendar,
  Building,
  UserPlus,
  Users,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface Contribution {
  id: string;
  amount: number;
  contributed_at: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  program: {
    name: string;
    mosque: {
      name: string;
    };
  };
}

interface MemberRecentActivityProps {
  contributions: Contribution[];
  dependentsCount: number;
}

export function MemberRecentActivity({ contributions, dependentsCount }: MemberRecentActivityProps) {
  const t = useTranslations('dashboard');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const recentContributions = contributions.slice(0, 5);
  const hasContributions = recentContributions.length > 0;

  return (
    <div className="space-y-6">

    </div>
  );
}
