'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Shield, Building, Phone, MapPin } from 'lucide-react';

interface UserProfile {
  fullName: string;
  phone: string;
  address: string;
  accountType: 'member' | 'admin';
  mosqueAction?: string;
  mosqueName?: string;
  mosqueAddress?: string;
  existingMosqueId?: string;
  email: string;
  completedAt: string;
}

export function UserRoleCard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user?.id) {
      const storedProfile = localStorage.getItem(`user_profile_${user.id}`);
      if (storedProfile) {
        try {
          setProfile(JSON.parse(storedProfile));
        } catch (error) {
          console.error('Error parsing user profile:', error);
        }
      }
    }
  }, [user]);

  if (!profile) {
    return null;
  }

  const getRoleIcon = () => {
    if (profile.accountType === 'admin') {
      return <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />;
    }
    return <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
  };

  const getRoleBadgeVariant = () => {
    return profile.accountType === 'admin' ? 'default' : 'secondary';
  };

  const getRoleTitle = () => {
    if (profile.accountType === 'admin') {
      return 'Mosque Administrator';
    }
    return 'Community Member';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getRoleIcon()}
          Welcome, {profile.fullName}
        </CardTitle>
        <CardDescription>
          Your account information and role in the mosque community
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Role
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getRoleBadgeVariant()}>{getRoleTitle()}</Badge>
              </div>
            </div>

            {profile.accountType === 'admin' && profile.mosqueAction && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Mosque Setup
                </label>
                <p className="text-slate-900 dark:text-slate-100 mt-1">
                  {profile.mosqueAction === 'create' ? 'Created New Mosque' : 'Joined Existing Mosque'}
                </p>
              </div>
            )}

            {profile.accountType === 'admin' && profile.mosqueName && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Mosque Name
                </label>
                <p className="text-slate-900 dark:text-slate-100 mt-1">
                  {profile.mosqueName}
                </p>
              </div>
            )}

            {profile.accountType === 'admin' && profile.mosqueAddress && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Mosque Address
                </label>
                <p className="text-slate-900 dark:text-slate-100 mt-1">
                  {profile.mosqueAddress}
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Email
              </label>
              <p className="text-slate-900 dark:text-slate-100 mt-1">
                {profile.email}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Phone
              </label>
              <p className="text-slate-900 dark:text-slate-100 mt-1">
                {profile.phone}
              </p>
            </div>

            {profile.address && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Address
                </label>
                <p className="text-slate-900 dark:text-slate-100 mt-1">
                  {profile.address}
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Member Since
              </label>
              <p className="text-slate-900 dark:text-slate-100 mt-1">
                {new Date(profile.completedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {profile.accountType === 'admin' && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Administrator Privileges
              </span>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              You have access to manage mosque operations and
              community activities.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
