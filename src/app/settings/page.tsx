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
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

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
  }, [user?.id, user?.email, isAdmin, mosqueId]);

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
      toast.success('Settings saved successfully!');

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
      setError(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return null; // Or a loading spinner
  }

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-2xl" />
          <div className="relative p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <p className="text-muted-foreground text-lg">
                  Manage your account and application preferences
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Activity className="h-4 w-4" />
                    <span>Customizable preferences</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    <span>Secure settings</span>
                  </div>
                </div>
              </div>
              {hasUnsavedChanges && (
                <Button
                  onClick={handleSaveSettings}
                  size="lg"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Save className="mr-2 h-5 w-5" />
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue={tabParam || 'profile'} className="space-y-6">
          <TabsList
            className={`grid ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}
          >
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="payment-settings">
                Payment Gateway
              </TabsTrigger>
            )}
          </TabsList>

          {/* Profile Settings Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <CardTitle>Profile Settings</CardTitle>
                </div>
                <CardDescription>
                  Update your personal information and account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={settings!.profile.name}
                      onChange={(e) =>
                        updateSettings('profile', 'name', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
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
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={settings!.profile.phone}
                      onChange={(e) =>
                        updateSettings('profile', 'phone', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{settings!.profile.role}</Badge>
                      <span className="text-sm text-slate-500">
                        Contact admin to change role
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional personal information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Street, City, Country"
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
                      <Label htmlFor="dob">Date of Birth</Label>
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
                      <Label htmlFor="gender">Gender</Label>
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
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation</Label>
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
                      Emergency Contact Name
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
              </CardContent>
            </Card>

            {/* Mosque Settings - Only for admin users */}
            {isAdmin && mosque && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <CardTitle>Mosque Settings</CardTitle>
                  </div>
                  <CardDescription>
                    Manage your mosque information and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mosqueName">Mosque Name</Label>
                      <Input
                        id="mosqueName"
                        value={settings!.mosque.name}
                        onChange={(e) =>
                          updateSettings('mosque', 'name', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mosquePhone">Phone</Label>
                      <Input
                        id="mosquePhone"
                        value={settings!.mosque.phone}
                        onChange={(e) =>
                          updateSettings('mosque', 'phone', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mosqueEmail">Email</Label>
                      <Input
                        id="mosqueEmail"
                        type="email"
                        value={settings!.mosque.email}
                        onChange={(e) =>
                          updateSettings('mosque', 'email', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mosqueWebsite">Website</Label>
                      <Input
                        id="mosqueWebsite"
                        value={settings!.mosque.website}
                        onChange={(e) =>
                          updateSettings('mosque', 'website', e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mosqueAddress">Address</Label>
                    <Textarea
                      id="mosqueAddress"
                      placeholder="Full mosque address"
                      value={settings!.mosque.address}
                      onChange={(e) =>
                        updateSettings('mosque', 'address', e.target.value)
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={settings!.mosque.is_private}
                      onChange={(e) =>
                        updateSettings('mosque', 'is_private', e.target.checked)
                      }
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="isPrivate">
                      Make mosque profile private
                    </Label>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <CardTitle>Notification Preferences</CardTitle>
                </div>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
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
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications on your device
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
                    <Label htmlFor="eventReminders">Event Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded about upcoming events
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
                    <Label htmlFor="donationReceipts">Donation Receipts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive receipts for donations and contributions
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  <CardTitle>Appearance</CardTitle>
                </div>
                <CardDescription>
                  Customize the look and feel of the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
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
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings!.appearance.language}
                    onValueChange={(value) =>
                      updateSettings('appearance', 'language', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Arabic">العربية</SelectItem>
                      <SelectItem value="Malay">Bahasa Malaysia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings Tab - Admin Only */}
          {isAdmin && (
            <TabsContent value="payment-settings" className="space-y-6">
              <PaymentProviderSettings />
            </TabsContent>
          )}

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <CardTitle>Security Settings</CardTitle>
                </div>
                <CardDescription>
                  Manage your account security and privacy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
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
                    Session Timeout (minutes)
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
                    Automatically sign out after this period of inactivity
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
