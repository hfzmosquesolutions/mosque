'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Building2,
  Users,
  Calendar,
  DollarSign,
  BookOpen,
  Heart,
  Calculator,
  BarChart3,
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
  ArrowRight,
  Check,
  Menu,
  X,
} from 'lucide-react';

interface HomePageProps {
  onLogin: () => void;
  isLoading: boolean;
}

export function HomePage({ onLogin, isLoading }: HomePageProps) {
  const t = useTranslation();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      icon: Users,
      title: t('Members Management'),
      description: t(
        'Manage mosque members, their profiles, and membership details'
      ),
      color: 'bg-blue-500',
    },
    {
      icon: Calendar,
      title: t('Bookings & Events'),
      description: t('Schedule events, manage bookings, and organize programs'),
      color: 'bg-green-500',
    },
    {
      icon: DollarSign,
      title: t('Financial Management'),
      description: t(
        'Track donations, expenses, and generate financial reports'
      ),
      color: 'bg-purple-500',
    },
    {
      icon: Calculator,
      title: t('Zakat Calculator'),
      description: t('Calculate and manage zakat payments and records'),
      color: 'bg-orange-500',
    },
    {
      icon: BarChart3,
      title: t('Reports & Analytics'),
      description: t('Generate detailed reports and analyze mosque activities'),
      color: 'bg-indigo-500',
    },
  ];

  const stats = [
    { label: t('Active Members'), value: '500+', icon: Users },
    { label: t('Monthly Events'), value: '25+', icon: Calendar },
    { label: t('Programs'), value: '15+', icon: BookOpen },
    { label: t('Years of Service'), value: '10+', icon: Clock },
  ];

  const testimonials = [
    {
      name: 'Ahmad Ibrahim',
      role: t('Mosque Administrator'),
      content: t(
        'This system has transformed how we manage our mosque activities. Everything is now organized and efficient.'
      ),
      rating: 5,
    },
    {
      name: 'Fatimah Abdullah',
      role: t('Treasurer'),
      content: t(
        'The financial management features are excellent. We can now track all donations and expenses easily.'
      ),
      rating: 5,
    },
    {
      name: 'Ali Hassan',
      role: t('Program Coordinator'),
      content: t(
        'Event management has never been easier. The booking system is intuitive and user-friendly.'
      ),
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                {t('Mosque Management System')}
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <LanguageSwitcher />
              <ThemeToggle />
              <Button
                onClick={onLogin}
                disabled={isLoading}
                className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
              >
                {isLoading ? t('Loading...') : t('Login')}
              </Button>
              <Button variant="outline" onClick={() => router.push('/signup')}>
                {t('Sign Up')}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2"
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={onLogin}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
                >
                  {isLoading ? t('Loading...') : t('Login')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/signup')}
                  className="w-full"
                >
                  {t('Sign Up')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-4">
              {t('Comprehensive Mosque Management')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              {t('Streamline Your')}{' '}
              <span className="text-primary">{t('Mosque Operations')}</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t(
                'A complete solution for managing members, finances, events, and programs in your mosque community.'
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={onLogin}
                disabled={isLoading}
                className="text-lg px-8 py-6 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
              >
                {t('Get Started')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/signup')}
                className="text-lg px-8 py-6"
              >
                {t('Sign Up')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-2">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('Powerful Features')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t(
                'Everything you need to manage your mosque efficiently and effectively'
              )}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow duration-300"
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('What Our Users Say')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t(
                'Hear from mosque administrators who have transformed their operations'
              )}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow duration-300"
              >
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                  <CardDescription>{testimonial.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground italic">
                    "{testimonial.content}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('Ready to Transform Your Mosque Management?')}
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              {t(
                'Join hundreds of mosques already using our system to streamline their operations'
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={onLogin}
                disabled={isLoading}
                className="text-lg px-8 py-6 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
              >
                {t('Start Free Trial')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                {t('Contact Sales')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-gray-200 dark:border-slate-700 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  {t('Mosque Management System')}
                </span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                {t(
                  'Empowering mosque communities with modern management tools for better organization and service.'
                )}
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{t('Kuala Lumpur, Malaysia')}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{t('Features')}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{t('Member Management')}</li>
                <li>{t('Event Booking')}</li>
                <li>{t('Financial Tracking')}</li>
                <li>{t('Zakat Calculator')}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{t('Support')}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>support@mosque.com</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+60 3-1234 5678</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-slate-700 pt-8 mt-8 text-center text-sm text-muted-foreground">
            <p>
              &copy; 2025 {t('Mosque Management System')}.{' '}
              {t('All rights reserved')}.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
