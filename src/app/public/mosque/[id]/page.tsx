'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  Calendar,
  Clock,
  User,
  Heart,
  Star,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { MosqueProfileService, MosqueProfile } from '@/services/mosque-profile';

export default function DynamicPublicMosqueProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const [mosque, setMosque] = useState<MosqueProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mosqueId = params.id as string;

  useEffect(() => {
    const fetchMosqueData = async () => {
      if (!mosqueId) {
        setError('Invalid mosque ID');
        setLoading(false);
        return;
      }

      try {
        const mosqueData = await MosqueProfileService.getMosqueProfile(
          mosqueId
        );
        if (mosqueData) {
          setMosque(mosqueData);
        } else {
          setError('Mosque not found');
        }
      } catch (error) {
        console.error('Error fetching mosque data:', error);
        setError('Failed to load mosque information');
      } finally {
        setLoading(false);
      }
    };

    fetchMosqueData();
  }, [mosqueId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('publicMosque.loadingMessage')}</p>
        </div>
      </div>
    );
  }

  if (error || !mosque) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t('publicMosque.notFoundTitle')}
          </h2>
          <p className="text-gray-600 mb-6">
            {error || t('publicMosque.notFoundMessage')}
          </p>
          <Button
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
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
                <h1 className="font-semibold text-gray-900">{mosque.name}</h1>
                <p className="text-sm text-gray-600">
                  {t('publicMosque.publicProfile')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  {t('publicMosque.staffLogin')}
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">{t('publicMosque.joinUs')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-12">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-green-600 text-white overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="h-32 w-32 lg:h-40 lg:w-40 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Building className="h-16 w-16 lg:h-20 lg:w-20 text-white" />
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                      {mosque.name}
                    </h1>
                    <p className="text-white/90 flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5" />
                      {mosque.address}
                    </p>
                  </div>

                  {mosque.description && (
                    <p className="text-white/90 text-lg leading-relaxed max-w-3xl">
                      {mosque.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {mosque.created_at && (
                      <Badge
                        variant="secondary"
                        className="bg-white/20 text-white border-white/30"
                      >
                        Est. {new Date(mosque.created_at).getFullYear()}
                      </Badge>
                    )}
                    {mosque.capacity && (
                      <Badge
                        variant="secondary"
                        className="bg-white/20 text-white border-white/30"
                      >
                        Capacity: {mosque.capacity} people
                      </Badge>
                    )}
                    {mosque.facilities && (
                      <Badge
                        variant="secondary"
                        className="bg-white/20 text-white border-white/30"
                      >
                        {mosque.facilities.length} Facilities
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center p-6 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {mosque.capacity || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Capacity</div>
          </Card>
          <Card className="text-center p-6 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <Star className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {mosque.facilities?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Facilities</div>
          </Card>
          <Card className="text-center p-6 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {mosque.created_at
                ? `${
                    new Date().getFullYear() -
                    new Date(mosque.created_at).getFullYear()
                  }+`
                : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Years Serving</div>
          </Card>
          <Card className="text-center p-6 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <Heart className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">Active</div>
            <div className="text-sm text-gray-600">Community</div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Contact & Hours */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mosque.phone && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {mosque.phone}
                      </div>
                      <div className="text-sm text-gray-600">Phone</div>
                    </div>
                  </div>
                )}
                {mosque.email && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {mosque.email}
                      </div>
                      <div className="text-sm text-gray-600">Email</div>
                    </div>
                  </div>
                )}
                {mosque.website && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Globe className="h-5 w-5 text-purple-600 flex-shrink-0" />
                    <div>
                      <a
                        href={`https://${mosque.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-purple-600 hover:text-purple-700 transition-colors"
                      >
                        {mosque.website}
                      </a>
                      <div className="text-sm text-gray-600">Website</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information Card */}
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Details
                </CardTitle>
                <CardDescription>How to reach the mosque</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {mosque.phone && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">Phone</span>
                    <span className="text-sm text-gray-600">
                      {mosque.phone}
                    </span>
                  </div>
                )}
                {mosque.email && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">Email</span>
                    <span className="text-sm text-gray-600">
                      {mosque.email}
                    </span>
                  </div>
                )}
                {mosque.website && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">Website</span>
                    <a
                      href={mosque.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {mosque.website}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Services & Leadership */}
          <div className="lg:col-span-2 space-y-6">
            {/* Facilities */}
            {mosque.facilities && mosque.facilities.length > 0 && (
              <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Facilities & Services
                  </CardTitle>
                  <CardDescription>
                    Facilities and services available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mosque.facilities.map(
                      (facility: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100"
                        >
                          <div className="h-2 w-2 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex-shrink-0"></div>
                          <span className="text-gray-900 font-medium">
                            {facility}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Leadership Section - Since we don't have imam/chairman, we'll skip this or make it optional */}
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>Get in touch with the mosque</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mosque.phone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">Phone</div>
                        <div className="text-sm text-gray-600">
                          {mosque.phone}
                        </div>
                      </div>
                    </div>
                  )}

                  {mosque.email && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium text-gray-900">Email</div>
                        <div className="text-sm text-gray-600">
                          {mosque.email}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Call to Action */}
            <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-600" />
                  Get Involved
                </CardTitle>
                <CardDescription>
                  Join our community and participate in our programs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-700">
                    We welcome new members to join our growing community.
                    Whether you're looking to participate in our religious
                    services, educational programs, or community initiatives,
                    there's a place for everyone at {mosque.name}.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/signup" className="flex-1">
                      <Button className="w-full">Become a Member</Button>
                    </Link>
                    {mosque.phone && (
                      <Link href={`tel:${mosque.phone}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          Contact Us
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-green-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-2">Join Our Community</h3>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                Be part of our growing community. Register as a member to access
                our services and stay updated with our programs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white text-blue-600 hover:bg-gray-100"
                  >
                    Become a Member
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10"
                  >
                    Staff Portal
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
