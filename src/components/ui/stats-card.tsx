'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  valueColor?: string;
  className?: string;
  children?: ReactNode;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-muted-foreground',
  iconBgColor = 'bg-slate-100 dark:bg-slate-900/30',
  valueColor = 'text-slate-900 dark:text-slate-100',
  className = '',
  children,
}: StatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className={`p-2 ${iconBgColor} rounded-lg`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor}`}>
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

// Predefined color schemes for common use cases
export const StatsCardColors = {
  emerald: {
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    valueColor: 'text-emerald-600 dark:text-emerald-400',
  },
  orange: {
    iconColor: 'text-orange-600 dark:text-orange-400',
    iconBgColor: 'bg-orange-100 dark:bg-orange-900/30',
    valueColor: 'text-orange-600 dark:text-orange-400',
  },
  blue: {
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBgColor: 'bg-blue-100 dark:bg-blue-900/30',
    valueColor: 'text-blue-600 dark:text-blue-400',
  },
  yellow: {
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    iconBgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    valueColor: 'text-yellow-600 dark:text-yellow-400',
  },
  purple: {
    iconColor: 'text-purple-600 dark:text-purple-400',
    iconBgColor: 'bg-purple-100 dark:bg-purple-900/30',
    valueColor: 'text-purple-600 dark:text-purple-400',
  },
  red: {
    iconColor: 'text-red-600 dark:text-red-400',
    iconBgColor: 'bg-red-100 dark:bg-red-900/30',
    valueColor: 'text-red-600 dark:text-red-400',
  },
  slate: {
    iconColor: 'text-slate-600 dark:text-slate-400',
    iconBgColor: 'bg-slate-100 dark:bg-slate-900/30',
    valueColor: 'text-slate-900 dark:text-slate-100',
  },
} as const;
