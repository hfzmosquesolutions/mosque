'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAdminAccess, useUserMosque } from '@/hooks/useUserRole';
import { useRouter } from 'next/navigation';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import { useAuth } from '@/contexts/AuthContext';
import { ClaimsManagement } from '@/components/admin/ClaimsManagement';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { getUserClaims } from '@/lib/api';
import { createClaim } from '@/lib/api';
import { getKhairatMembers } from '@/lib/api/khairat-members';
import { toast } from 'sonner';
import type { KhairatClaimWithDetails, ClaimPriority, CreateKhairatClaim } from '@/types/database';

function KhairatClaimsContent() {
  const t = useTranslations('khairat');
  const { user } = useAuth();
  const { hasAdminAccess, loading: adminLoading } = useAdminAccess();
  const { mosqueId } = useUserMosque();
  const { isCompleted, isLoading: onboardingLoading } = useOnboardingRedirect();
  const router = useRouter();
  const [userClaims, setUserClaims] = useState<KhairatClaimWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateClaimDialog, setShowCreateClaimDialog] = useState(false);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimForm, setClaimForm] = useState<{
    requested_amount: number;
    title: string;
    description: string;
    priority: ClaimPriority;
  }>({ requested_amount: 0, title: '', description: '', priority: 'medium' });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Regular user claims
      if (!hasAdminAccess) {
        try {
          const userClaimsResult = await getUserClaims(user.id, 50, 0);
          setUserClaims(userClaimsResult.data || []);
        } catch (e) {
          console.error('Error fetching user claims:', e);
          setUserClaims([]);
        }
      }
    } catch (error) {
      console.error('Error fetching claims data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, hasAdminAccess]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData, isCompleted, onboardingLoading]);

  if (onboardingLoading || !isCompleted || adminLoading) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading claims...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Khairat claims
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {hasAdminAccess
            ? 'Review and decide on khairat claims from your mosque members in one clear view.'
            : 'View your khairat claims and submit new requests when you need assistance.'}
        </p>
      </div>

      {hasAdminAccess ? (
        mosqueId ? (
          <ClaimsManagement mosqueId={mosqueId} showHeader={false} />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No mosque associated</p>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {userClaims.length === 0 ? (
            <div className="text-sm text-muted-foreground">No claims yet.</div>
          ) : (
            userClaims.map((claim) => (
              <div key={claim.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{claim.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{claim.program?.name || 'Khairat'} • {new Date(claim.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">{claim.status}</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">RM {claim.requested_amount.toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
          <div>
            <Button onClick={() => setShowCreateClaimDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Claim
            </Button>
          </div>
        </div>
      )}

      {/* Create Claim Dialog (user) */}
      {!hasAdminAccess && (
        <Dialog open={showCreateClaimDialog} onOpenChange={setShowCreateClaimDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t('claims.submitClaim', { fallback: 'Submit New Claim' })}</DialogTitle>
              <DialogDescription>
                {t('claims.claimDetails', { fallback: 'Fill in details for your khairat claim' })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('claims.title', { fallback: 'Title' })} *</Label>
                <Input
                  id="title"
                  type="text"
                  value={claimForm.title}
                  onChange={(e) => setClaimForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={t('claims.titlePlaceholder', { fallback: 'Enter claim title...' })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">{t('claims.claimAmount', { fallback: 'Claim Amount (RM)' })} *</Label>
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
                <Label htmlFor="priority">{t('common.priority', { fallback: 'Priority' })}</Label>
                <Select
                  value={claimForm.priority}
                  onValueChange={(value: ClaimPriority) =>
                    setClaimForm((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('claims.priority.low', { fallback: 'Low' })}</SelectItem>
                    <SelectItem value="medium">{t('claims.priority.medium', { fallback: 'Medium' })}</SelectItem>
                    <SelectItem value="high">{t('claims.priority.high', { fallback: 'High' })}</SelectItem>
                    <SelectItem value="urgent">{t('claims.priority.urgent', { fallback: 'Urgent' })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('claims.description', { fallback: 'Description' })} *</Label>
                <Textarea
                  id="description"
                  value={claimForm.description}
                  onChange={(e) => setClaimForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={t('claims.descriptionPlaceholder', { fallback: 'Describe your claim...' })}
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateClaimDialog(false)}
                  disabled={submittingClaim}
                >
                  {t('claims.cancel', { fallback: 'Cancel' })}
                </Button>
                <Button
                  onClick={async () => {
                    if (!user || !mosqueId || !claimForm.title || !claimForm.description || !claimForm.requested_amount) {
                      toast.error(t('claims.messages.fillRequired', { fallback: 'Please fill all required fields' }));
                      return;
                    }
                    try {
                      // Check if user is an active or approved member before allowing claim submission
                      try {
                        const members = await getKhairatMembers({ user_id: user.id, mosque_id: mosqueId });
                        const activeMember = members.find(m => m.status === 'active' || m.status === 'approved');
                        
                        if (!activeMember) {
                          const anyMember = members.find(m => m.status);
                          if (anyMember) {
                            toast.error('You must be an active or approved member of this mosque to submit a claim');
                          } else {
                            toast.error('You must be a member of this mosque to submit a claim. Please apply for membership first.');
                          }
                          return;
                        }
                      } catch (error) {
                        console.error('Error checking membership status:', error);
                        toast.error('Unable to verify membership status. Please try again.');
                        return;
                      }
                      
                      setSubmittingClaim(true);
                      
                      // Find the khairat_member record for this user and mosque
                      let khairatMemberId: string | undefined = undefined;
                      try {
                        const members = await getKhairatMembers({ user_id: user.id, mosque_id: mosqueId });
                        const activeMember = members.find(m => m.status === 'active' || m.status === 'approved');
                        if (activeMember) {
                          khairatMemberId = activeMember.id;
                        }
                      } catch (error) {
                        console.error('Error fetching khairat member:', error);
                        toast.error('Unable to verify membership. Please try again.');
                        setSubmittingClaim(false);
                        return;
                      }
                      
                      const payload: CreateKhairatClaim = {
                        claimant_id: user.id,
                        khairat_member_id: khairatMemberId,
                        mosque_id: mosqueId,
                        title: claimForm.title,
                        description: claimForm.description,
                        requested_amount: claimForm.requested_amount,
                        priority: claimForm.priority,
                      };
                      await createClaim(payload);
                      toast.success(t('claims.messages.submitSuccess', { fallback: 'Claim submitted successfully' }));
                      setShowCreateClaimDialog(false);
                      setClaimForm({ requested_amount: 0, title: '', description: '', priority: 'medium' });
                      fetchData();
                    } catch (e) {
                      console.error(e);
                      toast.error(t('claims.messages.submitError', { fallback: 'Failed to submit claim' }));
                    } finally {
                      setSubmittingClaim(false);
                    }
                  }}
                  disabled={submittingClaim}
                >
                  {submittingClaim ? t('claims.submitting', { fallback: 'Submitting...' }) : t('claims.submitClaimButton', { fallback: 'Submit Claim' })}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function KhairatClaimsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Khairat Claims">
        <KhairatClaimsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

