'use client';

import { Building, ArrowLeft, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Mosque } from '@/types/database';
import { useTranslations } from 'next-intl';

interface KhairatStandardHeaderProps {
  mosque: Mosque | null;
  locale: string;
  mosqueId: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  backButtonText?: string;
}

export function KhairatStandardHeader({ 
  mosque, 
  locale, 
  mosqueId, 
  title, 
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-green-50 dark:bg-green-950/20',
  iconColor = 'text-green-600 dark:text-green-400',
  backButtonText,
}: KhairatStandardHeaderProps) {
  const tKhairat = useTranslations('khairat');
  const backText = backButtonText || tKhairat('payPage.backToMosque') || 'Back to Mosque';

  return (
    <>
      {/* Hero Header with Mosque Branding */}
      {mosque && (
        <div
          className="relative w-full h-48 sm:h-56"
          style={{
            backgroundImage: mosque.banner_url
              ? `url(${mosque.banner_url})`
              : 'linear-gradient(135deg, rgb(16, 185, 129) 0%, rgb(34, 197, 94) 50%, rgb(5, 150, 105) 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60"></div>
          <div className="relative h-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4 text-center">
              {/* Logo */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex items-center justify-center overflow-hidden ring-2 ring-white/20">
                {mosque.logo_url ? (
                  <img
                    src={mosque.logo_url}
                    alt={`${mosque.name} logo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" />
                )}
              </div>
              {/* Mosque Name */}
              <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">
                {mosque.name}
              </h1>
            </div>
          </div>
        </div>
      )}
      
      {/* Page Header Section */}
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-4">
        <div className="mb-6">
          <Link href={`/${locale}/mosques/${mosqueId}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {backText}
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            {Icon && (
              <div className={`p-2 ${iconBgColor} rounded-lg`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
              </div>
            )}
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
              {subtitle && (
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

