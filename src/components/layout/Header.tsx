'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Building2, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            <nav className="flex items-center gap-4">
              <Link href="/mosques">
                <Button
                  variant="ghost"
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  Browse Mosques
                </Button>
              </Link>
              {user && (
                <>
                  <Link href="/dashboard">
                    <Button
                      variant="ghost"
                      className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/events">
                    <Button
                      variant="ghost"
                      className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                      Events
                    </Button>
                  </Link>
                  <Link href="/donations">
                    <Button
                      variant="ghost"
                      className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                      Donations
                    </Button>
                  </Link>
                </>
              )}
            </nav>

            {/* Auth Section */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 dark:text-slate-400 hidden lg:block">
                    {user.email}
                  </span>
                  <Button onClick={signOut} variant="outline" size="sm">
                    Sign Out
                  </Button>
                </div>
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
                  <Link
                    href="/donations"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                      Donations
                    </Button>
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile Auth Section */}
            <div className="mt-4 pt-4 border-t border-emerald-100 dark:border-slate-700">
              {user ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400 px-3">
                    {user.email}
                  </p>
                  <Button
                    onClick={signOut}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    className="flex-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link
                    href="/signup"
                    className="flex-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      size="sm"
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
