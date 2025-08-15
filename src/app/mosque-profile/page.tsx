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
  Clock,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Target,
  Plus,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { useAdminAccess } from '@/hooks/useUserRole';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  getContributionPrograms,
  getUserMosqueId,
  getMosque,
  updateMosque,
} from '@/lib/api';
import type {
  ContributionProgram,
  Mosque,
  UpdateMosque,
} from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

// Extended mosque interface for profile editing
interface MosqueProfileData extends Mosque {
  // Additional fields for UI that might not be in the database yet
  established_year?: string;
  capacity?: string;
  imam_name?: string;
  services?: string[];
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
  prayer_times: {
    fajr: '5:30 AM',
    dhuhr: '12:30 PM',
    asr: '3:45 PM',
    maghrib: '6:15 PM',
    isha: '7:30 PM',
  },
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
});

function MosqueProfileContent() {
  const { user } = useAuth();
  const { hasAdminAccess } = useAdminAccess();
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
  const [programs, setPrograms] = useState<ContributionProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [mosqueId, setMosqueId] = useState<string | null>(null);

  const updateProfile = (
    field: keyof MosqueProfileData,
    value: string | boolean | Record<string, unknown>
  ) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const updatePrayerTime = (prayer: string, time: string) => {
    setProfile((prev) => ({
      ...prev,
      prayer_times: {
        ...prev.prayer_times,
        [prayer]: time,
      },
    }));
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
  }, [user, loadUserMosque]);

  const loadMosqueData = useCallback(async () => {
    if (!mosqueId) return;

    setIsLoading(true);
    try {
      const response = await getMosque(mosqueId);
      if (response.success && response.data) {
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
      const response = await getContributionPrograms(mosqueId);
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
        address: profile.address || undefined,
        phone: profile.phone || undefined,
        email: profile.email || undefined,
        website: profile.website || undefined,
        prayer_times: profile.prayer_times,
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

  if (!hasAdminAccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Only mosque administrators can access the mosque profile
                settings.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl" />
          <div className="relative p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                      Mosque Profile
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                      Manage your mosque&apos;s public profile and information
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Saved successfully
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
                        View Public Profile
                      </a>
                    </Button>
                  )}
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            Saving...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            Save Changes
                          </div>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Alert */}
        <Alert>
          <div className="flex items-center gap-2">
            {profile.is_private ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <AlertDescription>
              Your mosque profile is currently{' '}
              <strong>{profile.is_private ? 'private' : 'public'}</strong>.
              {profile.is_private
                ? ' Only members can view your mosque information.'
                : ' Anyone can discover and view your mosque profile.'}
            </AlertDescription>
          </div>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Essential details about your mosque
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mosqueName">Mosque Name *</Label>
                    <Input
                      id="mosqueName"
                      value={profile.name}
                      onChange={(e) => updateProfile('name', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="establishedYear">Established Year</Label>
                    <Input
                      id="establishedYear"
                      value={profile.established_year}
                      onChange={(e) =>
                        updateProfile('established_year', e.target.value)
                      }
                      disabled={!isEditing}
                      placeholder="e.g., 1995"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={profile.description}
                    onChange={(e) =>
                      updateProfile('description', e.target.value)
                    }
                    disabled={!isEditing}
                    rows={3}
                    placeholder="Describe your mosque and its mission..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      value={profile.capacity}
                      onChange={(e) =>
                        updateProfile('capacity', e.target.value)
                      }
                      disabled={!isEditing}
                      placeholder="e.g., 500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imamName">Imam Name</Label>
                    <Input
                      id="imamName"
                      value={profile.imam_name}
                      onChange={(e) =>
                        updateProfile('imam_name', e.target.value)
                      }
                      disabled={!isEditing}
                      placeholder="e.g., Sheikh Abdullah Rahman"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  How people can reach your mosque
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={profile.address}
                    onChange={(e) => updateProfile('address', e.target.value)}
                    disabled={!isEditing}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => updateProfile('phone', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
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
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={profile.website}
                    onChange={(e) => updateProfile('website', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Prayer Times */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Prayer Times
                </CardTitle>
                <CardDescription>
                  Daily prayer schedule for your mosque
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(profile.prayer_times || {}).map(
                    ([prayer, time]) => (
                      <div key={prayer} className="space-y-2">
                        <Label htmlFor={prayer} className="capitalize">
                          {prayer}
                        </Label>
                        <Input
                          id={prayer}
                          value={time as string}
                          onChange={(e) =>
                            updatePrayerTime(prayer, e.target.value)
                          }
                          disabled={!isEditing}
                          placeholder="e.g., 5:30 AM"
                        />
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Programs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Contribution Programs
                </CardTitle>
                <CardDescription>
                  Active programs and initiatives at your mosque
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
                            {program.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                          {program.target_amount && (
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              <span>
                                Target: $
                                {program.target_amount.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {program.start_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Started:{' '}
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
                                  Progress
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
                          href="/contributions"
                          className="flex items-center gap-2"
                        >
                          <TrendingUp className="h-4 w-4" />
                          Manage All Programs
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                      No Programs Yet
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Create contribution programs to engage your community
                    </p>
                    <Button variant="outline" asChild>
                      <a
                        href="/contributions"
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create First Program
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Profile Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Profile Visibility</Label>
                    <p className="text-sm text-slate-500">
                      Control who can see your mosque profile
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
                      {profile.is_private ? 'Private' : 'Public'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Last updated:{' '}
                    {profile.updated_at
                      ? new Date(profile.updated_at).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Capacity</span>
                  <span className="font-medium">{profile.capacity} people</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Established</span>
                  <span className="font-medium">
                    {profile.established_year}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Services</span>
                  <span className="font-medium">
                    {profile.services?.length || 0} offered
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle>Services Offered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.services?.map((service, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  )) || (
                    <p className="text-sm text-slate-500">No services listed</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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
