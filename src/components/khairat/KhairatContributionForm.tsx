'use client';

import { useState, useEffect } from 'react';
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
  const isMosqueFixed = Boolean(preselectedMosqueId);

  useEffect(() => {
    if (selectedMosqueId) {
      loadKhairatSettings(selectedMosqueId);
      checkPaymentProvider(selectedMosqueId);
    } else {
      setKhairatSettings(null);
      setHasOnlinePayment(false);
    }
  }, [selectedMosqueId]);

  // Handle fixed price when mosque is selected
  useEffect(() => {
    if (khairatSettings?.fixed_price && khairatSettings.fixed_price > 0) {
      setAmount(khairatSettings.fixed_price.toString());
    } else {
      setAmount('');
    }
  }, [khairatSettings]);

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

      // Check for Billplz
      if (data.billplz && data.hasBillplz) {
        providers.push('billplz');
      }

      // Check for ToyyibPay
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

    // Validate online payment fields
    if (paymentMethod === 'billplz' || paymentMethod === 'toyyibpay') {
      // Name and email are automatically populated from user account, no need to validate

      // Phone number is required for ToyyibPay
      if (paymentMethod === 'toyyibpay') {
        if (!payerMobile || payerMobile.trim() === '') {
          toast.error(t('errors.mobileRequiredForToyyibpay'));
          return;
        }
      }

      // Validate mobile format if provided
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

        // Handle online payment (Billplz or ToyyibPay)
        if (paymentMethod === 'billplz' || paymentMethod === 'toyyibpay') {
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
                  description: `Khairat contribution - ${selectedMosqueId}`,
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
                This mosque has not enabled khairat contributions yet. Please check back later or contact the mosque for more information.
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
              const hasFixedPrice = Boolean(khairatSettings?.fixed_price && khairatSettings.fixed_price > 0);
              
              return (
                <>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => !hasFixedPrice && setAmount(e.target.value)}
                    placeholder={hasFixedPrice ? `RM ${khairatSettings?.fixed_price?.toFixed(2)}` : t('makePaymentDialog.enterAmount')}
                    readOnly={hasFixedPrice}
                    className={hasFixedPrice ? "bg-muted cursor-not-allowed" : ""}
                    required
                  />
                  {hasFixedPrice && khairatSettings?.fixed_price && (
                    <p className="text-xs text-muted-foreground">
                      Fixed price: RM {khairatSettings.fixed_price.toFixed(2)}
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
          {(paymentMethod === 'billplz' || paymentMethod === 'toyyibpay') && (
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

          {selectedMosqueId && khairatSettings?.enabled && (
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
                  onValueChange={setPaymentMethod}
                >
                  {/* Online Payment Options */}
                  {availableProviders.includes('billplz') && (
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="billplz" id="billplz" />
                      <Label
                        htmlFor="billplz"
                        className="flex items-center gap-3 cursor-pointer flex-1"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {t('makePaymentDialog.onlinePaymentBillplz')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t('makePaymentDialog.onlinePaymentDescription')}
                          </div>
                        </div>
                      </Label>
                    </div>
                  )}

                  {availableProviders.includes('toyyibpay') && (
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="toyyibpay" id="toyyibpay" />
                      <Label
                        htmlFor="toyyibpay"
                        className="flex items-center gap-3 cursor-pointer flex-1"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                          <CreditCard className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">
                            Online Payment (ToyyibPay)
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t('makePaymentDialog.onlinePaymentDescription')}
                          </div>
                        </div>
                      </Label>
                    </div>
                  )}

                  {/* Manual Payment Options */}
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label
                      htmlFor="cash"
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <Banknote className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {t('makePaymentDialog.cashPayment')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t('makePaymentDialog.cashPaymentDescription')}
                        </div>
                      </div>
                    </Label>
                  </div>
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
          )}

          {/* Payment Reference - Only show for manual payments */}
          {paymentMethod &&
            paymentMethod !== 'billplz' &&
            paymentMethod !== 'toyyibpay' && (
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
