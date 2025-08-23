'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  Banknote,
  FileText,
  Heart,
  Building,
  BookOpen,
  Settings,
  Users,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

import { FEATURES } from '@/lib/utils'

interface UserProfile {
  accountType: 'member' | 'admin';
  mosqueRole?: string;
}

interface FeatureCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  adminOnly?: boolean;
}

const memberFeatures: FeatureCard[] = [
  {
    title: 'Prayer Times',
    description: 'View daily prayer times and Islamic calendar',
    icon: <BookOpen className="h-5 w-5" />,
    href: '/prayer-times',
  },
  // Events is hidden via feature flag
  ...(FEATURES.EVENTS_ENABLED
    ? [{
        title: 'Events',
        description: 'Browse and register for mosque events',
        icon: <Calendar className="h-5 w-5" />,
        href: '/events',
      } as FeatureCard]
    : []),
  {
    title: 'Donations',
    description: 'Make donations and view your contribution history',
    icon: <Banknote className="h-5 w-5" />,
    href: '/donations',
  },
  {
    title: 'Contributions',
    description: 'Participate in community welfare programs',
    icon: <Heart className="h-5 w-5" />,
    href: '/contributions',
  },
  {
    title: 'Resources',
    description: 'Access Islamic resources and educational materials',
    icon: <FileText className="h-5 w-5" />,
    href: '/resources',
  },
];

const adminFeatures: FeatureCard[] = [
  // Event Management hidden via feature flag
  ...(FEATURES.EVENTS_ENABLED
    ? [{
        title: 'Event Management',
        description: 'Create and manage mosque events',
        icon: <Calendar className="h-5 w-5" />,
        href: '/events',
        badge: 'Admin',
        adminOnly: true,
      } as FeatureCard]
    : []),

  {
    title: 'Financial Reports',
    description: 'View donation reports and financial analytics',
    icon: <Banknote className="h-5 w-5" />,
    href: '/financial-reports',
    badge: 'Admin',
    adminOnly: true,
  },
  {
    title: 'Payment Settings',
    description: 'Configure payment providers and mosque settings',
    icon: <Building className="h-5 w-5" />,
    href: '/settings?tab=payment-settings',
    badge: 'Admin',
    adminOnly: true,
  },
  {
    title: 'System Settings',
    description: 'Manage system configuration and permissions',
    icon: <Settings className="h-5 w-5" />,
    href: '/settings',
    badge: 'Admin',
    adminOnly: true,
  },
];

export function RoleBasedFeatures() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user?.id) {
      const storedProfile = localStorage.getItem(`user_profile_${user.id}`);
      if (storedProfile) {
        try {
          const parsedProfile = JSON.parse(storedProfile);
          setProfile({
            accountType: parsedProfile.accountType,
            mosqueRole: parsedProfile.mosqueRole,
          });
        } catch (error) {
          console.error('Error parsing user profile:', error);
        }
      }
    }
  }, [user]);

  if (!profile) {
    return null;
  }

  const isAdmin = profile.accountType === 'admin';

  return (
    <div className="space-y-6">
      {/* Member Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Community Features
          </CardTitle>
          <CardDescription>
            Access mosque services and community resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memberFeatures.map((feature, index) => (
              <Link key={index} href={feature.href}>
                <Card className="cursor-pointer transition-all hover:shadow-md hover:scale-105">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        {feature.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">{feature.title}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admin Features */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Administrative Features
            </CardTitle>
            <CardDescription>
              Manage mosque operations and community administration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminFeatures.map((feature, index) => (
                <Link key={index} href={feature.href}>
                  <Card className="cursor-pointer transition-all hover:shadow-md hover:scale-105 border-green-200 dark:border-green-800">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                          {feature.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm">
                              {feature.title}
                            </h3>
                            {feature.badge && (
                              <Badge variant="outline" className="text-xs">
                                {feature.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Information */}
      <Card className="bg-slate-50 dark:bg-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isAdmin ? (
                <Shield className="h-5 w-5 text-green-600" />
              ) : (
                <Users className="h-5 w-5 text-blue-600" />
              )}
              <div>
                <p className="font-medium text-sm">
                  {isAdmin ? 'Administrator Access' : 'Member Access'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isAdmin
                    ? 'You have full access to manage mosque operations'
                    : 'You have access to all community features and services'}
                </p>
              </div>
            </div>
            <Badge variant={isAdmin ? 'default' : 'secondary'}>
              {isAdmin ? 'Admin' : 'Member'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
