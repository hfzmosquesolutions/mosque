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
  Save,
  Eye,
  EyeOff,
  Calendar,
  Briefcase,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import { getUserProfile, updateUserProfile } from '@/lib/api';
import { UserProfile } from '@/types/database';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Loading } from '@/components/ui/loading';

function ProfileContent() {
  const { user } = useAuth();
  const { isCompleted, isLoading: onboardingLoading } = useOnboardingRedirect();
  const t = useTranslations('users');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    const response = await getUserProfile(user.id);

    if (response.success && response.data) {
      setProfile(response.data);
    } else {
      setError(response.error || 'Failed to load profile');
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id, fetchProfile, isCompleted, onboardingLoading]);

  const handleSave = async () => {
    if (!user?.id || !profile) return;

    setSaving(true);
    const response = await updateUserProfile(user.id, {
      full_name: profile.full_name,
      username: profile.username,
      phone: profile.phone,
      address: profile.address,
      date_of_birth: profile.date_of_birth,
      gender: profile.gender,
      occupation: profile.occupation,
      ic_passport_number: profile.ic_passport_number,
      emergency_contact_name: profile.emergency_contact_name,
      emergency_contact_phone: profile.emergency_contact_phone,
    });

    if (response.success) {
      setHasUnsavedChanges(false);
      setProfile(response.data!);
    } else {
      setError(response.error || 'Failed to update profile');
    }
    setSaving(false);
  };

  const updateField = (field: keyof UserProfile, value: string | boolean | null) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
    setHasUnsavedChanges(true);
  };


  const getRoleIcon = () => {
    if (profile?.account_type === 'admin') {
      return <Users className="h-4 w-4 text-green-600" />;
    }
    return <Users className="h-4 w-4 text-blue-600" />;
  };

  const getRoleBadgeVariant = () => {
    return profile?.account_type === 'admin' ? 'default' : 'secondary';
  };

  const getFieldVisibility = (fieldName: string) => {
    const publicFields = ['full_name', 'profile_picture_url', 'created_at', 'account_type', 'membership_type'];
    return publicFields.includes(fieldName);
  };

  if (onboardingLoading || !isCompleted) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Loading 
          message="Loading profile..." 
          size="lg"
          className="py-12"
        />
      </DashboardLayout>
    );
  }

  if (error || !profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Card className="border-0 shadow-lg max-w-md">
            <CardContent className="pt-6 text-center">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full w-fit mx-auto mb-4">
                <User className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {t('profileError')}
              </h3>
              <p className="text-muted-foreground mb-4">{error || t('profileNotFound')}</p>
              <Button 
                onClick={fetchProfile}
                className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
              >
                {t('tryAgain')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            My Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your profile information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/users/${profile.username || user?.id}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              {t('viewPublicProfile')}
            </Button>
          </Link>
          {hasUnsavedChanges && (
            <Button 
              onClick={handleSave} 
              disabled={saving} 
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>

        {/* Profile Form */}
        <div className="space-y-6">

          {/* Basic Information */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <Briefcase className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                {t('basicInformation')}
              </CardTitle>
              <CardDescription>
                {t('updatePersonalDetails')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="fullName">{t('fullName')}</Label>
                    <Badge variant="outline" className="text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      Public
                    </Badge>
                  </div>
                  <Input
                    id="fullName"
                    value={profile.full_name}
                    onChange={(e) => updateField('full_name', e.target.value)}
                  />
                </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('emailAddress')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-slate-50"
                    />
                    <p className="text-xs text-slate-500">
                      {t('emailCannotBeChanged')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icPassportNumber">IC/Passport Number</Label>
                    <Input
                      id="icPassportNumber"
                      value={profile.ic_passport_number || ''}
                      onChange={(e) => updateField('ic_passport_number', e.target.value)}
                      placeholder="Enter your IC or Passport number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">{t('dateOfBirth')}</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={profile.date_of_birth || ''}
                      onChange={(e) =>
                        updateField('date_of_birth', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">{t('gender')}</Label>
                    <Select
                      value={profile.gender || ''}
                      onValueChange={(value) => updateField('gender', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectGender')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t('male')}</SelectItem>
                        <SelectItem value="female">{t('female')}</SelectItem>
                        <SelectItem value="other">{t('other')}</SelectItem>
                        <SelectItem value="prefer-not-to-say">
                          {t('preferNotToSay')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="occupation">{t('occupation')}</Label>
                    <Input
                      id="occupation"
                      value={profile.occupation || ''}
                      onChange={(e) =>
                        updateField('occupation', e.target.value)
                      }
                      placeholder={t('yourProfessionPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="phone">{t('phoneNumber')}</Label>
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Private
                      </Badge>
                    </div>
                    <Input
                      id="phone"
                      value={profile.phone || ''}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder={t('phonePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="address">{t('address')}</Label>
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Private
                      </Badge>
                    </div>
                    <Textarea
                      id="address"
                      value={profile.address || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        updateField('address', e.target.value)
                      }
                      placeholder={t('fullAddressPlaceholder')}
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

        </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Profile">
        <ProfileContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
