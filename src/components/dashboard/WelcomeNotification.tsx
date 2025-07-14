'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from '@/hooks/useAuth.v2';
import { useLanguage } from '@/contexts/LanguageContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, X } from 'lucide-react';

export function WelcomeNotification() {
  const { profile } = useAuthState();
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show welcome notification for users who just completed onboarding
    // We can check if this is a new profile by looking at recent updates
    if (profile && profile.full_name && profile.phone && profile.username) {
      const profileCreated = new Date(profile.created_at);
      const profileUpdated = new Date(profile.updated_at || profile.created_at);

      // Show welcome if profile was updated recently (within last hour)
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

      if (profileUpdated > hourAgo && profileUpdated > profileCreated) {
        setIsVisible(true);
      }
    }
  }, [profile]);

  if (!isVisible) return null;

  return (
    <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <span className="font-medium text-green-800 dark:text-green-200">
            Welcome to the Mosque Management System!
          </span>
          <span className="text-green-700 dark:text-green-300 ml-2">
            Your profile has been successfully set up. You can now access all
            features of the system.
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="text-green-600 hover:text-green-800 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-200 dark:hover:bg-green-900"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
