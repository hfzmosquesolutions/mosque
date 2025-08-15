'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Settings,
  User,
  Bell,
  Palette,
  Building,
  Shield,
  Save,
  Eye,
  EyeOff,
  Activity,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

// Mock current settings
const mockSettings: UserSettings = {
  profile: {
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@mosque.org',
    phone: '+1 (555) 123-4567',
    role: 'Administrator',
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
    timezone: 'America/New_York',
  },
  mosque: {
    name: 'Islamic Center of Excellence',
    address: '123 Main Street, City, State 12345',
    phone: '+1 (555) 987-6543',
    email: 'info@mosque.org',
    website: 'https://mosque.org',
    is_private: false,
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 30,
  },
};

function SettingsContent() {
  const [settings, setSettings] = useState<UserSettings>(mockSettings);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const updateSettings = (
    section: keyof UserSettings,
    field: string,
    value: string | boolean | number
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = () => {
    // Here you would typically save to your backend
    console.log('Saving settings:', settings);
    setHasUnsavedChanges(false);
    // Show success message
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }
    // Here you would typically call your password change API
    console.log('Changing password');
    setIsChangePasswordOpen(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-2xl" />
          <div className="relative p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Settings className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    Settings
                  </h1>
                </div>
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
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Save className="mr-2 h-5 w-5" />
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="mosque">Mosque</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
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
                      value={settings.profile.name}
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
                      value={settings.profile.email}
                      onChange={(e) =>
                        updateSettings('profile', 'email', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={settings.profile.phone}
                      onChange={(e) =>
                        updateSettings('profile', 'phone', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{settings.profile.role}</Badge>
                      <span className="text-sm text-slate-500">
                        Contact admin to change role
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <Dialog
                    open={isChangePasswordOpen}
                    onOpenChange={setIsChangePasswordOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline">Change Password</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                          Enter your current password and choose a new one.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">
                            Current Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showPasswords.current ? 'text' : 'password'}
                              value={passwordData.currentPassword}
                              onChange={(e) =>
                                setPasswordData((prev) => ({
                                  ...prev,
                                  currentPassword: e.target.value,
                                }))
                              }
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() =>
                                togglePasswordVisibility('current')
                              }
                            >
                              {showPasswords.current ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showPasswords.new ? 'text' : 'password'}
                              value={passwordData.newPassword}
                              onChange={(e) =>
                                setPasswordData((prev) => ({
                                  ...prev,
                                  newPassword: e.target.value,
                                }))
                              }
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => togglePasswordVisibility('new')}
                            >
                              {showPasswords.new ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">
                            Confirm New Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showPasswords.confirm ? 'text' : 'password'}
                              value={passwordData.confirmPassword}
                              onChange={(e) =>
                                setPasswordData((prev) => ({
                                  ...prev,
                                  confirmPassword: e.target.value,
                                }))
                              }
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() =>
                                togglePasswordVisibility('confirm')
                              }
                            >
                              {showPasswords.confirm ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsChangePasswordOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleChangePassword}>
                          Change Password
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <CardTitle>Notification Preferences</CardTitle>
                </div>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-slate-500">
                        Receive notifications via email
                      </p>
                    </div>
                    <Button
                      variant={
                        settings.notifications.emailNotifications
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      onClick={() =>
                        updateSettings(
                          'notifications',
                          'emailNotifications',
                          !settings.notifications.emailNotifications
                        )
                      }
                    >
                      {settings.notifications.emailNotifications
                        ? 'Enabled'
                        : 'Disabled'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pushNotifications">
                        Push Notifications
                      </Label>
                      <p className="text-sm text-slate-500">
                        Receive push notifications in your browser
                      </p>
                    </div>
                    <Button
                      variant={
                        settings.notifications.pushNotifications
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      onClick={() =>
                        updateSettings(
                          'notifications',
                          'pushNotifications',
                          !settings.notifications.pushNotifications
                        )
                      }
                    >
                      {settings.notifications.pushNotifications
                        ? 'Enabled'
                        : 'Disabled'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="eventReminders">Event Reminders</Label>
                      <p className="text-sm text-slate-500">
                        Get reminded about upcoming events
                      </p>
                    </div>
                    <Button
                      variant={
                        settings.notifications.eventReminders
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      onClick={() =>
                        updateSettings(
                          'notifications',
                          'eventReminders',
                          !settings.notifications.eventReminders
                        )
                      }
                    >
                      {settings.notifications.eventReminders
                        ? 'Enabled'
                        : 'Disabled'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="donationReceipts">
                        Donation Receipts
                      </Label>
                      <p className="text-sm text-slate-500">
                        Automatically receive donation receipts
                      </p>
                    </div>
                    <Button
                      variant={
                        settings.notifications.donationReceipts
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      onClick={() =>
                        updateSettings(
                          'notifications',
                          'donationReceipts',
                          !settings.notifications.donationReceipts
                        )
                      }
                    >
                      {settings.notifications.donationReceipts
                        ? 'Enabled'
                        : 'Disabled'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings Tab */}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={settings.appearance.theme}
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
                      value={settings.appearance.language}
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
                        <SelectItem value="Urdu">اردو</SelectItem>
                        <SelectItem value="French">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={settings.appearance.timezone}
                      onValueChange={(value) =>
                        updateSettings('appearance', 'timezone', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">
                          Eastern Time
                        </SelectItem>
                        <SelectItem value="America/Chicago">
                          Central Time
                        </SelectItem>
                        <SelectItem value="America/Denver">
                          Mountain Time
                        </SelectItem>
                        <SelectItem value="America/Los_Angeles">
                          Pacific Time
                        </SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mosque Settings Tab */}
          <TabsContent value="mosque" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  <CardTitle>Mosque Information</CardTitle>
                </div>
                <CardDescription>
                  Update mosque contact information and details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mosqueName">Mosque Name</Label>
                    <Input
                      id="mosqueName"
                      value={settings.mosque.name}
                      onChange={(e) =>
                        updateSettings('mosque', 'name', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mosquePhone">Phone Number</Label>
                    <Input
                      id="mosquePhone"
                      value={settings.mosque.phone}
                      onChange={(e) =>
                        updateSettings('mosque', 'phone', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="mosqueAddress">Address</Label>
                    <Input
                      id="mosqueAddress"
                      value={settings.mosque.address}
                      onChange={(e) =>
                        updateSettings('mosque', 'address', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mosqueEmail">Email Address</Label>
                    <Input
                      id="mosqueEmail"
                      type="email"
                      value={settings.mosque.email}
                      onChange={(e) =>
                        updateSettings('mosque', 'email', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mosqueWebsite">Website</Label>
                    <Input
                      id="mosqueWebsite"
                      type="url"
                      value={settings.mosque.website}
                      onChange={(e) =>
                        updateSettings('mosque', 'website', e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="mosquePrivacy">Mosque Privacy</Label>
                      <p className="text-sm text-slate-500">
                        Make mosque profile private. When enabled, only members
                        can view mosque information.
                      </p>
                    </div>
                    <Switch
                      id="mosquePrivacy"
                      checked={settings.mosque.is_private}
                      onCheckedChange={(checked) =>
                        updateSettings('mosque', 'is_private', checked)
                      }
                    />
                  </div>
                  {settings.mosque.is_private && (
                    <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        <Eye className="h-4 w-4 inline mr-1" />
                        Your mosque profile is currently private and only
                        visible to members.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <CardTitle>Security</CardTitle>
                </div>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                    <p className="text-sm text-slate-500">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button
                    variant={
                      settings.security.twoFactorEnabled ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() =>
                      updateSettings(
                        'security',
                        'twoFactorEnabled',
                        !settings.security.twoFactorEnabled
                      )
                    }
                  >
                    {settings.security.twoFactorEnabled ? 'Enabled' : 'Enable'}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">
                    Session Timeout (minutes)
                  </Label>
                  <Select
                    value={settings.security.sessionTimeout.toString()}
                    onValueChange={(value) =>
                      updateSettings(
                        'security',
                        'sessionTimeout',
                        parseInt(value)
                      )
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                    </SelectContent>
                  </Select>
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
