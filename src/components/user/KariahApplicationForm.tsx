'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  FileText,
  Loader2,
  Trash2,
  User,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import {
  getKariahApplications,
  submitKariahApplication,
  deleteKariahApplication,
} from '@/lib/api/kariah-applications';
import {
  getKariahMemberships,
  withdrawKariahMembership,
} from '@/lib/api/kariah-memberships';
import { getUserProfile, getAllMosques } from '@/lib/api';
import { UserProfile } from '@/types/database';

interface KariahApplication {
  id: string;
  mosque_id: string;
  ic_passport_number: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  mosque: {
    name: string;
  };
  reviewer?: {
    full_name: string;
  };
}

interface KariahMembership {
  id: string;
  mosque_id: string;
  membership_number: string;
  status: 'active' | 'inactive' | 'suspended';
  joined_date: string;
  mosque: {
    name: string;
  };
}

interface Mosque {
  id: string;
  name: string;
  address?: string;
}

interface ApplicationFormData {
  mosque_id: string;
  additional_notes?: string;
}

export function KariahApplicationForm() {
  const t = useTranslations('kariahManagement');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [applications, setApplications] = useState<KariahApplication[]>([]);
  const [memberships, setMemberships] = useState<KariahMembership[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState<string | null>(null);
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const [membershipToWithdraw, setMembershipToWithdraw] = useState<{
    id: string;
    mosqueName: string;
  } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState<ApplicationFormData>({
    mosque_id: '',
    additional_notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      if (!user?.id) return;

      // Load user profile
      const profileResult = await getUserProfile(user.id);
      if (profileResult.success && profileResult.data) {
        setUserProfile(profileResult.data);
      }

      // Load user's applications
      const applicationsResult = await getKariahApplications();
      setApplications(applicationsResult.applications || []);

      // Load user's memberships
      const membershipsResult = await getKariahMemberships();
      setMemberships(membershipsResult.memberships || []);

      // Load available mosques
      const mosquesResult = await getAllMosques();
      if (mosquesResult.success && mosquesResult.data) {
        setMosques(mosquesResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleSubmitApplication = async () => {
    if (!formData.mosque_id) {
      toast.error('Please select a mosque');
      return;
    }

      if (!userProfile?.ic_passport_number) {
      toast.error(
        'IC number not found in your profile. Please complete your onboarding first.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitKariahApplication({
        mosque_id: formData.mosque_id,
        ic_passport_number: userProfile.ic_passport_number,
        notes: formData.additional_notes,
      });

      toast.success(result.message || t('applicationSubmittedSuccess'));
      setShowForm(false);
      setFormData({
        mosque_id: '',
        additional_notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Error submitting application:', error);
      let errorMessage = 'Failed to submit application';

      if (error instanceof Error) {
        // Check for duplicate key constraint error
        if (
          error.message.includes(
            'duplicate key value violates unique constraint "kariah_applications_user_id_mosque_id_key"'
          )
        ) {
          errorMessage =
            'You already have an application for this mosque. Please delete your previous application first to reapply.';
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(t('errorSubmittingApplication'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawMembership = async () => {
    if (!membershipToWithdraw) return;

    setIsWithdrawing(membershipToWithdraw.id);
    try {
      await withdrawKariahMembership(membershipToWithdraw.id);
      toast.success(t('membershipWithdrawnSuccess'));
      await loadData();
    } catch (error) {
      console.error('Error withdrawing membership:', error);
      toast.error(
        error instanceof Error ? error.message : t('errorWithdrawingMembership')
      );
    } finally {
      setIsWithdrawing(null);
      setWithdrawConfirmOpen(false);
      setMembershipToWithdraw(null);
    }
  };

  const handleDeleteApplication = async () => {
    if (!applicationToDelete) return;

    setIsDeleting(applicationToDelete);
    try {
      await deleteKariahApplication(applicationToDelete);
      toast.success(t('applicationDeletedSuccess'));
      await loadData();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error(
        error instanceof Error ? error.message : t('errorDeletingApplication')
      );
    } finally {
      setIsDeleting(null);
      setDeleteConfirmOpen(false);
      setApplicationToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('approved')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            {t('rejected')}
          </Badge>
        );
      case 'withdrawn':
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <XCircle className="h-3 w-3 mr-1" />
            {t('withdrawn')}
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            {t('pending')}
          </Badge>
        );
    }
  };

  const getMembershipStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800">
            <UserCheck className="h-3 w-3 mr-1" />
            {t('active')}
          </Badge>
        );
      case 'suspended':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            {t('suspended')}
          </Badge>
        );
      case 'inactive':
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <Clock className="h-3 w-3 mr-1" />
            {t('inactive')}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{t('kariahMembership')}</h1>
        <p className="text-muted-foreground">
          {t('applyForMembershipDescription')}
        </p>
      </div>

      {/* Current Memberships */}
      {memberships.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              {t('yourMemberships')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {memberships.map((membership) => (
                <div
                  key={membership.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">{membership.mosque.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('memberSince')} {formatDate(membership.joined_date)}
                    </p>
                    <p className="text-sm font-mono text-muted-foreground">
                      #{membership.membership_number}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getMembershipStatusBadge(membership.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setMembershipToWithdraw({
                          id: membership.id,
                          mosqueName: membership.mosque.name,
                        });
                        setWithdrawConfirmOpen(true);
                      }}
                      disabled={isWithdrawing === membership.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {isWithdrawing === membership.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      {t('withdrawMembership')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Applications */}
      {applications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('yourApplications')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applications.map((application) => (
                <div key={application.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{application.mosque.name}</h3>
                    {getStatusBadge(application.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {t('appliedOn')} {formatDate(application.created_at)}
                  </p>
                  <p className="text-sm font-mono text-muted-foreground mb-2">
                    IC/Passport: {application.ic_passport_number}
                  </p>
                  {application.admin_notes && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-1">{t('adminNotes')}:</p>
                      <p className="text-sm">{application.admin_notes}</p>
                    </div>
                  )}
                  {application.reviewer && application.reviewed_at && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {t('reviewedBy')} {application.reviewer.full_name} on{' '}
                      {formatDate(application.reviewed_at)}
                    </div>
                  )}
                  {application.status === 'rejected' && (
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setApplicationToDelete(application.id);
                          setDeleteConfirmOpen(true);
                        }}
                        disabled={isDeleting === application.id}
                      >
                        {isDeleting === application.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        {t('deleteApplication')}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Application Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('applyForMembership')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showForm ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                {t('applyForMembershipAtMosque')}
              </p>
              <Button onClick={() => setShowForm(true)}>
                <FileText className="h-4 w-4 mr-2" />
                {t('newApplication')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('icPassportMatchInfo')}
                </AlertDescription>
              </Alert>

              {/* User Profile Preview */}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4" />
                    {t('yourProfileInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {t('fullName')}
                      </label>
                      <p className="text-sm font-medium mt-1">
                        {userProfile?.full_name || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {t('icPassportNumber')}
                      </label>
                      <p className="text-sm font-mono mt-1">
                        {userProfile?.ic_passport_number || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {t('address')}
                      </label>
                      <p className="text-sm mt-1">
                        {userProfile?.address || t('notProvided')}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {t('phone')}
                      </label>
                      <p className="text-sm mt-1">
                        {userProfile?.phone || t('notProvided')}
                      </p>
                    </div>
                  </div>

                  {(!userProfile?.full_name ||
                    !userProfile?.ic_passport_number ||
                    !userProfile?.address) && (
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t('missingProfileInfo')}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end pt-2">
                    <Link href="/profile">
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3 mr-2" />
                        {t('updateProfile')}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <div>
                <label className="text-sm font-medium">{t('mosque')} *</label>
                <Select
                  value={formData.mosque_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, mosque_id: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={t('selectMosque')} />
                  </SelectTrigger>
                  <SelectContent>
                    {mosques.map((mosque) => (
                      <SelectItem key={mosque.id} value={mosque.id}>
                        {mosque.name}
                        {mosque.address && (
                          <span className="text-muted-foreground ml-2">
                            - {mosque.address}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  {t('additionalNotesOptional')}
                </label>
                <Textarea
                  placeholder={t('additionalNotesPlaceholder')}
                  value={formData.additional_notes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      additional_notes: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  {t('cancel')}
                </Button>
                <Button
                  onClick={handleSubmitApplication}
                  disabled={
                    submitting ||
                    !userProfile?.full_name ||
                    !userProfile?.ic_passport_number ||
                    !userProfile?.address ||
                    !formData.mosque_id
                  }
                >
                  {submitting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {submitting ? t('submitting') : t('submitApplication')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdraw Confirmation Dialog */}
      <AlertDialog
        open={withdrawConfirmOpen}
        onOpenChange={setWithdrawConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('withdrawMembershipTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('withdrawMembershipConfirm')}{' '}
              <strong>{membershipToWithdraw?.mosqueName}</strong>?
              <br />
              <br />
              {t('withdrawMembershipActions')}
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{t('permanentlyDeleteMembership')}</li>
                <li>{t('permanentlyDeleteApplication')}</li>
                <li>{t('removeAccessToBenefits')}</li>
                <li>
                  {t('allowReapply')}
                </li>
              </ul>
              <br />
              <strong>{t('actionCannotBeUndone')}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWithdrawMembership}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('withdrawMembership')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteApplicationTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteApplicationConfirm')}
              <br />
              <br />
              <strong>{t('actionCannotBeUndone')}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteApplication}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('deleteApplication')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
