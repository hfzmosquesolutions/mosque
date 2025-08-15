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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Heart, Loader2 } from 'lucide-react';
import { getUserFollowedMosques, getAllMosques } from '@/lib/api';
import { getContributionPrograms, createContribution } from '@/lib/api';
import type { Mosque, ContributionProgram } from '@/types/database';
import { toast } from 'sonner';

interface ContributionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedMosqueId?: string;
  preselectedProgramId?: string;
}

export function ContributionForm({
  isOpen,
  onClose,
  onSuccess,
  preselectedMosqueId,
  preselectedProgramId,
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
  const [contributorName, setContributorName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      loadAvailableMosques();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (selectedMosqueId) {
      loadKhairatPrograms(selectedMosqueId);
    } else {
      setKhairatPrograms([]);
      setSelectedProgramId('');
    }
  }, [selectedMosqueId]);

  const loadAvailableMosques = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await getAllMosques();
      setAvailableMosques(response.data || []);
    } catch (error) {
      console.error('Error loading available mosques:', error);
      toast.error('Failed to load available mosques');
    } finally {
      setLoading(false);
    }
  };

  const loadKhairatPrograms = async (mosqueId: string) => {
    try {
      const response = await getContributionPrograms(mosqueId);
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

    if (!user || !selectedProgramId || !amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const contributionData = {
        program_id: selectedProgramId,
        contributor_id: user.id,
        contributor_name: contributorName || undefined,
        amount: parseFloat(amount),
        payment_method: paymentMethod || undefined,
        payment_reference: paymentReference || undefined,
        status: 'pending' as const,
        notes: notes || undefined,
      };

      const response = await createContribution(contributionData);

      if (response.success) {
        toast.success('Contribution submitted successfully!');
        onSuccess?.();
        handleClose();
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
    setContributorName('');
    setPaymentMethod('');
    setPaymentReference('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-600" />
            Make Contribution
          </DialogTitle>
          <DialogDescription>
            Contribute to a contribution program at one of your followed mosques
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading mosques...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mosque">Select Mosque *</Label>
              <Select
                value={selectedMosqueId}
                onValueChange={setSelectedMosqueId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a mosque" />
                </SelectTrigger>
                <SelectContent>
                  {availableMosques.map((mosque) => (
                    <SelectItem key={mosque.id} value={mosque.id}>
                      {mosque.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableMosques.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No mosques available for contributions.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="program">Contribution Program *</Label>
              <Select
                value={selectedProgramId}
                onValueChange={setSelectedProgramId}
                disabled={!selectedMosqueId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a program" />
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
                            Raised: RM {(program.current_amount || 0).toLocaleString()}
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
              <Label htmlFor="contributorName">
                Contributor Name (Optional)
              </Label>
              <Input
                id="contributorName"
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                placeholder="Leave empty to use your profile name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="online_banking">Online Banking</SelectItem>
                  <SelectItem value="ewallet">E-Wallet</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentReference">Payment Reference</Label>
              <Input
                id="paymentReference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Transaction ID, receipt number, etc."
              />
            </div>

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
                  'Submit Contribution'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
