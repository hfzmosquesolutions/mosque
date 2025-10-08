'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Search,
  Building,
  Clock,
  Users,
  Star,
  Filter,
  X,
} from 'lucide-react';
import { getAllMosques } from '@/lib/api';
import { Mosque } from '@/types/database';
import { useTranslations } from 'next-intl';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

// Malaysian states for filtering
const MALAYSIAN_STATES = [
  { value: 'johor', label: 'Johor' },
  { value: 'kedah', label: 'Kedah' },
  { value: 'kelantan', label: 'Kelantan' },
  { value: 'kl', label: 'Kuala Lumpur' },
  { value: 'labuan', label: 'Labuan' },
  { value: 'malacca', label: 'Malacca' },
  { value: 'negeri-sembilan', label: 'Negeri Sembilan' },
  { value: 'pahang', label: 'Pahang' },
  { value: 'penang', label: 'Penang' },
  { value: 'perak', label: 'Perak' },
  { value: 'perlis', label: 'Perlis' },
  { value: 'putrajaya', label: 'Putrajaya' },
  { value: 'sabah', label: 'Sabah' },
  { value: 'sarawak', label: 'Sarawak' },
  { value: 'selangor', label: 'Selangor' },
  { value: 'terengganu', label: 'Terengganu' },
];

