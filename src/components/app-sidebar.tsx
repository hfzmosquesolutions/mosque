'use client';

import {
  Calendar,
  Home,
  HandHeart,
  User,
  Building,
  LogOut,
  ChevronUp,
  User2,
  Users,
  UserPlus,
  Database,
  FileText,
  CreditCard,
  UserCheck,
  ExternalLink,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAdminAccess, useUserMosque } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { RUNTIME_FEATURES, FEATURES } from '@/lib/utils';
import { getMosque } from '@/lib/api';
import { useState, useEffect } from 'react';
import type { Mosque } from '@/types/database';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const getNavigation = (hasAdminAccess: boolean, t: any, locale: string, mosqueId?: string | null) => {
  const baseNavigation = [
    {
      name: t('dashboard'),
      href: '/dashboard',
      icon: Home,
    },
  ];

  // For admin users, only show the core features
  if (hasAdminAccess) {
    baseNavigation.push({
      name: t('members'),
      href: '/members',
      icon: FileText,
    });
    baseNavigation.push({
      name: t('payments'),
      href: '/payments',
      icon: CreditCard,
    });
    baseNavigation.push({
      name: t('paymentSettings'),
      href: '/payment-settings',
      icon: Settings,
    });
    baseNavigation.push({
      name: t('claims.title'),
      href: '/claims',
      icon: FileText,
    });
    // Legacy data page hidden for now
    // baseNavigation.push({
    //   name: t('legacyData'),
    //   href: '/legacy',
    //   icon: Database,
    // });
    baseNavigation.push({
      name: t('mosquePage'),
      href: '/mosque-profile',
      icon: Building,
    });
  } else {
    // For regular users, show community features
    // Events removed

    // Show My Mosques (user version)
    baseNavigation.push({
      name: t('myMosques'),
      href: '/my-mosques',
      icon: HandHeart,
    });

    // Payment History for regular users
    baseNavigation.push({
      name: t('paymentHistory'),
      href: '/payments',
      icon: CreditCard,
    });

    // Claims for regular users
    baseNavigation.push({
      name: t('claims.title'),
      href: '/claims',
      icon: FileText,
    });

    // Khairat page is not available to regular users
    // Kariah applications are now handled through My Mosques page

    // Dependents management for regular users only
    baseNavigation.push({
      name: t('dependents'),
      href: '/dependents',
      icon: Users,
    });

    // Only show personal Profile link for non-admin (normal) users
    baseNavigation.push({
      name: t('profile'),
      href: '/profile',
      icon: User,
    });
  }

  // Add billing link only for admin users
  if (hasAdminAccess) {
    baseNavigation.push({
      name: t('billing'),
      href: '/billing',
      icon: CreditCard,
    });
  }

  return baseNavigation;
};

