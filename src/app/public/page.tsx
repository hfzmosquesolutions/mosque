'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/useAuth.v2';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building, Users, Heart, Star } from 'lucide-react';
import Link from 'next/link';

export default function PublicLandingPage() {
  const { user, isLoading } = useAuthState();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, don't show this page (redirect will happen)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">
                  Masjid Al-Hidayah
                </h1>
                <p className="text-sm text-gray-600">
                  Digital Management System
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/public/mosques">
                <Button variant="outline" size="sm">
                  Mosque Directory
                </Button>
              </Link>
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

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="h-20 w-20 bg-gradient-to-br from-blue-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to Masjid Al-Hidayah
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Experience our comprehensive digital mosque management system. Join
            our community, access services, and stay connected with our programs
            and activities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/public/mosques">
              <Button size="lg" className="w-full sm:w-auto">
                Explore Mosque Directory
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Become a Member
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center p-6 border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Community</h3>
            <p className="text-sm text-gray-600">
              Join our vibrant community of faithful members
            </p>
          </Card>

          <Card className="text-center p-6 border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Building className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Services</h3>
            <p className="text-sm text-gray-600">
              Access various religious and community services
            </p>
          </Card>

          <Card className="text-center p-6 border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Programs</h3>
            <p className="text-sm text-gray-600">
              Participate in educational and religious programs
            </p>
          </Card>

          <Card className="text-center p-6 border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Heart className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Support</h3>
            <p className="text-sm text-gray-600">
              Get support for your spiritual and community needs
            </p>
          </Card>
        </div>

        {/* Call to Action Section */}
        <div className="text-center">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-green-600 text-white">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Join Our Community?
              </h2>
              <p className="text-white/90 mb-8 text-lg max-w-2xl mx-auto">
                Discover what makes Masjid Al-Hidayah special. Learn about our
                services, prayer times, programs, and how you can be part of our
                growing community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/public/mosques">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white text-blue-600 hover:bg-gray-100 w-full sm:w-auto"
                  >
                    View Mosque Directory
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 w-full sm:w-auto"
                  >
                    Sign Up Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 bg-white/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <Building className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">
                Masjid Al-Hidayah
              </span>
            </div>
            <p className="text-gray-600 mb-4">
              Jalan Masjid Al-Hidayah, Kampung Baru, Kuala Lumpur, Wilayah
              Persekutuan 50300
            </p>
            <p className="text-sm text-gray-500">
              © 2024 Masjid Al-Hidayah. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
