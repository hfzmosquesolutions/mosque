'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAuthState } from '@/hooks/useAuth.v2';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building, Edit, Info, Eye } from 'lucide-react';
import Link from 'next/link';
import MosqueProfileForm, {
  MosqueProfileData,
} from '@/components/mosques/MosqueProfileForm';
import { MosqueProfileService, MosqueProfile } from '@/services/mosque-profile';

function MosqueProfileContent() {
  const { t } = useLanguage();
  const { user: authUser, profile } = useAuthState();
  const [mosqueProfile, setMosqueProfile] = useState<MosqueProfile | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [canCreate, setCanCreate] = useState(false);

  const canManageProfile =
    profile?.role === 'super_admin' || profile?.role === 'mosque_admin';

  useEffect(() => {
    if (profile?.id && authUser?.id) {
      fetchMosqueProfile();
      checkCreatePermission();
    }
  }, [profile?.id, authUser?.id]);

  const fetchMosqueProfile = async () => {
    if (!authUser?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data = await MosqueProfileService.getUserMosqueProfile(authUser.id);

      setMosqueProfile(data);
    } catch (error) {
      console.error('Error fetching mosque profile:', error);
      setMessage({ type: 'error', text: 'Failed to load mosque profile' });
    } finally {
      setLoading(false);
    }
  };

  const checkCreatePermission = async () => {
    if (!authUser?.id) return;

    try {
      const canCreateMosque = await MosqueProfileService.canCreateMosque(
        authUser.id
      );

      setCanCreate(canCreateMosque);
    } catch (error) {
      console.error('Error checking create permission:', error);
    }
  };

  const handleSaveMosque = async (data: MosqueProfileData) => {
    if (!authUser) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      let result;

      if (mosqueProfile?.id) {
        // Update existing mosque
        result = await MosqueProfileService.updateMosqueProfile(
          mosqueProfile.id,
          data,
          authUser.id
        );
      } else {
        // Create new mosque
        result = await MosqueProfileService.createMosqueProfile(
          data,
          authUser.id
        );
      }

      if (result) {
        setMosqueProfile(result);
        setIsEditing(false);
        setMessage({
          type: 'success',
          text: mosqueProfile?.id
            ? 'Mosque profile updated successfully!'
            : 'Mosque profile created successfully!',
        });
        // No need to fetch again since we already have the result
      } else {
        setMessage({
          type: 'error',
          text: 'Failed to save mosque profile. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error saving mosque profile:', error);
      setMessage({
        type: 'error',
        text: 'An error occurred while saving the mosque profile.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading mosque profile...</p>
        </div>
      </div>
    );
  }

  if (!canManageProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Access Restricted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              You don't have permission to manage mosque profiles. Please
              contact your administrator.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert
          className={
            message.type === 'error' ? 'border-red-500' : 'border-green-500'
          }
        >
          <AlertDescription
            className={
              message.type === 'error' ? 'text-red-700' : 'text-green-700'
            }
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold mb-2">Mosque Profile Management</h1>
          <p className="text-gray-600">
            {mosqueProfile
              ? 'Manage your mosque information and details'
              : 'Create your mosque profile to get started'}
          </p>
        </div>

        {mosqueProfile && !isEditing && (
          <div className="flex gap-2">
            <Link
              href={`/public/mosque/${mosqueProfile.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                View Live Profile
              </Button>
            </Link>
            <Button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        )}
      </div>

      {/* Mosque Profile Display or Form */}
      {!mosqueProfile && canCreate ? (
        <MosqueProfileForm
          onSubmit={handleSaveMosque}
          isSubmitting={isSubmitting}
        />
      ) : mosqueProfile && !isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {mosqueProfile.name}
            </CardTitle>
            <CardDescription>
              {mosqueProfile.description || 'No description provided'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wide">
                  Address
                </h4>
                <p className="mt-1">
                  {mosqueProfile.address || 'Not provided'}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wide">
                  Capacity
                </h4>
                <p className="mt-1">
                  {mosqueProfile.capacity
                    ? `${mosqueProfile.capacity} people`
                    : 'Not specified'}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wide">
                  Phone
                </h4>
                <p className="mt-1">{mosqueProfile.phone || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wide">
                  Email
                </h4>
                <p className="mt-1">{mosqueProfile.email || 'Not provided'}</p>
              </div>
              {mosqueProfile.website && (
                <div>
                  <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wide">
                    Website
                  </h4>
                  <p className="mt-1">
                    <a
                      href={mosqueProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {mosqueProfile.website}
                    </a>
                  </p>
                </div>
              )}
            </div>

            {mosqueProfile.facilities &&
              mosqueProfile.facilities.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wide mb-2">
                    Facilities
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {mosqueProfile.facilities.map((facility, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      ) : mosqueProfile && isEditing ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
          <MosqueProfileForm
            initialData={mosqueProfile}
            onSubmit={handleSaveMosque}
            isSubmitting={isSubmitting}
          />
        </div>
      ) : !canCreate ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              No Mosque Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                You already have a mosque assigned or don't have permission to
                create a new mosque profile. Please contact your administrator
                if you need to make changes.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export default function MosqueProfilePage() {
  return (
    <AuthLayout>
      <MosqueProfileContent />
    </AuthLayout>
  );
}
