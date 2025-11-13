'use client';

import {
  Calendar,
  Home,
  Settings,
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

const getNavigation = (hasAdminAccess: boolean, t: any, locale: string) => {
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
      name: t('khairat'),
      href: '/khairat',
      icon: HandHeart,
    });
    // Claims are now managed inside Khairat page tabs
    baseNavigation.push({
      name: t('mosqueProfile'),
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

    // Only include Contributions if enabled for regular users
    if (FEATURES.CONTRIBUTIONS_ENABLED) {
      baseNavigation.push({
        name: t('contributions'),
        href: '/khairat',
        icon: HandHeart,
      });
    }

    // Khairat page is not available to regular users
    // Kariah applications are now handled through My Mosques page

    // Claims are now managed inside Khairat page tabs

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

  const navigation = getNavigation(hasAdminAccess, t, locale);

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
                src={mosque?.logo_url || '/icon-kariah-masjid.png'}
                alt={
                  mosque?.name ? `${mosque.name} Logo` : 'Kariah Masjid Logo'
                }
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {mosqueLoading ? '...' : mosque?.name || 'Kariah Masjid'}
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

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>{t('system')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminLoading ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <span className="flex items-center gap-2">
                      <div className="size-4 bg-sidebar-accent rounded animate-pulse" />
                      <div className="h-4 w-16 bg-sidebar-accent rounded animate-pulse" />
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.includes('/settings')}
                    tooltip="Settings"
                    className={pathname.includes('/settings') ? "bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 font-medium shadow-xs backdrop-blur-sm" : ""}
                  >
                    <Link href="/settings">
                      <span className="flex items-center gap-2">
                        <Settings className="size-4" />
                        <span>{t('settings')}</span>
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
                  <DropdownMenuItem asChild className="gap-2">
                    <Link href="/settings">
                      <Settings className="h-4 w-4" />
                      <span>{t('settings')}</span>
                    </Link>
                  </DropdownMenuItem>
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
