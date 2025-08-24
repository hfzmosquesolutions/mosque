'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { getAllMosques } from '@/lib/api';
import { Mosque } from '@/types/database';
import { useTranslations } from 'next-intl';

export default function MosquesPage() {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [filteredMosques, setFilteredMosques] = useState<Mosque[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    fetchMosques();
  }, []);

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
    if (!searchQuery.trim()) {
      setFilteredMosques(mosques);
      return;
    }

    const filtered = mosques.filter(
      (mosque) =>
        mosque.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mosque.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mosque.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredMosques(filtered);
  }, [searchQuery, mosques]);

  useEffect(() => {
    filterMosques();
  }, [filterMosques]);

  const handleMosqueClick = (mosqueId: string) => {
    router.push(`/mosques/${mosqueId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {t('mosques.loading')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('mosques.errorLoading')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={fetchMosques} variant="outline">
              {t('common.tryAgain')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mr-4">
              <Building className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
                {t('mosques.discoverMosques')}
              </h1>
              <p className="text-emerald-600 font-medium">
                {t('mosques.findCommunity')}
              </p>
            </div>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            {t('mosques.description')}
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder={t('mosques.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 text-base border-slate-300 dark:border-slate-600"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {t('common.filters')}
              </Button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-8">
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

        {/* Mosques Grid */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMosques.map((mosque) => (
              <Card
                key={mosque.id}
                className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden"
                onClick={() => handleMosqueClick(mosque.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">
                        {mosque.name}
                      </CardTitle>
                      {mosque.address && (
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 mb-2">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-emerald-600" />
                          <span className="line-clamp-1">{mosque.address}</span>
                        </div>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                    >
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
                      {t('mosques.active')}
                    </Badge>
                  </div>

                  {mosque.description && (
                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {mosque.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3 mb-4">
                    {mosque.phone && (
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
                          <Phone className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium">{mosque.phone}</span>
                      </div>
                    )}

                    {mosque.email && (
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-3">
                          <Mail className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="truncate font-medium">
                          {mosque.email}
                        </span>
                      </div>
                    )}

                    {mosque.website && (
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <div className="w-8 h-8 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-3">
                          <Globe className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="truncate font-medium">
                          {mosque.website}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{t('mosques.prayerTimes')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{t('mosques.community')}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMosqueClick(mosque.id);
                      }}
                    >
                      {t('mosques.viewDetails')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
