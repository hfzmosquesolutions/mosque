'use client';

import { useEffect, useState } from 'react';
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
import { MapPin, Phone, Mail, Globe, Search, Building } from 'lucide-react';
import { getAllMosques } from '@/lib/api';
import { Mosque } from '@/types/database';

export default function MosquesPage() {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [filteredMosques, setFilteredMosques] = useState<Mosque[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchMosques();
  }, []);

  useEffect(() => {
    filterMosques();
  }, [searchQuery, mosques]);

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

  const filterMosques = () => {
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
  };

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
              Loading mosques...
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
              Error Loading Mosques
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={fetchMosques} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building className="h-8 w-8 text-blue-600 mr-2" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Find a Mosque
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover mosques in your community. Connect with local congregations
            and find your spiritual home.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search mosques by name, location, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="text-center mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            {filteredMosques.length} mosque
            {filteredMosques.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Mosques Grid */}
        {filteredMosques.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No mosques found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery
                ? 'Try adjusting your search terms.'
                : 'No mosques are currently listed.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMosques.map((mosque) => (
              <Card
                key={mosque.id}
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 bg-white dark:bg-gray-800 border-0 shadow-md"
                onClick={() => handleMosqueClick(mosque.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {mosque.name}
                      </CardTitle>
                      {mosque.address && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{mosque.address}</span>
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      Active
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {mosque.description && (
                    <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {mosque.description}
                    </CardDescription>
                  )}

                  <div className="space-y-2">
                    {mosque.phone && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="h-3 w-3 mr-2 flex-shrink-0" />
                        <span>{mosque.phone}</span>
                      </div>
                    )}

                    {mosque.email && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="h-3 w-3 mr-2 flex-shrink-0" />
                        <span className="truncate">{mosque.email}</span>
                      </div>
                    )}

                    {mosque.website && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Globe className="h-3 w-3 mr-2 flex-shrink-0" />
                        <span className="truncate">{mosque.website}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMosqueClick(mosque.id);
                      }}
                    >
                      View Profile
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
