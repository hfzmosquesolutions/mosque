'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getDashboardUrl } from '@/lib/utils/dashboard';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  completeOnboarding,
  getUserProfile,
  getUserMosqueId,
  getMosque,
} from '@/lib/api';
import {
  Users,
  Shield,
  Building,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AddressForm, parseAddressString, formatAddressForDisplay } from '@/components/ui/address-form';
import { AddressData } from '@/types/database';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';

interface OnboardingData {
  // Personal Information
  fullName: string;
  phone: string;
  address: string;
  icPassportNumber: string;

  // Mosque admin role within the organisation
  mosqueRole?: string;

  // Role Selection (admin only now)
  accountType: 'admin' | '';

  // Admin-specific fields
  mosqueName?: string;
  mosqueAddress?: string;
  mosqueAddressData?: AddressData;
  institutionType?: 'mosque' | 'surau';
  // Extended mosque profile fields
  mosqueDescription?: string;
  mosquePhone?: string;
  mosqueEmail?: string;
  mosqueLogoUrl?: string;
  mosqueBannerUrl?: string;
}

function OnboardingContent() {
  const t = useTranslations('onboarding');
  const tMosque = useTranslations('mosquePage');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    phone: '',
    address: '',
    icPassportNumber: '',
    mosqueRole: '',
    accountType: 'admin', // Always admin for mosque administrators
    institutionType: 'mosque', // Default to mosque
    mosqueAddressData: {
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postcode: '',
      country: 'Malaysia',
      full_address: '',
    },
    mosqueDescription: '',
    mosquePhone: '',
    mosqueEmail: '',
    mosqueLogoUrl: '',
    mosqueBannerUrl: '',
  });
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Fetch and populate existing user data if available
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        const response = await getUserProfile(user.id);
        if (response.success && response.data) {
          const profile = response.data;

          // If onboarding already completed, don't show the wizard again
          if (profile.onboarding_completed) {
            setProfileCompleted(true);
          }

          // Populate form with existing data
          const updatedData: Partial<OnboardingData> = {
            fullName: profile.full_name || '',
            phone: profile.phone || '',
            address: profile.address || '',
            icPassportNumber: profile.ic_passport_number || '',
            accountType: 'admin', // Always admin
            // If we later store mosque role in preferences, we can prefill it here
          };

          // If user is admin, try to fetch mosque data
          if (profile.account_type === 'admin') {
            try {
              const mosqueId = await getUserMosqueId(user.id);
              if (mosqueId) {
                const mosqueResponse = await getMosque(mosqueId);
                if (mosqueResponse.success && mosqueResponse.data) {
                  const mosque = mosqueResponse.data;
                  updatedData.mosqueName = mosque.name;
                  updatedData.mosqueAddress = mosque.address || '';
                  updatedData.institutionType = mosque.institution_type || 'mosque';
                  updatedData.mosqueDescription = mosque.description || '';
                  updatedData.mosquePhone = mosque.phone || '';
                  updatedData.mosqueEmail = mosque.email || '';
                  updatedData.mosqueLogoUrl = mosque.logo_url || '';
                  updatedData.mosqueBannerUrl = mosque.banner_url || '';
                  
                  // Parse existing address or use structured address fields
                  updatedData.mosqueAddressData = mosque.address_line1 
                    ? {
                        address_line1: mosque.address_line1 || '',
                        address_line2: mosque.address_line2 || '',
                        city: mosque.city || '',
                        state: mosque.state || '',
                        postcode: mosque.postcode || '',
                        country: mosque.country || 'Malaysia',
                        full_address: formatAddressForDisplay({
                          address_line1: mosque.address_line1 || '',
                          address_line2: mosque.address_line2 || '',
                          city: mosque.city || '',
                          state: mosque.state || '',
                          postcode: mosque.postcode || '',
                          country: mosque.country || 'Malaysia',
                          full_address: '',
                        }),
                      }
                    : parseAddressString(mosque.address || '');
                }
              }
            } catch (mosqueError) {
              console.error('Error fetching mosque data:', mosqueError);
              // Continue without mosque data
            }
          }

          setData((prev) => ({ ...prev, ...updatedData }));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Don't show error toast as this is just pre-population
      } finally {
        setInitializing(false);
      }
    };

    fetchUserData();
  }, [user?.id]);

  // If onboarding already completed (user revisits /onboarding), redirect them to dashboard
  useEffect(() => {
    const redirectIfCompleted = async () => {
      if (!user?.id) return;
      const dashboardUrl = await getDashboardUrl(user.id);
      window.location.href = dashboardUrl;
    };

    if (profileCompleted && !hasCompleted) {
      redirectIfCompleted();
    }
  }, [profileCompleted, hasCompleted, user?.id]);

  const updateData = (field: keyof OnboardingData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const updateMosqueAddressData = (addressData: AddressData) => {
    setData((prev) => ({ 
      ...prev, 
      mosqueAddressData: addressData,
      mosqueAddress: addressData.full_address, // Keep legacy field in sync
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!data.fullName || !data.phone || !data.mosqueRole) {
        toast.error(t('fillRequiredFields'));
        return;
      }
    } else if (step === 2) {
      if (
        !data.mosqueName ||
        !data.mosqueAddress ||
        !data.mosquePhone ||
        !data.mosqueEmail ||
        !data.mosqueLogoUrl ||
        !data.mosqueBannerUrl
      ) {
        toast.error(t('fillRequiredFields'));
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      if (!user?.id) {
        toast.error(t('userNotAuthenticated'));
        return;
      }

      // Complete onboarding using Supabase API
      const result = await completeOnboarding(user.id, {
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        icPassportNumber: data.icPassportNumber,
        accountType: 'admin' as const,
        mosqueName: data.mosqueName,
        mosqueAddress: data.mosqueAddress,
        mosqueAddressData: data.mosqueAddressData,
        institutionType: data.institutionType || 'mosque',
        mosqueDescription: data.mosqueDescription,
        mosquePhone: data.mosquePhone,
        mosqueEmail: data.mosqueEmail,
        mosqueLogoUrl: data.mosqueLogoUrl,
        mosqueBannerUrl: data.mosqueBannerUrl,
      });

      if (result.success) {
        setHasCompleted(true);
        toast.success(t('onboardingCompleted'));
        
        // Wait a moment for database to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Trigger refresh event for useUserRole hook
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('refreshUserRole'));
        }
        
        // Wait a bit more for hook to refresh
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check for pending returnUrl (from login/signup flow)
        const pendingReturnUrl = typeof window !== 'undefined' 
          ? sessionStorage.getItem('pendingReturnUrl') 
          : null;
        
        // Clear pendingReturnUrl from sessionStorage
        if (typeof window !== 'undefined' && sessionStorage.getItem('pendingReturnUrl')) {
          sessionStorage.removeItem('pendingReturnUrl');
        }
        
        // Force a full page reload to ensure all hooks refresh with new admin status
        // Get correct dashboard URL based on admin status
        const dashboardUrl = await getDashboardUrl(user?.id);
        const redirectTo = pendingReturnUrl || dashboardUrl;
        window.location.href = redirectTo;
      } else {
        toast.error(result.error || t('onboardingFailed'));
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error(t('onboardingFailedRetry'));
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Users className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">
          {t('mosqueAdministratorInformation')}
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          {t('mosqueAdministratorInformationDescription')}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">{t('fullName')}</Label>
          <Input
            id="fullName"
            value={data.fullName}
            onChange={(e) => updateData('fullName', e.target.value)}
            placeholder={t('enterFullName')}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="phone">{t('phoneNumber')}</Label>
          <Input
            id="phone"
            value={data.phone}
            onChange={(e) => updateData('phone', e.target.value)}
            placeholder={t('enterPhoneNumber')}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="mosqueRole">{t('mosqueRoleLabel')}</Label>
          <Select
            value={data.mosqueRole || ''}
            onValueChange={(value) => updateData('mosqueRole', value)}
          >
            <SelectTrigger id="mosqueRole" className="mt-1">
              <SelectValue placeholder={t('mosqueRolePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chairman">{t('mosqueRoleChairman')}</SelectItem>
              <SelectItem value="deputy_chairman">{t('mosqueRoleDeputyChairman')}</SelectItem>
              <SelectItem value="secretary">{t('mosqueRoleSecretary')}</SelectItem>
              <SelectItem value="treasurer">{t('mosqueRoleTreasurer')}</SelectItem>
              <SelectItem value="committee_member">{t('mosqueRoleCommittee')}</SelectItem>
              <SelectItem value="imam">{t('mosqueRoleImam')}</SelectItem>
              <SelectItem value="bilal">{t('mosqueRoleBilal')}</SelectItem>
              <SelectItem value="staff">{t('mosqueRoleStaff')}</SelectItem>
              <SelectItem value="volunteer">{t('mosqueRoleVolunteer')}</SelectItem>
              <SelectItem value="other">{t('mosqueRoleOther')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <Building className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('mosqueSetup')}</h3>
          <p className="text-slate-600 dark:text-slate-400">
            {t('mosqueSetupDescription')}
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="mosqueName">{t('mosqueName')}</Label>
              <Input
                id="mosqueName"
                value={data.mosqueName || ''}
                onChange={(e) => updateData('mosqueName', e.target.value)}
                placeholder={t('enterMosqueName')}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="institutionType">{t('institutionType')}</Label>
              <Select
                value={data.institutionType || 'mosque'}
                onValueChange={(value) => updateData('institutionType', value as 'mosque' | 'surau')}
              >
                <SelectTrigger id="institutionType" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mosque">{t('mosque')}</SelectItem>
                  <SelectItem value="surau">{t('surau')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <AddressForm
                value={data.mosqueAddressData || {
                  address_line1: '',
                  address_line2: '',
                  city: '',
                  state: '',
                  postcode: '',
                  country: 'Malaysia',
                  full_address: '',
                }}
                onChange={updateMosqueAddressData}
                disabled={false}
                showFullAddress={false}
                className="mt-1"
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="mosquePhone">{tMosque('phoneNumber')}</Label>
                <Input
                  id="mosquePhone"
                  value={data.mosquePhone || ''}
                  onChange={(e) => updateData('mosquePhone', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="mosqueEmail">{tMosque('emailAddress')}</Label>
                <Input
                  id="mosqueEmail"
                  type="email"
                  value={data.mosqueEmail || ''}
                  onChange={(e) => updateData('mosqueEmail', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="mosqueDescription">{t('mosqueDescriptionLabel')}</Label>
                <Textarea
                  id="mosqueDescription"
                  value={data.mosqueDescription || ''}
                  onChange={(e) => updateData('mosqueDescription', e.target.value)}
                  rows={3}
                  className="mt-1"
                  placeholder={t('mosqueDescriptionPlaceholder')}
                />
              </div>

            </div>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ImageUpload
                  label={tMosque('mosqueLogo')}
                  description={tMosque('mosqueLogoDescription')}
                  currentImageUrl={data.mosqueLogoUrl || undefined}
                  onImageUpload={(url) => setData((prev) => ({ ...prev, mosqueLogoUrl: url }))}
                  onImageRemove={() => setData((prev) => ({ ...prev, mosqueLogoUrl: '' }))}
                  aspectRatio="square"
                  filePrefix="logo"
                />
                <ImageUpload
                  label={tMosque('mosqueBanner')}
                  description={tMosque('mosqueBannerDescription')}
                  currentImageUrl={data.mosqueBannerUrl || undefined}
                  onImageUpload={(url) => setData((prev) => ({ ...prev, mosqueBannerUrl: url }))}
                  onImageRemove={() => setData((prev) => ({ ...prev, mosqueBannerUrl: '' }))}
                  aspectRatio="banner"
                  filePrefix="banner"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const getMosqueRoleLabel = () => {
      switch (data.mosqueRole) {
        case 'chairman':
          return t('mosqueRoleChairman');
        case 'deputy_chairman':
          return t('mosqueRoleDeputyChairman');
        case 'secretary':
          return t('mosqueRoleSecretary');
        case 'treasurer':
          return t('mosqueRoleTreasurer');
        case 'committee_member':
          return t('mosqueRoleCommittee');
        case 'imam':
          return t('mosqueRoleImam');
        case 'bilal':
          return t('mosqueRoleBilal');
        case 'staff':
          return t('mosqueRoleStaff');
        case 'volunteer':
          return t('mosqueRoleVolunteer');
        case 'other':
          return t('mosqueRoleOther');
        default:
          return '';
      }
    };

    const mosqueRoleLabel = getMosqueRoleLabel();

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <CheckCircle className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('reviewConfirm')}</h3>
          <p className="text-slate-600 dark:text-slate-400">
            {t('reviewConfirmDescription')}
          </p>
        </div>

        <Card className="bg-slate-50 dark:bg-slate-800">
          <CardContent className="p-6 space-y-4">
            <div>
              <h4 className="font-semibold mb-2">{t('mosqueAdministratorInformation')}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">
                    {t('reviewStepAdministratorName')}:
                  </span>
                  <p className="font-medium">{data.fullName}</p>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">
                    {t('reviewStepPhone')}:
                  </span>
                  <p className="font-medium">{data.phone}</p>
                </div>
                {mosqueRoleLabel && (
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">
                      {t('reviewStepMosqueRole')}:
                    </span>
                    <p className="font-medium">{mosqueRoleLabel}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{t('mosqueInformation')}</h4>
              <div className="text-sm">
                {data.institutionType && (
                  <p className="mb-2">
                    <span className="text-slate-600 dark:text-slate-400">
                      {t('institutionType')}:
                    </span>{' '}
                    <span className="font-medium">
                      {data.institutionType === 'mosque' ? t('mosque') : t('surau')}
                    </span>
                  </p>
                )}
                {data.mosqueName && (
                  <p>
                    <span className="text-slate-600 dark:text-slate-400">
                      {t('mosqueName')}:
                    </span>{' '}
                    <span className="font-medium">{data.mosqueName}</span>
                  </p>
                )}
                {data.mosqueAddressData && data.mosqueAddressData.address_line1 && (
                  <div className="mt-2">
                    <p className="text-slate-600 dark:text-slate-400 mb-1">
                      {t('mosqueAddress')}:
                    </p>
                    <p className="text-sm font-medium leading-relaxed">
                      {[
                        data.mosqueAddressData.address_line1,
                        data.mosqueAddressData.address_line2,
                        data.mosqueAddressData.city,
                        data.mosqueAddressData.state,
                        data.mosqueAddressData.postcode,
                        data.mosqueAddressData.country,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                )}
                {data.mosqueDescription && (
                  <div className="mt-2">
                    <p className="text-slate-600 dark:text-slate-400 mb-1">
                      {t('mosqueDescriptionLabel')}:
                    </p>
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-line">
                      {data.mosqueDescription}
                    </p>
                  </div>
                )}
                {(data.mosquePhone || data.mosqueEmail) && (
                  <div className="mt-2 space-y-1">
                    {data.mosquePhone && (
                      <p>
                        <span className="text-slate-600 dark:text-slate-400">
                          {tMosque('phoneNumber')}:
                        </span>{' '}
                        <span className="font-medium">{data.mosquePhone}</span>
                      </p>
                    )}
                    {data.mosqueEmail && (
                      <p>
                        <span className="text-slate-600 dark:text-slate-400">
                          {tMosque('emailAddress')}:
                        </span>{' '}
                        <span className="font-medium break-all">
                          {data.mosqueEmail}
                        </span>
                      </p>
                    )}
                  </div>
                )}
                {(data.mosqueLogoUrl || data.mosqueBannerUrl) && (
                  <div className="mt-3 space-y-3">
                    {data.mosqueLogoUrl && (
                      <div>
                        <p className="text-slate-600 dark:text-slate-400 text-xs mb-1">
                          {tMosque('mosqueLogo')}
                        </p>
                        <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                          <img
                            src={data.mosqueLogoUrl}
                            alt="Mosque logo preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    {data.mosqueBannerUrl && (
                      <div>
                        <p className="text-slate-600 dark:text-slate-400 text-xs mb-1">
                          {tMosque('mosqueBanner')}
                        </p>
                        <div className="w-full max-w-xs h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                          <img
                            src={data.mosqueBannerUrl}
                            alt="Mosque banner preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (hasCompleted || profileCompleted || initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold mb-2">
                {hasCompleted || profileCompleted
                  ? t('onboardingCompleted')
                  : t('setupAccount')}
              </CardTitle>
              <CardDescription>
                {t('completing')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Main Content */}
      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mb-6">
              <CardTitle className="text-3xl font-bold mb-2">
                {t('setupYourMosque')}
              </CardTitle>
              <CardDescription className="text-lg">
                {t('stepOf', { step, total: 3 })}
              </CardDescription>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-4">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('back')}
              </Button>

              {step < 3 ? (
                <Button
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  {t('next')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? t('completing') : t('completeSetup')}
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <ProtectedRoute requireAuth={true} requireAdmin={false}>
      <OnboardingContent />
    </ProtectedRoute>
  );
}
