'use client';

import { Building, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface KhairatLoadingHeaderProps {
  locale: string;
  mosqueId: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  backButtonText?: string;
}

export function KhairatLoadingHeader({ 
  locale, 
  mosqueId, 
  title, 
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-green-50 dark:bg-green-950/20',
  iconColor = 'text-green-600 dark:text-green-400',
  backButtonText,
}: KhairatLoadingHeaderProps) {
  return (
    <>
      {/* Loading Header Skeleton */}
      <div className="relative w-full h-48 sm:h-56 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 animate-pulse">
        <div className="relative h-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex items-center justify-center">
              <Building className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Page Header Section */}
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-4">
        <div className="mb-6">
          <Link href={`/${locale}/mosques/${mosqueId}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {backButtonText || 'Back to Mosque'}
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            {Icon && (
              <div className={`p-2 ${iconBgColor} rounded-lg`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
              </div>
            )}
            <div className="flex-1">
              <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-2"></div>
              {subtitle && (
                <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

