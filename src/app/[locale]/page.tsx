'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
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
  const t = useTranslations('homepage');

  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [filteredMosques, setFilteredMosques] = useState<Mosque[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const featuredMosques = useMemo(() => filteredMosques.slice(0, 6), [filteredMosques]);
  const phrases = useMemo(
    () => [t('heroPhrase1'), t('heroPhrase2'), t('heroPhrase3')],
    [t]
  );
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

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

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const intervalId = setInterval(() => {
      setIsFading(true);
      timeoutId = setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
        setIsFading(false);
      }, 200);
    }, 3000);
    return () => {
      clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [phrases.length]);

  // Keep featured list static on homepage; searching redirects to listing page

  // (Removed popular searches feature)

  // Standard service categories for quick filtering
  const serviceCategories: Array<{ label: string; keyword: string; icon: React.ComponentType<{ className?: string }> }> = [
    { label: 'Khairat (Welfare Assistance)', keyword: 'khairat', icon: Heart },
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
              <span
                aria-live="polite"
                className={[
                  'inline-block min-h-[1.2em] transition-all duration-300 ease-out will-change-transform will-change-opacity',
                  'motion-reduce:transition-none motion-reduce:transform-none',
                  isFading ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0',
                ].join(' ')}
              >
                {phrases[phraseIndex]}
              </span>
            </h1>
            <p className="mt-2 text-base md:text-lg text-slate-600 dark:text-slate-400">
              {t('heroSubtitle')}
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
              <label id="search-label" htmlFor="hero-search" className="sr-only">Search mosques/surau and services</label>
              <div className="relative" ref={searchContainerRef}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder={t('searchPlaceholder')}
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
                  <span>{t('searchButton')}</span>
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
                        <li className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{t('noResults')}</li>
                      )}
                    </ul>
                    <div className="border-t border-slate-200 dark:border-slate-700">
                      <button
                        type="submit"
                        className="w-full px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-left"
                      >
                        {t('searchButton')} semua keputusan untuk "{searchQuery.trim()}"
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
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('popularServices')}</h3>
              <Link href={`/${locale}/mosques`} className="text-xs text-emerald-700 hover:underline dark:text-emerald-300 flex items-center gap-1">
                {t('seeAll')}
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Register Khairat */}
              <Link href={`/${locale}/mosques?services=khairat_management`} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200">
                <span className="rounded-full p-1 bg-rose-50 text-rose-600 dark:bg-rose-900/30">
                  <UserPlus className="h-3.5 w-3.5" />
                </span>
                <span className="font-semibold">{t('registerKhairatShort')}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </Link>

              {/* Pay Khairat */}
              <Link href={`/${locale}/mosques?services=khairat_management`} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200">
                <span className="rounded-full p-1 bg-purple-50 text-purple-600 dark:bg-purple-900/30">
                  <Heart className="h-3.5 w-3.5" />
                </span>
                <span className="font-semibold">{t('payKhairat')}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </Link>

              {/* Organization */}
              <Link href={`/${locale}/mosques?services=organization_people`} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200">
                <span className="rounded-full p-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30">
                  <Building2 className="h-3.5 w-3.5" />
                </span>
                <span className="font-semibold">{t('mosqueInfo')}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </Link>

              {/* Register Mosque */}
              <Link href={`/${locale}/signup`} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200">
                <span className="rounded-full p-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
                  <Plus className="h-3.5 w-3.5" />
                </span>
                <span className="font-semibold">{t('registerMosqueShort')}</span>
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
        <h2 id="find-mosques-heading" className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">{t('featuredMosque')}</h2>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <Star className="h-4 w-4 text-yellow-500" />
            <span>{t('verifiedListings')}</span>
          </div>
          <div className="text-sm text-slate-500">
            {loading ? t('loading') : `${featuredMosques.length} ${t('featured')}`}
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
              <p className="text-slate-600 dark:text-slate-400">{t('noResults')}</p>
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
                <Building2 className="h-4 w-4" /> {t('browseMosques')}
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
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">{t('howItWorks')}</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">{t('getStartedIn3Steps')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-slate-200/70 dark:border-slate-700/70">
              <CardHeader>
                <div className="text-emerald-600 text-sm font-semibold">{t('step1')}</div>
                <CardTitle>{t('findMosque')}</CardTitle>
                <CardDescription>{t('findMosqueDescription')}</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-slate-200/70 dark:border-slate-700/70">
              <CardHeader>
                <div className="text-emerald-600 text-sm font-semibold">{t('step2')}</div>
                <CardTitle>{t('registerKhairat')}</CardTitle>
                <CardDescription>{t('registerKhairatDescription')}</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-slate-200/70 dark:border-slate-700/70">
              <CardHeader>
                <div className="text-emerald-600 text-sm font-semibold">{t('step3')}</div>
                <CardTitle>{t('makeKhairatPayment')}</CardTitle>
                <CardDescription>{t('makeKhairatPaymentDescription')}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>


      {/* Problems Section */}
      <section className="bg-slate-50 dark:bg-slate-900/40 backdrop-blur-sm border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-sm mb-4 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Building2 className="h-4 w-4" />
              <span>{t('forMosqueAdmins')}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {t('problemsTitle')}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              {t('problemsSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">😞</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                {t('noOneKnowsAboutYou')}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {t('noOneKnowsDescription')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">😵</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                {t('tooMuchPaperwork')}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {t('tooMuchPaperworkDescription')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">😫</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                {t('khairatIsConfusing')}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {t('khairatIsConfusingDescription')}
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="bg-emerald-50 dark:bg-slate-900/40 backdrop-blur-sm border-y border-emerald-100/60 dark:border-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {t('whatWeOffer')}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              {t('whatWeOfferSubtitle')}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-4">
                <Heart className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{t('digitalKhairat')}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">{t('digitalKhairatDescription')}</p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{t('onlinePayments')}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">{t('onlinePaymentsDescription')}</p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
                <Building2 className="h-7 w-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{t('mosqueProfiles')}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">{t('mosqueProfilesDescription')}</p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-4">
                <Users className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{t('community')}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">{t('communityDescription')}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center mt-16">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3">
                    <ArrowRight className="mr-2 h-5 w-5" />
                    {t('goToDashboard')}
                  </Button>
                </Link>
              ) : (
                <Link href="/signup">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3">
                    <UserPlus className="mr-2 h-5 w-5" />
                    {t('registerYourMosque')}
                  </Button>
                </Link>
              )}
              <Link href="/pricing" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-8 py-3">
                  {t('viewPricingPlans')}
                </Button>
              </Link>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 max-w-2xl mx-auto">
              {t('startManagingDescription')}
            </p>
          </div>

        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {t('testimonialsTitle')}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              {t('testimonialsSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <blockquote className="text-slate-600 dark:text-slate-400 text-lg italic leading-relaxed px-4">
                "{t('testimonial1')}"
              </blockquote>
              <div className="flex items-center justify-center space-x-4">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                  <Users className="h-7 w-7 text-emerald-600 dark:text-emerald-300" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 text-base">{t('ahmadRahman')}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{t('mosqueAdministrator')}</div>
                </div>
              </div>
            </div>

            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <blockquote className="text-slate-600 dark:text-slate-400 text-lg italic leading-relaxed px-4">
                "{t('testimonial2')}"
              </blockquote>
              <div className="flex items-center justify-center space-x-4">
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Heart className="h-7 w-7 text-blue-600 dark:text-blue-300" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 text-base">{t('fatimahAli')}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{t('communityMember')}</div>
                </div>
              </div>
            </div>

            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <blockquote className="text-slate-600 dark:text-slate-400 text-lg italic leading-relaxed px-4">
                "{t('testimonial3')}"
              </blockquote>
              <div className="flex items-center justify-center space-x-4">
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-purple-600 dark:text-purple-300" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 text-base">{t('ustazHassan')}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{t('imamAdministrator')}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('readyToGetStarted')}
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            {t('readyToGetStartedSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 px-8 py-3">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  {t('goToDashboard')}
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 px-8 py-3">
                  <UserPlus className="mr-2 h-5 w-5" />
                  {t('registerYourMosque')}
                </Button>
              </Link>
            )}
            <Link href="/pricing" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="bg-white/10 text-white hover:bg-white/20 border-white/40 px-8 py-3">
                {t('viewPricingPlans')}
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
              {t('footerDescription')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}


