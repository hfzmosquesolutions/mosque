'use client';

import { useState, useEffect } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  User,
  Camera,
  Save,
  Eye,
  Share2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Shield,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, updateUserProfile } from '@/lib/api';
import { UserProfile } from '@/types/database';
import { FollowingDashboard } from '@/components/following';
import Link from 'next/link';

function ProfileContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    const response = await getUserProfile(user.id);

    if (response.success && response.data) {
      setProfile(response.data);
    } else {
      setError(response.error || 'Failed to load profile');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user?.id || !profile) return;

    setSaving(true);
    const response = await updateUserProfile(user.id, {
      full_name: profile.full_name,
      phone: profile.phone,
      address: profile.address,
      date_of_birth: profile.date_of_birth,
      gender: profile.gender,
      occupation: profile.occupation,
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

  const updateField = (field: keyof UserProfile, value: any) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
    setHasUnsavedChanges(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleIcon = () => {
    if (profile?.account_type === 'admin') {
      return <Shield className="h-4 w-4 text-green-600" />;
    }
    return <Users className="h-4 w-4 text-blue-600" />;
  };

  const getRoleBadgeVariant = () => {
    return profile?.account_type === 'admin' ? 'default' : 'secondary';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile data...</p>
          </div>
        </div>
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
                Profile Error
              </h3>
              <p className="text-muted-foreground mb-4">{error || 'Profile not found'}</p>
              <Button 
                onClick={fetchProfile}
                className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl" />
          <div className="relative p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    My Profile
                  </h1>
                </div>
                <p className="text-muted-foreground text-lg">
                  Manage your personal information and public profile
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getRoleIcon()}
                    <span>{profile.account_type === 'admin' ? 'Administrator' : 'Member'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/users/${user?.id}`}>
                  <Button variant="outline" size="lg" className="gap-2 shadow-md hover:shadow-lg transition-all duration-200">
                    <Eye className="h-4 w-4" />
                    View Public Profile
                  </Button>
                </Link>
                {hasUnsavedChanges && (
                  <Button 
                    onClick={handleSave} 
                    disabled={saving} 
                    size="lg"
                    className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="contact">Contact & Emergency</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="public">Public Profile</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            {/* Profile Header */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 ring-4 ring-blue-100 dark:ring-blue-900/30">
                      <AvatarImage src={profile.profile_picture_url} />
                      <AvatarFallback className="text-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-white shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{profile.full_name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      {getRoleIcon()}
                      <Badge variant={getRoleBadgeVariant()} className="shadow-sm">
                        {profile.account_type === 'admin'
                          ? 'Administrator'
                          : 'Member'}
                      </Badge>
                      <Badge variant="outline" className="shadow-sm">{profile.membership_type}</Badge>
                    </div>
                    <p className="text-muted-foreground mt-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Member since {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <Briefcase className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and basic information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profile.full_name}
                      onChange={(e) => updateField('full_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-slate-50"
                    />
                    <p className="text-xs text-slate-500">
                      Email cannot be changed here. Contact support if needed.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
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
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={profile.gender || ''}
                      onValueChange={(value) => updateField('gender', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">
                          Prefer not to say
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={profile.occupation || ''}
                      onChange={(e) =>
                        updateField('occupation', e.target.value)
                      }
                      placeholder="Your profession or occupation"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact & Emergency Tab */}
          <TabsContent value="contact" className="space-y-6">
            {/* Contact Information */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  Contact Information
                </CardTitle>
                <CardDescription>Update your contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profile.phone || ''}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={profile.address || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        updateField('address', e.target.value)
                      }
                      placeholder="Your full address"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  Emergency Contact
                </CardTitle>
                <CardDescription>
                  Provide emergency contact information for safety purposes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyName">
                      Emergency Contact Name
                    </Label>
                    <Input
                      id="emergencyName"
                      value={profile.emergency_contact_name || ''}
                      onChange={(e) =>
                        updateField('emergency_contact_name', e.target.value)
                      }
                      placeholder="Full name of emergency contact"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">
                      Emergency Contact Phone
                    </Label>
                    <Input
                      id="emergencyPhone"
                      value={profile.emergency_contact_phone || ''}
                      onChange={(e) =>
                        updateField('emergency_contact_phone', e.target.value)
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="following" className="space-y-6">
            <FollowingDashboard />
          </TabsContent>

          {/* Public Profile Tab */}
          <TabsContent value="public" className="space-y-6">
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Share2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  Public Profile Settings
                </CardTitle>
                <CardDescription>
                  Control what information is visible on your public profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                      Public Profile URL
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                    Your public profile can be accessed at:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg text-sm border shadow-sm flex-1">
                      {window.location.origin}/users/{user?.id}
                    </code>
                    <Button size="sm" variant="outline" className="shadow-sm hover:shadow-md transition-all duration-200">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Privacy Toggle */}
                  <div className="flex items-center justify-between p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 shadow-sm">
                    <div className="space-y-2">
                      <Label
                        htmlFor="profile-privacy"
                        className="text-base font-semibold text-slate-900 dark:text-slate-100"
                      >
                        Make Profile Private
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        When enabled, only you can view your profile. When
                        disabled, your profile is publicly visible like social
                        media.
                      </p>
                    </div>
                    <Switch
                      id="profile-privacy"
                      checked={profile.is_profile_private}
                      onCheckedChange={(checked) =>
                        updateField('is_profile_private', checked)
                      }
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Information visible on your public profile:
                      </h4>
                      <div className="grid gap-3">
                        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-green-800 dark:text-green-200">Full name and profile picture</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-green-800 dark:text-green-200">Member since date</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-green-800 dark:text-green-200">Role and membership type</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-sm text-red-800 dark:text-red-200">Contact information (private)</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-sm text-red-800 dark:text-red-200">Emergency contacts (private)</span>
                        </div>
                      </div>
                    </div>

                    {profile.is_profile_private && (
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <span className="font-medium text-yellow-900 dark:text-yellow-100">Privacy Notice</span>
                        </div>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          Your profile is currently private and not visible to other users.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
