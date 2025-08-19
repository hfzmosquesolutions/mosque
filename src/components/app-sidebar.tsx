'use client';

import { Calendar, Home, Settings, HandHeart, User, Building, LogOut, ChevronUp, User2, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAccess } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { FEATURES } from '@/lib/utils';
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

const getNavigation = (hasAdminAccess: boolean) => {
  const baseNavigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
  ];

  // For admin users, only show the three core features
  if (hasAdminAccess) {
    baseNavigation.push({
      name: 'Khairat',
      href: '/khairat',
      icon: HandHeart,
    });
    baseNavigation.push({
      name: 'Mosque Profile',
      href: '/mosque-profile',
      icon: Building,
    });
  } else {
    // For regular users, show community features
    if (FEATURES.EVENTS_ENABLED) {
      baseNavigation.push({
        name: 'Events',
        href: '/events',
        icon: Calendar,
      });
    }

    // Only include Contributions if enabled for regular users
    if (FEATURES.CONTRIBUTIONS_ENABLED) {
      baseNavigation.push({
        name: 'Contributions',
        href: '/contributions',
        icon: HandHeart,
      });
    }

    // Dedicated Khairat page for regular users
    baseNavigation.push({
      name: 'Khairat',
      href: '/khairat',
      icon: HandHeart,
    });

    // Dependents management for regular users only
    baseNavigation.push({
      name: 'Dependents',
      href: '/dependents',
      icon: Users,
    });

    // Only show personal Profile link for non-admin (normal) users
    baseNavigation.push({
      name: 'Profile',
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

  const navigation = getNavigation(hasAdminAccess);

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
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
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                      <Link href={item.href}>
                        <Icon className="size-4" />
                        <span>{item.name}</span>
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
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/settings'} tooltip="Settings">
                  <Link href="/settings">
                    <Settings className="size-4" />
                    <span>Settings</span>
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
                <DropdownMenuItem onClick={signOut} className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20">
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}