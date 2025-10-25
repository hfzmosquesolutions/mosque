'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Building,
  ArrowLeft,
  Calendar,
  Users,
  CreditCard,
  Target,
} from 'lucide-react';
import {
  getMosque,
  getMosqueKhairatSettings,
  getOrganizationPeople,
} from '@/lib/api';
import { KhairatContributionForm } from '@/components/khairat/KhairatContributionForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, HeartHandshake, HandCoins, CheckCircle, Clock, Edit, User, Trash2, X, UserCheck, Heart } from 'lucide-react';
import { createClaim, uploadClaimDocument } from '@/lib/api';
import { submitKariahApplication, getKariahMembers, deleteKariahMember, withdrawKariahMembership } from '@/lib/api/kariah-members';
import { submitKhairatApplication, getKhairatMembers, deleteKhairatMember, withdrawKhairatMembership } from '@/lib/api/khairat-members';
import { getUserProfile, updateUserProfile } from '@/lib/api';
import { ClaimDocumentUpload } from '@/components/khairat/ClaimDocumentUpload';
import type { UserProfile, ClaimDocument } from '@/types/database';
import { toast } from 'sonner';
import { ShareProfileButton } from '@/components/mosque/ShareProfileButton';
import { ServiceAwareButton } from '@/components/mosque/ServiceAwareButton';
import { KariahRegistrationInfo } from '@/components/mosque/KariahRegistrationInfo';
import { KariahRegistrationDialog } from '@/components/mosque/KariahRegistrationDialog';
import { KhairatRegistrationInfo } from '@/components/mosque/KhairatRegistrationInfo';
import { KhairatRegistrationDialog } from '@/components/mosque/KhairatRegistrationDialog';
import { Mosque, KhairatProgram } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { RUNTIME_FEATURES } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';

