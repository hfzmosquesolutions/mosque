'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getUserProfile, updateUserProfile } from '@/lib/api';

function AccountSettingsContent() {
  const t = useTranslations('docs.profile');
  const tSidebar = useTranslations('sidebar');
  const router = useRouter();
  const pathname = usePathname();
  const { session, user, signOut } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [isAdminAccount, setIsAdminAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setLoadingProfile(false);
        return;
      }
      try {
        const res = await getUserProfile(user.id);
        if (res.success && res.data) {
          setIsAdminAccount(res.data.account_type === 'admin');
          setFullName(res.data.full_name || '');
          setPhone(res.data.phone || '');
          setAddress(res.data.address || '');
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSavingProfile(true);
    try {
      const res = await updateUserProfile(user.id, {
        full_name: fullName,
        phone: phone || null,
        address: address || null,
      } as any);

      if (!res.success) {
        toast.error(res.error || 'Failed to update profile');
        return;
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.access_token) {
      toast.error('You must be signed in to delete your account.');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(
          result.error || 'Failed to delete account. Please try again later.'
        );
        setIsDeleting(false);
        return;
      }

      toast.success('Your account has been deleted.');

      // Sign out locally and redirect to home
      await signOut();

      const localeMatch = pathname.match(/^\/(en|ms)\//);
      const localePrefix = localeMatch ? `/${localeMatch[1]}` : '/ms';
      router.push(`${localePrefix}/`);
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please try again later.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header, consistent with other internal pages */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {tSidebar('accountSettings')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {t('description')}
        </p>
      </div>

      <Tabs defaultValue="general" className="max-w-3xl space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            {t('accountSettings')}
          </TabsTrigger>
          <TabsTrigger value="delete">
            {t('accountDeletion')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 pt-4">
          <Card className="border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">
                {t('personalInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('updatingInfoDesc')}
              </p>

              {loadingProfile ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Loading profile...
                </p>
              ) : !user?.id ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  You must be signed in to edit your profile.
                </p>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('emailLabel') || 'Email address'}
                    </Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-slate-50 dark:bg-slate-800 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('fullNameLabel') || 'Full Name'}
                    </Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('phoneLabel') || 'Phone Number'}
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  {!isAdminAccount && (
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('addressLabel') || 'Address'}
                      </Label>
                      <Textarea
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}

                  <Button type="submit" disabled={savingProfile}>
                    {savingProfile ? 'Saving...' : 'Save changes'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delete" className="space-y-6 pt-4">
          <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <CardTitle className="text-lg font-semibold text-red-700 dark:text-red-300">
                  {t('accountDeletion')}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-red-700/90 dark:text-red-200">
                {t('deletingAccountDesc')}
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700/90 dark:text-red-200">
                <li>{t('deletionItem1')}</li>
                <li>{t('deletionItem2')}</li>
                <li>{t('deletionItem3')}</li>
                <li>{t('deletionItem4')}</li>
              </ul>

              <div className="space-y-2 pt-2">
                <Label
                  htmlFor="delete-confirm-input"
                  className="text-sm font-medium text-red-700 dark:text-red-300"
                >
                  {t('deleteConfirmInputLabel')}
                </Label>
                <Input
                  id="delete-confirm-input"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={t('deleteConfirmInputPlaceholder')}
                  className="border-red-200 focus-visible:ring-red-500 dark:border-red-800"
                />
                <p className="text-xs text-red-700/90 dark:text-red-300">
                  {t('deleteConfirmInputHint')}
                </p>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="mt-4"
                    disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                  >
                    {isDeleting ? t('deleteButtonLoading') || 'Deleting account...' : t('deleteButton')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t('deleteConfirmTitle')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('deleteConfirmDescription')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                      {t('deleteConfirmCancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                    >
                      {t('deleteConfirmConfirm')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AccountSettingsPage() {
  const tSidebar = useTranslations('sidebar');

  return (
    <ProtectedRoute requireAuth={true} requireAdmin={false}>
      <DashboardLayout title={tSidebar('accountSettings')}>
        <AccountSettingsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

