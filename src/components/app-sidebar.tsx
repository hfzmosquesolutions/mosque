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
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAdminAccess } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { RUNTIME_FEATURES, FEATURES } from '@/lib/utils';
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

const getNavigation = (hasAdminAccess: boolean, t: any) => {
  const baseNavigation = [
    {
      name: t('dashboard'),
      href: '/dashboard',
      icon: Home,
    },
  ];

  // For admin users, only show the three core features
  if (hasAdminAccess) {
    baseNavigation.push({
      name: t('khairat'),
      href: '/khairat',
      icon: HandHeart,
    });
    baseNavigation.push({
      name: t('mosqueProfile'),
      href: '/mosque-profile',
      icon: Building,
    });
  } else {
    // For regular users, show community features
    if (RUNTIME_FEATURES.EVENTS_VISIBLE) {
      baseNavigation.push({
        name: t('events'),
        href: '/events',
        icon: Calendar,
      });
    }

    // Only include Contributions if enabled for regular users
    if (FEATURES.CONTRIBUTIONS_ENABLED) {
      baseNavigation.push({
        name: t('contributions'),
        href: '/contributions',
        icon: HandHeart,
      });
    }

    // Dedicated Khairat page for regular users
    baseNavigation.push({
      name: t('khairat'),
      href: '/khairat',
      icon: HandHeart,
    });

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

  return baseNavigation;
};

export function AppSidebar() {
  const pathname = usePathname();
  const { hasAdminAccess } = useAdminAccess();
  const { user, signOut } = useAuth();
  const t = useTranslations('sidebar');

  const navigation = getNavigation(hasAdminAccess, t);

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <Link href="/" className="block">
          <div className="flex items-center gap-2 px-2 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors cursor-pointer">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-600 text-sidebar-primary-foreground">
              <Building className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Mosque Admin</span>
              <span className="truncate text-xs text-sidebar-foreground/70">
                {hasAdminAccess ? 'Administrator' : 'Member'}
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
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
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
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/settings'}
                  tooltip="Settings"
                >
                  <Link href="settings">
                    <span className="flex items-center gap-2">
                      <Settings className="size-4" />
                      <span>{t('settings')}</span>
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
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
                  <Link href="settings">
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
