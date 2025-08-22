'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { getContributionPrograms, createContribution } from '@/lib/api';
import type { Mosque, ContributionProgram } from '@/types/database';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface ContributionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedMosqueId?: string;
  preselectedProgramId?: string;
  defaultProgramType?: import('@/types/database').ProgramType;
}

export function ContributionForm({
  isOpen,
  onClose,
  onSuccess,
  preselectedMosqueId,
  preselectedProgramId,
  defaultProgramType,
}: ContributionFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableMosques, setAvailableMosques] = useState<Mosque[]>([]);
  const [khairatPrograms, setKhairatPrograms] = useState<ContributionProgram[]>(
    []
  );
  const [selectedMosqueId, setSelectedMosqueId] = useState(
    preselectedMosqueId || ''
  );
  const [selectedProgramId, setSelectedProgramId] = useState(
    preselectedProgramId || ''
  );
  const [amount, setAmount] = useState('');
  const [payerName, setPayerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [payerEmail, setPayerEmail] = useState(user?.email || '');
  const [payerMobile, setPayerMobile] = useState('');
  const [hasOnlinePayment, setHasOnlinePayment] = useState(false);
  const [checkingPaymentProvider, setCheckingPaymentProvider] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  useEffect(() => {
    if (selectedMosqueId) {
      loadKhairatPrograms(selectedMosqueId);
      checkPaymentProvider(selectedMosqueId);
    } else {
      setKhairatPrograms([]);
      setSelectedProgramId('');
      setHasOnlinePayment(false);
    }
  }, [selectedMosqueId]);

  // Auto-populate email and name from user account
  useEffect(() => {
    if (user?.email) {
      setPayerEmail(user.email);
    }
    
    // Auto-populate name from user metadata or fetch from profile
    if (user?.user_metadata?.full_name) {
      setPayerName(user.user_metadata.full_name);
    } else if (user?.id) {
      // Fetch user profile to get full name
      const fetchUserProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
          
          if (data && !error) {
            setPayerName(data.full_name);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      };
      
      fetchUserProfile();
    }
  }, [user]);

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
      console.log('data', data);
      // API returns direct object structure: {hasBillplz: boolean, billplz: {...}, ...}
      if (data.billplz && data.hasBillplz) {
        setHasOnlinePayment(true);
      } else {
        console.warn(
          'No payment providers found or API returned error:',
          data.error
        );
        setHasOnlinePayment(false);
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

  const loadKhairatPrograms = async (mosqueId: string) => {
    setLoadingPrograms(true);
    try {
      const response = await getContributionPrograms(
        mosqueId,
        defaultProgramType
      );
      if (response.success && response.data) {
        setKhairatPrograms(response.data);
      } else {
        throw new Error(response.error || 'Failed to load khairat programs');
      }
    } catch (error) {
      console.error('Error loading khairat programs:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to load khairat programs';
      toast.error(errorMessage);
      setKhairatPrograms([]);
    } finally {
      setLoadingPrograms(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in to make a payment');
      return;
    }

    if (!selectedMosqueId) {
      toast.error('Please select a mosque');
      return;
    }

    if (!selectedProgramId) {
      toast.error('Please select a payment program');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    // Validate online payment fields
    if (paymentMethod === 'billplz') {
      // Name and email are automatically populated from user account, no need to validate
      if (payerMobile && !/^\+?[0-9\s-()]{8,}$/.test(payerMobile)) {
        toast.error('Please enter a valid mobile number');
        return;
      }
    }

    setSubmitting(true);
    try {
      const paymentData = {
        program_id: selectedProgramId,
        contributor_id: user.id,
        contributor_name: payerName || undefined,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        payment_reference: paymentReference || undefined,
        status: 'pending' as const,
        notes: notes || undefined,
      };

      const response = await createContribution(paymentData);

      if (response.success && response.data) {
        const contributionId = response.data.id;

        // Handle online payment (Billplz)
        if (paymentMethod === 'billplz') {
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
                  programId: selectedProgramId,
                  amount: parseFloat(amount),
                  payerName: payerName.trim(),
                  payerEmail: payerEmail.trim(),
                  payerMobile: payerMobile.trim() || undefined,
                  description: `Khairat contribution - ${
                    khairatPrograms.find((p) => p.id === selectedProgramId)
                      ?.name
                  }`,
                  providerType: 'billplz',
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
              toast.success('Redirecting to payment gateway...');
              // Redirect to Billplz payment page
              window.location.href = paymentResult.paymentUrl;
              return;
            } else {
              throw new Error(
                paymentResult.error || 'Failed to create payment'
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
          toast.success('Contribution submitted successfully!');
          onSuccess?.();
          handleClose();
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
    setSelectedProgramId(preselectedProgramId || '');
    setAmount('');
    setPayerName('');
    setPaymentMethod('');
    setPaymentReference('');
    setNotes('');
    setPayerEmail('');
    setPayerMobile('');
    setHasOnlinePayment(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-600" />
            Make Payment
          </DialogTitle>
          <DialogDescription>
            Make a payment to a program at one of your followed mosques
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="mosque">Select Mosque *</Label>
            <Select
              value={selectedMosqueId}
              onValueChange={setSelectedMosqueId}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loading ? 'Loading mosques...' : 'Choose a mosque'
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
                      Loading mosques...
                    </div>
                  </SelectItem>
                ) : availableMosques.length === 0 ? (
                  <SelectItem value="no-mosques" disabled>
                    No mosques available
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
                Loading mosques...
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="program">Payment Program *</Label>
            <Select
              value={selectedProgramId}
              onValueChange={setSelectedProgramId}
              disabled={!selectedMosqueId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a program">
                  {selectedProgramId && (
                    <span>
                      {
                        khairatPrograms.find((p) => p.id === selectedProgramId)
                          ?.name
                      }
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {loadingPrograms ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                      Loading programs...
                    </div>
                  </SelectItem>
                ) : khairatPrograms.length === 0 ? (
                  <SelectItem value="no-programs" disabled>
                    {selectedMosqueId
                      ? 'No programs available'
                      : 'Select a mosque first'}
                  </SelectItem>
                ) : (
                  khairatPrograms.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      <div className="space-y-1">
                        <div className="font-medium">{program.name}</div>
                        {program.description && (
                          <div className="text-sm text-muted-foreground">
                            {program.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs">
                          {program.target_amount ? (
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                              Target: RM{' '}
                              {program.target_amount.toLocaleString()}
                            </span>
                          ) : (
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                              Ongoing program
                            </span>
                          )}
                          <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
                            Raised: RM{' '}
                            {(program.current_amount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (RM) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payerName">
              Payer Name (From your account)
            </Label>
            <Input
              id="payerName"
              value={payerName}
              readOnly
              className="bg-muted cursor-not-allowed"
              placeholder="Your full name"
            />
            <p className="text-xs text-muted-foreground">
              Using your account name for payment records
            </p>
          </div>

          {/* Online Payment Contact Details */}
          {paymentMethod === 'billplz' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="payerEmail">Email (From your account)</Label>
                <Input
                  id="payerEmail"
                  type="email"
                  value={payerEmail}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                  placeholder="your@email.com"
                />
                <p className="text-xs text-muted-foreground">
                  Using your account email for payment notifications and receipt
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payerMobile">Mobile Number (Optional)</Label>
                <Input
                  id="payerMobile"
                  type="tel"
                  value={payerMobile}
                  onChange={(e) => setPayerMobile(e.target.value)}
                  placeholder="+60123456789"
                />
              </div>
            </>
          )}

          <div className="space-y-3">
            <Label>Payment Method *</Label>
            {checkingPaymentProvider ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking payment options...
              </div>
            ) : (
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                {/* Online Payment Option */}
                {hasOnlinePayment && (
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
                          Online Payment (Billplz)
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Pay instantly with FPX, credit card, or e-wallet
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
                      <div className="font-medium">Cash</div>
                      <div className="text-sm text-muted-foreground">
                        Pay in person at the mosque
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                  <Label
                    htmlFor="bank_transfer"
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">Bank Transfer</div>
                      <div className="text-sm text-muted-foreground">
                        Transfer to mosque bank account
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="ewallet" id="ewallet" />
                  <Label
                    htmlFor="ewallet"
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                      <CreditCard className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium">E-Wallet</div>
                      <div className="text-sm text-muted-foreground">
                        GrabPay, Touch 'n Go, etc.
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
                    Online payment is not available for this mosque. Please use
                    manual payment methods.
                  </AlertDescription>
                </Alert>
              )}
          </div>

          {/* Payment Reference - Only show for manual payments */}
          {paymentMethod && paymentMethod !== 'billplz' && (
            <div className="space-y-2">
              <Label htmlFor="paymentReference">Payment Reference</Label>
              <Input
                id="paymentReference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Transaction ID, receipt number, etc."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !selectedProgramId || !amount}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Payment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
