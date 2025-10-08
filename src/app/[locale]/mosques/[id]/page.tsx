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
  getEvents,
  registerForEvent,
  getUserEventRegistrations,
  followMosque,
  unfollowMosque,
  isUserFollowingMosque,
  getMosqueFollowerCount,
  getKhairatPrograms,
} from '@/lib/api';
import { EventCard } from '@/components/events/EventCard';
import { KhairatContributionForm } from '@/components/khairat/KhairatContributionForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, HeartHandshake, HandCoins, CheckCircle, Clock, Edit, User, Trash2, X } from 'lucide-react';
import { createClaim, uploadClaimDocument } from '@/lib/api';
import { submitKariahApplication, getKariahApplications, deleteKariahApplication, withdrawKariahApplication } from '@/lib/api/kariah-applications';
import { getUserProfile, updateUserProfile } from '@/lib/api';
import { ClaimDocumentUpload } from '@/components/khairat/ClaimDocumentUpload';
import type { UserProfile, ClaimDocument } from '@/types/database';
import { toast } from 'sonner';
import { ShareProfileButton } from '@/components/mosque/ShareProfileButton';
import { Mosque, Event, KhairatProgram } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { RUNTIME_FEATURES } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export default function MosqueProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mosqueId = params.id as string;
  const { user } = useAuth();
  const t = useTranslations('mosqueProfile');

  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [contributionPrograms, setContributionPrograms] = useState<
    KhairatProgram[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [userRegistrations, setUserRegistrations] = useState<string[]>([]);
  const [isKhairatModalOpen, setIsKhairatModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isKariahSuccessModalOpen, setIsKariahSuccessModalOpen] = useState(false);
  const [isKariahApplicationModalOpen, setIsKariahApplicationModalOpen] = useState(false);
  const [currentApplicationStatus, setCurrentApplicationStatus] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<string | null>(null);
  const [currentApplicationId, setCurrentApplicationId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isWithdrawConfirmOpen, setIsWithdrawConfirmOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [isKhairatClaimDialogOpen, setIsKhairatClaimDialogOpen] = useState(false);
  const [isApplyingKariah, setIsApplyingKariah] = useState(false);
  const [khairatClaimSubmitting, setKhairatClaimSubmitting] = useState(false);
  const [khairatClaimTitle, setKhairatClaimTitle] = useState('');
  const [khairatClaimAmount, setKhairatClaimAmount] = useState('');
  const [khairatClaimDescription, setKhairatClaimDescription] = useState('');
  const [khairatClaimDocuments, setKhairatClaimDocuments] = useState<File[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

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

      // Fetch events
      if (RUNTIME_FEATURES.EVENTS_VISIBLE) {
        console.log('[PAGE] MosqueProfilePage - Fetching events');
        const eventsResponse = await getEvents(mosqueId, 5);

        console.log(
          '[PAGE] MosqueProfilePage - getEvents response:',
          eventsResponse
        );

        if (eventsResponse.data) {
          console.log(
            '[PAGE] MosqueProfilePage - Successfully set events, count:',
            eventsResponse.data.length
          );
          setEvents(eventsResponse.data);

          // Fetch user registrations for these events (only if user is logged in)
          if (user?.id && eventsResponse.data.length > 0) {
            const eventIds = eventsResponse.data.map((event) => event.id);
            const registrations = await getUserEventRegistrations(
              user.id,
              eventIds
            );
            setUserRegistrations(registrations);
          }
        }
      }

      // Fetch follower count
      const followerCount = await getMosqueFollowerCount(mosqueId);
      setFollowerCount(followerCount);

      // Fetch contribution programs
      console.log('[PAGE] MosqueProfilePage - Fetching contribution programs');
      const programsResponse = await getKhairatPrograms(mosqueId);
      if (programsResponse.success && programsResponse.data) {
        // Filter only active programs
        const activePrograms = programsResponse.data.filter(
          (program) => program.is_active
        );
        setContributionPrograms(activePrograms);
        console.log(
          '[PAGE] MosqueProfilePage - Active programs count:',
          activePrograms.length
        );
      }

      // Check if user is following this mosque (only if user is logged in)
      if (user?.id) {
        const following = await isUserFollowingMosque(user.id, mosqueId);
        setIsFollowing(following);
      }
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

  const handleFollow = async () => {
    if (!user?.id) {
      router.push('/login');
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        const response = await unfollowMosque(user.id, mosqueId);
        if (response.success) {
          setIsFollowing(false);
          setFollowerCount((prev) => prev - 1);
        } else {
          console.error('Failed to unfollow mosque:', response.error);
        }
      } else {
        const response = await followMosque(user.id, mosqueId);
        if (response.success) {
          setIsFollowing(true);
          setFollowerCount((prev) => prev + 1);
        } else {
          console.error('Failed to follow mosque:', response.error);
        }
      }
    } catch (error) {
      console.error('Error handling follow action:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleRegisterForEvent = async (eventId: string) => {
    if (!user?.id) {
      router.push('/login');
      return;
    }

    try {
      const response = await registerForEvent(eventId, user.id);
      if (response.success) {
        // Update user registrations
        setUserRegistrations((prev) => [...prev, eventId]);
      } else {
        console.error('Failed to register for event:', response.error);
      }
    } catch (error) {
      console.error('Failed to register for event:', error);
    }
  };

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
      const response = await getKariahApplications({
        user_id: user.id,
        mosque_id: mosque.id,
        limit: 1
      });
      
      if (response.applications && response.applications.length > 0) {
        const application = response.applications[0];
        setCurrentApplicationStatus(application.status);
        setAdminNotes(application.admin_notes || null);
        setCurrentApplicationId(application.id);
      } else {
        setCurrentApplicationStatus(null);
        setAdminNotes(null);
        setCurrentApplicationId(null);
      }
    } catch (error) {
      console.error('Error fetching application status:', error);
      setCurrentApplicationStatus(null);
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
      await deleteKariahApplication(currentApplicationId);
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
      await withdrawKariahApplication(currentApplicationId);
      toast.success(t('applicationWithdrawnSuccessfully'));
      setIsWithdrawConfirmOpen(false);
      setIsKariahApplicationModalOpen(false);
      // Reset application status
      setCurrentApplicationStatus(null);
      setAdminNotes(null);
      setCurrentApplicationId(null);
    } catch (error: any) {
      console.error('Error withdrawing application:', error);
      toast.error(error?.message || t('errorWithdrawingApplication'));
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleConfirmKariahApplication = async () => {
    if (!user?.id || !mosque || !userProfile?.ic_passport_number) return;
    
    setIsApplyingKariah(true);
    try {
      const result = await submitKariahApplication({
        mosque_id: mosque.id,
        ic_passport_number: userProfile.ic_passport_number,
        notes: '',
      });
      toast.success(result.message || t('applicationSubmitted'));
      setIsKariahApplicationModalOpen(false);
      setIsKariahSuccessModalOpen(true);
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
                  {user && (
                    <Button
                      onClick={handleFollow}
                      disabled={followLoading}
                      variant={isFollowing ? 'secondary' : 'default'}
                      size="sm"
                      className="text-xs sm:text-sm"
                    >
                      {followLoading ? (
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-current mr-1 sm:mr-2"></div>
                      ) : isFollowing ? (
                        <>
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">
                            {t('following')}
                          </span>
                          <span className="sm:hidden">Following</span>
                        </>
                      ) : (
                        <>
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">
                            {t('follow')}
                          </span>
                          <span className="sm:hidden">Follow</span>
                        </>
                      )}
                    </Button>
                  )}
                  <ShareProfileButton mosque={mosque} />
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-white border-white/30 text-xs sm:text-sm px-2 py-1"
                  >
                    {t('active')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="px-6 py-4 bg-white/70 dark:bg-slate-900/40 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="font-medium">{followerCount}</span>
                  <span className="ml-1">
                    {followerCount === 1 ? t('follower') : t('followers')}
                  </span>
                </div>
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
                {mosque.settings?.services != null &&
                  Array.isArray(mosque.settings.services) &&
                  mosque.settings.services.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                        {t('servicesPrograms')}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(mosque.settings.services as string[]).map(
                          (service, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200"
                            >
                              {service}
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
                <TabsTrigger 
                  value="programs" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                >
                  {t('programs')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Prayer Times */}
                {mosque.prayer_times && (
                  <Card className="border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 shadow-sm backdrop-blur">
                    <CardHeader>
                      <CardTitle className="flex items-center text-xl">
                        <Calendar className="h-5 w-5 mr-2 text-emerald-600" />
                        {t('prayerTimes')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Object.entries(mosque.prayer_times).map(
                          ([prayer, time]) => (
                            <div
                              key={prayer}
                              className="text-center p-3 bg-slate-50 dark:bg-slate-700/70 rounded-lg"
                            >
                              <div className="font-semibold text-slate-900 dark:text-white capitalize mb-1">
                                {prayer}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {String(time)}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Active Programs Section */}
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
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleContributeToProgram(program.id)
                                  }
                                  className="ml-4 bg-emerald-600 hover:bg-emerald-700"
                                >
                                  <CreditCard className="h-4 w-4 mr-1" />
                                  {t('contribute')}
                                </Button>
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

                {/* Events Section */}
                {RUNTIME_FEATURES.EVENTS_VISIBLE && (
                  <Card className="border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 shadow-sm backdrop-blur">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-xl">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 mr-2 text-emerald-600" />
                          {t('upcomingEvents')}
                        </div>
                        {events.length > 3 && (
                          <Button variant="outline" size="sm">
                            {t('viewAllEvents')}
                          </Button>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {events.length === 0 ? (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-slate-500 dark:text-slate-400">
                            {t('noUpcomingEvents')}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {events.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white/90 dark:bg-slate-800/70"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                                    {event.title}
                                  </h4>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                    {formatDateTime(event.event_date)}
                                  </p>
                                  {event.location && (
                                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-500">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {event.location}
                                    </div>
                                  )}
                                </div>
                                {user &&
                                  !userRegistrations.includes(event.id) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleRegisterForEvent(event.id)
                                      }
                                      className="ml-4"
                                    >
                                      {t('register')}
                                    </Button>
                                  )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

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
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleContributeToProgram(program.id)
                                  }
                                  className="ml-4 bg-emerald-600 hover:bg-emerald-700"
                                >
                                  <CreditCard className="h-4 w-4 mr-1" />
                                  {t('contribute')}
                                </Button>
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
              <CardContent className="grid grid-cols-1 gap-3">
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setIsKhairatModalOpen(true)}
                >
                  <HandCoins className="h-4 w-4 mr-2" />
                  {t('payKhairat')}
                </Button>
                <Button variant="outline" className="w-full" onClick={handleOpenKhairatClaim}>
                  <HeartHandshake className="h-4 w-4 mr-2" />
                  {t('submitKhairatClaim')}
                </Button>
                <Button variant="outline" className="w-full" onClick={handleApplyKariah} disabled={isApplyingKariah}>
                  {isApplyingKariah ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('submitting')}
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      {t('applyKariah')}
                    </>
                  )}
                </Button>
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

            {/* Quick Stats */}
            <Card className="border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Users className="h-5 w-5 mr-2 text-emerald-600" />
                  {t('community')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {followerCount}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {followerCount === 1 ? t('follower') : t('followers')}
                  </div>
                </div>
                {!user && (
                  <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                      {t('joinCommunity')}
                    </p>
                    <Button
                      onClick={() => router.push('/login')}
                      className="w-full"
                    >
                      {t('signInToFollow')}
                    </Button>
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
                  router.push('/my-khairat');
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

      {/* Kariah Application Confirmation Modal */}
      <Dialog open={isKariahApplicationModalOpen} onOpenChange={setIsKariahApplicationModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              {t('applyKariah')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                currentApplicationStatus === 'approved' ? 'bg-green-100' :
                currentApplicationStatus === 'pending' ? 'bg-yellow-100' :
                currentApplicationStatus === 'rejected' ? 'bg-red-100' :
                'bg-emerald-100'
              }`}>
                {currentApplicationStatus === 'approved' ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : currentApplicationStatus === 'pending' ? (
                  <Clock className="h-8 w-8 text-yellow-600" />
                ) : currentApplicationStatus === 'rejected' ? (
                  <FileText className="h-8 w-8 text-red-600" />
                ) : (
                  <FileText className="h-8 w-8 text-emerald-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {t('confirmKariahApplication')}
              </h3>
              
              {/* Current Application Status */}
              {currentApplicationStatus && (
                <div className="mb-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {t('currentApplicationStatus')}
                    </span>
                    <Badge 
                      variant={
                        currentApplicationStatus === 'approved' ? 'default' :
                        currentApplicationStatus === 'pending' ? 'secondary' :
                        'destructive'
                      }
                      className={
                        currentApplicationStatus === 'approved' ? 'bg-green-100 text-green-800 border-green-200 font-medium' :
                        currentApplicationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 font-medium' :
                        'bg-red-100 text-red-800 border-red-200 font-medium'
                      }
                    >
                      {currentApplicationStatus === 'approved' ? t('approved') :
                       currentApplicationStatus === 'pending' ? t('pendingReview') :
                       t('rejected')}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {currentApplicationStatus === 'approved' && (
                      <p className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {t('alreadyKariahMember')}
                      </p>
                    )}
                    {currentApplicationStatus === 'pending' && (
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        {t('applicationUnderReview')}
                      </p>
                    )}
                    {currentApplicationStatus === 'rejected' && (
                      <div className="space-y-2">
                        <p className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-red-600" />
                          {t('applicationRejected')}
                        </p>
                        {adminNotes && (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-2">
                            <h5 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                              {t('adminNotes')}:
                            </h5>
                            <p className="text-sm text-red-700 dark:text-red-300">
                              {adminNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {!currentApplicationStatus && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t('kariahApplicationConfirmationMessage', { mosqueName: mosque?.name })}
                </p>
              )}
            </div>

            {/* User Profile Review Section */}
            {editingProfile && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('reviewYourInformation')}
                  </h4>
                  {!isEditingProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditProfile}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-3 w-3" />
                      {t('edit')}
                    </Button>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('fullName')}
                      </label>
                      {isEditingProfile ? (
                        <Input
                          value={editingProfile.full_name || ''}
                          onChange={(e) => setEditingProfile({...editingProfile, full_name: e.target.value})}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-slate-900 dark:text-white mt-1">
                          {editingProfile.full_name || t('notProvided')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('icPassportNumber')}
                      </label>
                      {isEditingProfile ? (
                        <Input
                          value={editingProfile.ic_passport_number || ''}
                          onChange={(e) => setEditingProfile({...editingProfile, ic_passport_number: e.target.value})}
                          className="mt-1"
                          placeholder="e.g., 123456789012"
                        />
                      ) : (
                        <p className="text-sm text-slate-900 dark:text-white mt-1">
                          {editingProfile.ic_passport_number || t('notProvided')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('phone')}
                      </label>
                      {isEditingProfile ? (
                        <Input
                          value={editingProfile.phone || ''}
                          onChange={(e) => setEditingProfile({...editingProfile, phone: e.target.value})}
                          className="mt-1"
                          placeholder="e.g., +60123456789"
                        />
                      ) : (
                        <p className="text-sm text-slate-900 dark:text-white mt-1">
                          {editingProfile.phone || t('notProvided')}
                        </p>
                      )}
                    </div>

                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('address')}
                    </label>
                    {isEditingProfile ? (
                      <Textarea
                        value={editingProfile.address || ''}
                        onChange={(e) => setEditingProfile({...editingProfile, address: e.target.value})}
                        className="mt-1"
                        rows={2}
                        placeholder={t('enterYourAddress')}
                      />
                    ) : (
                      <p className="text-sm text-slate-900 dark:text-white mt-1">
                        {editingProfile.address || t('notProvided')}
                      </p>
                    )}
                  </div>

                  {isEditingProfile && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleSaveProfile}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {t('save')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelEditProfile}
                        size="sm"
                      >
                        {t('cancel')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {currentApplicationStatus === 'approved' ? (
                <Button 
                  disabled={true}
                  className="w-full bg-green-400 cursor-not-allowed"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('applicationApproved')}
                </Button>
              ) : currentApplicationStatus === 'pending' ? (
                <div className="flex gap-2">
                  <Button 
                    disabled={true}
                    className="flex-1 bg-slate-400 cursor-not-allowed"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {t('applicationUnderReview')}
                  </Button>
                  <Button 
                    onClick={handleWithdrawApplication}
                    variant="outline"
                    className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t('withdrawApplication')}
                  </Button>
                </div>
              ) : currentApplicationStatus === 'rejected' ? (
                <Button 
                  onClick={handleDeleteApplication}
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('deleteApplication')}
                </Button>
              ) : (
                <Button 
                  onClick={handleConfirmKariahApplication}
                  disabled={isApplyingKariah}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {isApplyingKariah ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('submitting')}
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      {t('applyKariah')}
                    </>
                  )}
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setIsKariahApplicationModalOpen(false)}
                disabled={isApplyingKariah}
                className="w-full"
              >
{t('cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kariah Application Success Modal */}
      <Dialog open={isKariahSuccessModalOpen} onOpenChange={setIsKariahSuccessModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              {t('applicationSubmitted')}
            </DialogTitle>
          </DialogHeader>
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

      {/* Delete Application Confirmation Modal */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              {t('deleteApplication')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {t('confirmDeleteApplication')}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('deleteApplicationWarning')}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                variant="destructive"
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('deleting')}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('deleteApplication')}
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="w-full"
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Application Confirmation Modal */}
      <Dialog open={isWithdrawConfirmOpen} onOpenChange={setIsWithdrawConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <X className="h-5 w-5" />
              {t('withdrawApplication')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {t('confirmWithdrawApplication')}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('withdrawApplicationWarning')}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleConfirmWithdraw}
                disabled={isWithdrawing}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {isWithdrawing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('withdrawing')}
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    {t('withdrawApplication')}
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsWithdrawConfirmOpen(false)}
                disabled={isWithdrawing}
                className="w-full"
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
