'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Building, ArrowRight } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

export function MosqueSetupBanner() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const { isAdmin, mosqueId, loading } = useUserRole();

  // Only show if user is admin but doesn't have a mosque
  if (loading || !isAdmin || mosqueId) {
    return null;
  }

  return (
    <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
      <Building className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      <AlertDescription className="text-emerald-900 dark:text-emerald-100 !grid-cols-1 !justify-items-stretch">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
          <div className="flex-1 min-w-0">
            <p className="font-medium mb-1">
              {t('mosqueSetupRequired') || 'Mosque Profile Setup Required'}
            </p>
            <p className="text-sm">
              {t('mosqueSetupRequiredDescription') || 
               'You need to set up your mosque profile to use this feature. Complete your mosque registration to get started.'}
            </p>
          </div>
          <Button 
            size="sm" 
            onClick={() => router.push('/onboarding')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 ml-auto sm:ml-0"
          >
            {t('setupMosqueProfile') || 'Setup Mosque Profile'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
