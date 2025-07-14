'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthState } from '@/hooks/useAuth.v2';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Save,
  X,
  UserPlus,
  AlertCircle,
  CheckCircle,
  User,
  Shield,
  Crown,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface MemberApplicationFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

interface MemberFormData {
  membershipType: 'regular' | 'ajk' | 'committee';
  notes?: string;
  selectedMosqueId?: string;
}

export function MemberApplicationForm({
  onClose,
  onSave,
}: MemberApplicationFormProps) {
  const { t } = useLanguage();
  const { user: authUser, profile } = useAuthState();
  const [isSaving, setIsSaving] = useState(false);
  const [mosques, setMosques] = useState<any[]>([]);
  const [loadingMosques, setLoadingMosques] = useState(false);
  const [existingMemberships, setExistingMemberships] = useState<any[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(false);

  // Form state
  const [formData, setFormData] = useState<MemberFormData>({
    membershipType: 'regular',
    notes: '',
    selectedMosqueId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing memberships
  useEffect(() => {
    const loadExistingMemberships = async () => {
      if (!profile?.id) return;

      try {
        setLoadingMemberships(true);
        const { data, error } = await supabase
          .from('members')
          .select(
            `
            id,
            status,
            membership_type,
            mosque_id,
            mosques!inner(
              id,
              name,
              address
            )
          `
          )
          .eq('profile_id', profile.id);

        if (error) throw error;
        setExistingMemberships(data || []);
      } catch (error) {
        console.error('Error loading existing memberships:', error);
      } finally {
        setLoadingMemberships(false);
      }
    };

    loadExistingMemberships();
  }, [profile?.id]);

  // Load mosques for selection
  useEffect(() => {
    const loadMosques = async () => {
      try {
        setLoadingMosques(true);
        const { data, error } = await supabase
          .from('mosques')
          .select('id, name, address')
          .eq('status', 'active')
          .order('name');

        if (error) throw error;
        setMosques(data || []);
      } catch (error) {
        console.error('Error loading mosques:', error);
        toast.error(t('common.errorLoadingData'));
      } finally {
        setLoadingMosques(false);
      }
    };

    loadMosques();
  }, [t]);

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.selectedMosqueId) {
      newErrors.selectedMosqueId = t('members.validation.mosqueRequired');
    }

    if (!formData.membershipType) {
      newErrors.membershipType = t('members.validation.membershipTypeRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('common.pleaseFixErrors'));
      return;
    }

    if (!authUser || !profile) {
      toast.error(t('auth.pleaseLogin'));
      return;
    }

    try {
      setIsSaving(true);

      // Check if user already has a pending or active membership for this specific mosque
      const { data: existingMember, error: checkError } = await supabase
        .from('members')
        .select('id, status')
        .eq('profile_id', profile?.id)
        .eq('mosque_id', formData.selectedMosqueId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingMember) {
        if (existingMember.status === 'active') {
          toast.error(t('members.alreadyActiveMemberThisMosque'));
          return;
        } else {
          toast.error(t('members.membershipExistsThisMosque'));
          return;
        }
      }

      // Create new membership application
      const memberData = {
        mosque_id: formData.selectedMosqueId,
        profile_id: profile?.id || '',
        membership_type: formData.membershipType,
        status: 'inactive', // Start as inactive, admin will approve
        notes: formData.notes || null,
        joined_date: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('members')
        .insert(memberData)
        .select()
        .single();

      if (error) throw error;

      toast.success(t('members.applicationSubmittedSuccess'));
      onSave(data);
    } catch (error: any) {
      console.error('Error submitting membership application:', error);
      toast.error(error.message || t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const getMembershipTypeInfo = (type: string) => {
    const typeConfig = {
      regular: {
        label: t('members.types.regular'),
        description: t('members.types.regularDescription'),
        icon: User,
        color: 'text-blue-600',
      },
      ajk: {
        label: t('members.types.ajk'),
        description: t('members.types.ajkDescription'),
        icon: Shield,
        color: 'text-green-600',
      },
      committee: {
        label: t('members.types.committee'),
        description: t('members.types.committeeDescription'),
        icon: Crown,
        color: 'text-purple-600',
      },
    };
    return typeConfig[type as keyof typeof typeConfig];
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onClose} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <UserPlus className="h-8 w-8 text-blue-600" />
              {t('members.applyMembership')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('members.applicationFormDescription')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? t('common.submitting') : t('members.submitApplication')}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Information Display */}
        <Card>
          <CardHeader>
            <CardTitle>{t('members.applicantInformation')}</CardTitle>
            <CardDescription>
              {t('members.applicantInformationDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('common.fullName')}</Label>
                <Input
                  value={profile?.full_name || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('common.email')}</Label>
                <Input
                  value={profile?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Existing Memberships */}
        {existingMemberships.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('members.existingMemberships')}</CardTitle>
              <CardDescription>
                {t('members.existingMembershipsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {existingMemberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                  >
                    <div>
                      <div className="font-medium">
                        {membership.mosques.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {membership.mosques.address}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          membership.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : membership.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {t(`members.status.${membership.status}`)}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {t(`members.types.${membership.membership_type}`)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mosque Selection */}
        <Card>
          <CardHeader>
            <CardTitle>{t('members.mosqueSelection')}</CardTitle>
            <CardDescription>
              {t('members.mosqueSelectionDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="mosque">
                {t('members.selectMosque')}{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.selectedMosqueId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, selectedMosqueId: value }))
                }
                disabled={loadingMosques}
              >
                <SelectTrigger
                  className={errors.selectedMosqueId ? 'border-red-500' : ''}
                >
                  <SelectValue
                    placeholder={t('members.selectMosquePlaceholder')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {mosques
                    .filter((mosque) => {
                      // Filter out mosques where user already has active or pending membership
                      const existingMembership = existingMemberships.find(
                        (membership) =>
                          membership.mosque_id === mosque.id &&
                          (membership.status === 'active' ||
                            membership.status === 'pending')
                      );
                      return !existingMembership;
                    })
                    .map((mosque) => (
                      <SelectItem key={mosque.id} value={mosque.id}>
                        <div>
                          <div className="font-medium">{mosque.name}</div>
                          <div className="text-sm text-gray-500">
                            {mosque.address}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  {mosques.filter((mosque) => {
                    const existingMembership = existingMemberships.find(
                      (membership) =>
                        membership.mosque_id === mosque.id &&
                        (membership.status === 'active' ||
                          membership.status === 'pending')
                    );
                    return !existingMembership;
                  }).length === 0 && (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      {t('members.noAvailableMosques')}
                    </div>
                  )}
                </SelectContent>
              </Select>
              {errors.selectedMosqueId && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.selectedMosqueId}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Membership Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>{t('members.membershipType')}</CardTitle>
            <CardDescription>
              {t('members.membershipTypeDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label>
                {t('members.selectMembershipType')}{' '}
                <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-1 gap-4">
                {(['regular', 'ajk', 'committee'] as const).map((type) => {
                  const typeInfo = getMembershipTypeInfo(type);
                  const TypeIcon = typeInfo?.icon;
                  const isSelected = formData.membershipType === type;

                  return (
                    <div
                      key={type}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          membershipType: type,
                        }))
                      }
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <input
                            type="radio"
                            name="membershipType"
                            value={type}
                            checked={isSelected}
                            onChange={() =>
                              setFormData((prev) => ({
                                ...prev,
                                membershipType: type,
                              }))
                            }
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {TypeIcon && (
                              <TypeIcon
                                className={`h-5 w-5 ${typeInfo?.color}`}
                              />
                            )}
                            <h4 className="font-medium">{typeInfo?.label}</h4>
                          </div>
                          <p className="text-sm text-gray-600">
                            {typeInfo?.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {errors.membershipType && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.membershipType}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>{t('members.additionalNotes')}</CardTitle>
            <CardDescription>
              {t('members.additionalNotesDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('members.notes')}</Label>
              <Textarea
                id="notes"
                placeholder={t('members.notesPlaceholder')}
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
