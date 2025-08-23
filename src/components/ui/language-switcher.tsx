'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { locales, type Locale } from '@/i18n';
import { Globe, Check } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact';
  className?: string;
}

const languageNames: Record<Locale, string> = {
  en: 'English',
  ms: 'Bahasa Malaysia',
};

export function LanguageSwitcher({
  variant = 'default',
  className = '',
}: LanguageSwitcherProps) {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;
  const pathname = usePathname();

  // Compute pathname without leading locale prefix so we can link to the same page in another locale
  const pathWithoutLocale = pathname.replace(/^\/(en|ms)(?=\/|$)/, '') || '/';

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={`w-[140px] ${className}`}>
            <Globe className="h-4 w-4 mr-2" />
            <span>{languageNames[locale]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {locales.map((loc) => (
            <DropdownMenuItem key={loc} asChild>
              <Link
                href={`/${loc}${pathWithoutLocale}`}
                className="flex items-center justify-between w-full"
              >
                <span>{languageNames[loc as Locale]}</span>
                {loc === locale && (
                  <Check className="h-4 w-4 text-emerald-600" />
                )}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium">{t('language')}</label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <Globe className="h-4 w-4 mr-2" />
            <span>{languageNames[locale]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-full">
          {locales.map((loc) => (
            <DropdownMenuItem key={loc} asChild>
              <Link
                href={`/${loc}${pathWithoutLocale}`}
                className="flex items-center justify-between w-full"
              >
                <span>{languageNames[loc as Locale]}</span>
                {loc === locale && (
                  <Check className="h-4 w-4 text-emerald-600" />
                )}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
