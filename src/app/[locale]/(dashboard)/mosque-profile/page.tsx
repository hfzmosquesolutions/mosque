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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Building,
  Save,
  Eye,
  EyeOff,
  Phone,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Target,
  Plus,
  TrendingUp,
  ExternalLink,
  Image as ImageIcon,
  Settings,
  DollarSign,
  HeartHandshake,
} from 'lucide-react';
import { useAdminAccess } from '@/hooks/useUserRole';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  getMosqueKhairatSettings,
  getUserMosqueId,
  getMosque,
  updateMosque,
  getKhairatRegistrationSettings,
  updateKhairatRegistrationSettings,
  KariahRegistrationSettings,
} from '@/lib/api';
import type {
  MosqueKhairatSettings,
  Mosque,
  UpdateMosque,
} from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import { FEATURES } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { ImageUpload } from '@/components/ui/image-upload';
import { AddressForm, AddressData, parseAddressString, formatAddressForDisplay } from '@/components/ui/address-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganizationPeopleManagement } from '@/components/admin/OrganizationPeopleManagement';
import { updateMosqueSettings } from '@/lib/api';
import { PageLoading } from '@/components/ui/page-loading';

// Extended mosque interface for profile editing
interface MosqueProfileData extends Mosque {
  // Additional fields for UI that might not be in the database yet
  established_year?: string;
  capacity?: string;
  imam_name?: string;
  services?: string[];
  // Address data for the form
  addressData?: AddressData;
}

// Type for mosque settings
interface MosqueSettings {
  established_year?: string;
  capacity?: string;
  imam_name?: string;
  services?: string[];
}

const getDefaultMosqueProfile = (): MosqueProfileData => ({
  id: '',
  name: '',
  description: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  user_id: '',
  settings: {
    established_year: '',
    capacity: '',
    imam_name: '',
    services: [
      'Daily Prayers',
      'Islamic Education',
      'Community Activities',
    ],
  },
  is_private: false,
  created_at: '',
  updated_at: '',
  addressData: {
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Malaysia',
    full_address: '',
  },
});

