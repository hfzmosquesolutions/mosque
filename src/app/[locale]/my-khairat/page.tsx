'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HandHeart, MapPin, Building, Users, CreditCard, FileText, Plus, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess, useUserMosque } from '@/hooks/useUserRole';
import { UserPaymentsTable } from '@/components/khairat/UserPaymentsTable';
import { UserClaimsTable } from '@/components/khairat/UserClaimsTable';
import { UserApplicationsTable } from '@/components/khairat/UserApplicationsTable';
import { Loading } from '@/components/ui/loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { KhairatContribution, Mosque, CreateKhairatClaim } from '@/types/database';
import { getUserPaymentHistory, createClaim, searchMosques } from '@/lib/api';
import { getKariahMembers } from '@/lib/api/kariah-members';
import { toast } from 'sonner';

function MyKhairatContent() {
  const t = useTranslations('khairat');
  const router = useRouter();
  const { user } = useAuth();
  const { hasAdminAccess, loading: adminLoading } = useAdminAccess();
  const { mosqueId } = useUserMosque();
  const [loading, setLoading] = useState(true);
  const [userContributions, setUserContributions] = useState<any[]>([]);
  const [availableMosques, setAvailableMosques] = useState<Mosque[]>([]);
  const [loadingMosques, setLoadingMosques] = useState(false);
  const [activeTab, setActiveTab] = useState('my-mosques');
  const [showCreateClaimDialog, setShowCreateClaimDialog] = useState(false);
  const [isClaimMosquesOpen, setIsClaimMosquesOpen] = useState(false);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimForm, setClaimForm] = useState({
    title: '',
    requested_amount: 0,
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

  // If admin, redirect them to the admin Khairat page
  useEffect(() => {
    if (!adminLoading && hasAdminAccess) {
      router.replace('/khairat');
    }
  }, [adminLoading, hasAdminAccess, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const paymentHistoryResult = await getUserPaymentHistory(user.id);
      setUserContributions(paymentHistoryResult.data || []);
    } catch (e) {
      console.error('Error fetching user payment history', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handleSubmitClaim = async () => {
    if (!user || !mosqueId) {
      toast.error('User or mosque information not available');
      return;
    }

    if (!claimForm.title.trim() || claimForm.requested_amount <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmittingClaim(true);
    try {
      const claimData: CreateKhairatClaim = {
        claimant_id: user.id,
        mosque_id: mosqueId,
        requested_amount: claimForm.requested_amount,
        title: claimForm.title.trim(),
        description: claimForm.description.trim() || '',
        priority: claimForm.priority
      };

      const response = await createClaim(claimData);
      
      if (response.success) {
        toast.success('Claim submitted successfully');
        setShowCreateClaimDialog(false);
        setClaimForm({
          title: '',
          requested_amount: 0,
          description: '',
          priority: 'medium'
        });
        // Refresh the claims data
        window.location.reload();
      } else {
        toast.error(response.error || 'Failed to submit claim');
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast.error('Failed to submit claim');
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Load available mosques when opening the claim modal
  useEffect(() => {
    if (!isClaimMosquesOpen || !user) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingMosques(true);
        // Load all available mosques for selection
        const res = await searchMosques('', 50, 0);
        if (!cancelled) setAvailableMosques(res.data || []);
      } catch (e) {
        console.error('Failed to load mosques', e);
        if (!cancelled) setAvailableMosques([]);
      } finally {
        if (!cancelled) setLoadingMosques(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isClaimMosquesOpen, user]);

  if (adminLoading || hasAdminAccess) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          My Khairat
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-600">
          <TabsTrigger 
            value="my-mosques" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            <Heart className="h-4 w-4" />
            My Mosques
          </TabsTrigger>
          <TabsTrigger 
            value="payments" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            <CreditCard className="h-4 w-4" />
            Payment History
          </TabsTrigger>
          <TabsTrigger 
            value="claims" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            <FileText className="h-4 w-4" />
            Claim History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-mosques" forceMount className="space-y-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              My Mosques
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              View and manage your kariah and khairat memberships
            </p>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
              <Link href="/mosques" target="_blank" rel="noopener noreferrer">
                <Building className="mr-2 h-4 w-4" /> Find Mosque
              </Link>
            </Button>
          </div>
          <UserApplicationsTable showHeader={false} />
        </TabsContent>

        <TabsContent value="payments" forceMount className="space-y-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Payment History
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                View your payment history
              </p>
            </div>
          </div>
          
          {loading ? (
            <Loading message={t('loadingKhairatData')} />
          ) : (
            <UserPaymentsTable contributions={userContributions as any} showHeader={false} />
          )}
        </TabsContent>

        <TabsContent value="claims" forceMount className="space-y-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Claim History
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                View and manage your khairat claims
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsClaimMosquesOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Submit Claim
            </Button>
          </div>
          <UserClaimsTable showHeader={false} />
        </TabsContent>
      </Tabs>
      

      {/* Claim Mosque Selection Modal */}
      <Dialog open={isClaimMosquesOpen} onOpenChange={setIsClaimMosquesOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Mosque to Submit Claim</DialogTitle>
            <p className="text-sm text-muted-foreground">Choose a mosque to submit a khairat claim</p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {loadingMosques ? (
              <Loading message="Loading available mosques..." size="sm" />
            ) : availableMosques.length === 0 ? (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-sm text-muted-foreground mb-2">No mosques available.</div>
                <div className="text-xs text-muted-foreground">Try again later</div>
              </div>
            ) : (
              <div className="space-y-3">
                {availableMosques.map((mosque) => (
                  <Card
                    key={mosque.id}
                    className="cursor-pointer transition-all duration-200 hover:shadow-md border border-slate-200 dark:border-slate-700"
                    onClick={() => {
                      setIsClaimMosquesOpen(false);
                      window.open(`/mosques/${mosque.id}?openClaim=true`, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                          <img
                            src={mosque.logo_url || '/icon-kariah-masjid.png'}
                            alt={`${mosque.name} logo`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                            {mosque.name}
                          </h3>
                          {mosque.address && (
                            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 mt-1">
                              <MapPin className="h-3 w-3 mr-1 flex-shrink-0 text-blue-600" />
                              <span className="truncate">{mosque.address}</span>
                            </div>
                          )}
                          {mosque.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                              {mosque.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>Following</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Can't find your mosque?</div>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" asChild>
                <Link href="/mosques" target="_blank" rel="noopener noreferrer">Find more mosques</Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit Claim Dialog */}
      <Dialog open={showCreateClaimDialog} onOpenChange={setShowCreateClaimDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit New Claim</DialogTitle>
            <DialogDescription>
              Fill in details for your khairat claim
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                type="text"
                value={claimForm.title}
                onChange={(e) => setClaimForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter claim title..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Claim Amount (RM) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={claimForm.requested_amount || ''}
                onChange={(e) =>
                  setClaimForm((prev) => ({
                    ...prev,
                    requested_amount: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={claimForm.priority}
                onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') =>
                  setClaimForm((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                rows={3}
                value={claimForm.description}
                onChange={(e) => setClaimForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your situation and need for financial assistance..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateClaimDialog(false)}
                disabled={submittingClaim}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitClaim}
                disabled={submittingClaim}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submittingClaim ? 'Submitting...' : 'Submit Claim'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}

export default function MyKhairatPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Khairat">
        <MyKhairatContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}


