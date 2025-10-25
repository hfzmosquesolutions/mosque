'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Activity,
  Heart,
  DollarSign,
  UserPlus,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';
import Link from 'next/link';

interface ActivityItem {
  id: string;
  type: 'contribution' | 'claim' | 'member' | 'program' | 'application';
  title: string;
  description: string;
  timestamp: string;
  status?: 'completed' | 'pending' | 'approved' | 'rejected';
  amount?: number;
  user?: {
    name: string;
    avatar?: string;
  };
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

interface RecentActivityFeedProps {
  contributions: any[];
  claims: any[];
  isAdmin?: boolean;
}

export function RecentActivityFeed({ contributions, claims, isAdmin = false }: RecentActivityFeedProps) {
  // Generate activity items from real data
  const generateActivities = (): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    // Add recent contributions
    contributions.slice(0, 3).forEach((contrib, index) => {
      activities.push({
        id: `contrib-${contrib.id}`,
        type: 'contribution',
        title: 'New Contribution',
        description: `RM ${contrib.amount?.toLocaleString() || 0} contributed to ${contrib.program?.name || 'khairat program'}`,
        timestamp: contrib.contributed_at,
        status: contrib.status === 'completed' ? 'completed' : 'pending',
        amount: contrib.amount,
        icon: DollarSign,
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
      });
    });

    // Add recent claims
    claims.slice(0, 2).forEach((claim, index) => {
      activities.push({
        id: `claim-${claim.id}`,
        type: 'claim',
        title: 'New Claim Submitted',
        description: `Claim for RM ${claim.amount?.toLocaleString() || 0} - ${claim.reason || 'Medical assistance'}`,
        timestamp: claim.created_at,
        status: claim.status,
        amount: claim.amount,
        user: {
          name: claim.applicant_name || 'Anonymous',
        },
        icon: FileText,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      });
    });

    // Add mock activities for demonstration
    if (activities.length < 5) {
      activities.push({
        id: 'member-1',
        type: 'member',
        title: 'New Kariah Member',
        description: 'Ahmad bin Ali joined as a kariah member',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'approved',
        user: {
          name: 'Ahmad bin Ali',
        },
        icon: UserPlus,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      });

      activities.push({
        id: 'program-1',
        type: 'program',
        title: 'New Khairat Program',
        description: 'Emergency Medical Fund program created',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
        icon: Heart,
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
      });
    }

    // Sort by timestamp (most recent first)
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);
  };

  const activities = generateActivities();

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="h-3 w-3 text-red-600" />;
      default:
        return <Activity className="h-3 w-3 text-gray-600" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-blue-600" />
          Recent Activity
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Latest updates and activities in your {isAdmin ? 'mosque' : 'account'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                No recent activity
              </h3>
              <p className="text-xs text-muted-foreground">
                Activities will appear here as they happen
              </p>
            </div>
          ) : (
            activities.map((activity) => {
              const IconComponent = activity.icon;
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                    <IconComponent className={`h-4 w-4 ${activity.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm text-foreground">
                        {activity.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        {activity.status && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-2 py-0 ${getStatusColor(activity.status)}`}
                          >
                            {activity.status}
                          </Badge>
                        )}
                        {getStatusIcon(activity.status)}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {activity.user && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={activity.user.avatar} />
                              <AvatarFallback className="text-xs">
                                {activity.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {activity.user.name}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {activity.amount && (
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            RM {activity.amount.toLocaleString()}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {activities.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Link href={isAdmin ? '/dashboard' : '/my-mosques'}>
              <Button variant="outline" size="sm" className="w-full">
                View All Activity
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
