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
  Clock, 
  Heart, 
  X, 
  Users, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  UserPlus
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, getUserDependents, getMosque, checkOnboardingStatus, createUserDependent, isUserMosqueAdmin } from '@/lib/api';
import { submitKhairatApplication, getKhairatMembers } from '@/lib/api/khairat-members';
import { bulkCreateKhairatMemberDependents } from '@/lib/api/khairat-member-dependents';
import { UserProfile, UserDependent, Mosque, CreateKhairatMemberDependent } from '@/types/database';
import { toast } from 'sonner';
import { KhairatRegistrationInfo } from '@/components/mosque/KhairatRegistrationInfo';
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
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userDependents, setUserDependents] = useState<UserDependent[]>([]);
  const [selectedDependentIds, setSelectedDependentIds] = useState<Set<string>>(new Set());
  const [tempDependents, setTempDependents] = useState<Array<Omit<UserDependent, 'id' | 'user_id' | 'created_at' | 'updated_at'>>>([]);
  const [currentStatus, setCurrentStatus] = useState<'approved' | 'active' | 'pending' | 'withdrawn' | 'rejected' | 'inactive' | null>(null);
  const [adminNotes, setAdminNotes] = useState<string | null>(null);
  const [isMosqueAdmin, setIsMosqueAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [showAddDependentForm, setShowAddDependentForm] = useState(false);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const [submittedMemberId, setSubmittedMemberId] = useState<string | null>(null);
  const [savingDependent, setSavingDependent] = useState(false);
  const [newDependent, setNewDependent] = useState({
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
  });
  const [saveToProfile, setSaveToProfile] = useState(true);

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

        // Check if user is mosque admin (only if logged in)
        let isAdmin = false;
        if (user?.id) {
          try {
            const adminCheck = await isUserMosqueAdmin(user.id, mosqueId);
            isAdmin = adminCheck;
            setIsMosqueAdmin(adminCheck);
          } catch (error) {
            console.error('Error checking admin status:', error);
          }
        }

        // Only pre-populate data if user is logged in and NOT admin
        if (user?.id && !isAdmin) {
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

        // Check existing application status (only if logged in)
        if (user?.id) {
          try {
            const existingMembers = await getKhairatMembers({
              mosque_id: mosqueId,
              user_id: user.id,
            });
            
            if (existingMembers && existingMembers.length > 0) {
              const latestMember = existingMembers[0];
              setCurrentStatus(latestMember.status as any);
              if (latestMember.admin_notes) {
                setAdminNotes(latestMember.admin_notes);
              }
            }
          } catch (error) {
            console.error('Error checking existing application:', error);
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load registration form');
      } finally {
        setLoading(false);
        setCheckingAdmin(false);
      }
    };

    fetchData();
  }, [user?.id, mosqueId, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if user is mosque admin
    if (isMosqueAdmin) {
      toast.error('Mosque administrators cannot submit applications. This page is for viewing purposes only.');
      return;
    }
    
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

      if (user && selectedDependentIds.size > 0 && memberId) {
        // For logged in users, get selected dependents from userDependents
        dependentsToAdd = userDependents
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
      } else if (!user && tempDependents.length > 0 && memberId) {
        // For non-logged in users, use temporary dependents
        dependentsToAdd = tempDependents.map(dep => ({
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600 mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading registration form...</p>
        </div>
      </div>
    );
  }

  // Show success page after submission
  if (submittedSuccessfully) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <Link href={`/${locale}/mosques/${mosqueId}`}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Mosque
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Application Submitted Successfully!</CardTitle>
                  <CardDescription className="mt-1">
                    Your Khairat registration has been received
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                  <strong>Thank you for your registration!</strong>
                  <p className="mt-2">
                    Your Khairat application for <strong>{mosque?.name}</strong> has been submitted successfully and is now pending review by the mosque administrator.
                  </p>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-semibold mb-2">Application Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Name:</span>
                      <span className="font-medium">{formData.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">IC:</span>
                      <span className="font-medium">{formData.ic_passport_number}</span>
                    </div>
                    {formData.phone && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Phone:</span>
                        <span className="font-medium">{formData.phone}</span>
                      </div>
                    )}
                    {formData.email && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Email:</span>
                        <span className="font-medium">{formData.email}</span>
                      </div>
                    )}
                    {mosque?.name && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Mosque:</span>
                        <span className="font-medium">{mosque.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {!user && (
                  <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                      <strong>Not logged in?</strong> We recommend you{' '}
                      <Link href={`/${locale}/login?returnUrl=/${locale}/mosques/${mosqueId}`} className="underline font-semibold">
                        create an account and log in
                      </Link>{' '}
                      to easily track your application status and view your membership history.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="pt-4 space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <strong>What happens next?</strong>
                  </p>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                    <li>The mosque administrator will review your application</li>
                    <li>You will be notified once a decision is made</li>
                    {user && <li>You can check your application status in your dashboard</li>}
                    {!user && <li>If you log in, you can track your application status</li>}
                  </ul>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <Link href={`/${locale}/mosques/${mosqueId}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Back to Mosque
                  </Button>
                </Link>
                {user ? (
                  <Link href={`/${locale}/dashboard`} className="flex-1">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/${locale}/login?returnUrl=/${locale}/dashboard`} className="flex-1">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Log In to Track Status
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

  // If user already has an application (and is logged in), show status
  if (user && currentStatus && currentStatus !== null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <Link href={`/${locale}/mosques/${mosqueId}`}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Mosque
                  </Button>
                </Link>
              </div>
              <CardTitle className="text-2xl">Khairat Registration Status</CardTitle>
              <CardDescription>
                Your application status for {mosque?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentStatus === 'active' && (
                  <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      <strong>Active Member</strong> - You are an active member of this mosque's Khairat program.
                    </AlertDescription>
                  </Alert>
                )}
                {currentStatus === 'pending' && (
                  <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                      <strong>Application Pending</strong> - Your application is under review. You will be notified once a decision is made.
                    </AlertDescription>
                  </Alert>
                )}
                {currentStatus === 'rejected' && adminNotes && (
                  <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      <strong>Application Rejected</strong>
                      <p className="mt-2">{adminNotes}</p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/${locale}/mosques/${mosqueId}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {tMosquePage('backToMosques')}
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {tRegister('pageTitle')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {mosque?.name
                  ? tRegister('pageSubtitle', { mosqueName: mosque.name })
                  : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Alert */}
        {isMosqueAdmin && (
          <Alert className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>View Only Mode</strong> - As a mosque administrator, you can view this form to see what users will experience, but you cannot submit applications.
            </AlertDescription>
          </Alert>
        )}

        {/* Login Encouragement for Non-Logged In Users */}
        {!user && (
          <Alert className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <strong>{tRegister('notLoggedInTitle')}</strong>{' '}
                  {tRegister('notLoggedInDescription')}{' '}
                  <Link href={`/${locale}/login?returnUrl=/${locale}/khairat/register/${mosqueId}`} className="underline font-semibold">
                    {tRegister('logIn')}
                  </Link>{' '}
                </div>
                <Link href={`/${locale}/login?returnUrl=/${locale}/khairat/register/${mosqueId}`}>
                  <Button size="sm" variant="outline" className="ml-4">
                    {tRegister('logIn')}
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

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
                  disabled={isMosqueAdmin}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ic_passport_number">
                  {tRegister('icNumber')}{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ic_passport_number"
                  value={formData.ic_passport_number}
                  onChange={(e) => {
                    const normalized = normalizeMalaysiaIc(e.target.value).slice(0, 12);
                    setFormData({ ...formData, ic_passport_number: normalized });
                  }}
                  placeholder={tRegister('icNumberPlaceholder')}
                  required
                  disabled={isMosqueAdmin}
                  maxLength={12}
                />
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
                    disabled={isMosqueAdmin}
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
                    disabled={isMosqueAdmin || (user !== null && user !== undefined)}
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
                  disabled={isMosqueAdmin}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="application_reason">
                  {tRegister('applicationReasonLabel')}
                </Label>
                <Textarea
                  id="application_reason"
                  value={formData.application_reason}
                  disabled={isMosqueAdmin}
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
                  {((user && userDependents.length > 0) || (!user && tempDependents.length > 0)) && !isMosqueAdmin && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddDependentForm(true)}
                      disabled={isMosqueAdmin}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {tRegister('addDependentButton')}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Existing Dependents List (for logged in users) */}
                {user && userDependents.length > 0 && (
                <div className="space-y-3 mb-4">
                  {userDependents.map((dependent) => (
                    <Card key={dependent.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedDependentIds.has(dependent.id)}
                      onCheckedChange={(checked) => {
                        if (isMosqueAdmin) return;
                        const newSet = new Set(selectedDependentIds);
                        if (checked) {
                          newSet.add(dependent.id);
                        } else {
                          newSet.delete(dependent.id);
                        }
                        setSelectedDependentIds(newSet);
                      }}
                      className="mt-1"
                      disabled={isMosqueAdmin}
                    />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{dependent.full_name}</p>
                            <Badge variant="outline" className="text-xs">
                              {dependent.relationship}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            {dependent.date_of_birth && (
                              <p>
                                {tRegister('dateOfBirth')}: {new Date(dependent.date_of_birth).toLocaleDateString()}
                              </p>
                            )}
                            {dependent.phone && (
                              <p>
                                {tRegister('phoneNumber')}: {dependent.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

                {/* Add Dependent Form */}
                {!isMosqueAdmin && (showAddDependentForm || (user ? userDependents.length === 0 : tempDependents.length === 0)) && (
                <Card className="border-2 border-dashed border-slate-300 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {tRegister('addDependentTitle')}
                    </CardTitle>
                    <CardDescription>
                      {tRegister('addDependentDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dep_full_name">
                          {tRegister('fullName')}{' '}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="dep_full_name"
                          value={newDependent.full_name}
                          onChange={(e) => setNewDependent({ ...newDependent, full_name: e.target.value })}
                          placeholder={tRegister('fullNamePlaceholder')}
                          disabled={isMosqueAdmin}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dep_relationship">
                          {tRegister('relationship')}{' '}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="dep_relationship"
                          value={newDependent.relationship}
                          onChange={(e) => setNewDependent({ ...newDependent, relationship: e.target.value })}
                          placeholder={tRegister('relationshipPlaceholder')}
                          disabled={isMosqueAdmin}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dep_ic">{tRegister('icNumber')}</Label>
                        <Input
                          id="dep_ic"
                          value={newDependent.ic_passport_number}
                          onChange={(e) =>
                            setNewDependent({
                              ...newDependent,
                              ic_passport_number: normalizeMalaysiaIc(e.target.value).slice(0, 12),
                            })
                          }
                          placeholder={tRegister('icNumberPlaceholder')}
                          disabled={isMosqueAdmin}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dep_dob">{tRegister('dateOfBirth')}</Label>
                        <Input
                          id="dep_dob"
                          type="date"
                          value={newDependent.date_of_birth}
                          onChange={(e) => setNewDependent({ ...newDependent, date_of_birth: e.target.value })}
                          disabled={isMosqueAdmin}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dep_gender">{tRegister('gender')}</Label>
                        <Select
                          value={newDependent.gender}
                          onValueChange={(value) => setNewDependent({ ...newDependent, gender: value })}
                          disabled={isMosqueAdmin}
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
                        <Label htmlFor="dep_phone">{tRegister('phoneNumber')}</Label>
                        <Input
                          id="dep_phone"
                          type="tel"
                          value={newDependent.phone}
                          onChange={(e) => setNewDependent({ ...newDependent, phone: e.target.value })}
                          placeholder={tRegister('phoneNumberPlaceholder')}
                          disabled={isMosqueAdmin}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="dep_email">{tRegister('email')}</Label>
                        <Input
                          id="dep_email"
                          type="email"
                          value={newDependent.email}
                          onChange={(e) => setNewDependent({ ...newDependent, email: e.target.value })}
                          placeholder={tRegister('emailPlaceholder')}
                          disabled={isMosqueAdmin}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="dep_address">{tRegister('address')}</Label>
                        <Textarea
                          id="dep_address"
                          value={newDependent.address}
                          onChange={(e) => setNewDependent({ ...newDependent, address: e.target.value })}
                          placeholder={tRegister('addressPlaceholder')}
                          rows={2}
                          disabled={isMosqueAdmin}
                        />
                      </div>
                    </div>

                    {user && (
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="save_to_profile"
                          checked={saveToProfile}
                          onCheckedChange={(checked) => setSaveToProfile(checked === true)}
                          disabled={isMosqueAdmin}
                        />
                        <Label htmlFor="save_to_profile" className="text-sm font-normal cursor-pointer">
                              {tRegister('saveToProfile')}
                        </Label>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddDependentForm(false);
                          setNewDependent({
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
                          });
                        }}
                        className="flex-1"
                        disabled={isMosqueAdmin}
                      >
                        {tMosquePage('cancel') || 'Cancel'}
                      </Button>
                      <Button
                        type="button"
                        onClick={async () => {
                          if (isMosqueAdmin) return;
                          if (!newDependent.full_name || !newDependent.relationship) {
                            toast.error(tRegister('dependentValidation'));
                            return;
                          }

                          setSavingDependent(true);
                          try {
                            if (user) {
                              // If save to profile, save to user_dependents first
                              let dependentId: string | null = null;
                              
                              if (saveToProfile && user.id) {
                                const result = await createUserDependent({
                                  user_id: user.id,
                                  full_name: newDependent.full_name,
                                  relationship: newDependent.relationship,
                                  date_of_birth: newDependent.date_of_birth || undefined,
                                  gender: newDependent.gender,
                                  phone: newDependent.phone || undefined,
                                  email: newDependent.email || undefined,
                                  address: newDependent.address || undefined,
                                  emergency_contact: newDependent.emergency_contact,
                                });

                                if (result.success && result.data) {
                                  dependentId = result.data.id;
                                  // Add to list and auto-select
                                  setUserDependents([...userDependents, result.data]);
                                  setSelectedDependentIds(new Set([...selectedDependentIds, result.data.id]));
                                  toast.success('Dependent saved to your profile and added to selection');
                                } else {
                                  throw new Error(result.error || 'Failed to save dependent');
                                }
                              } else {
                                // Create temporary dependent object for selection
                                const tempDependent: UserDependent = {
                                  id: `temp-${Date.now()}`,
                                  user_id: user.id,
                                  full_name: newDependent.full_name,
                                  relationship: newDependent.relationship,
                                  date_of_birth: newDependent.date_of_birth,
                                  gender: newDependent.gender,
                                  phone: newDependent.phone,
                                  email: newDependent.email,
                                  address: newDependent.address,
                                  emergency_contact: newDependent.emergency_contact,
                                  created_at: new Date().toISOString(),
                                  updated_at: new Date().toISOString(),
                                };
                                setUserDependents([...userDependents, tempDependent]);
                                setSelectedDependentIds(new Set([...selectedDependentIds, tempDependent.id]));
                                toast.success('Dependent added to selection');
                              }
                            } else {
                              // For non-logged in users, add to temporary dependents
                              setTempDependents([...tempDependents, {
                                full_name: newDependent.full_name,
                                relationship: newDependent.relationship,
                                date_of_birth: newDependent.date_of_birth,
                                gender: newDependent.gender,
                                phone: newDependent.phone,
                                email: newDependent.email,
                                address: newDependent.address,
                                emergency_contact: newDependent.emergency_contact,
                              }]);
                              toast.success('Dependent added to your registration');
                            }

                            // Reset form
                            setNewDependent({
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
                            });
                            setShowAddDependentForm(false);
                          } catch (error: any) {
                            console.error('Error saving dependent:', error);
                            toast.error(error?.message || 'Failed to save dependent');
                          } finally {
                            setSavingDependent(false);
                          }
                        }}
                        disabled={isMosqueAdmin || savingDependent || !newDependent.full_name || !newDependent.relationship}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        {savingDependent ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {tMosquePage('saving') || 'Saving...'}
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            {tRegister('addDependentButton')}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Temporary Dependents List (for non-logged in users) */}
              {!user && tempDependents.length > 0 && (
                <div className="space-y-3 mb-4">
                  {tempDependents.map((dependent, index) => (
                    <Card key={`temp-${index}`} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{dependent.full_name}</p>
                            <Badge variant="outline" className="text-xs">
                              {dependent.relationship}
                            </Badge>
                            {!isMosqueAdmin && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newTemp = [...tempDependents];
                                  newTemp.splice(index, 1);
                                  setTempDependents(newTemp);
                                }}
                                className="h-6 w-6 p-0 ml-auto"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            {dependent.date_of_birth && (
                              <p>DOB: {new Date(dependent.date_of_birth).toLocaleDateString()}</p>
                            )}
                            {dependent.phone && (
                              <p>Phone: {dependent.phone}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

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
              </CardContent>
            </Card>

          {/* Submit Button */}
          <div className="pt-6">
            <Button
              type="submit"
              disabled={isMosqueAdmin || submitting || !formData.full_name || !formData.ic_passport_number || !formData.phone || !formData.email || !formData.address}
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

