'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  Heart,
  Building,
  Activity,
  Shield,
  Plus,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { getDashboardStats, getUserDonations, getEvents } from '@/lib/api';
import { DashboardStats, Donation, Event } from '@/types/database';

function DashboardContent() {
  const { user } = useAuth();
  const { isCompleted, isLoading } = useOnboardingRedirect();
  const { profile, isAdmin, isMosqueOwner, mosqueId, loading: roleLoading } = useUserRole();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);

  const [, setDataLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.id || !isCompleted) return;
      
      try {
        setDataLoading(true);
        
        // Fetch user donations
        const donationsResult = await getUserDonations(user.id, 5);
        if (donationsResult.data) {
          setRecentDonations(donationsResult.data);
        }
        
        // If user is admin and has mosque, fetch mosque stats
        if (isAdmin && mosqueId) {
          const statsResult = await getDashboardStats(mosqueId);
          if (statsResult.success && statsResult.data) {
            setStats(statsResult.data);
          }
          
          const eventsResult = await getEvents(mosqueId, 5);
          if (eventsResult.data) {
            setUpcomingEvents(eventsResult.data);
          }
        } else if (mosqueId) {
          // For regular users, still fetch some basic data
          const eventsResult = await getEvents(mosqueId, 3);
          if (eventsResult.data) {
            setUpcomingEvents(eventsResult.data);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setDataLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [user?.id, isCompleted, isAdmin, mosqueId]);

  // Show loading while checking onboarding status
  if (isLoading || roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Don't render dashboard content if onboarding is not completed
  if (!isCompleted) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-2xl" />
          <div className="relative p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <LayoutDashboard className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                      Welcome back, {profile?.full_name || user?.email}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={isAdmin ? "default" : "secondary"}>
                        {isAdmin ? "Mosque Administrator" : "Community Member"}
                      </Badge>
                      {isMosqueOwner && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Mosque Owner
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground text-lg">
                  {isAdmin 
                    ? "Manage your mosque and serve the community" 
                    : "Stay connected with your mosque community"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {isAdmin && stats && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_members}</div>
                <p className="text-xs text-muted-foreground">
                  Active community members
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.total_donations}</div>
                <p className="text-xs text-muted-foreground">
                  All-time donations received
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.upcoming_events}</div>
                <p className="text-xs text-muted-foreground">
                  Upcoming events
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contributions</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_contribution_programs}</div>
                <p className="text-xs text-muted-foreground">
                  Community contributions
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Community Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Community
              </CardTitle>
              <CardDescription>Connect with your mosque community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/events">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    View Events
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/donations">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Make Donation
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contributions">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Contributions
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Admin Features */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Administration
                </CardTitle>
                <CardDescription>Manage mosque operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">

                <Link href="/users">
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Manage Members
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/mosque-profile">
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Mosque Settings
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest interactions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentDonations.length > 0 ? (
                <div className="space-y-3">
                  {recentDonations.slice(0, 3).map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between text-sm">
                      <span>Donation: {donation.category_id || 'General'}</span>
                      <span className="font-medium">${donation.amount}</span>
                    </div>
                  ))}
                  <Link href="/donations">
                    <Button variant="ghost" size="sm" className="w-full">
                      View All Donations
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    No recent activity
                  </p>
                  <Link href="/donations">
                    <Button size="sm">
                      Make Your First Donation
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Admin Sections */}
        {isAdmin && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Upcoming Events */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>Manage mosque events</CardDescription>
                </div>
                <Link href="/events">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingEvents.slice(0, 3).map((event) => (
                      <div key={event.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.event_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">{event.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming events
                  </p>
                )}
              </CardContent>
            </Card>


          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