export default function MosqueProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mosqueId = params.id as string;
  const { user } = useAuth();
  const t = useTranslations('mosqueProfile');

  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [contributionPrograms, setContributionPrograms] = useState<
    KhairatProgram[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isKhairatModalOpen, setIsKhairatModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isKariahSuccessModalOpen, setIsKariahSuccessModalOpen] = useState(false);
  const [isKhairatSuccessModalOpen, setIsKhairatSuccessModalOpen] = useState(false);
  const [isKariahApplicationModalOpen, setIsKariahApplicationModalOpen] = useState(false);
  const [currentApplicationStatus, setCurrentApplicationStatus] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<string | null>(null);
  const [currentApplicationId, setCurrentApplicationId] = useState<string | null>(null);
  const [isKhairatApplicationModalOpen, setIsKhairatApplicationModalOpen] = useState(false);
  const [currentKhairatApplicationStatus, setCurrentKhairatApplicationStatus] = useState<string | null>(null);
  const [khairatAdminNotes, setKhairatAdminNotes] = useState<string | null>(null);
  const [currentKhairatApplicationId, setCurrentKhairatApplicationId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isWithdrawConfirmOpen, setIsWithdrawConfirmOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [isWithdrawingMembership, setIsWithdrawingMembership] = useState(false);
  const [isWithdrawMembershipConfirmOpen, setIsWithdrawMembershipConfirmOpen] = useState(false);
  const [currentMembershipId, setCurrentMembershipId] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [isKhairatClaimDialogOpen, setIsKhairatClaimDialogOpen] = useState(false);
  const [isApplyingKariah, setIsApplyingKariah] = useState(false);
  const [isApplyingKhairat, setIsApplyingKhairat] = useState(false);
  const [khairatClaimSubmitting, setKhairatClaimSubmitting] = useState(false);
  const [khairatClaimTitle, setKhairatClaimTitle] = useState('');
  const [khairatClaimAmount, setKhairatClaimAmount] = useState('');
  const [khairatClaimDescription, setKhairatClaimDescription] = useState('');
  const [khairatClaimDocuments, setKhairatClaimDocuments] = useState<File[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [organizationPeople, setOrganizationPeople] = useState<any[]>([]);
  const [organizationPeopleLoading, setOrganizationPeopleLoading] = useState(false);
  const [isUserAnyMosqueAdmin, setIsUserAnyMosqueAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(false);

  const fetchMosqueData = useCallback(async () => {
    try {
      console.log(
        '[PAGE] MosqueProfilePage - Starting to fetch mosque data for ID:',
        mosqueId
      );
      setLoading(true);

      // Fetch mosque details
      console.log('[PAGE] MosqueProfilePage - Fetching mosque details');
      const mosqueResponse = await getMosque(mosqueId);
      console.log(
        '[PAGE] MosqueProfilePage - getMosque response:',
        mosqueResponse
      );

      if (!mosqueResponse.success || !mosqueResponse.data) {
        console.error(
          '[PAGE] MosqueProfilePage - Failed to fetch mosque:',
          mosqueResponse.error
        );
        setError(mosqueResponse.error || t('notFound'));
        return;
      }

      console.log(
        '[PAGE] MosqueProfilePage - Successfully fetched mosque data'
      );
      setMosque(mosqueResponse.data);


      // Fetch khairat settings
      console.log('[PAGE] MosqueProfilePage - Fetching khairat settings');
      const settingsResponse = await getMosqueKhairatSettings(mosqueId);
      if (settingsResponse.success && settingsResponse.data) {
        // Check if khairat is enabled
        const khairatEnabled = settingsResponse.data.enabled;
        setContributionPrograms(khairatEnabled ? [settingsResponse.data] : []);
        console.log(
          '[PAGE] MosqueProfilePage - Khairat enabled:',
          khairatEnabled
        );
      }

      // Fetch organization people only if service enabled (public only)
      const enabledServices = Array.isArray(mosqueResponse.data.settings?.enabled_services)
        ? (mosqueResponse.data.settings.enabled_services as string[])
        : [];
      if (enabledServices.includes('organization_people')) {
        console.log('[PAGE] MosqueProfilePage - Fetching organization people');
        setOrganizationPeopleLoading(true);
        const organizationResponse = await getOrganizationPeople(mosqueId, true);
        if (organizationResponse.success && organizationResponse.data) {
          setOrganizationPeople(organizationResponse.data);
          console.log(
            '[PAGE] MosqueProfilePage - Organization people count:',
            organizationResponse.data.length
          );
        }
        setOrganizationPeopleLoading(false);
      }

      // Check if user is following this mosque (only if user is logged in)
    } catch (err) {
      console.error('[PAGE] MosqueProfilePage - Catch error:', err);
      setError(t('errorFetchingData'));
    } finally {
      setLoading(false);
    }
  }, [mosqueId, user]);

  useEffect(() => {
    if (mosqueId) {
      fetchMosqueData();
    }
  }, [mosqueId, fetchMosqueData]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      const profile = await getUserProfile(user.id);
      if (profile.success) setUserProfile(profile.data || null);
    };
    loadProfile();
  }, [user]);

  // Check if current user is admin of any mosque
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        setIsUserAnyMosqueAdmin(false);
        setAdminCheckLoading(false);
        return;
      }

      setAdminCheckLoading(true);
      try {
        // Check if user owns any mosque (making them an admin)
        const { data: mosqueData, error: mosqueError } = await supabase
          .from('mosques')
          .select('id')
          .eq('user_id', user.id)
          .single();

        const isAdmin = !mosqueError && !!mosqueData;
        setIsUserAnyMosqueAdmin(isAdmin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsUserAnyMosqueAdmin(false);
      } finally {
        setAdminCheckLoading(false);
      }
    };

    checkAdminStatus();
  }, [user?.id]);

  // Check for URL parameter to auto-open khairat contribution modal
  useEffect(() => {
    const openKhairat = searchParams.get('openKhairat');
    if (openKhairat === 'true' && user?.id && !loading) {
      setIsKhairatModalOpen(true);
      // Clear URL parameter immediately when modal opens
      const url = new URL(window.location.href);
      url.searchParams.delete('openKhairat');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, user?.id, loading]);

  // Check for URL parameter to auto-open khairat claim modal
  useEffect(() => {
    const openClaim = searchParams.get('openClaim');
    if (openClaim === 'true' && user?.id && !loading) {
      setIsKhairatClaimDialogOpen(true);
      // Clear URL parameter immediately when modal opens
      const url = new URL(window.location.href);
      url.searchParams.delete('openClaim');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, user?.id, loading]);


  // events functionality removed

  const handleContributeToProgram = (programId: string) => {
    if (!user?.id) {
      router.push('/login');
      return;
    }
    setSelectedProgramId(programId);
    setIsKhairatModalOpen(true);
  };

  const handleOpenKhairatClaim = () => {
    if (!user?.id) {
      router.push('/login');
      return;
    }
    setIsKhairatClaimDialogOpen(true);
  };

  const handleCloseKhairatClaim = () => {
    setIsKhairatClaimDialogOpen(false);
    setKhairatClaimTitle('');
    setKhairatClaimAmount('');
    setKhairatClaimDescription('');
    setKhairatClaimDocuments([]);
  };

  const handleSubmitKhairatClaim = async () => {
    if (!user || !mosque) return;
    if (!khairatClaimTitle || !khairatClaimAmount) {
      toast.error(t('pleaseFillRequired'));
      return;
    }
    const amountNum = parseFloat(khairatClaimAmount);
    if (!(amountNum > 0)) {
      toast.error(t('invalidAmount'));
      return;
    }
    setKhairatClaimSubmitting(true);
    try {
      const payload = {
        claimant_id: user.id,
        mosque_id: mosque.id,
        title: khairatClaimTitle,
        description: khairatClaimDescription || undefined,
        requested_amount: amountNum,
        priority: 'medium' as const,
      };
      const res = await createClaim(payload as any);
      if ((res as any)?.success) {
        const claimId = (res as any).data?.id;
        toast.success(t('khairatClaimSubmitted'));
        
        // If there are documents to upload, upload them now
        if (khairatClaimDocuments.length > 0) {
          toast.info('Claim created. Uploading supporting documents...');
          
          // Upload each document
          for (const file of khairatClaimDocuments) {
            try {
              const uploadResponse = await uploadClaimDocument(claimId, file, user.id);
              if (!uploadResponse.success) {
                console.error('Failed to upload document:', uploadResponse.error);
                toast.error(`Failed to upload ${file.name}`);
              }
            } catch (error) {
              console.error('Error uploading document:', error);
              toast.error(`Failed to upload ${file.name}`);
            }
          }
          
          toast.success('Claim and documents submitted successfully!');
        } else {
          toast.success('Claim submitted successfully!');
        }
        
        // Close dialog and reset form
        setIsKhairatClaimDialogOpen(false);
        setKhairatClaimTitle('');
        setKhairatClaimAmount('');
        setKhairatClaimDescription('');
        setKhairatClaimDocuments([]);
      } else {
        toast.error((res as any)?.error || t('errorSubmittingKhairatClaim'));
      }
    } catch (e) {
      toast.error(t('errorSubmittingKhairatClaim'));
    } finally {
      setKhairatClaimSubmitting(false);
    }
  };

  const fetchCurrentApplicationStatus = async () => {
    if (!user?.id || !mosque?.id) return;
    
    try {
      const members = await getKariahMembers({ user_id: user.id, mosque_id: mosque.id });
      
      if (members.length > 0) {
        const latestMember = members[0];
        console.log('Latest kariah member record:', latestMember);
        setCurrentApplicationStatus(latestMember.status);
        setAdminNotes(latestMember.admin_notes || null);
        setCurrentApplicationId(latestMember.id);
        
        // If it's an active membership, set the membership ID
        if (latestMember.status === 'active') {
          setCurrentMembershipId(latestMember.id);
        } else {
          setCurrentMembershipId(null);
        }
      } else {
        setCurrentApplicationStatus(null);
        setAdminNotes(null);
        setCurrentApplicationId(null);
        setCurrentMembershipId(null);
      }
    } catch (error) {
      console.error('Error fetching application status:', error);
      setCurrentApplicationStatus(null);
      setAdminNotes(null);
      setCurrentApplicationId(null);
      setCurrentMembershipId(null);
    }
  };

  const handleApplyKariah = async () => {
    if (!user?.id) {
      router.push('/login');
      return;
    }
    if (!mosque) return;
    if (!userProfile?.ic_passport_number) {
      toast.error(t('completeProfileFirst'));
      router.push('/profile');
      return;
    }
    
    // Fetch current application status before showing modal
    await fetchCurrentApplicationStatus();
    // Initialize editing profile with current user profile
    setEditingProfile(userProfile);
    setIsKariahApplicationModalOpen(true);
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!editingProfile || !user?.id) return;
    
    try {
      const response = await updateUserProfile(user.id, editingProfile);
      if (response.success) {
        setUserProfile(editingProfile);
        setIsEditingProfile(false);
        toast.success(t('profileUpdatedSuccessfully'));
      } else {
        toast.error(response.error || t('errorUpdatingProfile'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('errorUpdatingProfile'));
    }
  };

  const handleCancelEditProfile = () => {
    setEditingProfile(userProfile);
    setIsEditingProfile(false);
  };

  const handleDeleteApplication = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentApplicationId) return;
    
    setIsDeleting(true);
    try {
      await deleteKariahMember(currentApplicationId);
      toast.success(t('applicationDeletedSuccessfully'));
      setIsDeleteConfirmOpen(false);
      setIsKariahApplicationModalOpen(false);
      // Reset application status
      setCurrentApplicationStatus(null);
      setAdminNotes(null);
      setCurrentApplicationId(null);
    } catch (error: any) {
      console.error('Error deleting application:', error);
      toast.error(error?.message || t('errorDeletingApplication'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleWithdrawApplication = () => {
    setIsWithdrawConfirmOpen(true);
  };

  const handleConfirmWithdraw = async () => {
    if (!currentApplicationId) return;
    
    setIsWithdrawing(true);
    try {
      // For applications, we need to update the status to withdrawn
      // For memberships, we use the withdrawKariahMembership function
      if (currentApplicationStatus === 'active') {
        await withdrawKariahMembership(currentApplicationId);
      } else {
        // For applications, update status to withdrawn
        const { updateKariahMember } = await import('@/lib/api/kariah-members');
        await updateKariahMember(currentApplicationId, { status: 'withdrawn' });
      }
      toast.success(t('applicationWithdrawnSuccessfully'));
      setIsWithdrawConfirmOpen(false);
      setIsKariahApplicationModalOpen(false);
      // Reset application status
      setCurrentApplicationStatus(null);
      setAdminNotes(null);
      setCurrentApplicationId(null);
      // Refresh the application status to ensure it's updated
      await fetchCurrentApplicationStatus();
    } catch (error: any) {
      console.error('Error withdrawing application:', error);
      toast.error(error?.message || t('errorWithdrawingApplication'));
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleWithdrawMembership = async () => {
    if (!user?.id || !mosque?.id) return;
    try {
      // Ensure we have the membership ID before opening the confirm dialog
      if (!currentMembershipId) {
        const { getKariahMemberships } = await import('@/lib/api/kariah-memberships');
        const membershipResponse = await getKariahMemberships({
          user_id: user.id,
          mosque_id: mosque.id,
          limit: 1,
        });

        const foundId = membershipResponse.memberships?.[0]?.id;
        if (foundId) {
          setCurrentMembershipId(foundId);
        } else {
          toast.error(t('errorWithdrawingMembership'));
          return;
        }
      }

      setIsWithdrawMembershipConfirmOpen(true);
    } catch (err) {
      console.error('Error preparing membership withdrawal:', err);
      toast.error(t('errorWithdrawingMembership'));
    }
  };

  const handleConfirmWithdrawMembership = async () => {
    if (!currentMembershipId) return;
    
    setIsWithdrawingMembership(true);
    try {
      await withdrawKariahMembership(currentMembershipId);
      toast.success(t('membershipWithdrawnSuccessfully'));
      setIsWithdrawMembershipConfirmOpen(false);
      setIsKariahApplicationModalOpen(false);
      // Reset application status
      setCurrentApplicationStatus(null);
      setAdminNotes(null);
      setCurrentApplicationId(null);
      setCurrentMembershipId(null);
      // Refresh the application status to ensure it's updated
      await fetchCurrentApplicationStatus();
    } catch (error: any) {
      console.error('Error withdrawing membership:', error);
      toast.error(error?.message || t('errorWithdrawingMembership'));
    } finally {
      setIsWithdrawingMembership(false);
    }
  };

  const handleConfirmKariahApplication = async () => {
    if (!user?.id || !mosque || !userProfile?.ic_passport_number) return;
    
    setIsApplyingKariah(true);
    try {
      const result = await submitKariahApplication({
        mosque_id: String(mosque.id),
        ic_passport_number: userProfile.ic_passport_number,
        notes: '',
      });
      
      // Check if it's a reactivation or new application
      const isReactivation = result.message?.includes('reactivated');
      toast.success(result.message || t('applicationSubmitted'));
      setIsKariahApplicationModalOpen(false);
      setIsKariahSuccessModalOpen(true);
      
      // Refresh application status after submission
      await fetchCurrentApplicationStatus();
    } catch (e: any) {
      toast.error(e?.message || t('errorSubmittingApplication'));
    } finally {
      setIsApplyingKariah(false);
    }
  };

  const handleKhairatSuccess = () => {
    setIsKhairatModalOpen(false);
    setSelectedProgramId('');
    // Show success modal instead of just toast
    setIsSuccessModalOpen(true);
    // Refresh khairat programs to get updated amounts
    fetchMosqueData();
  };

  // Khairat Application Functions
  const fetchCurrentKhairatApplicationStatus = async () => {
    if (!user?.id || !mosqueId) return;
    
    try {
      const members = await getKhairatMembers({ user_id: user.id, mosque_id: mosqueId });
      
      if (members.length > 0) {
        const latestMember = members[0];
        console.log('Latest khairat member record:', latestMember);
        setCurrentKhairatApplicationStatus(latestMember.status);
        setKhairatAdminNotes(latestMember.admin_notes || null);
        setCurrentKhairatApplicationId(latestMember.id);
        
        // If it's an active membership, set the membership ID
        if (latestMember.status === 'active') {
          setCurrentMembershipId(latestMember.id);
          console.log('Active khairat membership found:', latestMember);
        }
      } else {
        console.log('No khairat member records found');
        setCurrentKhairatApplicationStatus(null);
        setKhairatAdminNotes(null);
        setCurrentKhairatApplicationId(null);
        setCurrentMembershipId(null);
      }
    } catch (error) {
      console.error('Error fetching khairat member status:', error);
      setCurrentKhairatApplicationStatus(null);
      setKhairatAdminNotes(null);
      setCurrentKhairatApplicationId(null);
      setCurrentMembershipId(null);
    }
  };

  const handleApplyKhairat = async () => {
    if (!user?.id) {
      router.push('/login');
      return;
    }
    if (!mosque) return;
    if (!userProfile?.ic_passport_number) {
      toast.error(t('completeProfileFirst'));
      router.push('/profile');
      return;
    }
    
    // Fetch current application status before showing modal
    await fetchCurrentKhairatApplicationStatus();
    // Initialize editing profile with current user profile
    setEditingProfile(userProfile);
    setIsKhairatApplicationModalOpen(true);
  };

  const handleDeleteKhairatApplication = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteKhairatApplication = async () => {
    if (!currentKhairatApplicationId) return;
    
    setIsDeleting(true);
    try {
      await deleteKhairatMember(currentKhairatApplicationId);
      toast.success(t('applicationDeletedSuccessfully'));
      setIsDeleteConfirmOpen(false);
      setIsKhairatApplicationModalOpen(false);
      // Reset application status
      setCurrentKhairatApplicationStatus(null);
      setKhairatAdminNotes(null);
      setCurrentKhairatApplicationId(null);
    } catch (error: any) {
      console.error('Error deleting khairat application:', error);
      toast.error(error?.message || t('errorDeletingApplication'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleWithdrawKhairatApplication = () => {
    console.log('Withdrawing khairat application:', currentKhairatApplicationId);
    setIsWithdrawConfirmOpen(true);
  };

  const handleConfirmWithdrawKhairatApplication = async () => {
    if (!currentKhairatApplicationId) return;
    
    setIsWithdrawing(true);
    try {
      await withdrawKhairatMembership(currentKhairatApplicationId);
      toast.success(t('applicationWithdrawnSuccessfully'));
      setIsWithdrawConfirmOpen(false);
      setIsKhairatApplicationModalOpen(false);
      // Reset application status
      setCurrentKhairatApplicationStatus(null);
      setKhairatAdminNotes(null);
      setCurrentKhairatApplicationId(null);
      // Refresh the application status to ensure it's updated
      await fetchCurrentKhairatApplicationStatus();
    } catch (error: any) {
      console.error('Error withdrawing khairat application:', error);
      toast.error(error?.message || t('errorWithdrawingApplication'));
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleWithdrawKhairatMembership = async () => {
    console.log('Attempting to withdraw khairat membership, currentMembershipId:', currentMembershipId);
    
    if (!currentMembershipId) {
      console.error('No membership ID available for withdrawal');
      toast.error('Membership ID not found');
      return;
    }
    
    setIsWithdrawingMembership(true);
    try {
      console.log('Calling withdrawKhairatMembership with ID:', currentMembershipId);
      await withdrawKhairatMembership(currentMembershipId);
      toast.success(t('membershipWithdrawnSuccessfully'));
      setIsWithdrawMembershipConfirmOpen(false);
      setIsKhairatApplicationModalOpen(false);
      // Reset application status
      setCurrentKhairatApplicationStatus(null);
      setKhairatAdminNotes(null);
      setCurrentKhairatApplicationId(null);
      setCurrentMembershipId(null);
      // Refresh the application status to ensure it's updated
      await fetchCurrentKhairatApplicationStatus();
    } catch (error: any) {
      console.error('Error withdrawing khairat membership:', error);
      toast.error(error?.message || t('errorWithdrawingMembership'));
    } finally {
      setIsWithdrawingMembership(false);
    }
  };

  const handleSubmitKhairatApplication = async () => {
    if (!user?.id || !mosque || !userProfile?.ic_passport_number) return;
    
    setIsApplyingKhairat(true);
    try {
      const result = await submitKhairatApplication({
        mosque_id: String(mosque.id),
        ic_passport_number: userProfile.ic_passport_number,
        application_reason: '',
      });
      
      // Check if it's a reactivation or new application
      const isReactivation = result.message?.includes('reactivated');
      toast.success(result.message || t('khairatApplicationSubmitted'));
      setIsKhairatApplicationModalOpen(false);
      setIsKhairatSuccessModalOpen(true);
      
      // Refresh application status after submission
      await fetchCurrentKhairatApplicationStatus();
    } catch (e: any) {
      toast.error(e?.message || t('errorSubmittingApplication'));
    } finally {
      setIsApplyingKhairat(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {t('loading')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !mosque) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('notFound')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => router.push('/mosques')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('backToMosques')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-emerald-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] blur-3xl">
          <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-emerald-300/40" />
          <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-teal-300/40" />
        </div>
        {/* Hero Section */}
        <div className="relative bg-white/90 dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-8 backdrop-blur">
          {/* Cover Image */}
          <div
            className="h-48 relative"
            style={{
              backgroundImage: mosque.banner_url
                ? `url(${mosque.banner_url})`
                : 'linear-gradient(to right, rgb(16, 185, 129), rgb(34, 197, 94))',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-end sm:justify-between sm:space-y-0">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {mosque.logo_url ? (
                      <img
                        src={mosque.logo_url}
                        alt={`${mosque.name} logo`}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <Building className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" />
                    )}
                  </div>
                  <div className="text-white min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 leading-tight">
                      {mosque.name}
                    </h1>
                    {mosque.address && (
                      <div className="flex items-start text-white/90">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm sm:text-base leading-tight">
                          {mosque.address}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-2 sm:space-x-3 flex-shrink-0">
                  <ShareProfileButton mosque={mosque} />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="px-6 py-4 bg-white/70 dark:bg-slate-900/40 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {mosque.settings?.established_year != null && (
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      {t('established')}{' '}
                      {String(mosque.settings.established_year)}
                    </span>
                  </div>
                )}
                {mosque.settings?.capacity != null && (
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <Building className="h-4 w-4 mr-2" />
                    <span>
                      {t('capacity')}: {String(mosque.settings.capacity)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {/* About Section */}
            <Card className="border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 shadow-sm mb-8 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Building className="h-5 w-5 mr-2 text-emerald-600" />
                  {t('aboutMosque')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mosque.description && (
                  <div>
                    <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed mb-4">
                      {mosque.description}
                    </p>
                  </div>
                )}
                {mosque.settings?.imam_name != null && (
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                      {t('imam')}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      {String(mosque.settings.imam_name)}
                    </p>
                  </div>
                )}
                {mosque.settings?.enabled_services != null &&
                  Array.isArray(mosque.settings.enabled_services) &&
                  mosque.settings.enabled_services.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                        {t('servicesPrograms')}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(mosque.settings.enabled_services as string[]).map(
                          (service, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200"
                            >
                              {service.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-600">
                <TabsTrigger 
                  value="overview" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                >
                  {t('overview')}
                </TabsTrigger>
                {Array.isArray(mosque.settings?.enabled_services) && mosque.settings.enabled_services.includes('khairat_management') && (
                  <TabsTrigger 
                    value="programs" 
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                  >
                    {t('programs')}
                  </TabsTrigger>
                )}
                {Array.isArray(mosque.settings?.enabled_services) && mosque.settings.enabled_services.includes('organization_people') && (
                  <TabsTrigger 
                    value="organization" 
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                  >
                    <Users className="h-4 w-4" />
                    {t('organizationPeople')}
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">

                {/* Active Programs Section */}
                {Array.isArray(mosque.settings?.enabled_services) && mosque.settings.enabled_services.includes('khairat_management') && (
                  <Card className="border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 shadow-sm backdrop-blur">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-xl">
                        <div className="flex items-center">
                          <CreditCard className="h-5 w-5 mr-2 text-emerald-600" />
                          {t('activePrograms')}
                        </div>
                        {contributionPrograms.length > 3 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab('programs')}
                          >
                            {t('viewAllPrograms')}
                          </Button>
                        )}
                      </CardTitle>
                      <CardDescription>{t('supportPrograms')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {contributionPrograms.length === 0 ? (
                        <div className="text-center py-8">
                          <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-slate-500 dark:text-slate-400">
                            {t('noActivePrograms')}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {contributionPrograms.slice(0, 3).map((program) => {
                            const progressPercentage = program.target_amount
                              ? Math.min(
                                  ((program.current_amount || 0) /
                                    program.target_amount) *
                                    100,
                                  100
                                )
                              : 0;

                            return (
                              <div
                                key={program.id}
                                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white/90 dark:bg-slate-800/70"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold text-slate-900 dark:text-white">
                                        {program.name}
                                      </h4>
                                      <Badge
                                        variant="secondary"
                                        className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                                      >
                                        Khairat
                                      </Badge>
                                    </div>
                                    {program.description && (
                                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                        {program.description}
                                      </p>
                                    )}
                                  </div>
                                  <ServiceAwareButton
                                    size="sm"
                                    onClick={() =>
                                      handleContributeToProgram(program.id)
                                    }
                                    className="ml-4 bg-emerald-600 hover:bg-emerald-700"
                                    serviceId="khairat_management"
                                    enabledServices={Array.isArray(mosque.settings?.enabled_services) ? mosque.settings.enabled_services : []}
                                    disabledMessage="Khairat contributions are not currently available for this mosque."
                                  >
                                    <CreditCard className="h-4 w-4 mr-1" />
                                    {t('contribute')}
                                  </ServiceAwareButton>
                                </div>

                                {/* Progress Bar */}
                                {program.target_amount && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-slate-600 dark:text-slate-400">
                                        {t('progress')}
                                      </span>
                                      <span className="font-medium text-slate-900 dark:text-white">
                                        RM{' '}
                                        {(
                                          program.current_amount || 0
                                        ).toLocaleString()}{' '}
                                        / RM{' '}
                                        {program.target_amount.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                      <div
                                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                                        style={{
                                          width: `${progressPercentage}%`,
                                        }}
                                      ></div>
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                      {t('completed', {
                                        percentage: progressPercentage.toFixed(1),
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Ongoing program without target */}
                                {!program.target_amount && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">
                                      {t('totalRaised')}
                                    </span>
                                    <span className="font-medium text-emerald-600">
                                      RM{' '}
                                      {(
                                        program.current_amount || 0
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Activities Section */}
                {/* activities removed */}

                {/* events removed */}
              </TabsContent>

              {Array.isArray(mosque.settings?.enabled_services) && mosque.settings.enabled_services.includes('khairat_management') && (
                <TabsContent value="programs" className="space-y-6 mt-6">
                  <Card className="border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 shadow-sm backdrop-blur">
                    <CardHeader>
                      <CardTitle className="flex items-center text-xl">
                        <CreditCard className="h-5 w-5 mr-2 text-emerald-600" />
                        {t('allPrograms')}
                      </CardTitle>
                      <CardDescription>{t('supportPrograms')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {contributionPrograms.length === 0 ? (
                        <div className="text-center py-8">
                          <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-slate-500 dark:text-slate-400">
                            {t('noActivePrograms')}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {contributionPrograms.map((program) => {
                            const progressPercentage = program.target_amount
                              ? Math.min(
                                  ((program.current_amount || 0) /
                                    program.target_amount) *
                                    100,
                                  100
                                )
                              : 0;

                            return (
                              <div
                                key={program.id}
                                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white/90 dark:bg-slate-800/70"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold text-slate-900 dark:text-white">
                                        {program.name}
                                      </h4>
                                      <Badge
                                        variant="secondary"
                                        className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                                      >
                                        Khairat
                                      </Badge>
                                    </div>
                                    {program.description && (
                                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                        {program.description}
                                      </p>
                                    )}
                                  </div>
                                  <ServiceAwareButton
                                    size="sm"
                                    onClick={() =>
                                      handleContributeToProgram(program.id)
                                    }
                                    className="ml-4 bg-emerald-600 hover:bg-emerald-700"
                                    serviceId="khairat_management"
                                    enabledServices={Array.isArray(mosque.settings?.enabled_services) ? mosque.settings.enabled_services : []}
                                    disabledMessage="Khairat contributions are not currently available for this mosque."
                                  >
                                    <CreditCard className="h-4 w-4 mr-1" />
                                    {t('contribute')}
                                  </ServiceAwareButton>
                                </div>

                                {/* Progress Bar */}
                                {program.target_amount && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-slate-600 dark:text-slate-400">
                                        {t('progress')}
                                      </span>
                                      <span className="font-medium text-slate-900 dark:text-white">
                                        RM{' '}
                                        {(
                                          program.current_amount || 0
                                        ).toLocaleString()}{' '}
                                        / RM{' '}
                                        {program.target_amount.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                      <div
                                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                                        style={{
                                          width: `${progressPercentage}%`,
                                        }}
                                      ></div>
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                      {t('completed', {
                                        percentage: progressPercentage.toFixed(1),
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Ongoing program without target */}
                                {!program.target_amount && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">
                                      {t('totalRaised')}
                                    </span>
                                    <span className="font-medium text-emerald-600">
                                      RM{' '}
                                      {(
                                        program.current_amount || 0
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {Array.isArray(mosque.settings?.enabled_services) && mosque.settings.enabled_services.includes('organization_people') && (
              <TabsContent value="organization" className="space-y-6 mt-6">
                <Card className="border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 shadow-sm backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                      <Users className="h-5 w-5 mr-2 text-emerald-600" />
                      {t('organizationPeople')}
                    </CardTitle>
                    <CardDescription>{t('meetOurTeam')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {organizationPeopleLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                      </div>
                    ) : organizationPeople.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">
                          {t('noOrganizationPeople')}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {organizationPeople.map((person) => (
                          <div
                            key={person.id}
                            className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white/90 dark:bg-slate-800/70"
                          >
                            <div className="flex items-start space-x-3">
                              {person.profile_picture_url ? (
                                <img
                                  src={person.profile_picture_url}
                                  alt={person.full_name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                  <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                                  {person.full_name}
                                </h4>
                                <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                                  {person.position}
                                </p>
                                {person.department && (
                                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                                    {person.department}
                                  </p>
                                )}
                                {person.bio && (
                                  <p className="text-slate-600 dark:text-slate-400 text-xs mt-2 line-clamp-2">
                                    {person.bio}
                                  </p>
                                )}
                                {(person.email || person.phone) && (
                                  <div className="mt-2 space-y-1">
                                    {person.email && (
                                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                                        <Mail className="h-3 w-3 mr-1" />
                                        {person.email}
                                      </p>
                                    )}
                                    {person.phone && (
                                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                                        <Phone className="h-3 w-3 mr-1" />
                                        {person.phone}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Right Column - Contact & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Target className="h-5 w-5 mr-2 text-emerald-600" />
                  {t('quickActions', { fallback: 'Quick Actions' })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {adminCheckLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                    <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                      {t('loading', { fallback: 'Loading...' })}
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Admin Notice */}
                    {isUserAnyMosqueAdmin && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <UserCheck className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                              {t('adminNotice', { fallback: 'You are a mosque administrator' })}
                            </h4>
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                              {t('adminNoticeMessage', { fallback: 'As a mosque administrator, these member actions are not available to you. Use your dashboard to manage your mosque.' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2">
                      {/* Register as Kariah Member */}
                      <ServiceAwareButton
                        serviceId="kariah_management"
                        enabledServices={Array.isArray(mosque.settings?.enabled_services) ? mosque.settings.enabled_services : []}
                        disabledMessage="Kariah registrations are not currently available for this mosque."
                        className={`w-full justify-start p-3 h-auto ${isUserAnyMosqueAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                        variant="ghost"
                        disabled={isUserAnyMosqueAdmin}
                        onClick={() => {
                          if (isUserAnyMosqueAdmin) return;
                          if (!user?.id) {
                            router.push('/login');
                            return;
                          }
                          handleApplyKariah();
                        }}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                          isUserAnyMosqueAdmin
                            ? 'bg-gray-200 dark:bg-gray-700'
                            : !user?.id || isApplyingKariah
                            ? 'bg-gray-200 dark:bg-gray-700' 
                            : 'bg-purple-100 dark:bg-purple-800'
                        }`}>
                          {isApplyingKariah ? (
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-gray-500" />
                          ) : (
                            <UserCheck className={`h-5 w-5 ${
                              isUserAnyMosqueAdmin
                                ? 'text-gray-400 dark:text-gray-500'
                                : !user?.id 
                                ? 'text-gray-400 dark:text-gray-500' 
                                : 'text-purple-600 dark:text-purple-400'
                            }`} />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-medium text-slate-900 dark:text-white text-sm">
                            {isApplyingKariah ? t('submitting') : t('applyKariah')}
                          </h3>
                          {isUserAnyMosqueAdmin && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {t('notAvailableForAdmin', { fallback: 'Not available for mosque administrators' })}
                            </p>
                          )}
                        </div>
                      </ServiceAwareButton>

                      {/* Register for Khairat */}
                      <ServiceAwareButton
                        serviceId="khairat_management"
                        enabledServices={Array.isArray(mosque.settings?.enabled_services) ? mosque.settings.enabled_services : []}
                        disabledMessage="Khairat registrations are not currently available for this mosque."
                        className={`w-full justify-start p-3 h-auto ${isUserAnyMosqueAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                        variant="ghost"
                        disabled={isUserAnyMosqueAdmin}
                        onClick={() => {
                          if (isUserAnyMosqueAdmin) return;
                          if (!user?.id) {
                            router.push('/login');
                            return;
                          }
                          handleApplyKhairat();
                        }}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                          isUserAnyMosqueAdmin
                            ? 'bg-gray-200 dark:bg-gray-700'
                            : !user?.id || isApplyingKhairat
                            ? 'bg-gray-200 dark:bg-gray-700' 
                            : 'bg-emerald-100 dark:bg-emerald-800'
                        }`}>
                          {isApplyingKhairat ? (
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-gray-500" />
                          ) : (
                            <Heart className={`h-5 w-5 ${
                              isUserAnyMosqueAdmin
                                ? 'text-gray-400 dark:text-gray-500'
                                : !user?.id 
                                ? 'text-gray-400 dark:text-gray-500' 
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`} />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-medium text-slate-900 dark:text-white text-sm">
                            {isApplyingKhairat ? t('submitting') : t('applyKhairat')}
                          </h3>
                          {isUserAnyMosqueAdmin && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {t('notAvailableForAdmin', { fallback: 'Not available for mosque administrators' })}
                            </p>
                          )}
                        </div>
                      </ServiceAwareButton>

                      {/* Pay Khairat */}
                      <ServiceAwareButton
                        serviceId="khairat_management"
                        enabledServices={Array.isArray(mosque.settings?.enabled_services) ? mosque.settings.enabled_services : []}
                        disabledMessage="Khairat payments are not currently available for this mosque."
                        className={`w-full justify-start p-3 h-auto ${isUserAnyMosqueAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                        variant="ghost"
                        disabled={isUserAnyMosqueAdmin}
                        onClick={() => {
                          if (isUserAnyMosqueAdmin) return;
                          if (!user?.id) {
                            router.push('/login');
                            return;
                          }
                          setIsKhairatModalOpen(true);
                        }}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                          isUserAnyMosqueAdmin
                            ? 'bg-gray-200 dark:bg-gray-700'
                            : !user?.id 
                            ? 'bg-gray-200 dark:bg-gray-700' 
                            : 'bg-emerald-100 dark:bg-emerald-800'
                        }`}>
                          <HandCoins className={`h-5 w-5 ${
                            isUserAnyMosqueAdmin
                              ? 'text-gray-400 dark:text-gray-500'
                              : !user?.id 
                              ? 'text-gray-400 dark:text-gray-500' 
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`} />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-medium text-slate-900 dark:text-white text-sm">
                            {t('payKhairat')}
                          </h3>
                          {isUserAnyMosqueAdmin && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {t('notAvailableForAdmin', { fallback: 'Not available for mosque administrators' })}
                            </p>
                          )}
                        </div>
                      </ServiceAwareButton>

                      {/* Submit Khairat Claim */}
                      <ServiceAwareButton
                        serviceId="khairat_management"
                        enabledServices={Array.isArray(mosque.settings?.enabled_services) ? mosque.settings.enabled_services : []}
                        disabledMessage="Khairat claims are not currently available for this mosque."
                        className={`w-full justify-start p-3 h-auto ${isUserAnyMosqueAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                        variant="ghost"
                        disabled={isUserAnyMosqueAdmin}
                        onClick={() => {
                          if (isUserAnyMosqueAdmin) return;
                          if (!user?.id) {
                            router.push('/login');
                            return;
                          }
                          handleOpenKhairatClaim();
                        }}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                          isUserAnyMosqueAdmin
                            ? 'bg-gray-200 dark:bg-gray-700'
                            : !user?.id 
                            ? 'bg-gray-200 dark:bg-gray-700' 
                            : 'bg-rose-100 dark:bg-rose-800'
                        }`}>
                          <HeartHandshake className={`h-5 w-5 ${
                            isUserAnyMosqueAdmin
                              ? 'text-gray-400 dark:text-gray-500'
                              : !user?.id 
                              ? 'text-gray-400 dark:text-gray-500' 
                              : 'text-rose-600 dark:text-rose-400'
                          }`} />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-medium text-slate-900 dark:text-white text-sm">
                            {t('submitKhairatClaim')}
                          </h3>
                          {isUserAnyMosqueAdmin && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {t('notAvailableForAdmin', { fallback: 'Not available for mosque administrators' })}
                            </p>
                          )}
                        </div>
                      </ServiceAwareButton>
                    </div>
                    {!user && (
                      <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                          {t('loginRequiredForActions', { fallback: 'Please log in to access these actions' })}
                        </p>
                        <Button
                          onClick={() => router.push('/login')}
                          className="w-full"
                        >
                          {t('signInToContinue', { fallback: 'Sign In to Continue' })}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
            {/* Contact Information */}
            <Card className="border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Phone className="h-5 w-5 mr-2 text-emerald-600" />
                  {t('contactInformation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mosque.phone && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Phone className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('phone')}
                      </p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {mosque.phone}
                      </p>
                    </div>
                  </div>
                )}
                {mosque.email && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Mail className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('email')}
                      </p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {mosque.email}
                      </p>
                    </div>
                  </div>
                )}
                {mosque.website && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Globe className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('website')}
                      </p>
                      <a
                        href={mosque.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        {t('visitWebsite')}
                      </a>
                    </div>
                  </div>
                )}
                {mosque.address && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mt-1">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('address')}
                      </p>
                      <p className="font-medium text-slate-900 dark:text-white leading-relaxed">
                        {mosque.address}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* Khairat Contribution Modal */}
      <KhairatContributionForm
        isOpen={isKhairatModalOpen}
        onClose={() => setIsKhairatModalOpen(false)}
        onSuccess={handleKhairatSuccess}
        preselectedMosqueId={mosque?.id}
        preselectedProgramId={selectedProgramId}
        defaultProgramType={'khairat' as any}
      />

      {/* Success Modal */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              {t('paymentSuccess', { fallback: 'Payment Successful!' })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('paymentSuccessMessage', { fallback: 'Your khairat payment has been recorded successfully!' })}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  router.push('/my-mosques');
                }}
                className="w-full"
              >
                {t('viewMyPayments', { fallback: 'View My Payments' })}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsSuccessModalOpen(false)}
                className="w-full"
              >
                {t('close', { fallback: 'Close' })}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit Khairat Claim Dialog */}
      <Dialog open={isKhairatClaimDialogOpen} onOpenChange={handleCloseKhairatClaim}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('submitKhairatClaim', { fallback: 'Submit Khairat Claim' })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {!user && (
              <Alert>
                <AlertDescription>{t('loginRequired', { fallback: 'Please log in to continue.' })}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('khairatClaimTitle', { fallback: 'Claim Title' })}</label>
              <Input value={khairatClaimTitle} onChange={(e) => setKhairatClaimTitle(e.target.value)} placeholder={t('khairatClaimTitlePlaceholder', { fallback: 'E.g. Funeral assistance, Medical expenses' })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('amount', { fallback: 'Amount (RM)' })}</label>
              <Input type="number" step="0.01" min="1" value={khairatClaimAmount} onChange={(e) => setKhairatClaimAmount(e.target.value)} placeholder={t('amountPlaceholder', { fallback: 'Enter amount' })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('description', { fallback: 'Description (optional)' })}</label>
              <Textarea rows={3} value={khairatClaimDescription} onChange={(e) => setKhairatClaimDescription(e.target.value)} placeholder={t('khairatClaimDescriptionPlaceholder', { fallback: 'Describe your situation and need for financial assistance' })} />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Supporting Documents (Optional)</label>
              <p className="text-xs text-slate-500">
                Upload documents like medical bills, death certificates, or other supporting evidence
              </p>
              <ClaimDocumentUpload
                onDocumentsChange={(docs) => {
                  if (Array.isArray(docs) && docs.length > 0 && docs[0] instanceof File) {
                    setKhairatClaimDocuments(docs as File[]);
                  }
                }}
                maxFiles={5}
                disabled={false}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseKhairatClaim}>
                {t('cancel', { fallback: 'Cancel' })}
              </Button>
              <Button onClick={handleSubmitKhairatClaim} disabled={khairatClaimSubmitting || !khairatClaimTitle || !khairatClaimAmount}>
                {khairatClaimSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('submitting', { fallback: 'Submitting...' })}
                  </>
                ) : (
                  t('submit', { fallback: 'Submit' })
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <KariahRegistrationDialog
        isOpen={isKariahApplicationModalOpen}
        onOpenChange={setIsKariahApplicationModalOpen}
        status={currentApplicationStatus as any}
        adminNotes={adminNotes}
        mosqueId={mosqueId}
        mosqueName={mosque?.name}
        isApplying={isApplyingKariah}
        isWithdrawingApplication={isWithdrawing}
        isDeletingApplication={isDeleting}
        isWithdrawingMembership={isWithdrawingMembership}
        onApply={handleConfirmKariahApplication}
        onWithdrawApplication={handleConfirmWithdraw}
        onDeleteApplication={handleConfirmDelete}
        onWithdrawMembership={handleWithdrawMembership}
      />

      <KhairatRegistrationDialog
        isOpen={isKhairatApplicationModalOpen}
        onOpenChange={setIsKhairatApplicationModalOpen}
        status={currentKhairatApplicationStatus as any}
        adminNotes={khairatAdminNotes}
        mosqueId={mosqueId}
        mosqueName={mosque?.name}
        isApplying={isApplyingKhairat}
        isWithdrawingApplication={isWithdrawing}
        isDeletingApplication={isDeleting}
        isWithdrawingMembership={isWithdrawingMembership}
        onApply={handleSubmitKhairatApplication}
        onWithdrawApplication={handleConfirmWithdrawKhairatApplication}
        onDeleteApplication={handleConfirmDeleteKhairatApplication}
        onWithdrawMembership={handleWithdrawKhairatMembership}
      />

      {/* Kariah Registration Success Modal */}
      <Dialog open={isKariahSuccessModalOpen} onOpenChange={setIsKariahSuccessModalOpen}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {t('applicationSubmitted')}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('kariahApplicationSuccessMessage')}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsKariahSuccessModalOpen(false)}
                className="w-full"
              >
                {t('close')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Khairat Registration Success Modal */}
      <Dialog open={isKhairatSuccessModalOpen} onOpenChange={setIsKhairatSuccessModalOpen}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {t('khairatApplicationSubmitted')}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('khairatApplicationSuccessMessage')}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsKhairatSuccessModalOpen(false)}
                className="w-full"
              >
                {t('close')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inline confirmations handled by KariahRegistrationDialog */}
    </div>
  );
}
