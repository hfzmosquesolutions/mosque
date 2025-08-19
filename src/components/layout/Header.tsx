'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { FEATURES } from '@/lib/utils';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User2 } from 'lucide-react';

export default function Header() {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Hide header on internal pages that have sidebar
  const internalPages = [
    '/dashboard',
    '/khairat',
    '/mosque-profile',
    '/settings',
    '/events',
    '/contributions',
    '/profile',
    '/dependents',
  ];

  const isInternalPage = internalPages.some((page) =>
    pathname.startsWith(page)
  );

  // Don't render header at all for internal pages
  if (isInternalPage) {
    return null;
  }

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-emerald-100 dark:border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Building2 className="h-8 w-8 text-emerald-600" />
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              MosqueConnect
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/mosques" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                    >
                      Browse Mosques
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                {user && (
                  <>
                    <NavigationMenuItem>
                      <Link href="/dashboard" legacyBehavior passHref>
                        <NavigationMenuLink
                          className={navigationMenuTriggerStyle()}
                        >
                          Dashboard
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                    {FEATURES.EVENTS_ENABLED && (
                      <NavigationMenuItem>
                        <Link href="/events" legacyBehavior passHref>
                          <NavigationMenuLink
                            className={navigationMenuTriggerStyle()}
                          >
                            Events
                          </NavigationMenuLink>
                        </Link>
                      </NavigationMenuItem>
                    )}
                  </>
                )}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Auth Section */}
            <div className="flex items-center gap-3">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 h-10"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30">
                          <User2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-slate-600 dark:text-slate-400 hidden lg:block">
                        {user.email?.split('@')[0] || 'User'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={signOut}
                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-emerald-100 dark:border-slate-700 py-4">
            <nav className="flex flex-col gap-2">
              <Link href="/mosques" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  Browse Mosques
                </Button>
              </Link>
              {user && (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                      Dashboard
                    </Button>
                  </Link>
                  {FEATURES.EVENTS_ENABLED && (
                    <Link
                      href="/events"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                      >
                        Events
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </nav>

            {/* Mobile Auth Section */}
            <div className="mt-4 pt-4 border-t border-emerald-100 dark:border-slate-700">
              {user ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-2 py-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30">
                        <User2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {user.email}
                    </span>
                  </div>
                  <Button
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" size="sm" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
