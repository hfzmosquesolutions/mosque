'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// import { Textarea } from '@/components/ui/textarea'; // Will use Input for now
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { completeOnboarding } from '@/lib/api';
import {
  Users,
  Shield,
  Building,
  CheckCircle,
  ArrowRight,
  ArrowLeft,

  LogOut,
  Home,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface OnboardingData {
  // Personal Information
  fullName: string;
  phone: string;
  address: string;

  // Role Selection
  accountType: 'member' | 'admin' | '';

  // Admin-specific fields
  mosqueAction?: 'join' | 'create';
  mosqueName?: string;
  mosqueAddress?: string;
  existingMosqueId?: string;
}

function OnboardingContent() {
  const t = useTranslations('onboarding');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    phone: '',
    address: '',
    accountType: '',
  });
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const updateData = (field: keyof OnboardingData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!data.fullName || !data.phone) {
        toast.error(t('fillRequiredFields'));
        return;
      }
    } else if (step === 2) {
      if (!data.accountType) {
        toast.error(t('selectAccountType'));
        return;
      }
    } else if (step === 3) {
      if (data.accountType === 'admin' && !data.mosqueAction) {
        toast.error(t('selectMosqueOption'));
        return;
      }
      if (
        data.accountType === 'admin' &&
        data.mosqueAction === 'create' &&
        !data.mosqueName
      ) {
        toast.error(t('enterMosqueName'));
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      if (!user?.id) {
        toast.error(t('userNotAuthenticated'));
        return;
      }

      // Complete onboarding using Supabase API
      const result = await completeOnboarding(user.id, {
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        accountType: data.accountType as 'member' | 'admin',
        mosqueAction: data.accountType === 'admin' ? data.mosqueAction : undefined,
        mosqueName: data.accountType === 'admin' ? data.mosqueName : undefined,
        mosqueAddress: data.accountType === 'admin' ? data.mosqueAddress : undefined,
        existingMosqueId: data.accountType === 'admin' ? data.existingMosqueId : undefined,
      });

      if (result.success) {
        toast.success(t('onboardingCompleted'));
        router.push('/dashboard');
      } else {
        toast.error(result.error || t('onboardingFailed'));
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error(t('onboardingFailedRetry'));
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">{t('personalInformation')}</h3>
        <p className="text-slate-600 dark:text-slate-400">
          {t('personalInfoDescription')}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">{t('fullName')} *</Label>
          <Input
            id="fullName"
            value={data.fullName}
            onChange={(e) => updateData('fullName', e.target.value)}
            placeholder={t('enterFullName')}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="phone">{t('phoneNumber')} *</Label>
          <Input
            id="phone"
            value={data.phone}
            onChange={(e) => updateData('phone', e.target.value)}
            placeholder={t('enterPhoneNumber')}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="address">{t('addressOptional')}</Label>
          <Input
            id="address"
            value={data.address}
            onChange={(e) => updateData('address', e.target.value)}
            placeholder={t('enterAddress')}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">{t('accountType')}</h3>
        <p className="text-slate-600 dark:text-slate-400">
          {t('accountTypeDescription')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className={`cursor-pointer transition-all ${
            data.accountType === 'member'
              ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'hover:shadow-md'
          }`}
          onClick={() => updateData('accountType', 'member')}
        >
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h4 className="font-semibold mb-2">{t('communityMember')}</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('communityMemberDescription')}
            </p>
            <div className="mt-3">
              <Badge variant="secondary">{t('memberAccess')}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            data.accountType === 'admin'
              ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'hover:shadow-md'
          }`}
          onClick={() => updateData('accountType', 'admin')}
        >
          <CardContent className="p-6 text-center">
            <Shield className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h4 className="font-semibold mb-2">{t('mosqueAdministrator')}</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('mosqueAdministratorDescription')}
            </p>
            <div className="mt-3">
              <Badge variant="default">{t('adminAccess')}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep3 = () => {
    if (data.accountType === 'member') {
      return (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('membershipDetails')}</h3>
            <p className="text-slate-600 dark:text-slate-400">
              {t('membershipDetailsDescription')}
            </p>
          </div>

          <div className="text-center p-6 bg-green-50 dark:bg-green-950 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              {t('memberAccountSetup')}
            </h4>
            <p className="text-green-700 dark:text-green-300">
              {t('memberAccountSetupDescription')}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <Building className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('mosqueSetup')}</h3>
          <p className="text-slate-600 dark:text-slate-400">
            {t('mosqueSetupDescription')}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label>{t('whatWouldYouLikeToDo')}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <Card
                className={`cursor-pointer transition-all ${
                  data.mosqueAction === 'join'
                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'hover:shadow-md'
                }`}
                onClick={() => updateData('mosqueAction', 'join')}
              >
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium mb-1">{t('joinExistingMosque')}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {t('joinExistingMosqueDescription')}
                  </p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  data.mosqueAction === 'create'
                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'hover:shadow-md'
                }`}
                onClick={() => updateData('mosqueAction', 'create')}
              >
                <CardContent className="p-4 text-center">
                  <Building className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium mb-1">{t('createNewMosque')}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {t('createNewMosqueDescription')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {data.mosqueAction === 'create' && (
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="mosqueName">{t('mosqueName')} *</Label>
                <Input
                  id="mosqueName"
                  value={data.mosqueName || ''}
                  onChange={(e) => updateData('mosqueName', e.target.value)}
                  placeholder={t('enterMosqueName')}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="mosqueAddress">{t('mosqueAddressOptional')}</Label>
                <Input
                  id="mosqueAddress"
                  value={data.mosqueAddress || ''}
                  onChange={(e) => updateData('mosqueAddress', e.target.value)}
                  placeholder={t('enterMosqueAddress')}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {data.mosqueAction === 'join' && (
            <div className="mt-4">
              <Label htmlFor="existingMosqueId">{t('mosqueId')}</Label>
              <Input
                id="existingMosqueId"
                value={data.existingMosqueId || ''}
                onChange={(e) => updateData('existingMosqueId', e.target.value)}
                placeholder={t('enterMosqueId')}
                className="mt-1"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">{t('reviewConfirm')}</h3>
        <p className="text-slate-600 dark:text-slate-400">
          {t('reviewConfirmDescription')}
        </p>
      </div>

      <Card className="bg-slate-50 dark:bg-slate-800">
        <CardContent className="p-6 space-y-4">
          <div>
            <h4 className="font-semibold mb-2">{t('personalInformation')}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600 dark:text-slate-400">{t('name')}:</span>
                <p className="font-medium">{data.fullName}</p>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">{t('phone')}:</span>
                <p className="font-medium">{data.phone}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">{t('accountType')}</h4>
            <Badge variant={data.accountType === 'admin' ? 'default' : 'secondary'}>
              {data.accountType === 'admin' ? t('mosqueAdministrator') : t('communityMember')}
            </Badge>
          </div>

          {data.accountType === 'admin' && (
            <div>
              <h4 className="font-semibold mb-2">{t('mosqueInformation')}</h4>
              <div className="text-sm">
                <p>
                  <span className="text-slate-600 dark:text-slate-400">{t('action')}:</span>{' '}
                  <span className="font-medium capitalize">{data.mosqueAction}</span>
                </p>
                {data.mosqueAction === 'create' && data.mosqueName && (
                  <p>
                    <span className="text-slate-600 dark:text-slate-400">{t('mosqueName')}:</span>{' '}
                    <span className="font-medium">{data.mosqueName}</span>
                  </p>
                )}
                {data.mosqueAction === 'join' && data.existingMosqueId && (
                  <p>
                    <span className="text-slate-600 dark:text-slate-400">{t('mosqueId')}:</span>{' '}
                    <span className="font-medium">{data.existingMosqueId}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {data.address && (
            <div>
              <h4 className="font-semibold mb-2">{t('address')}</h4>
              <p className="font-medium">{data.address}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Top Navigation */}
      <div className="flex justify-between items-center p-4">
        <Button
          variant="outline"
          onClick={handleGoHome}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          {t('home')}
        </Button>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          {t('logout')}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 pt-0">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Building className="h-8 w-8 text-blue-600" />
              <CardTitle className="text-3xl font-bold">
                {t('welcomeToOurMosque')}
              </CardTitle>
            </div>
            <CardDescription>
              {t('stepOf', { step, total: 4 })} - {t('setupAccount')}
            </CardDescription>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('back')}
              </Button>

              {step < 4 ? (
                <Button onClick={handleNext} className="flex items-center gap-2">
                  {t('next')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? t('completing') : t('completeSetup')}
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <OnboardingContent />
    </ProtectedRoute>
  );
}
