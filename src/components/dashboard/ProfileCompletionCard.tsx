'use client';

import { useAuthState } from '@/hooks/useAuth.v2';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  getProfileCompletionPercentage,
  getMissingProfileFields,
} from '@/utils/profileUtils';
import { User, Settings } from 'lucide-react';
import Link from 'next/link';

export function ProfileCompletionCard() {
  const { profile } = useAuthState();
  const { t } = useLanguage();

  if (!profile) return null;

  const completionPercentage = getProfileCompletionPercentage(profile);
  const missingFields = getMissingProfileFields(profile);

  // Don't show if profile is already complete
  if (completionPercentage >= 100) return null;

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <User className="h-5 w-5" />
          Complete Your Profile
        </CardTitle>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          {completionPercentage}% complete - Help us serve you better by
          completing your profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress value={completionPercentage} className="h-2" />

          {missingFields.length > 0 && (
            <div>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                Missing information:
              </p>
              <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-1 mb-4">
                {missingFields.map((field) => (
                  <li key={field}>
                    •{' '}
                    {field
                      .replace('_', ' ')
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Link href="/onboarding">Complete Profile</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <Link href="/account">
                <Settings className="h-4 w-4 mr-1" />
                Account Settings
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
