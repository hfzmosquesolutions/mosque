'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  Megaphone,
  Heart,
  BookOpen,
  Settings,
  Menu,
  X,
  HandHeart,
  User,
  Building,
} from 'lucide-react';
import { useState } from 'react';
import { useAdminAccess } from '@/hooks/useUserRole';

interface SidebarProps {
  className?: string;
}

const getNavigation = (hasAdminAccess: boolean) => {
  const baseNavigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
  ];

  // Add other navigation items
  baseNavigation.push(
    {
      name: 'Events',
      href: '/events',
      icon: Calendar,
    },

    // {
    //   name: 'Donations',
    //   href: '/donations',
    //   icon: Heart,
    // },

    {
      name: 'Contributions',
      href: '/contributions',
      icon: HandHeart,
    },
    // {
    //   name: 'Resources',
    //   href: '/resources',
    //   icon: BookOpen,
    // },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
    }
  );

  // Add admin-only navigation items
  if (hasAdminAccess) {
    baseNavigation.push({
      name: 'Mosque Profile',
      href: '/mosque-profile',
      icon: Building,
    });
  }

  // Add settings at the end
  baseNavigation.push({
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  });

  return baseNavigation;
};

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { hasAdminAccess } = useAdminAccess();

  const navigation = getNavigation(hasAdminAccess);

  return (
    <div
      className={cn(
        'flex flex-col h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Mosque Admin
          </h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3 h-10',
                  isCollapsed && 'justify-center px-2',
                  isActive &&
                    'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        {!isCollapsed && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Mosque Management System
          </div>
        )}
      </div>
    </div>
  );
}

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { hasAdminAccess } = useAdminAccess();

  const navigation = getNavigation(hasAdminAccess);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 h-8 w-8 p-0"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Mosque Admin
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                  >
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-3 h-10',
                        isActive &&
                          'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Mosque Management System
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
