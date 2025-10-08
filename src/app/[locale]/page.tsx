'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  Users,
  Calendar,
  Heart,
  CheckCircle,
  ArrowRight,
  Star,
  Shield,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  Search,
} from 'lucide-react';
import { getAllMosques } from '@/lib/api';
import { Mosque } from '@/types/database';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [filteredMosques, setFilteredMosques] = useState<Mosque[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const featuredMosques = useMemo(() => filteredMosques.slice(0, 6), [filteredMosques]);

  useEffect(() => {
    const fetchMosques = async () => {
      try {
        setLoading(true);
        const response = await getAllMosques();
        if (response.success && response.data) {
          setMosques(response.data);
          setFilteredMosques(response.data);
        } else {
          setError(response.error || 'Error loading mosques');
        }
      } catch (e) {
        setError('Error loading mosques');
      } finally {
        setLoading(false);
      }
    };
    fetchMosques();
  }, []);

  // Keep featured list static on homepage; searching redirects to listing page

  // (Removed popular searches feature)

  // Standard service categories for quick filtering
  const serviceCategories: Array<{ label: string; keyword: string; icon: React.ComponentType<{ className?: string }> }> = [
    { label: 'Khairat (Welfare Assistance)', keyword: 'khairat', icon: Heart },
    { label: 'Friday Prayer (Jumuah)', keyword: 'friday', icon: Users },
    { label: 'Classes & Education', keyword: 'class education', icon: Calendar },
    { label: 'Community Events', keyword: 'event program', icon: Calendar },
    { label: 'Donations & Infaq', keyword: 'donation infaq sadaqah', icon: CheckCircle },
    { label: 'Marriage/Nikah Services', keyword: 'nikah marriage', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-emerald-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.15] blur-3xl">
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-emerald-300/40" />
          <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-teal-300/40" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-18">
          <div className="max-w-3xl text-left">
            {/* <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-emerald-200/50 dark:border-emerald-800 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/20 transition cursor-pointer"
            >
              <span>Add your mosque</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link> */}
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Mosque services made simple
            </h1>
            <p className="mt-2 text-base md:text-lg text-slate-600 dark:text-slate-400">
              Find mosques, events, classes, and more
            </p>
          </div>
          <div className="mt-8 mx-auto max-w-7xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
              const query = (searchQuery || '').trim();
              const base = `/${locale}/mosques`;
              const url = query ? `${base}?q=${encodeURIComponent(query)}` : base;
                if (typeof window !== 'undefined') {
                  window.open(url, '_blank', 'noopener,noreferrer');
                }
              }}
              role="search"
              aria-labelledby="search-label"
            >
              <label id="search-label" htmlFor="hero-search" className="sr-only">Search mosques and services</label>
              <div className="relative" ref={searchContainerRef}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder={"Search by mosque, location, or service..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={(e) => {
                    // Close only if clicking outside the container
                    requestAnimationFrame(() => {
                      if (!searchContainerRef.current?.contains(document.activeElement)) {
                        setIsSearchFocused(false);
                      }
                    });
                  }}
                  id="hero-search"
                  name="q"
                  autoComplete="off"
                  className="pr-32 h-14 text-lg bg-white shadow-sm dark:bg-slate-800/90 backdrop-blur border-slate-200 dark:border-slate-700"
                />
                <Button
                  type="submit"
                  variant="default"
                  aria-label="Search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-md flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </Button>

                {/* Live suggestions dropdown */}
                {isSearchFocused && searchQuery.trim().length > 0 && (
                  <div className="absolute z-50 mt-2 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
                    <ul className="max-h-72 overflow-auto py-1">
                      {mosques
                        .filter((m) => {
                          const q = searchQuery.toLowerCase();
                          return (
                            m.name.toLowerCase().includes(q) ||
                            (m.address || '').toLowerCase().includes(q) ||
                            (m.description || '').toLowerCase().includes(q)
                          );
                        })
                        .slice(0, 8)
                        .map((m) => (
                          <li key={m.id}>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 focus:bg-slate-50 dark:focus:bg-slate-700/60 focus:outline-none"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setIsSearchFocused(false);
                                const path = `/${locale}/mosques/${m.id}`;
                                if (typeof window !== 'undefined') {
                                  window.open(path, '_blank', 'noopener,noreferrer');
                                }
                              }}
                            >
                              <div className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{m.name}</div>
                              {m.address && (
                                <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{m.address}</div>
                              )}
                            </button>
                          </li>
                        ))}
                      {mosques.filter((m) => {
                        const q = searchQuery.toLowerCase();
                        return (
                          m.name.toLowerCase().includes(q) ||
                          (m.address || '').toLowerCase().includes(q) ||
                          (m.description || '').toLowerCase().includes(q)
                        );
                      }).length === 0 && (
                        <li className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">No matches found</li>
                      )}
                    </ul>
                    <div className="border-t border-slate-200 dark:border-slate-700">
                      <button
                        type="submit"
                        className="w-full px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-left"
                      >
                        Search all results for "{searchQuery.trim()}"
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
            {/* Popular searches removed */}
          </div>

          {/* Explore Services moved under search for compact layout */}
          <nav className="mt-6" aria-label="Quick actions">
            <div className="flex justify-end mb-3">
              <Link href={`/${locale}/mosques`} className="text-xs sm:text-sm text-emerald-700 hover:underline dark:text-emerald-300">See all</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {/* Khairat */}
              <Link href={`/${locale}/mosques?q=khairat`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <span className="rounded-full p-1.5 bg-purple-50 text-purple-600 dark:bg-purple-900/30">
                  <Heart className="h-4 w-4" />
                </span>
                <span className="font-medium">Apply for khairat</span>
              </Link>
              {/* Events */}
              <Link href={`/${locale}/mosques?q=event`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <span className="rounded-full p-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30">
                  <Calendar className="h-4 w-4" />
                </span>
                <span className="font-medium">Browse events</span>
              </Link>
              {/* Classes */}
              <Link href={`/${locale}/mosques?q=class`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <span className="rounded-full p-1.5 bg-amber-50 text-amber-600 dark:bg-amber-900/30">
                  <Users className="h-4 w-4" />
                </span>
                <span className="font-medium">Find classes</span>
              </Link>
              {/* Donations */}
              <Link href={`/${locale}/mosques?q=donation`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <span className="rounded-full p-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
                  <CheckCircle className="h-4 w-4" />
                </span>
                <span className="font-medium">Donate</span>
              </Link>
              {/* Marriage */}
              <Link href={`/${locale}/mosques?q=nikah`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <span className="rounded-full p-1.5 bg-rose-50 text-rose-600 dark:bg-rose-900/30">
                  <Building2 className="h-4 w-4" />
                </span>
                <span className="font-medium">Book nikah</span>
              </Link>
              {/* Friday Prayer */}
              <Link href={`/${locale}/mosques?q=jumuah`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <span className="rounded-full p-1.5 bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30">
                  <Users className="h-4 w-4" />
                </span>
                <span className="font-medium">Find Jumuah</span>
              </Link>
            </div>
          </nav>
        </div>
      </section>

      {/* Trending Searches removed */}

      {/* Results Section */}
      <div className="bg-white dark:bg-slate-900">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12" aria-labelledby="find-mosques-heading">
        <h2 id="find-mosques-heading" className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">Featured mosque</h2>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <Star className="h-4 w-4 text-yellow-500" />
            <span>Verified listings</span>
          </div>
          <div className="text-sm text-slate-500">
            {loading ? 'Loading...' : `${featuredMosques.length} featured`}
          </div>
        </div>

        {error ? (
          <Card>
            <CardContent className="py-10 text-center">
              <div className="text-red-500 mb-2">⚠️</div>
              <p className="text-sm text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        ) : filteredMosques.length === 0 && !loading ? (
          <Card className="bg-white dark:bg-slate-900/40">
            <CardContent className="py-12 text-center">
              <p className="text-slate-600 dark:text-slate-400">No results. Try different keywords like "events", "khairat" or a city.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(loading ? Array<Mosque | null>(6).fill(null) : featuredMosques).map((mosque: Mosque | null, idx) => (
              <Card
                key={mosque ? mosque.id : idx}
                className="transition-all hover:shadow-md bg-white/90 dark:bg-slate-800 border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer p-0"
                onClick={() => {
                  if (mosque) {
                    const path = `/mosques/${mosque.id}`;
                    if (typeof window !== 'undefined') {
                      window.open(path, '_blank', 'noopener,noreferrer');
                    } else {
                      router.push(path);
                    }
                  }
                }}
              >
                {mosque ? (
                  <div className="w-full h-40 bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <Image
                      src={(mosque.banner_url || mosque.logo_url || '/window.svg') as string}
                      alt={mosque.name}
                      width={800}
                      height={320}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-slate-100 dark:bg-slate-700 animate-pulse" />
                )}
                <CardHeader className="px-4 md:px-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        {mosque ? (
                          <div className="h-9 w-9 rounded-full overflow-hidden bg-white border border-slate-200 dark:border-slate-700">
                            <Image
                              src={(mosque.logo_url || '/icon-kariah-masjid.png') as string}
                              alt={`${mosque.name} logo`}
                              width={36}
                              height={36}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse" />
                        )}
                        <CardTitle className="text-lg">
                          {mosque ? mosque.name : '‎'}
                        </CardTitle>
                      </div>
                      {mosque?.address && (
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-emerald-600" />
                          <span className="line-clamp-1">{mosque.address}</span>
                        </div>
                      )}
                    </div>
                    
                  </div>
                </CardHeader>
                <CardContent className="px-4 md:px-5 pb-4 pt-0 space-y-3">
                  {mosque?.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {mosque.description}
                    </p>
                  )}
                  {mosque && (
                    <>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Prayer times</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>Community</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredMosques.length > 6 && (
          <div className="text-center mt-8">
            <Link href="/mosques">
              <Button variant="outline" className="gap-2">
                <Building2 className="h-4 w-4" /> Browse mosques
              </Button>
            </Link>
          </div>
        )}
      </section>
      </div>
      {/* How it works */}
      <section className="bg-emerald-50 dark:bg-slate-900/40 backdrop-blur-sm border-y border-emerald-100/60 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">How it works</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Find services in a few simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-slate-200/70 dark:border-slate-700/70">
              <CardHeader>
                <div className="text-emerald-600 text-sm font-semibold">Step 1</div>
                <CardTitle>Search</CardTitle>
                <CardDescription>Type a service, mosque name, or location.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-slate-200/70 dark:border-slate-700/70">
              <CardHeader>
                <div className="text-emerald-600 text-sm font-semibold">Step 2</div>
                <CardTitle>Compare</CardTitle>
                <CardDescription>Open listings to view details and contacts.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-slate-200/70 dark:border-slate-700/70">
              <CardHeader>
                <div className="text-emerald-600 text-sm font-semibold">Step 3</div>
                <CardTitle>Connect</CardTitle>
                <CardDescription>Apply, donate, or contact the mosque directly.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      
      {/* Testimonials/Stats Section */}
      {/* Add Your Mosque Section (moved below features) */}
      <section className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="rounded-xl bg-white dark:bg-slate-900 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-sm mb-2">
                  <Building2 className="h-4 w-4" />
                  <span>For mosque admins</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">Are you a mosque admin?</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">Create your mosque profile and list services like events, classes, khairat, nikah and more — all in one place.</p>
                <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> Manage listings and details</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> Accept donations online</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> Promote events and classes</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> Access anywhere, 24/7</li>
                </ul>
              </div>
              <div className="shrink-0 flex items-center gap-3">
                <Link href="/signup" aria-label="Create an account">
                  <Button className="gap-2">
                    <Building2 className="h-4 w-4" />
                    Get started
                  </Button>
                </Link>
                <Link href="/pricing" aria-label="See pricing for mosque admins" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">See pricing</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      
      <div className="bg-emerald-50 dark:bg-slate-900/40 backdrop-blur-sm border-y border-emerald-100/60 dark:border-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Why people choose us
            </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Clear design, accessible anywhere, and built for communities.
          </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="border-emerald-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
                </div>
                <CardTitle className="text-base">Fast and simple</CardTitle>
                <CardDescription>Streamlined experience with minimal clicks.</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-emerald-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                </div>
                <CardTitle className="text-base">Access anywhere, 24/7</CardTitle>
                <CardDescription>Works great on desktop and mobile.</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-emerald-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                </div>
                <CardTitle className="text-base">Easy access to mosque services</CardTitle>
                <CardDescription>Find, apply, and connect in minutes.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
      {/* Call to Action (Seekers and Providers) */}
      <div className="bg-emerald-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Ready to get started?</h2>
          <p className="text-emerald-100 mb-8 max-w-2xl mx-auto">Find mosques near you or list your mosque in minutes.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Go to dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Get started for free
                </Button>
              </Link>
            )}
            <Link href="/mosques">
              <Button size="lg" className="bg-white/10 text-white hover:bg-white/20 border border-white/40">
                <Building2 className="mr-2 h-5 w-5" />
                Explore mosques
              </Button>
            </Link>
            
          </div>
          
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Image
                src="/logo-kariah-masjid.png"
                alt="Kariah Masjid Logo"
                width={128}
                height={32}
                className="rounded-md"
              />
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              A modern platform for mosque communities, available 24/7.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
