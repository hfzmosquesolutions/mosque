'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAuth } from '@/hooks/useAuth';
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Lock,
  Bell,
  Globe,
  Building,
  Shield,
  Phone,
  Mail,
} from 'lucide-react';

function AccountPageContent() {
  const { t, language } = useLanguage();
  const { user: authUser } = useAuth();

  const [user, setUser] = useState({
    id: authUser?.id || '1',
    name: authUser?.name || 'Ahmad Ibrahim',
    email: authUser?.email || 'ahmad.ibrahim@email.com',
    phone: '+60123456789',
    role: authUser?.role || 'member',
    membershipId: 'MSJ001',
    joinDate: '2020-01-15',
    mosqueName: authUser?.mosqueName || 'Masjid Al-Hidayah',
    profilePhoto: null,
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setUser((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreferenceChange = (
    type: 'emailNotifications' | 'smsNotifications',
    value: boolean
  ) => {
    setUser((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [type]: value },
    }));
  };

  const handleSaveAccount = () => {
    console.log('Saving account:', user);
    setIsEditing(false);
  };

  const handlePasswordChange = () => {
    console.log('Changing password');
    setPasswords({ current: '', new: '', confirm: '' });
    setShowPasswordForm(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Shield className="h-4 w-4" />;
      case 'mosque_admin':
        return <Building className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'mosque_admin':
        return 'default';
      case 'ajk':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('account.title')}
              </h1>
              <p className="text-gray-600 mt-1">{t('account.subtitle')}</p>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? 'outline' : 'default'}
              className="w-full sm:w-auto"
            >
              {isEditing ? t('common.cancel') : t('common.edit')}
            </Button>
          </div>
        </div>

        {/* Profile Overview Section */}
        <div className="mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-shrink-0">
                  <Avatar className="h-20 w-20 md:h-24 md:w-24">
                    <AvatarImage
                      src={user.profilePhoto || undefined}
                      alt={user.name}
                    />
                    <AvatarFallback className="text-xl">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {user.name}
                    </h2>
                    <p className="text-gray-600">{user.email}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <Badge variant={getRoleColor(user.role)}>
                        {t(`roles.${user.role}`)}
                      </Badge>
                    </div>
                    {user.membershipId && (
                      <Badge variant="outline">ID: {user.membershipId}</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building className="h-4 w-4" />
                    <span>{user.mosqueName}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Personal Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('account.personalInfo')}
              </CardTitle>
              <CardDescription>{t('account.userInfo')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('account.fullName')}</Label>
                  <Input
                    id="fullName"
                    value={user.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    className="transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('account.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className="transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('account.phone')}</Label>
                  <Input
                    id="phone"
                    value={user.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    className="transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('account.joinDate')}</Label>
                  <Input
                    value={new Date(user.joinDate).toLocaleDateString()}
                    disabled
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t('account.accountSettings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Password Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50/50">
                  <div className="space-y-1">
                    <h4 className="font-medium text-gray-900">
                      {t('account.changePassword')}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {t('account.secureAccount')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                  >
                    {showPasswordForm
                      ? t('common.cancel')
                      : t('account.changePassword')}
                  </Button>
                </div>

                {showPasswordForm && (
                  <div className="border rounded-lg p-6 space-y-4 bg-white">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">
                          {t('account.currentPassword')}
                        </Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwords.current}
                          onChange={(e) =>
                            setPasswords((prev) => ({
                              ...prev,
                              current: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">
                          {t('account.newPassword')}
                        </Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwords.new}
                          onChange={(e) =>
                            setPasswords((prev) => ({
                              ...prev,
                              new: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                          {t('account.confirmPassword')}
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwords.confirm}
                          onChange={(e) =>
                            setPasswords((prev) => ({
                              ...prev,
                              confirm: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button
                        onClick={handlePasswordChange}
                        size="sm"
                        className="flex-1 sm:flex-none"
                      >
                        {t('common.save')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowPasswordForm(false)}
                        size="sm"
                        className="flex-1 sm:flex-none"
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Notifications Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <h4 className="font-medium">{t('account.notifications')}</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <Label className="text-sm font-medium">
                          {t('account.emailNotifications')}
                        </Label>
                        <p className="text-xs text-gray-600">
                          {t('account.systemNotifications')}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={user.preferences.emailNotifications}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange('emailNotifications', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <Label className="text-sm font-medium">
                          {t('account.smsNotifications')}
                        </Label>
                        <p className="text-xs text-gray-600">
                          {t('account.urgentNotifications')}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={user.preferences.smsNotifications}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange('smsNotifications', checked)
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Language Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  <h4 className="font-medium">{t('account.language')}</h4>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50/50">
                  <p className="text-sm text-gray-700">
                    {t('account.currentLanguage')}:{' '}
                    <span className="font-medium">
                      {language === 'ms' ? 'Bahasa Melayu' : 'English'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('account.useLanguageSwitcher')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Actions */}
          {isEditing && (
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="order-2 sm:order-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleSaveAccount}
                className="order-1 sm:order-2"
              >
                {t('account.updateAccount')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <AuthLayout>
      <AccountPageContent />
    </AuthLayout>
  );
}