function MosqueProfileContent() {
  const { user } = useAuth();
  const { hasAdminAccess, loading: adminLoading } = useAdminAccess();
  const { isCompleted, isLoading: onboardingLoading } = useOnboardingRedirect();
  const t = useTranslations('mosquePage');
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<MosqueProfileData>(
    getDefaultMosqueProfile()
  );
  const [originalProfile, setOriginalProfile] = useState<MosqueProfileData>(
    getDefaultMosqueProfile()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [khairatSettings, setKhairatSettings] = useState<MosqueKhairatSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [mosqueId, setMosqueId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [isOrganizationEnabled, setIsOrganizationEnabled] = useState(false);
  const [savingOrganizationToggle, setSavingOrganizationToggle] = useState(false);
  const [khairatRegistrationSettings, setKhairatRegistrationSettings] = useState<KariahRegistrationSettings>({
    requirements: '',
    benefits: '',
    custom_message: '',
  });
  const [loadingRegistrationSettings, setLoadingRegistrationSettings] = useState(true);
  const [savingRegistrationSettings, setSavingRegistrationSettings] = useState(false);

  const updateProfile = (
    field: keyof MosqueProfileData,
    value: string | boolean | Record<string, unknown>
  ) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const updateAddressData = (addressData: AddressData) => {
    setProfile((prev) => ({ ...prev, addressData }));
  };


  const loadUserMosque = useCallback(async () => {
    if (!user) return;

    try {
      const userMosqueId = await getUserMosqueId(user.id);
      setMosqueId(userMosqueId);
    } catch (error) {
      console.error('Error loading user mosque:', error);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUserMosque();
    }
  }, [user, loadUserMosque, isCompleted, onboardingLoading]);

  const loadMosqueData = useCallback(async () => {
    if (!mosqueId) return;

    setIsLoading(true);
    try {
      const response = await getMosque(mosqueId);
      if (response.success && response.data) {
        // Parse existing address or use structured address fields
        const addressData = response.data.address_line1 
          ? {
              address_line1: response.data.address_line1 || '',
              address_line2: response.data.address_line2 || '',
              city: response.data.city || '',
              state: response.data.state || '',
              postcode: response.data.postcode || '',
              country: response.data.country || 'Malaysia',
              full_address: formatAddressForDisplay({
                address_line1: response.data.address_line1 || '',
                address_line2: response.data.address_line2 || '',
                city: response.data.city || '',
                state: response.data.state || '',
                postcode: response.data.postcode || '',
                country: response.data.country || 'Malaysia',
                full_address: '',
              }),
            }
          : parseAddressString(response.data.address || '');

        const mosqueData: MosqueProfileData = {
          ...response.data,
          // Extract additional fields from settings if they exist
          established_year:
            (response.data.settings as MosqueSettings)?.established_year || '',
          capacity: (response.data.settings as MosqueSettings)?.capacity || '',
          imam_name:
            (response.data.settings as MosqueSettings)?.imam_name || '',
          services: (response.data.settings as MosqueSettings)?.services || [
            'Daily Prayers',
            'Islamic Education',
            'Community Activities',
          ],
          addressData,
        };
        setProfile(mosqueData);
        setOriginalProfile(mosqueData);
      }
    } catch (error) {
      console.error('Error loading mosque data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [mosqueId]);

  const loadKhairatSettings = useCallback(async () => {
    if (!mosqueId) return;

    setSettingsLoading(true);
    try {
      const response = await getMosqueKhairatSettings(mosqueId);
      if (response.success && response.data) {
        setKhairatSettings(response.data);
      }
    } catch (error) {
      console.error('Error loading khairat settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  }, [mosqueId]);

  const loadOrganizationServiceStatus = useCallback(async () => {
    if (!mosqueId) return;
    
    try {
      const response = await getMosque(mosqueId);
      if (response.success && response.data) {
        const enabledServices = (response.data.settings?.enabled_services as string[]) || [];
        setIsOrganizationEnabled(enabledServices.includes('organization_people'));
      }
    } catch (error) {
      console.error('Error loading organization service status:', error);
    }
  }, [mosqueId]);

  const loadKhairatRegistrationSettings = useCallback(async () => {
    if (!mosqueId) return;

    setLoadingRegistrationSettings(true);
    try {
      const response = await getKhairatRegistrationSettings(mosqueId);
      if (response.success && response.data) {
        setKhairatRegistrationSettings(response.data);
      }
    } catch (error) {
      console.error('Error loading khairat registration settings:', error);
    } finally {
      setLoadingRegistrationSettings(false);
    }
  }, [mosqueId]);

  const handleSaveRegistrationSettings = async () => {
    if (!mosqueId) return;

    setSavingRegistrationSettings(true);
    try {
      const response = await updateKhairatRegistrationSettings(mosqueId, khairatRegistrationSettings);
      if (response.success) {
        toast.success(t('settingsSaved'));
      } else {
        toast.error(response.error || t('failedToSave'));
      }
    } catch (error) {
      console.error('Error saving khairat registration settings:', error);
      toast.error(t('failedToSave'));
    } finally {
      setSavingRegistrationSettings(false);
    }
  };

  const handleOrganizationToggle = async (enabled: boolean) => {
    if (!mosqueId) return;
    
    setSavingOrganizationToggle(true);
    try {
      const currentServices = (profile.settings?.enabled_services as string[]) || [];
      const updatedServices = enabled
        ? [...currentServices.filter(s => s !== 'organization_people'), 'organization_people']
        : currentServices.filter(s => s !== 'organization_people');

      const response = await updateMosqueSettings(mosqueId, {
        enabled_services: updatedServices,
      });

      if (response.success) {
        setIsOrganizationEnabled(enabled);
        setProfile(prev => ({
          ...prev,
          settings: {
            ...(prev.settings || {}),
            enabled_services: updatedServices
          }
        }));
        toast.success(enabled ? t('serviceManagement.serviceEnabled') : t('serviceManagement.serviceDisabled'));
      } else {
        toast.error(response.error || t('serviceManagement.failedToUpdate'));
      }
    } catch (error) {
      console.error('Error updating organization service:', error);
      toast.error(t('serviceManagement.failedToUpdate'));
    } finally {
      setSavingOrganizationToggle(false);
    }
  };

  useEffect(() => {
    if (mosqueId) {
      loadMosqueData();
      loadKhairatSettings();
      loadOrganizationServiceStatus();
      loadKhairatRegistrationSettings();
    }
  }, [mosqueId, loadMosqueData, loadKhairatSettings, loadOrganizationServiceStatus, loadKhairatRegistrationSettings]);

  const handleSave = async () => {
    if (!mosqueId) return;

    setIsSaving(true);
    try {
      // Prepare update data
      const updateData: UpdateMosque = {
        name: profile.name,
        description: profile.description || undefined,
        address: profile.addressData?.full_address || profile.address || undefined,
        address_line1: profile.addressData?.address_line1 || undefined,
        address_line2: profile.addressData?.address_line2 || undefined,
        city: profile.addressData?.city || undefined,
        state: profile.addressData?.state || undefined,
        postcode: profile.addressData?.postcode || undefined,
        country: profile.addressData?.country || undefined,
        phone: profile.phone || undefined,
        email: profile.email || undefined,
        website: profile.website || undefined,
        logo_url: profile.logo_url || undefined,
        banner_url: profile.banner_url || undefined,
        settings: {
          ...profile.settings,
          established_year: profile.established_year,
          capacity: profile.capacity,
          imam_name: profile.imam_name,
          services: profile.services,
        },
        is_private: profile.is_private,
      };

      const response = await updateMosque(mosqueId, updateData);
      if (response.success) {
        setOriginalProfile(profile);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        console.error('Failed to save mosque profile:', response.error);
      }
    } catch (error) {
      console.error('Error saving mosque profile:', error);
    } finally {
      setIsSaving(false);
    }
  };


  // ProtectedRoute already handles access control
  // If we reach here, user is authenticated and has admin access
  // Wait for loading to complete before rendering
  const isPageLoading = onboardingLoading || !isCompleted || adminLoading || isLoading || settingsLoading;

  return (
    <DashboardLayout title={t('profile')}>
      <div className="space-y-6">
         {/* Header with Title */}
         <div>
           <h1 className="text-3xl font-bold tracking-tight">
             {t('mosquePage')}
           </h1>
         </div>

         {isPageLoading ? (
           <PageLoading />
         ) : (
          <>
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-600">
            <TabsTrigger 
              value="profile" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              <Building className="h-4 w-4" />
              {t('profile')}
            </TabsTrigger>
            <TabsTrigger 
              value="organization" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              <Users className="h-4 w-4" />
              {t('organizationPeople.title')}
            </TabsTrigger>
            {khairatSettings && (
              <TabsTrigger 
                value="khairat" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                <HeartHandshake className="h-4 w-4" />
                {t('khairatSettings')}
              </TabsTrigger>
            )}
              </TabsList>

              <TabsContent value="profile" forceMount className="space-y-6 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {t('profile')}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t('manageBasicInfoSettings')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {t('savedSuccessfully')}
                    </span>
                  </div>
                )}
                <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      {t('saving')}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {t('saveChanges')}
                    </div>
                  )}
                </Button>
              </div>
            </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Basic Information */}
                  <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {t('basicInformation')}
                </h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mosqueName">
                      {t('mosqueNameRequired')}
                    </Label>
                    <Input
                      id="mosqueName"
                      value={profile.name}
                      onChange={(e) => updateProfile('name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="establishedYear">
                      {t('establishedYear')}
                    </Label>
                    <Input
                      id="establishedYear"
                      value={profile.established_year}
                      onChange={(e) =>
                        updateProfile('established_year', e.target.value)
                      }
                      placeholder={t('establishedYearPlaceholder')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">
                    {t('description')}
                  </Label>
                  <Textarea
                    id="description"
                    value={profile.description}
                    onChange={(e) =>
                      updateProfile('description', e.target.value)
                    }
                    rows={3}
                    placeholder={t('descriptionPlaceholder')}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">
                      {t('capacity')}
                    </Label>
                    <Input
                      id="capacity"
                      value={profile.capacity}
                      onChange={(e) =>
                        updateProfile('capacity', e.target.value)
                      }
                      placeholder={t('capacityPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imamName">
                      {t('imamName')}
                    </Label>
                    <Input
                      id="imamName"
                      value={profile.imam_name}
                      onChange={(e) =>
                        updateProfile('imam_name', e.target.value)
                      }
                      placeholder={t('imamNamePlaceholder')}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr className="border-slate-200 dark:border-slate-700" />

            {/* Mosque Branding Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {t('mosqueBranding')}
                </h3>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ImageUpload
                    label={t('mosqueLogo')}
                    description={t('mosqueLogoDescription')}
                    currentImageUrl={profile.logo_url}
                    onImageUpload={(url) => updateProfile('logo_url', url)}
                    onImageRemove={() => updateProfile('logo_url', '')}
                    onImageChange={async (url) => {
                      if (!mosqueId) return;
                      const response = await updateMosque(mosqueId, {
                        logo_url: url === null ? (null as any) : url,
                      });
                      if (!response.success) {
                        throw new Error(
                          response.error || 'Failed to update logo'
                        );
                      }
                      toast.success(t('logoUpdatedSuccessfully'));
                    }}
                    aspectRatio="square"
                    maxSizeInMB={5}
                  />
                  <ImageUpload
                    label={t('mosqueBanner')}
                    description={t('mosqueBannerDescription')}
                    currentImageUrl={profile.banner_url}
                    onImageUpload={(url) => updateProfile('banner_url', url)}
                    onImageRemove={() => updateProfile('banner_url', '')}
                    onImageChange={async (url) => {
                      if (!mosqueId) return;
                      const response = await updateMosque(mosqueId, {
                        banner_url: url === null ? (null as any) : url,
                      });
                      if (!response.success) {
                        throw new Error(
                          response.error || 'Failed to update banner'
                        );
                      }
                      toast.success(t('bannerUpdatedSuccessfully'));
                    }}
                    aspectRatio="banner"
                    maxSizeInMB={5}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr className="border-slate-200 dark:border-slate-700" />

            {/* Contact Information Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {t('contactInformation')}
                </h3>
              </div>
              <div className="space-y-4">
                <AddressForm
                  value={profile.addressData || {
                    address_line1: '',
                    address_line2: '',
                    city: '',
                    state: '',
                    postcode: '',
                    country: 'Malaysia',
                    full_address: '',
                  }}
                  onChange={updateAddressData}
                  showFullAddress={true}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      {t('phoneNumber')}
                    </Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => updateProfile('phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {t('emailAddress')}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => updateProfile('email', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">{t('website')}</Label>
                  <Input
                    id="website"
                    type="url"
                    value={profile.website}
                    onChange={(e) => updateProfile('website', e.target.value)}
                    placeholder={t('websitePlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr className="border-slate-200 dark:border-slate-700" />

            {/* Programs Section */}
            {FEATURES.CONTRIBUTIONS_ENABLED && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {t('contributionPrograms')}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('activeProgramsInitiatives')}
                  </p>
                </div>
                <div>
                  {settingsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900 dark:text-slate-100">
                              {t('khairatKematian')}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {t('khairatKematianDescription')}
                            </p>
                          </div>
                          <Badge
                            variant={khairatSettings?.enabled ? 'default' : 'secondary'}
                          >
                            {khairatSettings?.enabled ? t('enabled') : t('disabled')}
                          </Badge>
                        </div>

                        {khairatSettings?.enabled && (
                          <div className="space-y-2 mt-3">
                            {khairatSettings.fixed_price && (
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <DollarSign className="h-4 w-4" />
                                <span>{t('fixedPrice')}: RM {khairatSettings.fixed_price.toFixed(2)}</span>
                              </div>
                            )}
                            {khairatSettings.target_amount && (
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Target className="h-4 w-4" />
                                <span>{t('targetAmount')}: RM {khairatSettings.target_amount.toLocaleString()}</span>
                              </div>
                            )}
                            {khairatSettings.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {khairatSettings.description}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t">
                        <Button variant="outline" className="w-full" asChild>
                          <a
                            href="/members"
                            className="flex items-center gap-2"
                          >
                            <Settings className="h-4 w-4" />
                            {t('manageKhairatSettings')}
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
             {/* Status Card */}
             <Card>
               <CardHeader className="pb-3">
                 <CardTitle className="text-slate-900 dark:text-slate-100">
                   {t('profileStatus')}
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>{t('profileVisibility')}</Label>
                    <p className="text-sm text-slate-500">
                      {t('controlWhoCanSee')}
                    </p>
                  </div>
                  <Switch
                    checked={!profile.is_private}
                    onCheckedChange={(checked) =>
                      updateProfile('is_private', !checked)
                    }
                  />
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={profile.is_private ? 'outline' : 'default'}>
                      {profile.is_private
                        ? t('private')
                        : t('public')}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    {t('lastUpdated')}:{' '}
                    {profile.updated_at
                      ? new Date(profile.updated_at).toLocaleDateString()
                      : t('never')}
                  </p>
                  {mosqueId && (
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <a
                        href={`/mosques/${mosqueId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {t('viewPublicProfile')}
                      </a>
                    </Button>
                  )}
                </div>
               </CardContent>
             </Card>

                  </div>
                </div>
              </TabsContent>

              <TabsContent value="organization" forceMount className="space-y-6 p-6">
            {mosqueId && (
              <OrganizationPeopleManagement 
                mosqueId={mosqueId}
                isServiceEnabled={isOrganizationEnabled}
                onServiceToggle={handleOrganizationToggle}
                savingToggle={savingOrganizationToggle}
              />
            )}
              </TabsContent>

              {khairatSettings && (
                <TabsContent value="khairat" forceMount className="space-y-6 p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                      {t('khairatSettings')}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('khairatRegistrationSettingsDescription')}
                    </p>
                  </div>
                </div>

                {/* Khairat Registration Settings Section */}
                <div>
                  {loadingRegistrationSettings ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  ) : (
                    <div className="space-y-6 border rounded-lg p-6">
                      {/* Custom Message */}
                      <div className="space-y-2">
                        <Label htmlFor="customMessage">
                          {t('customMessage')}
                        </Label>
                        <Textarea
                          id="customMessage"
                          value={khairatRegistrationSettings.custom_message}
                          onChange={(e) =>
                            setKhairatRegistrationSettings((prev) => ({
                              ...prev,
                              custom_message: e.target.value,
                            }))
                          }
                          rows={3}
                          placeholder={t('customMessagePlaceholder')}
                          className="bg-white dark:bg-slate-700"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t('customMessagePlaceholder')}
                        </p>
                      </div>

                      {/* Requirements */}
                      <div className="space-y-2">
                        <Label htmlFor="requirements">
                          {t('registrationRequirements')}
                        </Label>
                        <Textarea
                          id="requirements"
                          value={khairatRegistrationSettings.requirements}
                          onChange={(e) =>
                            setKhairatRegistrationSettings((prev) => ({
                              ...prev,
                              requirements: e.target.value,
                            }))
                          }
                          rows={6}
                          placeholder={t('requirementsPlaceholder')}
                          className="bg-white dark:bg-slate-700"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t('requirementsPlaceholder')}
                        </p>
                      </div>

                      {/* Benefits */}
                      <div className="space-y-2">
                        <Label htmlFor="benefits">
                          {t('membershipBenefits')}
                        </Label>
                        <Textarea
                          id="benefits"
                          value={khairatRegistrationSettings.benefits}
                          onChange={(e) =>
                            setKhairatRegistrationSettings((prev) => ({
                              ...prev,
                              benefits: e.target.value,
                            }))
                          }
                          rows={6}
                          placeholder={t('benefitsPlaceholder')}
                          className="bg-white dark:bg-slate-700"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t('benefitsPlaceholder')}
                        </p>
                      </div>

                      {/* Save Button */}
                      <div className="pt-4 border-t">
                        <Button
                          onClick={handleSaveRegistrationSettings}
                          disabled={savingRegistrationSettings}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {savingRegistrationSettings ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                              {t('saving')}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Save className="h-4 w-4" />
                              {t('saveSettings')}
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function MosqueProfilePage() {
  return (
    <ProtectedRoute>
      <MosqueProfileContent />
    </ProtectedRoute>
  );
}
