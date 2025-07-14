'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
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
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Users,
  Search,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { MosqueService, PublicMosqueData } from '@/services/mosque';

export default function MosqueDirectoryPage() {
  const { t } = useLanguage();
  const [mosques, setMosques] = useState<PublicMosqueData[]>([]);
  const [filteredMosques, setFilteredMosques] = useState<PublicMosqueData[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMosques = async () => {
      try {
        const mosquesData = await MosqueService.getAllPublicMosques();
        setMosques(mosquesData);
        setFilteredMosques(mosquesData);
      } catch (error) {
        console.error('Error fetching mosques:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMosques();
  }, []);

  useEffect(() => {
    const filtered = mosques.filter(
      (mosque) =>
        mosque.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mosque.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mosque.state.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMosques(filtered);
  }, [searchTerm, mosques]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mosque directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">
                  Mosque Directory
                </h1>
                <p className="text-sm text-gray-600">
                  Find mosques in your area
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Mosque Directory
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover mosques in your area. Find prayer times, services, and
            community information.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
            {/* Search */}
            <div className="max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by mosque name, city, or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Mosques Grid */}
        {filteredMosques.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No mosques found' : 'No mosques available'}
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? `No mosques match your search "${searchTerm}". Try different keywords.`
                : 'Check back later for mosque listings.'}
            </p>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => setSearchTerm('')}
                className="mt-4"
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Found {filteredMosques.length} mosque
                {filteredMosques.length !== 1 ? 's' : ''}
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMosques.map((mosque) => (
                <Card
                  key={mosque.id}
                  className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {mosque.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {mosque.city}
                          {mosque.state && `, ${mosque.state}`}
                        </CardDescription>
                      </div>
                      <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {mosque.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {mosque.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      {mosque.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          <span>{mosque.phone}</span>
                        </div>
                      )}
                      {mosque.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span>{mosque.email}</span>
                        </div>
                      )}
                      {mosque.capacity && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-3 w-3" />
                          <span>Capacity: {mosque.capacity}</span>
                        </div>
                      )}
                    </div>

                    {mosque.services && mosque.services.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {mosque.services.slice(0, 3).map((service, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {service}
                          </Badge>
                        ))}
                        {mosque.services.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{mosque.services.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="pt-2">
                      <Link href={`/public/mosque/${mosque.id}`}>
                        <Button className="w-full group">
                          View Profile
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-green-600 text-white">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4">
                Join the Digital Mosque Community
              </h2>
              <p className="text-white/90 mb-8 text-lg max-w-2xl mx-auto">
                Connect with mosques in your area, access services, and be part
                of a growing digital community.
              </p>
              <div className="flex justify-center">
                <Link href="/signup">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white text-blue-600 hover:bg-gray-100"
                  >
                    Become a Member
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
