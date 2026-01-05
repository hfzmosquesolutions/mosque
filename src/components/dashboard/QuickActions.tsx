'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Users,
  Plus,
  FileText,
  Calendar,
  MapPin,
  DollarSign,
  Building2,
  UserCheck,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle,
  Search,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import { useUserRole } from '@/hooks/useUserRole';
import { useTranslations } from 'next-intl';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  color: string;
  bgColor: string;
  iconColor: string;
  badge?: string;
  badgeColor?: string;
  isNew?: boolean;
}

interface QuickActionsProps {
  pendingClaimsCount?: number;
  pendingRegistrationsCount?: number;
}

export function QuickActions({ pendingClaimsCount = 0, pendingRegistrationsCount = 0 }: QuickActionsProps) {
  const { isAdmin, mosqueId, loading: roleLoading } = useUserRole();
  const t = useTranslations('dashboard');

  const getActionCopy = (key: string) => ({
    title: t(`quickActionsItems.${key}.title`),
    description: t(`quickActionsItems.${key}.description`),
  });

  // Define quick actions based on user role
  const adminActions: QuickAction[] = [
    {
      id: 'manage-registrations',
      ...getActionCopy('manageKhairat'),
      icon: Heart,
      href: '/members',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      iconColor: 'text-red-600 dark:text-red-400',
      badge: pendingRegistrationsCount > 0 ? t('quickActionsItems.manageKhairat.badge', { count: pendingRegistrationsCount }) : undefined,
      badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    },
    {
      id: 'payment-records',
      ...getActionCopy('managePayments'),
      icon: DollarSign,
      href: '/payments',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      id: 'review-claims',
      ...getActionCopy('reviewClaims'),
      icon: FileText,
      href: '/claims',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      iconColor: 'text-green-600 dark:text-green-400',
      badge: pendingClaimsCount > 0 ? t('quickActionsItems.reviewClaims.badge', { count: pendingClaimsCount }) : undefined,
      badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    },
    {
      id: 'mosque-profile',
      ...getActionCopy('updateMosqueProfile'),
      icon: Building2,
      href: '/mosque-profile',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 'billing',
      ...getActionCopy('billing'),
      icon: CreditCard,
      href: '/billing',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  ];

  const memberActions: QuickAction[] = [
    {
      id: 'my-mosque',
      ...getActionCopy('myMosque'),
      icon: Building2,
      href: '/my-mosques',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 'pay-khairat',
      ...getActionCopy('payKhairat'),
      icon: Heart,
      href: '/my-mosques?tab=payments',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    {
      id: 'claim-khairat',
      ...getActionCopy('claimKhairat'),
      icon: FileText,
      href: '/my-mosques?tab=claims',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      id: 'add-dependents',
      ...getActionCopy('addDependents'),
      icon: Users,
      href: '/dependents',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'my-profile',
      ...getActionCopy('myProfile'),
      icon: UserCheck,
      href: '/profile',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      id: 'more-mosques',
      ...getActionCopy('moreMosques'),
      icon: Search,
      href: '/mosques',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
  ];

  // Don't render actions until role is determined to prevent flash
  if (roleLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-blue-600" />
            {t('quickActions')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('loading')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl border bg-muted/50 animate-pulse"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-xl bg-muted w-12 h-12"></div>
                  <div className="h-4 w-20 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const actions = isAdmin ? adminActions : memberActions;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-blue-600" />
          {t('quickActions')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isAdmin 
            ? t('quickActionsAdminDescription') 
            : t('quickActionsMemberDescription')
          }
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {actions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Link key={action.id} href={action.href} target={action.id === 'more-mosques' ? '_blank' : undefined}>
                <div
                  className={`group relative p-4 rounded-xl border transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${action.bgColor} border-transparent hover:border-current/30 text-center cursor-pointer`}
                >
                  {/* New badge */}
                  {action.isNew && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-2 -right-2 text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 shadow-sm"
                    >
                      {t('newLabel')}
                    </Badge>
                  )}
                  
                  <div className="flex flex-col items-center gap-3">
                    <div className={`p-3 rounded-xl ${action.bgColor} shadow-sm`}>
                      <IconComponent className={`h-6 w-6 ${action.iconColor}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-300 leading-tight mb-1">
                        {action.title}
                      </h4>
                      {action.badge && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-2 py-1 ${action.badgeColor} shadow-sm`}
                        >
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
