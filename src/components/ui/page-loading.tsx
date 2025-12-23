'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PageLoadingProps {
  className?: string;
}

export function PageLoading({ className = '' }: PageLoadingProps) {
  const t = useTranslations('common');
  
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      </div>
    </div>
  );
}

