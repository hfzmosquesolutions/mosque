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
  AlertCircle,
  Target,
  Plus,
  TrendingUp,
  ExternalLink,
  Image as ImageIcon,
  Settings,
} from 'lucide-react';
import { useAdminAccess } from '@/hooks/useUserRole';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  getKhairatPrograms,
  getUserMosqueId,
  getMosque,
  updateMosque,
} from '@/lib/api';
import type {
  KhairatProgram,
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
import { ServiceManagement } from '@/components/dashboard/ServiceManagement';

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
      'Friday Prayers',
      'Islamic Education',
      'Community Events',
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
  const { hasAdminAccess } = useAdminAccess();
  const { isCompleted, isLoading: onboardingLoading } = useOnboardingRedirect();
  const t = useTranslations();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<MosqueProfileData>(
    getDefaultMosqueProfile()
  );
  const [originalProfile, setOriginalProfile] = useState<MosqueProfileData>(
    getDefaultMosqueProfile()
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [programs, setPrograms] = useState<KhairatProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [mosqueId, setMosqueId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');

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
            'Friday Prayers',
            'Islamic Education',
            'Community Events',
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

  const loadPrograms = useCallback(async () => {
    if (!mosqueId) return;

    setProgramsLoading(true);
    try {
      const response = await getKhairatPrograms(mosqueId);
      if (response.success && response.data) {
        setPrograms(response.data);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    } finally {
      setProgramsLoading(false);
    }
  }, [mosqueId]);

  useEffect(() => {
    if (mosqueId) {
      loadMosqueData();
      loadPrograms();
    }
  }, [mosqueId, loadMosqueData, loadPrograms]);

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
        setIsEditing(false);
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

  const handleCancel = () => {
    setProfile(originalProfile);
    setIsEditing(false);
  };

  if (onboardingLoading || !isCompleted) {
    return null;
  }

  if (!hasAdminAccess) {
    return (
      <DashboardLayout title={t('navigation.profile')}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t('mosqueProfile.accessRestricted')}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {t('mosqueProfile.onlyAdministratorsAccess')}
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t('navigation.profile')}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl" />
          <div className="relative p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <p className="text-slate-600 dark:text-slate-400">
                  {t('mosqueProfile.manageProfile')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {t('mosqueProfile.savedSuccessfully')}
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  {mosqueId && (
                    <Button variant="outline" asChild>
                      <a
                        href={`/mosques/${mosqueId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {t('mosqueProfile.viewPublicProfile')}
                      </a>
                    </Button>
                  )}
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={handleCancel}>
                        {t('common.cancel')}
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            {t('mosqueProfile.saving')}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            {t('mosqueProfile.saveChanges')}
                          </div>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>
                      {t('mosqueProfile.editProfile')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Status Card */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {profile.is_private ? (
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <EyeOff className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                ) : (
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {t('mosqueProfile.profileStatus')}
                  </h3>
                  <Badge variant={profile.is_private ? 'secondary' : 'default'}>
                    {profile.is_private
                      ? t('mosqueProfile.private')
                      : t('mosqueProfile.public')}
                  </Badge>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  {profile.is_private
                    ? t('mosqueProfile.privateProfileDescription')
                    : t('mosqueProfile.publicProfileDescription')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              {t('mosqueProfile.profile')}
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="organization" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('mosqueProfile.organizationPeople')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Information */}
              <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {t('mosqueProfile.basicInformation')}
                </CardTitle>
                <CardDescription>
                  {t('mosqueProfile.essentialDetails')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mosqueName">
                      {t('mosqueProfile.mosqueNameRequired')}
                    </Label>
                    <Input
                      id="mosqueName"
                      value={profile.name}
                      onChange={(e) => updateProfile('name', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="establishedYear">
                      {t('mosqueProfile.establishedYear')}
                    </Label>
                    <Input
                      id="establishedYear"
                      value={profile.established_year}
                      onChange={(e) =>
                        updateProfile('established_year', e.target.value)
                      }
                      disabled={!isEditing}
                      placeholder={t(
                        'mosqueProfile.establishedYearPlaceholder'
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">
                    {t('mosqueProfile.description')}
                  </Label>
                  <Textarea
                    id="description"
                    value={profile.description}
                    onChange={(e) =>
                      updateProfile('description', e.target.value)
                    }
                    disabled={!isEditing}
                    rows={3}
                    placeholder={t('mosqueProfile.descriptionPlaceholder')}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">
                      {t('mosqueProfile.capacity')}
                    </Label>
                    <Input
                      id="capacity"
                      value={profile.capacity}
                      onChange={(e) =>
                        updateProfile('capacity', e.target.value)
                      }
                      disabled={!isEditing}
                      placeholder={t('mosqueProfile.capacityPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imamName">
                      {t('mosqueProfile.imamName')}
                    </Label>
                    <Input
                      id="imamName"
                      value={profile.imam_name}
                      onChange={(e) =>
                        updateProfile('imam_name', e.target.value)
                      }
                      disabled={!isEditing}
                      placeholder={t('mosqueProfile.imamNamePlaceholder')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mosque Branding */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Mosque Branding
                </CardTitle>
                <CardDescription>
                  Upload your mosque logo and banner to enhance your public
                  profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ImageUpload
                    label="Mosque Logo"
                    description="Square logo that represents your mosque"
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
                      toast.success('Logo updated successfully');
                    }}
                    aspectRatio="square"
                    maxSizeInMB={5}
                  />
                  <ImageUpload
                    label="Mosque Banner"
                    description="Wide banner image for your mosque profile header"
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
                      toast.success('Banner updated successfully');
                    }}
                    aspectRatio="banner"
                    maxSizeInMB={5}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  {t('mosqueProfile.contactInformation')}
                </CardTitle>
                <CardDescription>
                  {t('mosqueProfile.howPeopleCanReach')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  disabled={!isEditing}
                  showFullAddress={true}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      {t('mosqueProfile.phoneNumber')}
                    </Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => updateProfile('phone', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {t('mosqueProfile.emailAddress')}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => updateProfile('email', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">{t('mosqueProfile.website')}</Label>
                  <Input
                    id="website"
                    type="url"
                    value={profile.website}
                    onChange={(e) => updateProfile('website', e.target.value)}
                    disabled={!isEditing}
                    placeholder={t('mosqueProfile.websitePlaceholder')}
                  />
                </div>
              </CardContent>
            </Card>


            {/* Programs */}
            {FEATURES.CONTRIBUTIONS_ENABLED && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {t('mosqueProfile.contributionPrograms')}
                  </CardTitle>
                  <CardDescription>
                    {t('mosqueProfile.activeProgramsInitiatives')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {programsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  ) : programs.length > 0 ? (
                    <div className="space-y-4">
                      {programs.map((program) => (
                        <div
                          key={program.id}
                          className="border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900 dark:text-slate-100">
                                {program.name}
                              </h4>
                              {program.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                  {program.description}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant={
                                program.is_active ? 'default' : 'secondary'
                              }
                            >
                              {program.is_active
                                ? t('mosqueProfile.active')
                                : t('mosqueProfile.inactive')}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                            {program.target_amount && (
                              <div className="flex items-center gap-1">
                                <Target className="h-4 w-4" />
                                <span>
                                  {t('mosqueProfile.target')}: $
                                  {program.target_amount.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {program.start_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {t('mosqueProfile.started')}:{' '}
                                  {new Date(
                                    program.start_date
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>

                          {program.target_amount &&
                            program.current_amount !== undefined && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="text-slate-600 dark:text-slate-400">
                                    {t('mosqueProfile.progress')}
                                  </span>
                                  <span className="font-medium">
                                    $
                                    {(
                                      program.current_amount || 0
                                    ).toLocaleString()}{' '}
                                    / ${program.target_amount.toLocaleString()}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(
                                        ((program.current_amount || 0) /
                                          program.target_amount) *
                                          100,
                                        100
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                        </div>
                      ))}

                      <div className="pt-4 border-t">
                        <Button variant="outline" className="w-full" asChild>
                          <a
                            href="/khairat"
                            className="flex items-center gap-2"
                          >
                            <TrendingUp className="h-4 w-4" />
                            {t('mosqueProfile.manageAllPrograms')}
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                        {t('mosqueProfile.noProgramsYet')}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        {t('mosqueProfile.createContributionPrograms')}
                      </p>
                      <Button variant="outline" asChild>
                        <a
                          href="/khairat"
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          {t('mosqueProfile.createFirstProgram')}
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t('mosqueProfile.profileStatus')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>{t('mosqueProfile.profileVisibility')}</Label>
                    <p className="text-sm text-slate-500">
                      {t('mosqueProfile.controlWhoCanSee')}
                    </p>
                  </div>
                  <Switch
                    checked={!profile.is_private}
                    onCheckedChange={(checked) =>
                      updateProfile('is_private', !checked)
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={profile.is_private ? 'outline' : 'default'}>
                      {profile.is_private
                        ? t('mosqueProfile.private')
                        : t('mosqueProfile.public')}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {t('mosqueProfile.lastUpdated')}:{' '}
                    {profile.updated_at
                      ? new Date(profile.updated_at).toLocaleDateString()
                      : t('mosqueProfile.never')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>{t('mosqueProfile.quickStats')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    {t('mosqueProfile.capacity')}
                  </span>
                  <span className="font-medium">
                    {profile.capacity} {t('mosqueProfile.people')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    {t('mosqueProfile.established')}
                  </span>
                  <span className="font-medium">
                    {profile.established_year}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    {t('mosqueProfile.services')}
                  </span>
                  <span className="font-medium">
                    {profile.services?.length || 0} {t('mosqueProfile.offered')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle>{t('mosqueProfile.servicesOffered')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.services?.map((service, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  )) || (
                    <p className="text-sm text-slate-500">
                      {t('mosqueProfile.noServicesListed')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            {mosqueId && (
              <ServiceManagement 
                mosqueId={mosqueId}
                currentServices={profile.settings?.enabled_services || []}
                onServicesUpdate={(services) => {
                  setProfile(prev => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      enabled_services: services
                    }
                  }));
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="organization" className="space-y-6">
            {mosqueId && <OrganizationPeopleManagement mosqueId={mosqueId} />}
          </TabsContent>
        </Tabs>
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
