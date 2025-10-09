'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Users,
  Plus,
  FileText,
  Settings,
  Calendar,
  MapPin,
  DollarSign,
  Building2,
  UserCheck,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useUserRole } from '@/hooks/useUserRole';

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

export function QuickActions() {
  const { isAdmin, mosqueId } = useUserRole();

  // Define quick actions based on user role
  const adminActions: QuickAction[] = [
    {
      id: 'create-program',
      title: 'Create Khairat Program',
      description: 'Start a new khairat program for community members',
      icon: Heart,
      href: '/khairat',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      iconColor: 'text-red-600 dark:text-red-400',
      isNew: true,
    },
    {
      id: 'manage-members',
      title: 'Manage Kariah Members',
      description: 'Review applications and manage memberships',
      icon: UserCheck,
      href: '/kariah',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      badge: '3 pending',
      badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    },
    {
      id: 'review-claims',
      title: 'Review Claims',
      description: 'Process and approve khairat claims',
      icon: FileText,
      href: '/khairat?tab=claims',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      iconColor: 'text-green-600 dark:text-green-400',
      badge: '5 new',
      badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    },
    {
      id: 'mosque-profile',
      title: 'Update Mosque Profile',
      description: 'Keep your mosque information current',
      icon: Building2,
      href: '/mosque-profile',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 'analytics',
      title: 'View Analytics',
      description: 'Track performance and insights',
      icon: TrendingUp,
      href: '/dashboard',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      id: 'settings',
      title: 'Mosque Settings',
      description: 'Configure payment and notification settings',
      icon: Settings,
      href: '/settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-950/20',
      iconColor: 'text-gray-600 dark:text-gray-400',
    },
  ];

  const memberActions: QuickAction[] = [
    {
      id: 'contribute',
      title: 'Make Contribution',
      description: 'Support khairat programs in your community',
      icon: Heart,
      href: '/khairat',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      iconColor: 'text-red-600 dark:text-red-400',
      isNew: true,
    },
    {
      id: 'add-dependents',
      title: 'Add Dependents',
      description: 'Register family members for khairat coverage',
      icon: Users,
      href: '/dependents',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'my-contributions',
      title: 'My Contributions',
      description: 'View your khairat contribution history',
      icon: DollarSign,
      href: '/my-khairat',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      id: 'apply-kariah',
      title: 'Apply for Kariah',
      description: 'Join as a kariah member of your mosque',
      icon: UserCheck,
      href: '/kariah-application',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 'events',
      title: 'View Events',
      description: 'See upcoming mosque events and activities',
      icon: Calendar,
      href: '/events',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      id: 'find-mosque',
      title: 'Find Mosques',
      description: 'Discover other mosques in your area',
      icon: MapPin,
      href: '/find-mosque',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
  ];

  const actions = isAdmin ? adminActions : memberActions;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-blue-600" />
          Quick Actions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isAdmin 
            ? 'Manage your mosque and community programs' 
            : 'Quick access to common tasks and features'
          }
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Link key={action.id} href={action.href}>
                <div
                  className={`group relative p-4 rounded-lg border transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${action.bgColor} border-transparent hover:border-current/20`}
                >
                  {/* New badge */}
                  {action.isNew && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-2 -right-2 text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    >
                      New
                    </Badge>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${action.bgColor}`}>
                      <IconComponent className={`h-5 w-5 ${action.iconColor}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                          {action.title}
                        </h4>
                        {action.badge && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-2 py-0 ${action.badgeColor}`}
                          >
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {action.description}
                      </p>
                      <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                        <span>Take action</span>
                        <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        
        {/* Additional quick stats or tips */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>
              {isAdmin 
                ? 'Keep your mosque profile updated to help community members find you'
                : 'Complete your profile to get the most out of the platform'
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
