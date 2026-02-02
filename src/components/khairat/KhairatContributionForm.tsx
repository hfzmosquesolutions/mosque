'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Heart,
  Loader2,
  CreditCard,
  Banknote,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { getAllMosques } from '@/lib/api';
import { getMosqueKhairatSettings, createKhairatContribution } from '@/lib/api';
import type { Mosque, MosqueKhairatSettings } from '@/types/database';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface KhairatContributionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedMosqueId?: string;
}

export function KhairatContributionForm({
  isOpen,
  onClose,
  onSuccess,
  preselectedMosqueId,
}: KhairatContributionFormProps) {
  const { user } = useAuth();
  const t = useTranslations('contributions');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableMosques, setAvailableMosques] = useState<Mosque[]>([]);
  const [khairatSettings, setKhairatSettings] = useState<MosqueKhairatSettings | null>(null);
  const [selectedMosqueId, setSelectedMosqueId] = useState(
    preselectedMosqueId || ''
  );
  const [amount, setAmount] = useState('');
  const [payerName, setPayerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [payerEmail, setPayerEmail] = useState(user?.email || '');
  const [payerMobile, setPayerMobile] = useState('');
  const [hasOnlinePayment, setHasOnlinePayment] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [checkingPaymentProvider, setCheckingPaymentProvider] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState({
    online_payment: true,
    bank_transfer: true,
    cash: true,
  });
  const [mosque, setMosque] = useState<Mosque | null>(null);
  const isMosqueFixed = Boolean(preselectedMosqueId);

  useEffect(() => {
    if (selectedMosqueId) {
      loadKhairatSettings(selectedMosqueId);
      loadMosqueAndPaymentSettings(selectedMosqueId);
    } else {
      setKhairatSettings(null);
      setHasOnlinePayment(false);
      setMosque(null);
    }
  }, [selectedMosqueId]);

  // Reset amount when mosque changes (will be set when payment method is selected)
  useEffect(() => {
    setAmount('');
    setPaymentMethod('');
  }, [selectedMosqueId]);

  // Auto-populate email, name, and mobile from user account
  useEffect(() => {
    if (isOpen && user?.email) {
      setPayerEmail(user.email);
    }

    // Always fetch full_name and phone from user_profiles table
    if (isOpen && user?.id) {
      const fetchUserProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('full_name, phone')
            .eq('id', user.id)
            .single();

          if (data && !error) {
            if (data.full_name) {
              setPayerName(data.full_name);
            }
            if (data.phone) {
              setPayerMobile(data.phone);
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      };

      fetchUserProfile();
    }
  }, [user, isOpen]);

  const checkPaymentProvider = async (mosqueId: string) => {
    setCheckingPaymentProvider(true);
    try {
      const response = await fetch(
        `${window.location.origin}/api/admin/payment-providers?mosqueId=${mosqueId}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to check payment providers: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      const providers: string[] = [];

      // Only check for ToyyibPay (Billplz no longer used)
      if (data.toyyibpay && data.hasToyyibpay) {
        providers.push('toyyibpay');
      }

      setAvailableProviders(providers);
      setHasOnlinePayment(providers.length > 0);

      if (providers.length === 0) {
        console.warn(
          'No payment providers found or API returned error:',
          data.error
        );
      }
    } catch (error) {
      console.error('Error checking payment provider:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to check payment availability';
      // Don't show toast for this as it's not critical - just disable online payment
      console.warn('Online payment disabled due to error:', errorMessage);
      setHasOnlinePayment(false);
      setAvailableProviders([]);
    } finally {
      setCheckingPaymentProvider(false);
    }
  };

  const loadAvailableMosques = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await getAllMosques();
      if (response.success && response.data) {
        setAvailableMosques(response.data);
      } else {
        throw new Error(response.error || 'Failed to load mosques');
      }
    } catch (error) {
      console.error('Error loading available mosques:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to load available mosques';
      toast.error(errorMessage);
      setAvailableMosques([]); // Ensure we set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      loadAvailableMosques();
    }
  }, [isOpen, user]);

  const loadKhairatSettings = async (mosqueId: string) => {
    setLoadingSettings(true);
    try {
      const response = await getMosqueKhairatSettings(mosqueId);
      if (response.success && response.data) {
        setKhairatSettings(response.data);
      } else {
        throw new Error(response.error || 'Failed to load khairat settings');
      }
    } catch (error) {
      console.error('Error loading khairat settings:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to load khairat settings';
      toast.error(errorMessage);
      setKhairatSettings(null);
    } finally {
      setLoadingSettings(false);
    }
  };

  const loadMosqueAndPaymentSettings = async (mosqueId: string) => {
    try {
      const { getMosque } = await import('@/lib/api');
      const mosqueRes = await getMosque(mosqueId);
      
      if (mosqueRes.success && mosqueRes.data) {
        setMosque(mosqueRes.data);
        const settings = mosqueRes.data.settings as Record<string, any> | undefined;
        const paymentMethods = settings?.enabled_payment_methods || {};
        
        // Check subscription plan
        const { getEffectiveSubscription } = await import('@/lib/subscription');
        let subscriptionPlan = 'free';
        try {
          const subscription = await getEffectiveSubscription(mosqueId);
          subscriptionPlan = subscription?.plan || 'free';
        } catch (error) {
          console.error('Error fetching subscription:', error);
        }
        
        const isFreePlan = subscriptionPlan === 'free';
        
        // Only treat methods as enabled when explicitly set to true.
        const paymentMethodsEnabled = {
          online_payment: isFreePlan ? false : paymentMethods.online_payment === true,
          bank_transfer: paymentMethods.bank_transfer === true,
          cash: paymentMethods.cash === true,
        };
        
        setEnabledPaymentMethods(paymentMethodsEnabled);
        
        // Check payment providers (only if online payment is enabled)
        if (paymentMethodsEnabled.online_payment) {
          await checkPaymentProvider(mosqueId);
        } else {
          setHasOnlinePayment(false);
          setAvailableProviders([]);
        }
      }
    } catch (error) {
      console.error('Error loading mosque and payment settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error(t('errors.mustBeLoggedIn'));
      return;
    }

    if (!selectedMosqueId) {
      toast.error(t('makePaymentDialog.selectMosqueRequired'));
      return;
    }

    if (!khairatSettings?.enabled) {
      toast.error('Khairat is not enabled for this mosque');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error(t('errors.validAmountRequired'));
      return;
    }

    if (!paymentMethod) {
      toast.error(t('makePaymentDialog.paymentMethodRequired'));
      return;
    }

    // Validate online payment fields (ToyyibPay only)
    if (paymentMethod === 'toyyibpay') {
      // Phone number is required for ToyyibPay
      if (!payerMobile || payerMobile.trim() === '') {
        toast.error(t('errors.mobileRequiredForToyyibpay'));
        return;
      }

      // Validate mobile format
      if (payerMobile && !/^\+?[0-9\s-()]{8,}$/.test(payerMobile)) {
        toast.error(t('errors.validMobileRequired'));
        return;
      }
    }

    setSubmitting(true);
    try {
      const paymentData = {
        mosque_id: selectedMosqueId,
        contributor_id: user.id,
        contributor_name: payerName || undefined,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        payment_reference: paymentReference || undefined,
        status: 'pending' as const,
        notes: notes || undefined,
      };

      const response = await createKhairatContribution(paymentData);

      if (response.success && response.data) {
        const contributionId = response.data.id;

        // Handle online payment (ToyyibPay only)
        if (paymentMethod === 'toyyibpay') {
          try {
            const paymentResponse = await fetch(
              `${window.location.origin}/api/payments/create`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  contributionId,
                  mosqueId: selectedMosqueId,
                  amount: parseFloat(amount),
                  payerName: payerName.trim(),
                  payerEmail: payerEmail.trim(),
                  payerMobile: payerMobile.trim() || undefined,
                  description: `Khairat Payment - ${selectedMosqueId}`,
                  providerType: paymentMethod,
                }),
              }
            );

            if (!paymentResponse.ok) {
              const errorText = await paymentResponse.text();
              let errorMessage = 'Failed to create payment';

              try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || errorMessage;
              } catch {
                // If response is not JSON, use status text
                errorMessage = `Payment failed: ${paymentResponse.status} ${paymentResponse.statusText}`;
              }

              throw new Error(errorMessage);
            }

            const paymentResult = await paymentResponse.json();

            if (paymentResult.success && paymentResult.paymentUrl) {
              toast.success(t('payment.redirectingToGateway'));
              // Redirect to payment gateway
              window.location.href = paymentResult.paymentUrl;
              return;
            } else {
              throw new Error(
                paymentResult.error || t('errors.failedToCreatePayment')
              );
            }
          } catch (paymentError) {
            console.error('Error creating online payment:', paymentError);
            const errorMessage =
              paymentError instanceof Error
                ? paymentError.message
                : 'Failed to create online payment';
            toast.error(errorMessage);
            return;
          }
        } else {
          // Handle manual payment methods
          toast.success(t('payment.contributionSubmitted'));
          onSuccess?.();
        }
      } else {
        const errorMessage = response.error || 'Failed to submit contribution';
        console.error('Contribution submission failed:', errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting contribution:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while submitting your contribution';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to get fixed price for a payment method
  const getFixedPriceForMethod = useCallback((method: string): number | undefined => {
    if (!khairatSettings?.fixed_prices) {
      // Fallback to legacy fixed_price if fixed_prices is not set
      return khairatSettings?.fixed_price;
    }

    switch (method) {
      case 'toyyibpay':
      case 'online_payment':
        return khairatSettings.fixed_prices.online_payment;
      case 'bank_transfer':
        return khairatSettings.fixed_prices.bank_transfer;
      case 'cash':
        return khairatSettings.fixed_prices.cash;
      default:
        return undefined;
    }
  }, [khairatSettings]);

  // Handle payment method change
  const handlePaymentMethodChange = useCallback((value: string) => {
    setPaymentMethod(value);
    
    // Set amount based on fixed price for the selected payment method
    const fixedPrice = getFixedPriceForMethod(value);
    if (fixedPrice && fixedPrice > 0) {
      setAmount(fixedPrice.toString());
    } else {
      setAmount('');
    }
  }, [getFixedPriceForMethod]);

  // Set initial amount when payment method is selected and khairat settings are loaded
  useEffect(() => {
    if (paymentMethod && khairatSettings) {
      const fixedPrice = getFixedPriceForMethod(paymentMethod);
      if (fixedPrice && fixedPrice > 0) {
        setAmount(fixedPrice.toString());
      }
    }
  }, [paymentMethod, khairatSettings, getFixedPriceForMethod]);

  // Set ToyyibPay as default payment method when available and enabled
  useEffect(() => {
    if (
      selectedMosqueId &&
      !paymentMethod && // Only set if no payment method is selected
      availableProviders.includes('toyyibpay') &&
      enabledPaymentMethods.online_payment &&
      hasOnlinePayment &&
      !checkingPaymentProvider
    ) {
      setPaymentMethod('toyyibpay');
      // Set amount based on fixed price for ToyyibPay if available
      const fixedPrice = getFixedPriceForMethod('toyyibpay');
      if (fixedPrice && fixedPrice > 0) {
        setAmount(fixedPrice.toString());
      }
    }
  }, [selectedMosqueId, availableProviders, enabledPaymentMethods.online_payment, hasOnlinePayment, checkingPaymentProvider, paymentMethod, getFixedPriceForMethod]);

  const handleClose = () => {
    setSelectedMosqueId(preselectedMosqueId || '');
    setAmount('');
    setPayerName('');
    setPaymentMethod('');
    setPaymentReference('');
    setNotes('');
    setPayerEmail('');
    setPayerMobile('');
    setHasOnlinePayment(false);
    setAvailableProviders([]);
    onClose();
  };

  // Check if khairat is not enabled for the selected mosque
  const khairatNotEnabled = selectedMosqueId && !loadingSettings && (!khairatSettings || !khairatSettings.enabled);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-600" />
            {t('makePaymentDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('makePaymentDialog.description')}
          </DialogDescription>
        </DialogHeader>

        {khairatNotEnabled ? (
          <div className="space-y-4 pb-4">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Khairat Not Available
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This mosque has not enabled khairat payments yet. Please check back later or contact the mosque for more information.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="mosque">
              {isMosqueFixed
                ? t('makePaymentDialog.mosqueSelected', { fallback: 'Mosque' })
                : t('makePaymentDialog.selectMosqueRequired')}
            </Label>
            {isMosqueFixed ? (
              <div className="w-full p-3 rounded-md border bg-muted/50 text-sm">
                {
                  availableMosques.find((m) => m.id === selectedMosqueId)?.name ||
                  t('makePaymentDialog.thisMosque', { fallback: 'This mosque' })
                }
              </div>
            ) : (
              <>
                <Select
                  value={selectedMosqueId}
                  onValueChange={setSelectedMosqueId}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        loading
                          ? t('makePaymentDialog.loadingMosques')
                          : t('makePaymentDialog.chooseMosque')
                      }
                    >
                      {selectedMosqueId && (
                        <span>
                          {
                            availableMosques.find((m) => m.id === selectedMosqueId)
                              ?.name
                          }
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {loading ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                          {t('makePaymentDialog.loadingMosques')}
                        </div>
                      </SelectItem>
                    ) : availableMosques.length === 0 ? (
                      <SelectItem value="no-mosques" disabled>
                        {t('makePaymentDialog.noMosquesAvailable')}
                      </SelectItem>
                    ) : (
                      availableMosques.map((mosque) => (
                        <SelectItem key={mosque.id} value={mosque.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{mosque.name}</span>
                            {mosque.address && (
                              <span className="text-xs text-muted-foreground">
                                {mosque.address}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('makePaymentDialog.loadingMosques')}
                  </div>
                )}
              </>
            )}
          </div>


          <div className="space-y-2">
            <Label htmlFor="amount">
              {t('makePaymentDialog.amountRequired')}
            </Label>
{(() => {
              const fixedPrice = paymentMethod ? getFixedPriceForMethod(paymentMethod) : undefined;
              const hasFixedPrice = Boolean(fixedPrice && fixedPrice > 0);
              
              return (
                <>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => !hasFixedPrice && setAmount(e.target.value)}
                    placeholder={hasFixedPrice ? `RM ${fixedPrice?.toFixed(2)}` : t('makePaymentDialog.enterAmount')}
                    readOnly={hasFixedPrice}
                    className={hasFixedPrice ? "bg-muted cursor-not-allowed" : ""}
                    required
                  />
                  {hasFixedPrice && fixedPrice && (
                    <p className="text-xs text-muted-foreground">
                      Fixed price: RM {fixedPrice.toFixed(2)}
                    </p>
                  )}
                </>
              );
            })()}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payerName">{t('form.payerNameFromAccount')}</Label>
            <Input
              id="payerName"
              value={payerName}
              readOnly
              className="bg-muted cursor-not-allowed"
              placeholder={t('form.payerNamePlaceholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('form.usingAccountName')}
            </p>
          </div>

          {/* Online Payment Contact Details */}
          {paymentMethod === 'toyyibpay' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="payerEmail">{t('form.emailFromAccount')}</Label>
                <Input
                  id="payerEmail"
                  type="email"
                  value={payerEmail}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                  placeholder={t('form.emailPlaceholder')}
                />
                <p className="text-xs text-muted-foreground">
                  {t('form.usingAccountEmail')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payerMobile">{t('form.mobile')}</Label>
                <Input
                  id="payerMobile"
                  type="tel"
                  value={payerMobile}
                  onChange={(e) => setPayerMobile(e.target.value)}
                  placeholder={t('form.mobilePlaceholder')}
                />
              </div>
            </>
          )}

          {selectedMosqueId && khairatSettings?.enabled ? (
            <div className="space-y-3">
              <Label>{t('makePaymentDialog.paymentMethodRequired')}</Label>
              {checkingPaymentProvider ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('makePaymentDialog.checkingPaymentOptions')}
                </div>
              ) : (
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={handlePaymentMethodChange}
                >
                  {/* Online Payment Options - Always show but disable if not enabled */}
                  {/* ToyyibPay - Always show, but disable if not configured or not enabled */}
                  <div className={`flex items-center space-x-2 p-3 border rounded-lg ${!enabledPaymentMethods.online_payment || !hasOnlinePayment || !availableProviders.includes('toyyibpay') ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50'}`}>
                    <RadioGroupItem 
                      value="toyyibpay" 
                      id="toyyibpay" 
                      disabled={!enabledPaymentMethods.online_payment || !hasOnlinePayment || !availableProviders.includes('toyyibpay')}
                    />
                    <Label
                      htmlFor="toyyibpay"
                      className={`flex items-center gap-3 flex-1 ${enabledPaymentMethods.online_payment && hasOnlinePayment && availableProviders.includes('toyyibpay') ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${enabledPaymentMethods.online_payment && hasOnlinePayment && availableProviders.includes('toyyibpay') ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <CreditCard className={`h-4 w-4 ${enabledPaymentMethods.online_payment && hasOnlinePayment && availableProviders.includes('toyyibpay') ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          Online Payment (ToyyibPay)
                          {(!enabledPaymentMethods.online_payment || !hasOnlinePayment || !availableProviders.includes('toyyibpay')) && (
                            <span className="text-xs text-muted-foreground">(Disabled)</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t('makePaymentDialog.onlinePaymentDescription')}
                        </div>
                      </div>
                    </Label>
                  </div>

                  {/* Bank Transfer - Always show but disable if not enabled */}
                  <div className={`flex items-center space-x-2 p-3 border rounded-lg ${!enabledPaymentMethods.bank_transfer ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50'}`}>
                    <RadioGroupItem 
                      value="bank_transfer" 
                      id="bank_transfer" 
                      disabled={!enabledPaymentMethods.bank_transfer}
                    />
                    <Label
                      htmlFor="bank_transfer"
                      className={`flex items-center gap-3 flex-1 ${enabledPaymentMethods.bank_transfer ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${enabledPaymentMethods.bank_transfer ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                        <Building2 className={`h-4 w-4 ${enabledPaymentMethods.bank_transfer ? 'text-emerald-600' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {t('makePaymentDialog.bankTransferPayment')}
                          {!enabledPaymentMethods.bank_transfer && (
                            <span className="text-xs text-muted-foreground">(Disabled)</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t('makePaymentDialog.bankTransferDescription')}
                        </div>
                      </div>
                    </Label>
                  </div>

                  {/* Cash - Always show but disable if not enabled */}
                  {!isMosqueFixed && (
                    <div className={`flex items-center space-x-2 p-3 border rounded-lg ${!enabledPaymentMethods.cash ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50'}`}>
                      <RadioGroupItem 
                        value="cash" 
                        id="cash" 
                        disabled={!enabledPaymentMethods.cash}
                      />
                      <Label
                        htmlFor="cash"
                        className={`flex items-center gap-3 flex-1 ${enabledPaymentMethods.cash ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${enabledPaymentMethods.cash ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Banknote className={`h-4 w-4 ${enabledPaymentMethods.cash ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {t('makePaymentDialog.cashPayment')}
                            {!enabledPaymentMethods.cash && (
                              <span className="text-xs text-muted-foreground">(Disabled)</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t('makePaymentDialog.cashPaymentDescription')}
                          </div>
                        </div>
                      </Label>
                    </div>
                  )}
                </RadioGroup>
              )}

              {!hasOnlinePayment &&
                selectedMosqueId &&
                !checkingPaymentProvider && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t('makePaymentDialog.onlinePaymentNotAvailable')}
                    </AlertDescription>
                  </Alert>
                )}
            </div>
          ) : null}

          {/* Bank Transfer Details - Show if bank transfer is selected */}
          {enabledPaymentMethods.bank_transfer && paymentMethod === 'bank_transfer' && (() => {
            const bankDetails = mosque?.settings?.bank_transfer_details;
            const hasBankDetails = bankDetails && typeof bankDetails === 'object' && bankDetails !== null;
            return hasBankDetails ? (
              <div className="space-y-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Bank Transfer Details</h4>
                  <div className="space-y-2 text-sm">
                    {(bankDetails as any).bank_name && (
                      <p><span className="font-medium">Bank:</span> {(bankDetails as any).bank_name}</p>
                    )}
                    {(bankDetails as any).account_number && (
                      <p><span className="font-medium">Account Number:</span> {(bankDetails as any).account_number}</p>
                    )}
                    {(bankDetails as any).account_holder_name && (
                      <p><span className="font-medium">Account Holder:</span> {(bankDetails as any).account_holder_name}</p>
                    )}
                    {(bankDetails as any).reference_instructions && (
                      <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded border">
                        <p className="font-medium text-xs mb-1">Reference Instructions:</p>
                        <p className="text-xs text-muted-foreground">{(bankDetails as any).reference_instructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null;
          })()}

          {/* Payment Reference - Only show for manual payments */}
          {paymentMethod && paymentMethod !== 'toyyibpay' && (
              <div className="space-y-2">
                <Label htmlFor="paymentReference">
                  {t('makePaymentDialog.paymentReferenceOptional')}
                </Label>
                <Input
                  id="paymentReference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder={t(
                    'makePaymentDialog.paymentReferencePlaceholder'
                  )}
                />
              </div>
            )}

          <div className="space-y-2">
            <Label htmlFor="notes">{t('form.notesOptional')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('form.notesPlaceholder')}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('makePaymentDialog.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={submitting || !selectedMosqueId || !amount || !khairatSettings?.enabled}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('form.submitting')}
                </>
              ) : (
                t('makePaymentDialog.submitPayment')
              )}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
