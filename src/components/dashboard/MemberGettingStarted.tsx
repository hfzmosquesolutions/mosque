'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Circle,
  ArrowRight,
  Heart,
  Users,
  UserPlus,
  Calendar,
  MapPin,
  Award,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface MemberGettingStartedProps {
  totalContributed: number;
  dependentsCount: number;
  contributionsCount: number;
  hasAppliedForKariah: boolean;
}

export function MemberGettingStarted({ 
  totalContributed, 
  dependentsCount, 
  contributionsCount,
  hasAppliedForKariah = false 
}: MemberGettingStartedProps) {
  
  const steps: Step[] = [
    {
      id: 'first-contribution',
      title: 'Make Your First Contribution',
      description: 'Start supporting your community with a khairat contribution',
      icon: Heart,
      href: '/khairat',
      completed: contributionsCount > 0,
      priority: 'high',
    },
    {
      id: 'add-dependents',
      title: 'Add Family Members',
      description: 'Register your dependents to extend khairat coverage',
      icon: UserPlus,
      href: '/dependents',
      completed: dependentsCount > 0,
      priority: 'high',
    },
    {
      id: 'apply-kariah',
      title: 'Register as Kariah Member',
      description: 'Join as a kariah member for exclusive benefits',
      icon: Award,
      href: '/my-mosques',
      completed: hasAppliedForKariah,
      priority: 'medium',
    },
    {
      id: 'explore-events',
      title: 'Join Mosque Events',
      description: 'Participate in community activities and events',
      icon: Calendar,
      href: '/events',
      completed: false, // This would need to be tracked
      priority: 'medium',
    },
    {
      id: 'find-mosques',
      title: 'Discover Local Mosques',
      description: 'Connect with other mosques in your area',
      icon: MapPin,
      href: '/mosques',
      completed: false, // This would need to be tracked
      priority: 'low',
    },
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
      case 'low':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Important';
      case 'medium':
        return 'Recommended';
      case 'low':
        return 'Optional';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            Getting Started
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {completedSteps}/{totalSteps} completed
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Complete these steps to get the most out of your mosque community
        </p>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                  step.completed 
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' 
                    : 'bg-card hover:bg-muted/50 border-border'
                }`}
              >
                {/* Step Number/Status */}
                <div className="flex-shrink-0">
                  {step.completed ? (
                    <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {index + 1}
                      </span>
                    </div>
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-medium text-sm ${
                      step.completed 
                        ? 'text-emerald-900 dark:text-emerald-100' 
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {step.title}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-0 ${getPriorityColor(step.priority)}`}
                    >
                      {getPriorityText(step.priority)}
                    </Badge>
                  </div>
                  <p className={`text-xs ${
                    step.completed 
                      ? 'text-emerald-700 dark:text-emerald-300' 
                      : 'text-muted-foreground'
                  }`}>
                    {step.description}
                  </p>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0">
                  {step.completed ? (
                    <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Completed
                    </Badge>
                  ) : (
                    <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                      <Link href={step.href} className="flex items-center gap-1">
                        Start
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion Message */}
        {completedSteps === totalSteps && (
          <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium text-sm">Congratulations! You've completed all the getting started steps.</span>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
              You're now fully engaged with your mosque community!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
