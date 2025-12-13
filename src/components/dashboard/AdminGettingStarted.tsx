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
import { useTranslations } from 'next-intl';

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
  hasMosqueProfile: boolean;
  hasPaymentSetup: boolean;
  applicationCount: number;
  contributionCount: number;
  claimCount: number;
}

export function AdminGettingStarted({ 
  hasMosqueProfile = false,
  hasPaymentSetup = false,
  applicationCount = 0,
  contributionCount = 0,
  claimCount = 0,
}: AdminGettingStartedProps) {
  const t = useTranslations('dashboard');

  const steps: Step[] = [
    {
      id: 'setup-mosque-profile',
      title: t('adminSetupSteps.setupMosqueProfile.title'),
      description: t('adminSetupSteps.setupMosqueProfile.description'),
      icon: Building2,
      href: '/mosque-profile',
      completed: hasMosqueProfile,
      priority: 'high',
    },
    {
      id: 'setup-payments',
      title: t('adminSetupSteps.setupPayments.title'),
      description: t('adminSetupSteps.setupPayments.description'),
      icon: Settings,
      href: '/payments?openModal=true',
      completed: hasPaymentSetup,
      priority: 'high',
    },
    {
      id: 'first-application',
      title: t('adminSetupSteps.firstApplication.title'),
      description: t('adminSetupSteps.firstApplication.description'),
      icon: Heart,
      href: '/mosque-profile?tab=khairat-applications',
      completed: applicationCount > 0,
      priority: 'medium',
    },
    {
      id: 'first-payment',
      title: t('adminSetupSteps.firstPayment.title'),
      description: t('adminSetupSteps.firstPayment.description'),
      icon: DollarSign,
      href: '/payments',
      completed: contributionCount > 0,
      priority: 'medium',
    },
    {
      id: 'first-claim',
      title: t('adminSetupSteps.firstClaim.title'),
      description: t('adminSetupSteps.firstClaim.description'),
      icon: FileText,
      href: '/claims',
      completed: claimCount > 0,
      priority: 'medium',
    },
    // events removed
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            {t('adminSetupGuideTitle')}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {t('stepsCompleted', { completed: completedSteps, total: totalSteps })}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('adminSetupGuideDescription')}
        </p>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>{t('setupProgress')}</span>
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
                      {t('stepStatus.completed')}
                    </Badge>
                  ) : (
                    <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                      <Link href={step.href} className="flex items-center gap-1">
                        {t('stepStatus.setupAction')}
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
              <span className="font-medium text-sm">{t('adminSetupCompletionTitle')}</span>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
              {t('adminSetupCompletionDescription')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
