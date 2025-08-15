"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Building2, Users, Calendar, Heart } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800">

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Connect with Your
              <span className="text-emerald-600 block">Local Mosque</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Discover mosques in your area, stay updated with events, 
              and strengthen your connection with the community.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/mosques">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                Explore Mosques
              </Button>
            </Link>
            {!user && (
              <Link href="/signup">
                <Button size="lg" variant="outline">
                  Join Community
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Everything You Need to Stay Connected
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Comprehensive tools for mosque management and community engagement
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center border-emerald-100 dark:border-slate-700">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle className="text-lg">Find Mosques</CardTitle>
              <CardDescription>
                Discover mosques in your area with detailed information and contact details
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center border-emerald-100 dark:border-slate-700">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Events & Programs</CardTitle>
              <CardDescription>
                Stay updated with prayer times, events, and community programs
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center border-emerald-100 dark:border-slate-700">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Community</CardTitle>
              <CardDescription>
                Connect with fellow community members and mosque administrators
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center border-emerald-100 dark:border-slate-700">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-rose-100 dark:bg-rose-900 rounded-lg flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-rose-600" />
              </div>
              <CardTitle className="text-lg">Donations</CardTitle>
              <CardDescription>
                Support your mosque through secure online donations and khairat programs
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-emerald-600 dark:bg-emerald-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-8">
            <h2 className="text-3xl font-bold text-white">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
              Join thousands of community members already using MosqueConnect to stay connected with their local mosques.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/mosques">
                <Button size="lg" variant="secondary">
                  Browse Mosques
                </Button>
              </Link>
              {!user && (
                <Link href="/onboarding">
                  <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-emerald-600">
                    Register Your Mosque
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Building2 className="h-6 w-6 text-emerald-600" />
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">MosqueConnect</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Connecting communities, one mosque at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
