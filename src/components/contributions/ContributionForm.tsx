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
import { Heart, Loader2, CreditCard, Banknote, AlertCircle } from 'lucide-react';
import { getAllMosques } from '@/lib/api';
import { getContributionPrograms, createContribution } from '@/lib/api';
import type { Mosque, ContributionProgram } from '@/types/database';
import { toast } from 'sonner';

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
  const [payerEmail, setPayerEmail] = useState('');
  const [payerMobile, setPayerMobile] = useState('');
  const [hasOnlinePayment, setHasOnlinePayment] = useState(false);
  const [checkingPaymentProvider, setCheckingPaymentProvider] = useState(false);

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

  const checkPaymentProvider = async (mosqueId: string) => {
    setCheckingPaymentProvider(true);
    try {
      const response = await fetch(`${window.location.origin}/api/admin/payment-providers?mosqueId=${mosqueId}`);
      if (response.ok) {
        const data = await response.json();
        setHasOnlinePayment(data.hasBillplz || false);
      }
    } catch (error) {
      console.error('Error checking payment provider:', error);
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
      setAvailableMosques(response.data || []);
    } catch (error) {
      console.error('Error loading available mosques:', error);
      toast.error('Failed to load available mosques');
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
    try {
      const response = await getContributionPrograms(
        mosqueId,
        defaultProgramType
      );
      if (response.success && response.data) {
        setKhairatPrograms(response.data);
      }
    } catch (error) {
      console.error('Error loading khairat programs:', error);
      toast.error('Failed to load khairat programs');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !selectedProgramId || !amount || !paymentMethod) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate online payment fields
    if (paymentMethod === 'billplz') {
      if (!payerName.trim()) {
        toast.error('Payer name is required for online payment');
        return;
      }
      if (payerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail)) {
        toast.error('Please enter a valid email address');
        return;
      }
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
            const paymentResponse = await fetch(`${window.location.origin}/api/payments/create`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contributionId,
                mosqueId: selectedMosqueId,
                amount: parseFloat(amount),
                payerName: payerName.trim(),
                payerEmail: payerEmail.trim() || undefined,
                payerMobile: payerMobile.trim() || undefined,
                description: `Khairat contribution - ${khairatPrograms.find(p => p.id === selectedProgramId)?.name}`,
                providerType: 'billplz',
              }),
            });

            const paymentResult = await paymentResponse.json();

            if (paymentResult.success && paymentResult.paymentUrl) {
              toast.success('Redirecting to payment gateway...');
              // Redirect to Billplz payment page
              window.location.href = paymentResult.paymentUrl;
              return;
            } else {
              throw new Error(paymentResult.error || 'Failed to create payment');
            }
          } catch (paymentError) {
            console.error('Error creating online payment:', paymentError);
            toast.error('Failed to create online payment. Please try again.');
            return;
          }
        } else {
          // Handle manual payment methods
          toast.success('Contribution submitted successfully!');
          onSuccess?.();
          handleClose();
        }
      } else {
        toast.error(response.error || 'Failed to submit contribution');
      }
    } catch (error) {
      console.error('Error submitting contribution:', error);
      toast.error('Failed to submit contribution');
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-600" />
            Make Payment
          </DialogTitle>
          <DialogDescription>
            Make a payment to a program at one of your followed mosques
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                      {availableMosques.find(m => m.id === selectedMosqueId)?.name}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableMosques.map((mosque) => (
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
                ))}
                {(!availableMosques || availableMosques.length === 0) &&
                  !loading && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No mosques available
                    </div>
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
                      {khairatPrograms.find(p => p.id === selectedProgramId)?.name}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {khairatPrograms.map((program) => (
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
                            Target: RM {program.target_amount.toLocaleString()}
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
                ))}
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
              Payer Name {paymentMethod === 'billplz' ? '*' : '(Optional)'}
            </Label>
            <Input
              id="payerName"
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              placeholder={paymentMethod === 'billplz' ? 'Required for online payment' : 'Leave empty to use your profile name'}
              required={paymentMethod === 'billplz'}
            />
          </div>

          {/* Online Payment Contact Details */}
          {paymentMethod === 'billplz' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="payerEmail">Email (Optional)</Label>
                <Input
                  id="payerEmail"
                  type="email"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  placeholder="your@email.com"
                />
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
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                {/* Online Payment Option */}
                {hasOnlinePayment && (
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="billplz" id="billplz" />
                    <Label htmlFor="billplz" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Online Payment (Billplz)</div>
                        <div className="text-sm text-muted-foreground">Pay instantly with FPX, credit card, or e-wallet</div>
                      </div>
                    </Label>
                  </div>
                )}
                
                {/* Manual Payment Options */}
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <Banknote className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Cash</div>
                      <div className="text-sm text-muted-foreground">Pay in person at the mosque</div>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                  <Label htmlFor="bank_transfer" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">Bank Transfer</div>
                      <div className="text-sm text-muted-foreground">Transfer to mosque bank account</div>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="ewallet" id="ewallet" />
                  <Label htmlFor="ewallet" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                      <CreditCard className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium">E-Wallet</div>
                      <div className="text-sm text-muted-foreground">GrabPay, Touch 'n Go, etc.</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            )}
            
            {!hasOnlinePayment && selectedMosqueId && !checkingPaymentProvider && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Online payment is not available for this mosque. Please use manual payment methods.
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
