'use client';

import { Building, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Mosque } from '@/types/database';

interface KhairatPageHeaderProps {
  mosque: Mosque | null;
  locale: string;
  mosqueId: string;
  title: string;
  subtitle?: string;
}

export function KhairatPageHeader({ 
  mosque, 
  locale, 
  mosqueId, 
  title, 
  subtitle 
}: KhairatPageHeaderProps) {
  return (
    <>
      {/* Hero Header with Background Image */}
      <div
        className="relative w-full h-48 sm:h-56 mb-8"
        style={{
          backgroundImage: mosque?.banner_url
            ? `url(${mosque.banner_url})`
            : 'linear-gradient(135deg, rgb(16, 185, 129) 0%, rgb(34, 197, 94) 50%, rgb(5, 150, 105) 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60"></div>
        
        {/* Content Container */}
        <div className="relative h-full max-w-4xl mx-auto px-4 sm:px-6 flex flex-col justify-end pb-6">
          {/* Back Button */}
          <div className="absolute top-4 left-4 sm:left-6">
            <Link href={`/${locale}/mosques/${mosqueId}`}>
              <Button 
                variant="ghost" 
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Mosque
              </Button>
            </Link>
          </div>

          {/* Logo and Mosque Info */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-white/20">
              {mosque?.logo_url ? (
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
            <div className="text-white min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold mb-1 leading-tight drop-shadow-lg">
                {mosque?.name || 'Mosque'}
              </h1>
              {subtitle && (
                <p className="text-sm sm:text-base text-white/90 drop-shadow-md">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Page Title Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-6 pt-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
      </div>
    </>
  );
}

