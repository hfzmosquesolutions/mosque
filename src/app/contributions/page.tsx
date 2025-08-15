'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminAccess, useUserMosque } from '@/hooks/useUserRole';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Plus,
  Target,
  Calendar,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { ContributionForm } from '@/components/contributions/ContributionForm';
import { ProgramManagement } from '@/components/contributions/ProgramManagement';
import { ContributionsTabContent } from '@/components/contributions/ContributionsTabContent';
import { getUserContributions, getContributionPrograms } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type {
  Contribution,
  ContributionProgram,
  Mosque,
} from '@/types/database';

function ContributionsContent() {
  const { user } = useAuth();
  const { hasAdminAccess } = useAdminAccess();
  const { mosqueId } = useUserMosque();
  const [userContributions, setUserContributions] = useState<
    (Contribution & { program: ContributionProgram & { mosque: Mosque } })[]
  >([]);
  const [programs, setPrograms] = useState<ContributionProgram[]>([]);
  const [loading, setLoading] = useState(true);

  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch user contributions
      const contributionsResult = await getUserContributions(user.id);
      setUserContributions(contributionsResult.data || []);

      // Fetch programs for the mosque (only if user has a mosque)
      if (mosqueId) {
        const programsResult = await getContributionPrograms(mosqueId);
        if (programsResult.success && programsResult.data) {
          setPrograms(programsResult.data);
        }
      } else {
        // For normal users without a mosque, clear programs
        setPrograms([]);
      }
    } catch (error) {
      console.error('Error fetching contribution data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, mosqueId]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contribution data...</p>
        </div>
      </div>
    );
  }

  // Calculate summary stats
  const totalContributed = userContributions.reduce(
    (sum, contribution) => sum + contribution.amount,
    0
  );
  const activePrograms = programs.filter((p) => p.is_active).length;
  const recentContributions = userContributions.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-2xl" />
        <div className="relative p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Heart className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Contributions
                </h1>
              </div>
              <p className="text-muted-foreground text-lg">
                {hasAdminAccess
                  ? 'Manage contribution programs and track community support'
                  : 'Support your community through meaningful contributions'}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  <span>{userContributions.length} contributions made</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span>{activePrograms} active programs</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setIsContributionModalOpen(true)}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="mr-2 h-5 w-5" />
              Make Contribution
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList
          className={`grid ${hasAdminAccess ? 'grid-cols-3' : 'grid-cols-1'}`}
        >
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {hasAdminAccess && (
            <TabsTrigger value="programs">Programs</TabsTrigger>
          )}
          {hasAdminAccess && (
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8">
          {/* Enhanced Summary Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Contributed
                </CardTitle>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  ${totalContributed.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Across {userContributions.length} contributions
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Programs
                </CardTitle>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {activePrograms}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Available for contribution
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Recent Activity
                </CardTitle>
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {recentContributions.length}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Recent contributions
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Programs Supported
                </CardTitle>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {new Set(userContributions.map((c) => c.program_id)).size}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Different programs
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Compact Side-by-Side Layout */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Available Programs Card */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-slate-900 dark:text-slate-100">
                      Available Programs
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Support meaningful causes
                    </CardDescription>
                  </div>
                  {programs.filter((p) => p.is_active).length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {programs.filter((p) => p.is_active).length} active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {programs.filter((p) => p.is_active).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Target className="h-8 w-8 text-muted-foreground mb-3" />
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                      No Active Programs
                    </h3>
                    <p className="text-muted-foreground text-center text-xs">
                      Check back later for new programs.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {programs
                      .filter((p) => p.is_active)
                      .slice(0, 3)
                      .map((program) => {
                        const progressPercentage = program.target_amount
                          ? Math.min((program.current_amount / program.target_amount) * 100, 100)
                          : 0;
                        
                        return (
                          <div
                            key={program.id}
                            className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all duration-200 p-3 rounded-lg border border-gray-100 dark:border-gray-800"
                            onClick={() => setIsContributionModalOpen(true)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-semibold text-sm group-hover:text-emerald-600 transition-colors truncate">
                                    {program.name}
                                  </h3>
                                  <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-emerald-600 transition-colors ml-2 flex-shrink-0" />
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-bold text-emerald-600">
                                    ${program.current_amount.toLocaleString()}
                                  </span>
                                  {program.target_amount ? (
                                    <span className="text-xs text-muted-foreground">
                                      of ${program.target_amount.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-blue-600 font-medium">
                                      Ongoing
                                    </span>
                                  )}
                                </div>
                                {program.target_amount ? (
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                      <div
                                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-1.5 rounded-full transition-all duration-500"
                                        style={{
                                          width: `${progressPercentage}%`,
                                        }}
                                      ></div>
                                    </div>
                                    <span className="text-xs font-medium text-emerald-600 flex-shrink-0">
                                      {Math.round(progressPercentage)}%
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground">
                                    No target amount set
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    {programs.filter((p) => p.is_active).length > 0 && (
                      <div className="text-center pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab('programs')}
                          className="text-xs"
                        >
                          See All Programs
                          <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Contributions Card */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-slate-900 dark:text-slate-100">
                      Recent Contributions
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Your latest activity
                    </CardDescription>
                  </div>
                  {recentContributions.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {recentContributions.length} recent
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {recentContributions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Heart className="h-8 w-8 text-muted-foreground mb-3" />
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                      No Contributions Yet
                    </h3>
                    <p className="text-muted-foreground text-center text-xs mb-3">
                      Start contributing to support causes.
                    </p>
                    <Button
                      onClick={() => setIsContributionModalOpen(true)}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Contribute
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-0 max-h-80 overflow-y-auto">
                     {recentContributions.slice(0, 3).map((contribution, index) => {
                      const getStatusColor = (status: string) => {
                        switch (status.toLowerCase()) {
                          case 'completed':
                            return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
                          case 'pending':
                            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
                          case 'cancelled':
                            return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
                          default:
                            return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
                        }
                      };
                      
                      return (
                        <div
                          key={contribution.id}
                          className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors ${
                             index !== recentContributions.slice(0, 3).length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                           }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-lg flex items-center justify-center">
                                  <Heart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                {index === 0 && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                  </div>
                                )}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                    {contribution.program?.name || 'Program'}
                                  </p>
                                  <Badge 
                                    className={`text-xs px-1.5 py-0.5 ${getStatusColor(contribution.status)}`}
                                    variant="secondary"
                                  >
                                    {contribution.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {new Date(contribution.contributed_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                ${contribution.amount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                     {recentContributions.length > 0 && (
                       <div className="text-center pt-3 border-t border-gray-100 dark:border-gray-800">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => setActiveTab('contributions')}
                           className="text-xs"
                         >
                           View All Contributions
                           <ArrowUpRight className="ml-1 h-3 w-3" />
                         </Button>
                       </div>
                     )}
                   </div>
                 )}
               </CardContent>
             </Card>
          </div>
        </TabsContent>

        {/* Programs Tab */}
        {hasAdminAccess && (
          <TabsContent value="programs" className="space-y-8">
            <ProgramManagement 
              onProgramSelect={() => {}} 
              onProgramsUpdate={fetchData}
            />
          </TabsContent>
        )}
        {/* Admin Contributions Tab */}
        {hasAdminAccess && (
          <TabsContent value="contributions" className="space-y-6">
            <ContributionsTabContent programs={programs} />
          </TabsContent>
        )}
      </Tabs>

      {/* Contribution Modal */}
      <ContributionForm
        isOpen={isContributionModalOpen}
        onClose={() => setIsContributionModalOpen(false)}
        onSuccess={() => {
          fetchData();
          setIsContributionModalOpen(false);
        }}
      />
    </div>
  );
}

export default function ContributionsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ContributionsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
