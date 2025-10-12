'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';
import {
  User,
  Bell,
  Palette,
  Shield,
  Save,
  Activity,
  Calendar,
  Briefcase,
  Users,
  Plus,
  Edit,
  Trash2,
  CreditCard,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import {
  getUserProfile,
  updateUserProfile,
  getMosque,
  updateMosque,
} from '@/lib/api';
import {
  UserProfile,
  Mosque,
  UpdateUserProfile,
  UpdateMosque,
} from '@/types/database';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { PaymentProviderSettings } from '@/components/settings/PaymentProviderSettings';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

interface UserSettings {
  profile: {
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    eventReminders: boolean;
    donationReceipts: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
  };
  mosque: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    is_private: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
  };
}

function SettingsContent() {
  const { user } = useAuth();
  const { isAdmin, mosqueId } = useUserRole();
  const { isCompleted, isLoading: onboardingLoading } = useOnboardingRedirect();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const t = useTranslations();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const profileRes = await getUserProfile(user.id);
        if (!profileRes.success || !profileRes.data) {
          throw new Error(profileRes.error || 'Failed to load profile');
        }
        const p = profileRes.data;
        setProfile(p);

        let m: Mosque | null = null;
        if (isAdmin && mosqueId) {
          const mosqueRes = await getMosque(mosqueId);
          if (mosqueRes.success) {
            m = mosqueRes.data!;
            setMosque(m);
          }
        }

        const initial: UserSettings = {
          profile: {
            name: p.full_name,
            email: user.email || '',
            phone: p.phone || '',
            role: p.account_type === 'admin' ? 'Administrator' : 'Member',
          },
          notifications: {
            emailNotifications: true,
            pushNotifications: true,
            eventReminders: true,
            donationReceipts: false,
          },
          appearance: {
            theme: 'system',
            language: 'English',
            timezone: 'UTC',
          },
          mosque: {
            name: m?.name || '',
            address: m?.address || '',
            phone: m?.phone || '',
            email: m?.email || '',
            website: m?.website || '',
            is_private: m?.is_private || false,
          },
          security: {
            twoFactorEnabled: false,
            sessionTimeout: 30,
          },
        };

        setSettings(initial);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user?.id, user?.email, isAdmin, mosqueId, isCompleted, onboardingLoading]);

  const updateSettings = (
    section: keyof UserSettings,
    field: string,
    value: string | boolean | number
  ) => {
    if (!settings) return;
    setSettings((prev) => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    if (!user?.id || !settings || !profile) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Update user profile
      const profileUpdate: UpdateUserProfile = {
        full_name: settings?.profile?.name || '',
        phone: settings?.profile?.phone || '',
        address: profile.address,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        occupation: profile.occupation,
        emergency_contact_name: profile.emergency_contact_name,
        emergency_contact_phone: profile.emergency_contact_phone,
        is_profile_private: profile.is_profile_private,
      };

      const profileRes = await updateUserProfile(user.id, profileUpdate);
      if (!profileRes.success) {
        throw new Error(profileRes.error || 'Failed to update profile');
      }

      // Update mosque if admin
      if (isAdmin && mosque && mosqueId) {
        const mosqueUpdate: UpdateMosque = {
          name: settings?.mosque?.name || '',
          address: settings?.mosque?.address || '',
          phone: settings?.mosque?.phone || '',
          email: settings?.mosque?.email || '',
          website: settings?.mosque?.website || '',
          is_private: settings?.mosque?.is_private || false,
        };

        const mosqueRes = await updateMosque(mosqueId, mosqueUpdate);
        if (!mosqueRes.success) {
          throw new Error(mosqueRes.error || 'Failed to update mosque');
        }
      }

      setHasUnsavedChanges(false);
      toast.success(t('settings.settingsSavedSuccessfully'));

      // Refresh data
      const updatedProfileRes = await getUserProfile(user.id);
      if (updatedProfileRes.success) {
        const newProfile = updatedProfileRes.data!;
        setProfile(newProfile);
        setSettings((prev) =>
          prev
            ? {
                ...prev,
                profile: {
                  ...prev.profile,
                  name: newProfile.full_name,
                  phone: newProfile.phone || '',
                },
              }
            : prev
        );
      }

      if (isAdmin && mosqueId) {
        const updatedMosqueRes = await getMosque(mosqueId);
        if (updatedMosqueRes.success) {
          const newMosque = updatedMosqueRes.data!;
          setMosque(newMosque);
          setSettings((prev) =>
            prev
              ? {
                  ...prev,
                  mosque: {
                    ...prev.mosque,
                    name: newMosque.name || '',
                    address: newMosque.address || '',
                    phone: newMosque.phone || '',
                    email: newMosque.email || '',
                    website: newMosque.website || '',
                    is_private: newMosque.is_private || false,
                  },
                }
              : prev
          );
        }
      }
    } catch (e) {
        setError(e instanceof Error ? e.message : t('errors.failedToSaveSettings'));
      } finally {
      setSaving(false);
    }
  };

  if (onboardingLoading || !isCompleted) {
    return null;
  }

  if (loading || !settings) {
    return null; // Or a loading spinner
  }

  return (
    <div className="space-y-6">
      {/* Header with Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('settings.title')}
        </h1>
      </div>

      <Tabs defaultValue={tabParam || 'profile'} className="space-y-6">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-600">
          <TabsTrigger 
            value="profile" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            {t('settings.profile')}
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            {t('settings.notifications')}
          </TabsTrigger>
          <TabsTrigger 
            value="appearance" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            {t('settings.appearance')}
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            {t('settings.security')}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger 
              value="payment-settings" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              {t('settings.paymentGateway')}
            </TabsTrigger>
          )}
        </TabsList>

          {/* Profile Settings Tab */}
          <TabsContent value="profile" forceMount className="space-y-6 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {t('settings.profileSettings')}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t('settings.profileDescription')}
                </p>
              </div>
              {hasUnsavedChanges && (
                <Button
                  onClick={handleSaveSettings}
                  size="sm"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {t('settings.saveChanges')}
                </Button>
              )}
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('settings.fullName')}</Label>
                    <Input
                      id="name"
                      value={settings!.profile.name}
                      onChange={(e) =>
                        updateSettings('profile', 'name', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('settings.emailAddress')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings!.profile.email}
                      onChange={(e) =>
                        updateSettings('profile', 'email', e.target.value)
                      }
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('settings.phoneNumber')}</Label>
                    <Input
                      id="phone"
                      value={settings!.profile.phone}
                      onChange={(e) =>
                        updateSettings('profile', 'phone', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">{t('settings.role')}</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{settings!.profile.role}</Badge>
                      <span className="text-sm text-slate-500">
                        {t('settings.contactAdminToChangeRole')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional personal information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">{t('settings.address')}</Label>
                    <Textarea
                      id="address"
                      placeholder={t('settings.addressPlaceholder')}
                      value={profile?.address || ''}
                      onChange={(e) => {
                        setProfile((prev) =>
                          prev
                            ? ({
                                ...prev,
                                address: e.target.value,
                              } as UserProfile)
                            : prev
                        );
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dob">{t('settings.dateOfBirth')}</Label>
                      <div className="relative">
                        <Input
                          id="dob"
                          type="date"
                          value={profile?.date_of_birth || ''}
                          onChange={(e) => {
                            setProfile((prev) =>
                              prev
                                ? ({
                                    ...prev,
                                    date_of_birth: e.target.value,
                                  } as UserProfile)
                                : prev
                            );
                            setHasUnsavedChanges(true);
                          }}
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">{t('settings.gender')}</Label>
                      <Select
                        value={profile?.gender || ''}
                        onValueChange={(value) => {
                          setProfile((prev) =>
                            prev
                              ? ({ ...prev, gender: value } as UserProfile)
                              : prev
                          );
                          setHasUnsavedChanges(true);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('settings.selectGender')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">{t('settings.male')}</SelectItem>
                          <SelectItem value="female">{t('settings.female')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="occupation">{t('settings.occupation')}</Label>
                    <div className="relative">
                      <Input
                        id="occupation"
                        value={profile?.occupation || ''}
                        onChange={(e) => {
                          setProfile((prev) =>
                            prev
                              ? ({
                                  ...prev,
                                  occupation: e.target.value,
                                } as UserProfile)
                              : prev
                          );
                          setHasUnsavedChanges(true);
                        }}
                      />
                      <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyName">
                      {t('settings.emergencyContactName')}
                    </Label>
                    <Input
                      id="emergencyName"
                      value={profile?.emergency_contact_name || ''}
                      onChange={(e) => {
                        setProfile((prev) =>
                          prev
                            ? ({
                                ...prev,
                                emergency_contact_name: e.target.value,
                              } as UserProfile)
                            : prev
                        );
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>
            </div>

          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" forceMount className="space-y-6 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {t('settings.notificationPreferences')}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t('settings.configureNotifications')}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">
                    {t('settings.emailNotifications')}
                  </Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.receiveNotificationsViaEmail')}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={settings!.notifications.emailNotifications}
                    onChange={(e) =>
                      updateSettings(
                        'notifications',
                        'emailNotifications',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="pushNotifications">
                      {t('settings.pushNotifications')}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.receivePushNotifications')}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="pushNotifications"
                    checked={settings!.notifications.pushNotifications}
                    onChange={(e) =>
                      updateSettings(
                        'notifications',
                        'pushNotifications',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="eventReminders">{t('settings.eventReminders')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.getRemindedAboutEvents')}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="eventReminders"
                    checked={settings!.notifications.eventReminders}
                    onChange={(e) =>
                      updateSettings(
                        'notifications',
                        'eventReminders',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="donationReceipts">{t('settings.donationReceipts')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.receiveReceiptsForDonations')}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="donationReceipts"
                    checked={settings!.notifications.donationReceipts}
                    onChange={(e) =>
                      updateSettings(
                        'notifications',
                        'donationReceipts',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300"
                  />
                </div>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" forceMount className="space-y-6 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {t('settings.appearance')}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t('settings.customizeLookAndFeel')}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">{t('settings.theme')}</Label>
                  <Select
                    value={settings!.appearance.theme}
                    onValueChange={(value) =>
                      updateSettings('appearance', 'theme', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t('settings.light')}</SelectItem>
                      <SelectItem value="dark">{t('settings.dark')}</SelectItem>
                      <SelectItem value="system">{t('settings.system')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">{t('settings.language')}</Label>
                  <LanguageSwitcher variant="compact" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">{t('settings.timezone')}</Label>
                  <Select
                    value={settings!.appearance.timezone}
                    onValueChange={(value) =>
                      updateSettings('appearance', 'timezone', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Asia/Kuala_Lumpur">
                        Asia/Kuala_Lumpur
                      </SelectItem>
                      <SelectItem value="America/New_York">
                        America/New_York
                      </SelectItem>
                      <SelectItem value="Europe/London">
                        Europe/London
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            </div>
          </TabsContent>

          {/* Payment Settings Tab - Admin Only */}
          {isAdmin && (
            <TabsContent value="payment-settings" forceMount className="space-y-6 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {t('settings.paymentGateway')}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Configure payment gateway settings for your mosque
                  </p>
                </div>
              </div>
              <PaymentProviderSettings />
            </TabsContent>
          )}

          {/* Security Tab */}
          <TabsContent value="security" forceMount className="space-y-6 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {t('settings.securitySettings')}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t('settings.manageAccountSecurity')}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="twoFactor">{t('settings.twoFactorAuthentication')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.addExtraLayerSecurity')}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="twoFactor"
                    checked={settings!.security.twoFactorEnabled}
                    onChange={(e) =>
                      updateSettings(
                        'security',
                        'twoFactorEnabled',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">
                    {t('settings.sessionTimeoutMinutes')}
                  </Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="15"
                    max="120"
                    value={settings!.security.sessionTimeout}
                    onChange={(e) =>
                      updateSettings(
                        'security',
                        'sessionTimeout',
                        parseInt(e.target.value)
                      )
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    {t('settings.automaticallySignOut')}
                  </p>
                </div>
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Settings">
        <SettingsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