export default function MosquesPage() {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [filteredMosques, setFilteredMosques] = useState<Mosque[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasPhone, setHasPhone] = useState(false);
  const [hasEmail, setHasEmail] = useState(false);
  const [hasWebsite, setHasWebsite] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'nameAsc' | 'nameDesc'>('relevance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchMosques();
  }, []);

  // Initialize search query from URL (?q=...)
  useEffect(() => {
    const q = (searchParams.get('q') || '').trim();
    if (q && q !== searchQuery) {
      setSearchQuery(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchMosques = async () => {
    try {
      console.log('[PAGE] MosquesPage - Starting to fetch all mosques');
      setLoading(true);
      const response = await getAllMosques();

      console.log('[PAGE] MosquesPage - getAllMosques response:', response);
      if (response.success && response.data) {
        console.log(
          '[PAGE] MosquesPage - Successfully fetched',
          response.data.length,
          'mosques'
        );
        setMosques(response.data);
        setFilteredMosques(response.data);
      } else {
        console.error(
          '[PAGE] MosquesPage - Failed to fetch mosques:',
          response.error
        );
        setError(response.error || 'Failed to fetch mosques');
      }
    } catch (err) {
      console.error('[PAGE] MosquesPage - Catch error:', err);
      setError('An error occurred while fetching mosques');
    } finally {
      setLoading(false);
    }
  };

  const filterMosques = useCallback(() => {
    let results = [...mosques];

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      results = results.filter((mosque) =>
        mosque.name.toLowerCase().includes(query) ||
        mosque.address?.toLowerCase().includes(query) ||
        mosque.description?.toLowerCase().includes(query) ||
        mosque.city?.toLowerCase().includes(query) ||
        mosque.state?.toLowerCase().includes(query) ||
        mosque.postcode?.toLowerCase().includes(query)
      );
    }

    // Filter by state
    if (selectedState) {
      results = results.filter((mosque) => mosque.state === selectedState);
    }

    // Filter by city
    if (selectedCity) {
      results = results.filter((mosque) => 
        mosque.city?.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    if (hasPhone) {
      results = results.filter((m) => !!m.phone);
    }
    if (hasEmail) {
      results = results.filter((m) => !!m.email);
    }
    if (hasWebsite) {
      results = results.filter((m) => !!m.website);
    }

    if (sortBy === 'nameAsc') {
      results.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'nameDesc') {
      results.sort((a, b) => b.name.localeCompare(a.name));
    }

    setFilteredMosques(results);
  }, [searchQuery, mosques, hasPhone, hasEmail, hasWebsite, selectedState, selectedCity, sortBy]);

  useEffect(() => {
    filterMosques();
  }, [filterMosques]);

  const handleMosqueClick = (mosqueId: string) => {
    const path = `/mosques/${mosqueId}`;
    if (typeof window !== 'undefined') {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      router.push(path);
    }
  };

  // Get unique cities from mosques for the current state
  const getAvailableCities = () => {
    const stateFilteredMosques = selectedState 
      ? mosques.filter(mosque => mosque.state === selectedState)
      : mosques;
    
    const cities = stateFilteredMosques
      .map(mosque => mosque.city)
      .filter(Boolean)
      .filter((city, index, arr) => arr.indexOf(city) === index)
      .sort();
    
    return cities;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedState('');
    setSelectedCity('');
    setHasPhone(false);
    setHasEmail(false);
    setHasWebsite(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-emerald-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              {t('mosques.loading')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-emerald-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              {t('mosques.errorLoading')}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <Button onClick={fetchMosques} variant="outline">
              {t('common.tryAgain')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-emerald-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header removed per request */}

        {/* Top Search (standardized like homepage) */}
        <div className="sticky top-16 z-30 mb-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur border-b border-emerald-100/40 dark:border-slate-800/40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = (searchQuery || '').trim();
              const url = q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname;
              router.replace(url);
            }}
            role="search"
            aria-label={t('mosques.searchPlaceholder')}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                type="text"
                placeholder={t('mosques.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="mosques-search-top"
                name="q"
                autoComplete="off"
                className="pl-12 pr-32 h-14 text-lg bg-white dark:bg-slate-800/90 backdrop-blur border-slate-200 dark:border-slate-700"
              />
              <Button
                type="submit"
                variant="default"
                aria-label={t('common.search')}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-md flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                <span>{t('common.search')}</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {t('mosques.mosquesFound', { count: filteredMosques.length })}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {searchQuery
                ? t('mosques.resultsFor', { query: searchQuery })
                : t('mosques.allRegistered')}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Star className="h-4 w-4 text-yellow-500" />
            <span>{t('mosques.verifiedListings')}</span>
          </div>
        </div>

        {/* Mobile Filters Toggle */}
        <div className="lg:hidden mb-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <Filter className="h-4 w-4" />
                {t('common.filters') || 'Filters'}
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>{t('mosques.refineSearch') || 'Refine search'}</SheetTitle>
              </SheetHeader>
              <div className="p-4 space-y-6">
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('common.sortBy') || 'Sort by'}</div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 px-3"
                  >
                    <option value="relevance">{t('common.relevance') || 'Relevance'}</option>
                    <option value="nameAsc">{t('common.nameAsc') || 'Name (A-Z)'}</option>
                    <option value="nameDesc">{t('common.nameDesc') || 'Name (Z-A)'}</option>
                  </select>
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Filters</div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={hasPhone}
                        onChange={(e) => setHasPhone(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <span>{t('mosques.hasPhone') || 'Has phone'}</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={hasEmail}
                        onChange={(e) => setHasEmail(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <span>{t('mosques.hasEmail') || 'Has email'}</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={hasWebsite}
                        onChange={(e) => setHasWebsite(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <span>{t('mosques.hasWebsite') || 'Has website'}</span>
                    </label>
                  </div>
                </div>

                {/* Mobile Location Filters */}
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Location</div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">State</label>
                      <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 px-3"
                      >
                        <option value="">All States</option>
                        {MALAYSIAN_STATES.map((state) => (
                          <option key={state.value} value={state.value}>
                            {state.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">City</label>
                      <input
                        type="text"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        placeholder="Search city..."
                        className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 px-3"
                      />
                    </div>
                    {(selectedState || selectedCity) && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('mosques.quickFilters') || 'Quick filters'}</div>
                  <div className="flex flex-wrap gap-2">
                    {['khairat', 'events', 'class', 'nikah', 'donation'].map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => setSearchQuery((prev) => (prev ? `${prev} ${kw}` : kw))}
                        className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Button className="w-full" variant="default" onClick={() => filterMosques()}>
                    {t('common.apply') || 'Apply'}
                  </Button>
                  <Button
                    className="w-full mt-2"
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setHasPhone(false);
                      setHasEmail(false);
                      setHasWebsite(false);
                      setSortBy('relevance');
                    }}
                  >
                    {t('common.reset') || 'Reset'}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Sticky Search & Filters */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
            <div className="lg:sticky lg:top-24">
              <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                    <Filter className="h-4 w-4" />
                    <span>{t('common.filters') || 'Filters'}</span>
                  </div>
                  <CardTitle className="text-lg">{t('mosques.refineSearch') || 'Refine search'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search moved to top; sidebar now only filters */}

                  <div className="pt-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Filters</div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={hasPhone}
                          onChange={(e) => setHasPhone(e.target.checked)}
                          className="h-4 w-4"
                        />
                        <span>{t('mosques.hasPhone') || 'Has phone'}</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={hasEmail}
                          onChange={(e) => setHasEmail(e.target.checked)}
                          className="h-4 w-4"
                        />
                        <span>{t('mosques.hasEmail') || 'Has email'}</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={hasWebsite}
                          onChange={(e) => setHasWebsite(e.target.checked)}
                          className="h-4 w-4"
                        />
                        <span>{t('mosques.hasWebsite') || 'Has website'}</span>
                      </label>
                    </div>
                  </div>

                  {/* Location Filters */}
                  <div className="pt-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Location</div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">State</label>
                        <Select value={selectedState || undefined} onValueChange={(value) => setSelectedState(value || '')}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All States" />
                          </SelectTrigger>
                          <SelectContent>
                            {MALAYSIAN_STATES.map((state) => (
                              <SelectItem key={state.value} value={state.value}>
                                {state.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">City</label>
                        <Input
                          value={selectedCity}
                          onChange={(e) => setSelectedCity(e.target.value)}
                          placeholder="Search city..."
                          className="w-full"
                        />
                      </div>
                      {(selectedState || selectedCity) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                          className="w-full"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('common.sortBy') || 'Sort by'}</div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 px-3"
                    >
                      <option value="relevance">{t('common.relevance') || 'Relevance'}</option>
                      <option value="nameAsc">{t('common.nameAsc') || 'Name (A-Z)'}</option>
                      <option value="nameDesc">{t('common.nameDesc') || 'Name (Z-A)'}</option>
                    </select>
                  </div>

                  {/* Quick keyword chips */}
                  <div className="pt-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('mosques.quickFilters') || 'Quick filters'}</div>
                    <div className="flex flex-wrap gap-2">
                      {['khairat', 'events', 'class', 'nikah', 'donation'].map((kw) => (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => setSearchQuery((prev) => (prev ? `${prev} ${kw}` : kw))}
                          className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          {kw}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      className="w-full"
                      variant="default"
                      onClick={() => filterMosques()}
                    >
                      {t('common.apply') || 'Apply'}
                    </Button>
                    <Button
                      className="w-full mt-2"
                      variant="outline"
                      onClick={() => {
                        setSearchQuery('');
                        setHasPhone(false);
                        setHasEmail(false);
                        setHasWebsite(false);
                        setSortBy('relevance');
                      }}
                    >
                      {t('common.reset') || 'Reset'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Right: Vertical Listing */}
          <div className="lg:col-span-8 xl:col-span-9">
            {filteredMosques.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">
                  {t('mosques.noMosquesFound')}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  {searchQuery
                    ? t('mosques.adjustSearch')
                    : t('mosques.noMosquesRegistered')}
                </p>
                {!searchQuery && (
                  <Button className="mt-6" variant="outline">
                    {t('mosques.registerMosque')}
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredMosques.map((mosque) => (
                  <Card
                    key={mosque.id}
                    className="cursor-pointer transition-all duration-300 hover:shadow-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden p-0"
                    onClick={() => handleMosqueClick(mosque.id)}
                  >
                    <CardContent className="p-0">
                      <div className="sm:flex items-stretch justify-between gap-0 sm:gap-4">
                        <div className="relative w-full h-40 sm:h-44 md:h-56 lg:h-64 sm:w-44 md:w-56 lg:w-64 shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-700 block">
                          <Image
                            src={(mosque.banner_url || mosque.logo_url || '/window.svg') as string}
                            alt={mosque.name}
                            fill
                            sizes="(min-width: 1024px) 256px, (min-width: 768px) 224px, (min-width: 640px) 176px, 100vw"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1 px-4 md:px-5 py-4">
                            <div className="flex items-center justify-start gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-full overflow-hidden bg-white border border-slate-200 dark:border-slate-700 flex-shrink-0">
                                  <Image
                                    src={(mosque.logo_url || '/icon-kariah-masjid.png') as string}
                                    alt={`${mosque.name} logo`}
                                    width={40}
                                    height={40}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">
                                  {mosque.name}
                                </CardTitle>
                              </div>
                            </div>
                            {mosque.address && (
                              <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 mb-2">
                                <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-emerald-600" />
                                <span className="line-clamp-1">{mosque.address}</span>
                              </div>
                            )}
                            {mosque.description && (
                              <CardDescription className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                {mosque.description}
                              </CardDescription>
                            )}
                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-4">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{t('mosques.prayerTimes')}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{t('mosques.community')}</span>
                              </div>
                            </div>
                          </div>
                          {/* Action button removed; entire card is clickable */}
                        </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
