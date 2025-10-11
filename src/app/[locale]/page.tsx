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
  MapPin,
  Phone,
  Mail,
  Globe,
  Search,
  ChevronRight,
  Plus,
  TrendingUp,
  UserPlus,
  Megaphone,
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

          {/* Popular Services */}
          <nav className="mt-6" aria-label="Popular services">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Popular services</h3>
              <Link href={`/${locale}/mosques`} className="text-xs text-emerald-700 hover:underline dark:text-emerald-300 flex items-center gap-1">
                See all
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {/* Khairat */}
              <Link href={`/${locale}/mosques?q=khairat`} className="group inline-flex items-center justify-between gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200">
                <div className="flex items-center gap-2">
                  <span className="rounded-full p-1.5 bg-purple-50 text-purple-600 dark:bg-purple-900/30">
                    <Heart className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-semibold">Apply for khairat</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </Link>
              {/* Events */}
              <Link href={`/${locale}/mosques?q=event`} className="group inline-flex items-center justify-between gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200">
                <div className="flex items-center gap-2">
                  <span className="rounded-full p-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30">
                    <Calendar className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-semibold">Browse events</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </Link>
              {/* Classes */}
              <Link href={`/${locale}/mosques?q=class`} className="group inline-flex items-center justify-between gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200">
                <div className="flex items-center gap-2">
                  <span className="rounded-full p-1.5 bg-amber-50 text-amber-600 dark:bg-amber-900/30">
                    <Users className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-semibold">Find classes</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </Link>
              {/* Donations */}
              <Link href={`/${locale}/mosques?q=donation`} className="group inline-flex items-center justify-between gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200">
                <div className="flex items-center gap-2">
                  <span className="rounded-full p-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
                    <CheckCircle className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-semibold">Donate</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </Link>
              {/* Marriage */}
              <Link href={`/${locale}/mosques?q=nikah`} className="group inline-flex items-center justify-between gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200">
                <div className="flex items-center gap-2">
                  <span className="rounded-full p-1.5 bg-rose-50 text-rose-600 dark:bg-rose-900/30">
                    <Building2 className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-semibold">Book nikah</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </Link>
              {/* Friday Prayer */}
              <Link href={`/${locale}/mosques?q=jumuah`} className="group inline-flex items-center justify-between gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200">
                <div className="flex items-center gap-2">
                  <span className="rounded-full p-1.5 bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30">
                    <Users className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-semibold">Find Jumuah</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
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

      {/* What Users Need to Do Section */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              What We Offer
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Everything you need to connect with mosques and manage your religious community activities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Easy Registration</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Quick and simple account creation to get started in minutes</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Find Mosques</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Discover mosques in your area with detailed information and services</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Join Events</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Participate in religious events, classes, and community activities</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-amber-600 dark:text-amber-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Make Contributions</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Support your community through khairat donations and charitable giving</p>
            </div>
          </div>

        </div>
      </section>

      {/* Add Your Mosque Section (moved below features) */}
      <section className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-sm mb-4 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Building2 className="h-4 w-4" />
              <span>For Mosque Administrators</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              List Your Mosque and Manage Services
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Join hundreds of mosques already using our platform to manage their services and operations effectively
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                Why List Your Mosque?
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Increase Visibility</h4>
                    <p className="text-slate-600 dark:text-slate-400">Make your mosque discoverable to people searching for services in your area</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Promote Services</h4>
                    <p className="text-slate-600 dark:text-slate-400">Promote events, classes, and programs to reach more people effectively</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Heart className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Manage Khairat</h4>
                    <p className="text-slate-600 dark:text-slate-400">Streamline khairat programs, track contributions, and manage claims efficiently</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Megaphone className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Easy Communication</h4>
                    <p className="text-slate-600 dark:text-slate-400">Share announcements, updates, and important information efficiently</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 text-center">
                Get Started in Minutes
              </h3>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                  <span className="text-slate-700 dark:text-slate-300">Create your account</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                  <span className="text-slate-700 dark:text-slate-300">Add your mosque details</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                  <span className="text-slate-700 dark:text-slate-300">Start listing services</span>
                </div>
              </div>
              <div className="space-y-3">
                <Link href="/signup" className="block">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3">
                    <Building2 className="h-5 w-5 mr-2" />
                    List Your Mosque Now
                  </Button>
                </Link>
                <Link href="/pricing" target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                    View Pricing Plans
                  </Button>
                </Link>
              </div>
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                Free to get started • No setup fees • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-emerald-50 dark:bg-slate-900/40 backdrop-blur-sm border-y border-emerald-100/60 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">How it works</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Manage your mosque services in a few simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-slate-200/70 dark:border-slate-700/70">
              <CardHeader>
                <div className="text-emerald-600 text-sm font-semibold">Step 1</div>
                <CardTitle>Create Profile</CardTitle>
                <CardDescription>Set up your mosque profile with basic information and services.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-slate-200/70 dark:border-slate-700/70">
              <CardHeader>
                <div className="text-emerald-600 text-sm font-semibold">Step 2</div>
                <CardTitle>Add Services</CardTitle>
                <CardDescription>List your events, classes, khairat programs, and other services.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-slate-200/70 dark:border-slate-700/70">
              <CardHeader>
                <div className="text-emerald-600 text-sm font-semibold">Step 3</div>
                <CardTitle>Manage & Engage</CardTitle>
                <CardDescription>Monitor registrations, manage donations, and communicate with your community.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
      
      <div className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 py-20">
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
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-emerald-700 dark:text-emerald-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Fast and Simple</h3>
              <p className="text-slate-600 dark:text-slate-400">Streamlined experience with minimal clicks</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-blue-700 dark:text-blue-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Access Anywhere, 24/7</h3>
              <p className="text-slate-600 dark:text-slate-400">Works great on desktop and mobile</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-purple-700 dark:text-purple-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Easy Access to Mosque Services</h3>
              <p className="text-slate-600 dark:text-slate-400">Find, apply, and connect in minutes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <section className="bg-emerald-50 dark:bg-slate-900/40 backdrop-blur-sm border-y border-emerald-100/60 dark:border-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              What People Say About Us
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Hear from our users about their experience with our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  "This platform has made it so much easier to manage our mosque services and events. The interface is intuitive and user-friendly."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mr-3">
                    <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Ahmad Rahman</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Mosque Administrator</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  "I can now easily find khairat programs and events in my area. The search functionality works perfectly and saves me time."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                    <Heart className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Fatimah Ali</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Community Member</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  "The platform has streamlined our mosque management. Setting up our mosque profile was quick and the features are comprehensive."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-3">
                    <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Ustaz Hassan</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Imam & Administrator</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users already using our platform to find and manage mosque services effectively.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Get Started
                </Button>
              </Link>
            )}
            <Link href="/mosques">
              <Button size="lg" variant="outline" className="bg-white/10 text-white hover:bg-white/20 border-white/40">
                <Building2 className="mr-2 h-5 w-5" />
                Browse Mosques
              </Button>
            </Link>
          </div>
        </div>
      </section>

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