export function AppSidebar() {
  const pathname = usePathname();
  const { hasAdminAccess, loading: adminLoading } = useAdminAccess();
  const { mosqueId } = useUserMosque();
  const { user, signOut } = useAuth();
  const t = useTranslations('sidebar');
  const locale = useLocale();
  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [mosqueLoading, setMosqueLoading] = useState(false);

  const navigation = getNavigation(hasAdminAccess, t, locale, mosqueId);

  // Fetch mosque data when mosqueId is available
  useEffect(() => {
    async function fetchMosqueData() {
      if (!mosqueId) {
        setMosque(null);
        return;
      }

      try {
        setMosqueLoading(true);
        const response = await getMosque(mosqueId);
        if (response.success && response.data) {
          setMosque(response.data);
        }
      } catch (error) {
        console.error('Error fetching mosque data:', error);
      } finally {
        setMosqueLoading(false);
      }
    }

    fetchMosqueData();
  }, [mosqueId]);

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <Link href="/" className="block">
          <div className="flex items-center gap-2 px-2 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors cursor-pointer">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
              <Image
                src={mosque?.logo_url || '/icon-khairatkita.png'}
                alt={
                  mosque?.name ? `${mosque.name} Logo` : 'khairatkita Logo'
                }
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {mosqueLoading ? '...' : mosque?.name || 'khairatkita'}
              </span>
              <span className="truncate text-xs text-sidebar-foreground/70">
                {adminLoading
                  ? '...'
                  : hasAdminAccess
                  ? t('administrator')
                  : t('member')}
              </span>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('navigation')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminLoading
                ? // Show skeleton loading state
                  Array.from({ length: 3 }).map((_, index) => (
                    <SidebarMenuItem key={`skeleton-${index}`}>
                      <SidebarMenuButton disabled>
                        <span className="flex items-center gap-2">
                          <div className="size-4 bg-sidebar-accent rounded animate-pulse" />
                          <div className="h-4 w-20 bg-sidebar-accent rounded animate-pulse" />
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                : navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.includes(item.href);

                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.name}
                          className={isActive ? "bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 font-medium shadow-xs backdrop-blur-sm" : ""}
                        >
                          <Link href={item.href}>
                            <span className="flex items-center gap-2">
                              <Icon className="size-4" />
                              <span>{item.name}</span>
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Mosque Public Page Preview Card - Only for admins */}
        {hasAdminAccess && mosqueId && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 mb-2">
              {t('publicPage')}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {mosqueLoading ? (
                <div className="relative rounded-xl overflow-hidden border border-sidebar-border min-h-[140px] bg-sidebar-accent animate-pulse">
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60"></div>
                  <div className="relative p-5 flex flex-col gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-white/20 rounded"></div>
                      <div className="h-3 w-24 bg-white/20 rounded"></div>
                    </div>
                  </div>
                </div>
              ) : mosque ? (
                <Link 
                  href={`/${locale}/mosques/${mosqueId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group/mosque-card"
                >
                  <div
                    className="relative rounded-xl overflow-hidden border border-sidebar-border/50 bg-sidebar-accent/50 hover:border-sidebar-accent hover:shadow-lg hover:shadow-black/10 transition-all duration-300 ease-out cursor-pointer group-hover/mosque-card:scale-[1.02]"
                    style={{
                      backgroundImage: mosque.banner_url
                        ? `url(${mosque.banner_url})`
                        : 'linear-gradient(135deg, rgb(16, 185, 129) 0%, rgb(34, 197, 94) 50%, rgb(5, 150, 105) 100%)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      minHeight: '140px',
                    }}
                  >
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70 group-hover/mosque-card:from-black/60 group-hover/mosque-card:via-black/50 group-hover/mosque-card:to-black/80 transition-all duration-300"></div>
                    
                    {/* Content */}
                    <div className="relative p-5 flex flex-col gap-4">
                      {/* Logo with better styling */}
                      <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-xl shadow-xl flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-white/40 group-hover/mosque-card:ring-white/60 transition-all duration-300 group-hover/mosque-card:scale-105">
                        {mosque.logo_url ? (
                          <Image
                            src={mosque.logo_url}
                            alt={`${mosque.name} logo`}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building className="h-7 w-7 text-emerald-600" />
                        )}
                      </div>
                      
                      {/* Mosque Name and Action */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold leading-snug text-white drop-shadow-md line-clamp-2 group-hover/mosque-card:text-white transition-colors">
                          {mosque.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-medium text-white/95 group-hover/mosque-card:text-white transition-colors">
                          <ExternalLink className="h-3.5 w-3.5 group-hover/mosque-card:translate-x-0.5 group-hover/mosque-card:-translate-y-0.5 transition-transform duration-300" />
                          <span>{t('viewPublicPage')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : null}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {adminLoading ? (
              <SidebarMenuButton size="lg" disabled>
                <div className="h-8 w-8 rounded-lg bg-sidebar-accent animate-pulse" />
                <div className="grid flex-1 text-left text-sm leading-tight gap-1">
                  <div className="h-4 w-20 bg-sidebar-accent rounded animate-pulse" />
                  <div className="h-3 w-24 bg-sidebar-accent rounded animate-pulse" />
                </div>
                <div className="ml-auto size-4 bg-sidebar-accent rounded animate-pulse" />
              </SidebarMenuButton>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                        <User2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.email?.split('@')[0] || 'User'}
                      </span>
                      <span className="truncate text-xs text-sidebar-foreground/70">
                        {user?.email || ''}
                      </span>
                    </div>
                    <ChevronUp className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuItem
                    onClick={signOut}
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('signOut')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
