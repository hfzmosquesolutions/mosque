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
  Building2,
  FileText,
  Settings,
  Calendar,
  MapPin,
  Award,
  DollarSign,
  UserCheck,
  TrendingUp,
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

interface AdminGettingStartedProps {
  mosqueId: string | null;
  totalMembers: number;
  totalContributions: number;
  totalClaims: number;
  hasMosqueProfile: boolean;
  hasCreatedProgram: boolean;
  hasPendingApplications: boolean;
}

export function AdminGettingStarted({ 
  mosqueId,
  totalMembers,
  totalContributions,
  totalClaims,
  hasMosqueProfile = false,
  hasCreatedProgram = false,
  hasPendingApplications = false
}: AdminGettingStartedProps) {
  
  const steps: Step[] = [
    {
      id: 'setup-mosque-profile',
      title: 'Setup Mosque Profile',
      description: 'Complete your mosque information and settings',
      icon: Building2,
      href: '/mosque-profile',
      completed: hasMosqueProfile,
      priority: 'high',
    },
    {
      id: 'create-khairat-program',
      title: 'Create Khairat Program',
      description: 'Set up your first khairat program for the community',
      icon: Heart,
      href: '/khairat',
      completed: hasCreatedProgram,
      priority: 'high',
    },
    {
      id: 'manage-claims',
      title: 'Manage Khairat Claims',
      description: 'Review and process khairat claims from members',
      icon: FileText,
      href: '/khairat?tab=claims',
      completed: totalClaims === 0, // If no claims, consider it "completed" for now
      priority: 'medium',
    },
    {
      id: 'setup-payments',
      title: 'Configure Payment Settings',
      description: 'Set up payment providers and billing settings',
      icon: Settings,
      href: '/settings',
      completed: false, // This would need to be tracked
      priority: 'medium',
    },
    // events removed
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
        return 'Critical';
      case 'medium':
        return 'Important';
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
            Admin Setup Guide
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {completedSteps}/{totalSteps} completed
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Complete these steps to fully set up your mosque management system
        </p>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Setup Progress</span>
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
                        Setup
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
              <span className="font-medium text-sm">Excellent! Your mosque management system is fully set up.</span>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
              You're now ready to serve your community effectively!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
