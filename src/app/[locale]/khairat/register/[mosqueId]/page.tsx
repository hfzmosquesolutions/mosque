'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Heart, 
  X, 
  Users, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  UserPlus,
  Building,
  Search
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useUserRole';
import { getDashboardUrlSync } from '@/lib/utils/dashboard';
import { getUserProfile, getUserDependents, getMosque, checkOnboardingStatus, createUserDependent } from '@/lib/api';
import { submitKhairatApplication } from '@/lib/api/khairat-members';
import { bulkCreateKhairatMemberDependents } from '@/lib/api/khairat-member-dependents';
import { UserProfile, UserDependent, Mosque, CreateKhairatMemberDependent } from '@/types/database';
import { toast } from 'sonner';
import { KhairatRegistrationInfo } from '@/components/mosque/KhairatRegistrationInfo';
import { KhairatStandardHeader } from '@/components/khairat/KhairatStandardHeader';
import { KhairatLoadingHeader } from '@/components/khairat/KhairatLoadingHeader';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { isValidMalaysiaIc, normalizeMalaysiaIc } from '@/lib/utils';

function KhairatRegisterPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mosqueId = params.mosqueId as string;
  const locale = params.locale as string;
  // Base mosque page translations
  const tMosquePage = useTranslations('mosquePage');
  // Register translations live under khairat.register in messages/*.json
  const tKhairat = useTranslations('khairat');
  const tRegister = useTranslations('khairat.register');
  const tKhairatManagement = useTranslations('khairatManagement');
  const { user } = useAuth();
  const { hasAdminAccess } = useAdminAccess();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userDependents, setUserDependents] = useState<UserDependent[]>([]);
  const [selectedDependentIds, setSelectedDependentIds] = useState<Set<string>>(new Set());
  const [tempDependents, setTempDependents] = useState<Array<Omit<UserDependent, 'id' | 'user_id' | 'created_at' | 'updated_at'>>>([]);
  const [showAddDependentForm, setShowAddDependentForm] = useState(false);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const [submittedMemberId, setSubmittedMemberId] = useState<string | null>(null);
  const [savingDependent, setSavingDependent] = useState(false);
  const [newDependents, setNewDependents] = useState<Array<{
    id: string;
    full_name: string;
    relationship: string;
    ic_passport_number: string;
    date_of_birth: string;
    gender: string;
    phone: string;
    email: string;
    address: string;
    emergency_contact: boolean;
    notes: string;
  }>>([]);
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [checkingIC, setCheckingIC] = useState(false);
  const [icCheckResult, setIcCheckResult] = useState<{
    found: boolean;
    status?: string;
    message?: string;
  } | null>(null);

  // Form state for application
  const [formData, setFormData] = useState({
    full_name: '',
    ic_passport_number: '',
    phone: '',
    email: '',
    address: '',
    application_reason: '',
  });

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch initial data (no login required)
  useEffect(() => {

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch mosque data
        const mosqueRes = await getMosque(mosqueId);
        if (mosqueRes.success && mosqueRes.data) {
          setMosque(mosqueRes.data);
        }

        // Pre-populate data if user is logged in
        if (user?.id) {
          // Fetch user profile
          const profileRes = await getUserProfile(user.id);
          if (profileRes.success && profileRes.data) {
            setUserProfile(profileRes.data);
            setFormData({
              full_name: profileRes.data.full_name || '',
              ic_passport_number: profileRes.data.ic_passport_number
                ? normalizeMalaysiaIc(profileRes.data.ic_passport_number).slice(0, 12)
                : '',
              phone: profileRes.data.phone || '',
              email: user.email || '',
              address: profileRes.data.address || '',
              application_reason: '',
            });
          }

          // Fetch dependents
          const dependentsRes = await getUserDependents(user.id);
          if (dependentsRes.success && dependentsRes.data) {
            setUserDependents(dependentsRes.data);
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load registration form');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, mosqueId, locale]);

  // Helper function to get translated status text
  const getStatusText = (status: string): string => {
    const normalized = status.toLowerCase();
    
    switch (normalized) {
      case 'active':
        return tKhairatManagement('active') || 'Active';
      case 'approved':
        return tKhairatManagement('approved') || 'Approved';
      case 'pending':
        return tKhairatManagement('pending') || 'Pending';
      case 'under_review':
        return tKhairatManagement('under_review') || 'Under Review';
      case 'rejected':
        return tKhairatManagement('rejected') || 'Rejected';
      case 'suspended':
        return tKhairatManagement('suspended') || 'Suspended';
      case 'inactive':
        return tKhairatManagement('inactive') || 'Inactive';
      case 'withdrawn':
        return tKhairatManagement('withdrawn') || 'Withdrawn';
      default:
        return status;
    }
  };

  // Helper function to get badge styling based on status
  const getStatusBadgeClassName = (status: string): string => {
    const normalized = status.toLowerCase();
    
    switch (normalized) {
      case 'active':
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      case 'pending':
      case 'under_review':
        return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      case 'rejected':
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case 'inactive':
      case 'withdrawn':
        return 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800';
    }
  };

  const handleCheckIC = async () => {
    if (!formData.ic_passport_number || !formData.ic_passport_number.trim()) {
      toast.error(tRegister('checkIC.icRequired') || 'Please enter your IC number');
      return;
    }

    if (!isValidMalaysiaIc(formData.ic_passport_number)) {
      toast.error(tRegister('checkIC.invalidIC') || 'Invalid IC number format');
      return;
    }

    setCheckingIC(true);
    setIcCheckResult(null);
    
    try {
      const normalizedIc = normalizeMalaysiaIc(formData.ic_passport_number);
      const response = await fetch('/api/khairat-members/check-by-ic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mosqueId,
          ic: normalizedIc,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to check IC registration');
      }

      const members = data.members || [];
      
      if (members.length > 0) {
        const latestMember = members[0];
        const translatedStatus = getStatusText(latestMember.status);
        setIcCheckResult({
          found: true,
          status: latestMember.status,
          message: tRegister('checkIC.alreadyRegistered', { status: translatedStatus }) || 
                   `This IC number is already registered with status: ${translatedStatus}`,
        });
        toast.warning(tRegister('checkIC.alreadyRegisteredWarning') || 
                     'This IC number is already registered. You may need to check your existing application status.');
      } else {
        setIcCheckResult({
          found: false,
          message: tRegister('checkIC.notRegistered') || 
                   'This IC number is not registered. You can proceed with registration.',
        });
        toast.success(tRegister('checkIC.notRegisteredSuccess') || 
                     'IC number is available for registration.');
      }
    } catch (error: any) {
      console.error('Error checking IC:', error);
      toast.error(error?.message || tRegister('checkIC.checkFailed') || 'Failed to check IC registration');
      setIcCheckResult({
        found: false,
        message: tRegister('checkIC.checkFailed') || 'Failed to check registration status',
      });
    } finally {
      setCheckingIC(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.ic_passport_number || !formData.phone || !formData.email || !formData.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!isValidMalaysiaIc(formData.ic_passport_number)) {
      toast.error('Invalid IC number.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitKhairatApplication({
        mosque_id: mosqueId,
        ic_passport_number: normalizeMalaysiaIc(formData.ic_passport_number),
        application_reason: formData.application_reason || '',
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
      });

      // If dependents are provided and member was created/reactivated, add dependents
      const memberId = result.member?.id || (result as any).memberId;
      let dependentsToAdd: Array<Omit<CreateKhairatMemberDependent, 'khairat_member_id'>> = [];

      // Include all dependents from the form array
      const formDependents = newDependents
        .filter(dep => dep.full_name && dep.relationship)
        .map(dep => ({
          full_name: dep.full_name,
          relationship: dep.relationship,
          ic_passport_number: dep.ic_passport_number || undefined,
          date_of_birth: dep.date_of_birth || undefined,
          gender: dep.gender || undefined,
          phone: dep.phone || undefined,
          email: dep.email || undefined,
          address: dep.address || undefined,
          emergency_contact: dep.emergency_contact || false,
          notes: dep.notes || undefined,
        }));
      dependentsToAdd = [...dependentsToAdd, ...formDependents];

      if (user && selectedDependentIds.size > 0 && memberId) {
        // For logged in users, get selected dependents from userDependents
        const selectedDeps = userDependents
          .filter(dep => selectedDependentIds.has(dep.id))
          .map(dep => ({
            full_name: dep.full_name,
            relationship: dep.relationship,
            ic_passport_number: undefined,
            date_of_birth: dep.date_of_birth || undefined,
            gender: dep.gender || undefined,
            phone: dep.phone || undefined,
            email: dep.email || undefined,
            address: dep.address || undefined,
            emergency_contact: dep.emergency_contact || false,
            notes: undefined,
          }));
        dependentsToAdd = [...dependentsToAdd, ...selectedDeps];
      } else if (!user && tempDependents.length > 0 && memberId) {
        // For non-logged in users, use temporary dependents
        const tempDeps = tempDependents.map(dep => ({
          full_name: dep.full_name,
          relationship: dep.relationship,
          ic_passport_number: undefined,
          date_of_birth: dep.date_of_birth || undefined,
          gender: dep.gender || undefined,
          phone: dep.phone || undefined,
          email: dep.email || undefined,
          address: dep.address || undefined,
          emergency_contact: dep.emergency_contact || false,
          notes: undefined,
        }));
        dependentsToAdd = [...dependentsToAdd, ...tempDeps];
      }

      if (dependentsToAdd.length > 0 && memberId) {
        try {
          await bulkCreateKhairatMemberDependents(memberId, dependentsToAdd);
          toast.success(`Application submitted with ${dependentsToAdd.length} dependent(s)`);
        } catch (depError: any) {
          console.error('Error adding dependents:', depError);
          toast.warning('Application submitted but some dependents could not be added');
        }
      }

      toast.success(result.message || 'Application submitted successfully');
      
      // Show success page instead of redirecting
      setSubmittedMemberId(result.member?.id || (result as any).memberId || null);
      setSubmittedSuccessfully(true);
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error(error?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <KhairatLoadingHeader
          locale={locale}
          mosqueId={mosqueId}
          title={tRegister('pageTitle')}
          subtitle={undefined}
          icon={UserPlus}
          iconBgColor="bg-blue-50 dark:bg-blue-950/20"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600 mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading registration form...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show success page after submission
  if (submittedSuccessfully) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <KhairatStandardHeader
          mosque={mosque}
          locale={locale}
          mosqueId={mosqueId}
          title={tRegister('success.title')}
          subtitle={tRegister('success.subtitle')}
          icon={CheckCircle2}
          iconBgColor="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <div className="max-w-2xl mx-auto px-4 pb-12">
          <Card>
            <CardContent className="space-y-4">
              <Alert className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                  <strong>{tRegister('success.thankYou')}</strong>
                  <p className="mt-2">
                    {tRegister('success.submittedMessage', { mosqueName: mosque?.name || '' })}
                  </p>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-semibold mb-2">{tRegister('success.applicationDetails')}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">{tRegister('success.name')}:</span>
                      <span className="font-medium">{formData.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">{tRegister('success.ic')}:</span>
                      <span className="font-medium">{formData.ic_passport_number}</span>
                    </div>
                    {formData.phone && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">{tRegister('success.phone')}:</span>
                        <span className="font-medium">{formData.phone}</span>
                      </div>
                    )}
                    {formData.email && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">{tRegister('success.email')}:</span>
                        <span className="font-medium">{formData.email}</span>
                      </div>
                    )}
                    {mosque?.name && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">{tRegister('success.mosque')}:</span>
                        <span className="font-medium">{mosque.name}</span>
                      </div>
                    )}
                  </div>
                </div>


                <div className="pt-4 space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <strong>{tRegister('success.whatHappensNext')}</strong>
                  </p>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                    <li>{tRegister('success.nextStep1')}</li>
                    <li>{tRegister('success.nextStep2')}</li>
                    <li>{tRegister('success.nextStep3')}</li>
                    {!user && (
                      <li>
                        {tRegister('success.nextStep4Guest')}{' '}
                        <Link href={`/${locale}/signup`} className="text-emerald-600 hover:underline">
                          {tRegister('success.createAccount')}
                        </Link>
                        {' '}{tRegister('success.nextStep4GuestOr')}
                      </li>
                    )}
                    {user && (
                      <li>{tRegister('success.nextStep4User')}</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <Link href={`/${locale}/mosques/${mosqueId}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    {tRegister('success.backToMosque')}
                  </Button>
                </Link>
                {user && (
                  <Link href={`/${locale}${getDashboardUrlSync(hasAdminAccess)}`} className="flex-1">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      {tRegister('success.goToDashboard')}
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <KhairatStandardHeader
        mosque={mosque}
        locale={locale}
        mosqueId={mosqueId}
        title={tRegister('pageTitle')}
        subtitle={mosque?.name ? tRegister('pageSubtitle', { mosqueName: mosque.name }) : undefined}
        icon={UserPlus}
        iconBgColor="bg-blue-50 dark:bg-blue-950/20"
        iconColor="text-blue-600 dark:text-blue-400"
      />
      <div className="max-w-3xl mx-auto px-4 pb-12">

        {/* Registration Info */}
        {mosqueId && (
          <div className="mb-6">
            <KhairatRegistrationInfo mosqueId={mosqueId} />
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{tRegister('personalInfoTitle')}</CardTitle>
              <CardDescription>
                {tRegister('personalInfoDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">
                  {tRegister('fullName')}{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder={tRegister('fullNamePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ic_passport_number">
                  {tRegister('icNumber')}{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="ic_passport_number"
                    value={formData.ic_passport_number}
                    onChange={(e) => {
                      const normalized = normalizeMalaysiaIc(e.target.value).slice(0, 12);
                      setFormData({ ...formData, ic_passport_number: normalized });
                      // Clear check result when IC changes
                      setIcCheckResult(null);
                    }}
                    placeholder={tRegister('icNumberPlaceholder')}
                    required
                    maxLength={12}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && formData.ic_passport_number.trim()) {
                        e.preventDefault();
                        handleCheckIC();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleCheckIC}
                    disabled={checkingIC || !formData.ic_passport_number.trim() || !isValidMalaysiaIc(formData.ic_passport_number)}
                    variant="outline"
                    size="default"
                    className="shrink-0"
                    title={tRegister('checkIC.buttonTitle') || 'Check if IC is already registered'}
                  >
                    {checkingIC ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {icCheckResult && (
                  <Alert 
                    className={icCheckResult.found 
                      ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" 
                      : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                    }
                  >
                    {icCheckResult.found ? (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )}
                    <AlertDescription 
                      className={icCheckResult.found 
                        ? "text-amber-800 dark:text-amber-200" 
                        : "text-emerald-800 dark:text-emerald-200"
                      }
                    >
                      {icCheckResult.message}
                      {icCheckResult.found && icCheckResult.status && (
                        <div className="mt-2 text-sm">
                          <strong>{tRegister('checkIC.statusLabel') || 'Status'}:</strong>{' '}
                          <Badge 
                            variant="outline" 
                            className={`ml-1 ${getStatusBadgeClassName(icCheckResult.status)}`}
                          >
                            {getStatusText(icCheckResult.status)}
                          </Badge>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                <p className="text-xs text-muted-foreground">
                  {tRegister('checkIC.helpText') || 'Click the search icon to check if this IC number is already registered'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {tRegister('phoneNumber')}{' '}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={tRegister('phoneNumberPlaceholder')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    {tRegister('email')}{' '}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={
                      user
                        ? tRegister('emailFromAccount')
                        : tRegister('emailPlaceholder')
                    }
                    required
                    disabled={user !== null && user !== undefined}
                    className={user ? "bg-slate-50 dark:bg-slate-800 cursor-not-allowed" : ""}
                  />
                  {user && (
                    <p className="text-xs text-muted-foreground">
                      {tRegister('emailFromAccount')}
                    </p>
                  )}
                  {!user && (
                    <p className="text-xs text-muted-foreground">
                      {tRegister('emailGuestHint')}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  {tRegister('address')}{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={tRegister('addressPlaceholder')}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="application_reason">
                  {tRegister('applicationReasonLabel')}
                </Label>
                <Textarea
                  id="application_reason"
                  value={formData.application_reason}
                  onChange={(e) => setFormData({ ...formData, application_reason: e.target.value })}
                  placeholder={tRegister('applicationReasonPlaceholder')}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dependents Section */}
          <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {tRegister('dependentsTitle')}
                    </CardTitle>
                    <CardDescription>
                      {user && userDependents.length > 0 
                        ? tRegister('dependentsDescriptionHas')
                        : !user && tempDependents.length > 0
                        ? tRegister('dependentsDescriptionGuestHas', { count: tempDependents.length })
                        : tRegister('dependentsDescriptionEmpty')}
                    </CardDescription>
                  </div>
                  {!showAddDependentForm && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddDependentForm(true);
                        // Initialize with one empty dependent form
                        if (newDependents.length === 0) {
                          setNewDependents([{
                            id: `dep-${Date.now()}`,
                            full_name: '',
                            relationship: '',
                            ic_passport_number: '',
                            date_of_birth: '',
                            gender: 'male',
                            phone: '',
                            email: '',
                            address: '',
                            emergency_contact: false,
                            notes: '',
                          }]);
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {tRegister('addDependentButton')}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Dependents are tracked but not displayed as cards - they'll be included in submission */}

                {/* Add Dependent Forms */}
                {showAddDependentForm && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold">{tRegister('dependentsTitle')}</h3>
                        <p className="text-sm text-muted-foreground">{tRegister('addDependentDescription')}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddDependentForm(false);
                          setNewDependents([]);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {newDependents.map((dependent, index) => (
                      <Card key={dependent.id} className="border-2 border-dashed border-slate-300 dark:border-slate-700">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {tRegister('addDependentTitle')} {newDependents.length > 1 ? `#${index + 1}` : ''}
                              </CardTitle>
                              <CardDescription>
                                {tRegister('addDependentDescription')}
                              </CardDescription>
                            </div>
                            {newDependents.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setNewDependents(newDependents.filter((_, i) => i !== index));
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`dep_full_name_${index}`}>
                                {tRegister('fullName')}{' '}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id={`dep_full_name_${index}`}
                                value={dependent.full_name}
                                onChange={(e) => {
                                  const updated = [...newDependents];
                                  updated[index].full_name = e.target.value;
                                  setNewDependents(updated);
                                }}
                                placeholder={tRegister('fullNamePlaceholder')}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`dep_relationship_${index}`}>
                                {tRegister('relationship')}{' '}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id={`dep_relationship_${index}`}
                                value={dependent.relationship}
                                onChange={(e) => {
                                  const updated = [...newDependents];
                                  updated[index].relationship = e.target.value;
                                  setNewDependents(updated);
                                }}
                                placeholder={tRegister('relationshipPlaceholder')}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`dep_ic_${index}`}>{tRegister('icNumber')}</Label>
                              <Input
                                id={`dep_ic_${index}`}
                                value={dependent.ic_passport_number}
                                onChange={(e) => {
                                  const updated = [...newDependents];
                                  updated[index].ic_passport_number = normalizeMalaysiaIc(e.target.value).slice(0, 12);
                                  setNewDependents(updated);
                                }}
                                placeholder={tRegister('icNumberPlaceholder')}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`dep_dob_${index}`}>{tRegister('dateOfBirth')}</Label>
                              <Input
                                id={`dep_dob_${index}`}
                                type="date"
                                value={dependent.date_of_birth}
                                onChange={(e) => {
                                  const updated = [...newDependents];
                                  updated[index].date_of_birth = e.target.value;
                                  setNewDependents(updated);
                                }}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`dep_gender_${index}`}>{tRegister('gender')}</Label>
                              <Select
                                value={dependent.gender}
                                onValueChange={(value) => {
                                  const updated = [...newDependents];
                                  updated[index].gender = value;
                                  setNewDependents(updated);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={tRegister('selectGender')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="male">{tRegister('genderMale')}</SelectItem>
                                  <SelectItem value="female">{tRegister('genderFemale')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`dep_phone_${index}`}>{tRegister('phoneNumber')}</Label>
                              <Input
                                id={`dep_phone_${index}`}
                                type="tel"
                                value={dependent.phone}
                                onChange={(e) => {
                                  const updated = [...newDependents];
                                  updated[index].phone = e.target.value;
                                  setNewDependents(updated);
                                }}
                                placeholder={tRegister('phoneNumberPlaceholder')}
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor={`dep_email_${index}`}>{tRegister('email')}</Label>
                              <Input
                                id={`dep_email_${index}`}
                                type="email"
                                value={dependent.email}
                                onChange={(e) => {
                                  const updated = [...newDependents];
                                  updated[index].email = e.target.value;
                                  setNewDependents(updated);
                                }}
                                placeholder={tRegister('emailPlaceholder')}
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor={`dep_address_${index}`}>{tRegister('address')}</Label>
                              <Textarea
                                id={`dep_address_${index}`}
                                value={dependent.address}
                                onChange={(e) => {
                                  const updated = [...newDependents];
                                  updated[index].address = e.target.value;
                                  setNewDependents(updated);
                                }}
                                placeholder={tRegister('addressPlaceholder')}
                                rows={2}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setNewDependents([...newDependents, {
                          id: `dep-${Date.now()}-${Math.random()}`,
                          full_name: '',
                          relationship: '',
                          ic_passport_number: '',
                          date_of_birth: '',
                          gender: 'male',
                          phone: '',
                          email: '',
                          address: '',
                          emergency_contact: false,
                          notes: '',
                        }]);
                      }}
                      className="w-full"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {tRegister('addAnotherDependent') || 'Add Another Dependent'}
                    </Button>
                    {newDependents.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center">
                        {tRegister('dependentFormNote') || 'Fill in the dependent information above. It will be included when you submit the registration form.'}
                      </p>
                    )}
                  </div>
                )}

              {/* Temporary Dependents List (for non-logged in users) */}

              {/* Show summary only when form is not visible */}
              {!showAddDependentForm && (
                <>
                  {user && selectedDependentIds.size > 0 && userDependents.length > 0 && (
                    <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <p className="text-sm text-emerald-800 dark:text-emerald-200">
                        {tRegister('dependentsSelectedSummary', {
                          count: selectedDependentIds.size,
                        })}
                      </p>
                    </div>
                  )}
                  {!user && tempDependents.length > 0 && (
                    <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <p className="text-sm text-emerald-800 dark:text-emerald-200">
                        {tRegister('dependentsGuestSummary', {
                          count: tempDependents.length,
                        })}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="pt-6">
            <Button
              type="submit"
              disabled={submitting || !formData.full_name || !formData.ic_passport_number || !formData.phone || !formData.email || !formData.address}
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-11"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {tMosquePage('saving') || 'Submitting...'}
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {tRegister('submitApplication')}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function KhairatRegisterPage() {
  return <KhairatRegisterPageContent />;
}

