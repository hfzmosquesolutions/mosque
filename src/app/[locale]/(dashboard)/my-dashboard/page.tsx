'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTranslations } from 'next-intl';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  DollarSign,
  TrendingUp,
  Building,
  UserPlus,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  IdCard,
  CreditCard,
  ChevronDown,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUserPaymentHistory, getUserClaims, getUserDependents } from '@/lib/api';
import { getKhairatMemberById } from '@/lib/api/khairat-members';
import { supabase } from '@/lib/supabase';
import { PageLoading } from '@/components/ui/page-loading';
import { toast } from 'sonner';
import type { KhairatMember } from '@/types/database';
import type { UserDependent } from '@/types/database';

function UserDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  
  const [loading, setLoading] = useState(true);
  const [totalContributed, setTotalContributed] = useState(0);
  const [activeClaimsAmount, setActiveClaimsAmount] = useState(0);
  const [khairatMemberships, setKhairatMemberships] = useState<KhairatMember[]>([]);
  const [dependents, setDependents] = useState<UserDependent[]>([]);
  const [expandedMemberships, setExpandedMemberships] = useState<Set<string>>(new Set());
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [paymentPages, setPaymentPages] = useState<Record<string, number>>({});
  const [userClaims, setUserClaims] = useState<any[]>([]);
  const [claimPages, setClaimPages] = useState<Record<string, number>>({});
  const PAYMENTS_PER_PAGE = 3;
  const CLAIMS_PER_PAGE = 3;

  const toggleMembership = (membershipId: string) => {
    setExpandedMemberships(prev => {
      const newSet = new Set(prev);
      if (newSet.has(membershipId)) {
        newSet.delete(membershipId);
      } else {
        newSet.add(membershipId);
      }
      return newSet;
    });
  };

  const loadMorePayments = (membershipId: string) => {
    setPaymentPages(prev => ({
      ...prev,
      [membershipId]: (prev[membershipId] || 1) + 1
    }));
  };

  const loadMoreClaims = (membershipId: string) => {
    setClaimPages(prev => ({
      ...prev,
      [membershipId]: (prev[membershipId] || 1) + 1
    }));
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user's payment history
      const paymentResult = await getUserPaymentHistory(user.id);
      if (paymentResult.success && paymentResult.data) {
        setPaymentHistory(paymentResult.data);
        const completed = paymentResult.data.filter(p => p.status === 'completed');
        const total = completed.reduce((sum, p) => sum + (p.amount || 0), 0);
        setTotalContributed(total);
      }

      // Fetch user dependents
      const dependentsResult = await getUserDependents(user.id);
      if (dependentsResult.success && dependentsResult.data) {
        setDependents(dependentsResult.data);
      }

      // Fetch user claims
      const claimsResult = await getUserClaims(user.id, 100, 0);
      if (claimsResult.data) {
        setUserClaims(claimsResult.data);
        const approved = claimsResult.data.filter(c => c.status === 'approved');
        const total = approved.reduce((sum, c) => sum + (c.approved_amount || 0), 0);
        setActiveClaimsAmount(total);
      }

      // Fetch khairat memberships with full details including submitted info
      const { data: khairatData, error: khairatError } = await supabase
        .from('khairat_members')
        .select(`
          *,
          mosque:mosques(id, name, logo_url, banner_url, address),
          dependents:khairat_member_dependents(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (khairatError) {
        console.error('Error fetching khairat memberships:', khairatError);
      } else {
        setKhairatMemberships((khairatData || []) as KhairatMember[]);
      }


    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl p-6 text-white">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            {t('welcome')}, {user?.email?.split('@')[0] || 'User'}
          </h1>
          <p className="text-emerald-50 text-sm">
            Manage your khairat memberships
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
                  <p className="text-2xl font-bold">RM {totalContributed.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Approved Claims</p>
                  <p className="text-2xl font-bold">RM {activeClaimsAmount.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Khairat Memberships */}
        {khairatMemberships.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              Khairat Memberships
            </h2>
            <div className="space-y-4">
              {khairatMemberships.map((membership) => {
              const isExpanded = expandedMemberships.has(membership.id);
              return (
                <Collapsible
                  key={membership.id}
                  open={isExpanded}
                  onOpenChange={() => toggleMembership(membership.id)}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CollapsibleTrigger asChild>
                      <CardContent className="p-4 cursor-pointer">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                              {(membership.mosque as any)?.logo_url ? (
                                <img
                                  src={(membership.mosque as any).logo_url}
                                  alt={(membership.mosque as any)?.name || 'Mosque logo'}
                                  className="h-12 w-12 rounded-full object-cover"
                                />
                              ) : (
                                <Building className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-muted-foreground mb-1">
                                {(membership.mosque as any)?.name || 'Unknown Mosque'}
                              </p>
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-2xl font-bold">
                                  {membership.membership_number || 'N/A'}
                                </p>
                                <Badge
                                  variant={
                                    membership.status === 'approved' || membership.status === 'active'
                                      ? 'default'
                                      : membership.status === 'pending'
                                      ? 'secondary'
                                      : 'destructive'
                                  }
                                  className="text-xs"
                                >
                                  {membership.status}
                                </Badge>
                              </div>
                              
                              {/* Additional Details Preview */}
                              <div className="space-y-1.5 mb-2">
                                {membership.full_name && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <User className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{membership.full_name}</span>
                                  </div>
                                )}
                                {membership.phone && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Phone className="h-3 w-3 flex-shrink-0" />
                                    <span>{membership.phone}</span>
                                  </div>
                                )}
                                {(() => {
                                  const mosquePayments = paymentHistory.filter(
                                    (p) => p.mosque?.id === membership.mosque_id || p.program?.mosque?.id === membership.mosque_id
                                  );
                                  const completedPayments = mosquePayments.filter(p => p.status === 'completed');
                                  const totalPaid = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                                  const mosqueClaims = userClaims.filter(c => c.mosque_id === membership.mosque_id);
                                  const dependentsCount = membership.dependents?.length || 0;
                                  
                                  return (
                                    <div className="flex items-center gap-3 flex-wrap pt-1">
                                      {dependentsCount > 0 && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <UserPlus className="h-3 w-3" />
                                          <span>{dependentsCount} dependent{dependentsCount !== 1 ? 's' : ''}</span>
                                        </div>
                                      )}
                                      {mosquePayments.length > 0 && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <CreditCard className="h-3 w-3" />
                                          <span>{mosquePayments.length} payment{mosquePayments.length !== 1 ? 's' : ''}</span>
                                          {totalPaid > 0 && (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-medium ml-1">
                                              • RM {totalPaid.toLocaleString()}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      {mosqueClaims.length > 0 && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Shield className="h-3 w-3" />
                                          <span>{mosqueClaims.length} claim{mosqueClaims.length !== 1 ? 's' : ''}</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                              
                              <p className="text-xs text-muted-foreground">
                                Joined: {new Date(membership.created_at).toLocaleDateString()}
                              </p>
                              {!isExpanded && (
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5 font-medium">
                                  Click to view full details
                                </p>
                              )}
                            </div>
                          </div>
                          <ChevronDown 
                            className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 mt-1 ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-6 pb-4 pt-4 border-t">
                            <div className="space-y-5">
                              {/* Personal Information */}
                              {(membership.full_name || membership.ic_passport_number || membership.phone || membership.email || membership.address) && (
                                <div>
                                  <h4 className="font-semibold text-xs mb-1.5 text-muted-foreground uppercase tracking-wide">
                                    Personal Information
                                  </h4>
                                  <div className="space-y-1.5 text-sm">
                                    {membership.full_name && (
                                      <div className="flex items-center gap-2">
                                        <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                        <span className="text-muted-foreground">Name: </span>
                                        <span className="font-medium">{membership.full_name}</span>
                                      </div>
                                    )}
                                    {membership.ic_passport_number && (
                                      <div className="flex items-center gap-2">
                                        <IdCard className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                        <span className="text-muted-foreground">IC/Passport: </span>
                                        <span className="font-mono text-xs">{membership.ic_passport_number}</span>
                                      </div>
                                    )}
                                    {membership.phone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                        <span className="text-muted-foreground">Phone: </span>
                                        <span>{membership.phone}</span>
                                      </div>
                                    )}
                                    {membership.email && (
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                        <span className="text-muted-foreground">Email: </span>
                                        <span>{membership.email}</span>
                                      </div>
                                    )}
                                    {membership.address && (
                                      <div className="flex items-start gap-2">
                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <div>
                                          <span className="text-muted-foreground">Address: </span>
                                          <span>{membership.address}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Application Details */}
                              {(membership.mosque_id || membership.membership_number || membership.application_reason || membership.joined_date || membership.admin_notes) && (
                                <div>
                                  <h4 className="font-semibold text-xs mb-1.5 text-muted-foreground uppercase tracking-wide">
                                    Application Details
                                  </h4>
                                  <div className="space-y-1.5 text-sm">
                                    {(membership.mosque as any)?.name && membership.mosque_id && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Mosque:</span>
                                        <Link
                                          href={`/mosques/${membership.mosque_id}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                          {(membership.mosque as any).name}
                                        </Link>
                                      </div>
                                    )}
                                    {membership.membership_number && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Khairat Member ID:</span>
                                        <span className="font-mono text-xs">{membership.membership_number}</span>
                                      </div>
                                    )}
                                    {membership.joined_date && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Joined:</span>
                                        <span>{new Date(membership.joined_date).toLocaleDateString()}</span>
                                      </div>
                                    )}
                                    {membership.application_reason && (
                                      <div>
                                        <span className="text-muted-foreground text-xs">Reason: </span>
                                        <p className="mt-0.5 text-xs text-slate-700 dark:text-slate-300">
                                          {membership.application_reason}
                                        </p>
                                      </div>
                                    )}
                                    {membership.admin_notes && (
                                      <div>
                                        <span className="text-muted-foreground text-xs">Admin Notes: </span>
                                        <p className="mt-0.5 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs border border-amber-200 dark:border-amber-800">
                                          {membership.admin_notes}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Dependents */}
                              {membership.dependents && membership.dependents.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-xs mb-1.5 text-muted-foreground uppercase tracking-wide">
                                    Dependents ({membership.dependents.length})
                                  </h4>
                                  <div className="space-y-1 border rounded-md divide-y">
                                    {membership.dependents.map((dependent) => (
                                      <div
                                        key={dependent.id}
                                        className="px-2 py-1.5 text-xs"
                                      >
                                        <div className="flex items-center justify-between mb-0.5">
                                          <span className="font-medium">{dependent.full_name}</span>
                                          <Badge variant="outline" className="text-xs">{dependent.relationship}</Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
                                          {dependent.ic_passport_number && (
                                            <span>IC: {dependent.ic_passport_number}</span>
                                          )}
                                          {dependent.date_of_birth && (
                                            <span>DOB: {new Date(dependent.date_of_birth).toLocaleDateString()}</span>
                                          )}
                                          {dependent.phone && <span>Phone: {dependent.phone}</span>}
                                          {dependent.gender && <span>Gender: {dependent.gender}</span>}
                                          {dependent.emergency_contact && (
                                            <Badge variant="default" className="text-xs">
                                              Emergency
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Payment Records for this Mosque */}
                              {(() => {
                                const mosquePayments = paymentHistory.filter(
                                  (p) => p.mosque?.id === membership.mosque_id || p.program?.mosque?.id === membership.mosque_id
                                );
                                const currentPage = paymentPages[membership.id] || 1;
                                const displayedPayments = mosquePayments.slice(0, currentPage * PAYMENTS_PER_PAGE);
                                const hasMore = mosquePayments.length > displayedPayments.length;
                                
                                return mosquePayments.length > 0 ? (
                                  <div>
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                      <CreditCard className="h-4 w-4" />
                                      Payment Records ({mosquePayments.length})
                                    </h4>
                                    <div className="space-y-1 border rounded-md divide-y">
                                      {displayedPayments.map((payment) => (
                                        <div
                                          key={payment.id}
                                          className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                          <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                                RM {payment.amount.toLocaleString()}
                                              </span>
                                              <span className="text-muted-foreground">
                                                {new Date(payment.contributed_at).toLocaleDateString()}
                                              </span>
                                              {payment.payment_method && (
                                                <span className="text-muted-foreground hidden sm:inline">
                                                  {payment.payment_method === 'legacy_record' ? 'Legacy' : payment.payment_method}
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                              {payment.payment_type === 'legacy' && (
                                                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                                  Legacy
                                                </Badge>
                                              )}
                                              <Badge
                                                variant={
                                                  payment.status === 'completed'
                                                    ? 'default'
                                                    : payment.status === 'pending'
                                                    ? 'secondary'
                                                    : 'destructive'
                                                }
                                                className="text-xs"
                                              >
                                                {payment.status}
                                              </Badge>
                                            </div>
                                          </div>
                                          {payment.payment_reference && (
                                            <div className="text-xs text-muted-foreground mt-1 font-mono">
                                              Ref: {payment.payment_reference}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                    {hasMore && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => loadMorePayments(membership.id)}
                                        className="w-full text-xs mt-2"
                                      >
                                        Load More ({mosquePayments.length - displayedPayments.length} remaining)
                                      </Button>
                                    )}
                                  </div>
                                ) : null;
                              })()}

                              {/* Claim Records for this Mosque */}
                              {(() => {
                                const mosqueClaims = userClaims.filter(
                                  (c) => c.mosque_id === membership.mosque_id
                                );
                                const currentPage = claimPages[membership.id] || 1;
                                const displayedClaims = mosqueClaims.slice(0, currentPage * CLAIMS_PER_PAGE);
                                const hasMore = mosqueClaims.length > displayedClaims.length;
                                
                                return mosqueClaims.length > 0 ? (
                                  <div>
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                      <Shield className="h-4 w-4" />
                                      Claim Records ({mosqueClaims.length})
                                    </h4>
                                    <div className="space-y-1 border rounded-md divide-y">
                                      {displayedClaims.map((claim) => {
                                        const getStatusVariant = () => {
                                          if (claim.status === 'approved' || claim.status === 'paid') return 'default';
                                          if (claim.status === 'pending' || claim.status === 'under_review') return 'secondary';
                                          if (claim.status === 'rejected' || claim.status === 'cancelled') return 'destructive';
                                          return 'outline';
                                        };

                                        return (
                                          <div
                                            key={claim.id}
                                            className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                          >
                                            <div className="flex items-start justify-between gap-2 text-xs">
                                              <div className="flex-1 min-w-0">
                                                <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                                                  {claim.title}
                                                </div>
                                                <div className="flex items-center gap-3 flex-wrap text-muted-foreground">
                                                  <span>
                                                    Requested: <span className="font-medium text-slate-700 dark:text-slate-300">RM {claim.requested_amount?.toLocaleString() || '0'}</span>
                                                  </span>
                                                  {claim.approved_amount && (
                                                    <span>
                                                      Approved: <span className="font-medium text-emerald-600">RM {claim.approved_amount.toLocaleString()}</span>
                                                    </span>
                                                  )}
                                                  <span>{new Date(claim.created_at).toLocaleDateString()}</span>
                                                </div>
                                                {claim.claim_id && (
                                                  <div className="text-muted-foreground font-mono text-xs mt-1">
                                                    {claim.claim_id}
                                                  </div>
                                                )}
                                              </div>
                                              <Badge variant={getStatusVariant()} className="text-xs flex-shrink-0">
                                                {claim.status}
                                              </Badge>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    {hasMore && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => loadMoreClaims(membership.id)}
                                        className="w-full text-xs mt-2"
                                      >
                                        Load More ({mosqueClaims.length - displayedClaims.length} remaining)
                                      </Button>
                                    )}
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        </CollapsibleContent>
                  </Card>
                    </Collapsible>
                  );
                })}
            </div>
          </div>
        )}

        {/* Dependents */}
        {dependents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                My Dependents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dependents.map((dependent) => (
                  <div
                    key={dependent.id}
                    className="border rounded-lg px-4 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors bg-white dark:bg-slate-900 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{dependent.full_name}</h3>
                            <Badge variant="outline" className="text-xs">{dependent.relationship}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {dependent.date_of_birth && (
                              <span>DOB: {new Date(dependent.date_of_birth).toLocaleDateString()}</span>
                            )}
                            {dependent.phone && <span>{dependent.phone}</span>}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="flex-shrink-0 text-xs" asChild>
                        <Link href="/dependents">Manage</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty States */}
        {khairatMemberships.length === 0 && dependents.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Building className="h-8 w-8 text-slate-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    No memberships yet
                  </p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Get started by finding a mosque and registering for khairat membership.
                  </p>
                </div>
                <Button asChild className="mt-2">
                  <Link href="/mosques">
                    Find a Mosque
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </DashboardLayout>
  );
}

export default function UserDashboardPage() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const router = useRouter();

  // Redirect admin users to their admin dashboard
  useEffect(() => {
    if (user && !roleLoading && isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, roleLoading, router]);

  // Don't render anything while checking admin status or if redirecting
  if (roleLoading || (user && isAdmin)) {
    return null;
  }

  return (
    <ProtectedRoute requireAdmin={false}>
      <UserDashboardContent />
    </ProtectedRoute>
  );
}

