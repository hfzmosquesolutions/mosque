'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Heart,
  Loader2,
  CreditCard,
  Banknote,
  AlertCircle,
  ArrowLeft,
  HandCoins,
  UserPlus,
  CheckCircle,
  CheckCircle2,
  Download,
  Building2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { getMosque, getMosqueKhairatSettings, createKhairatContribution, checkOnboardingStatus, isUserMosqueAdmin } from '@/lib/api';
import { getKhairatMembers } from '@/lib/api/khairat-members';
import { Mosque, MosqueKhairatSettings } from '@/types/database';
import { toast } from 'sonner';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PaymentReceiptUpload } from '@/components/khairat/PaymentReceiptUpload';
import jsPDF from 'jspdf';
import { isValidMalaysiaIc, normalizeMalaysiaIc } from '@/lib/utils';

function KhairatPayPageContent() {
  const params = useParams();
  const router = useRouter();
  const mosqueId = params.mosqueId as string;
  const locale = params.locale as string;
  const t = useTranslations('contributions');
  const tKhairat = useTranslations('khairat');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [khairatSettings, setKhairatSettings] = useState<MosqueKhairatSettings | null>(null);
  const [amount, setAmount] = useState('');
  const [payerName, setPayerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReceipts, setPaymentReceipts] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [payerEmail, setPayerEmail] = useState(user?.email || '');
  const [payerMobile, setPayerMobile] = useState('');
  const [hasOnlinePayment, setHasOnlinePayment] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [checkingPaymentProvider, setCheckingPaymentProvider] = useState(false);
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState({
    online_payment: true,
    bank_transfer: true,
    cash: true,
  });
  const [isMosqueAdmin, setIsMosqueAdmin] = useState(false);
  const [isKhairatMember, setIsKhairatMember] = useState(false);
  const [checkingMembership, setCheckingMembership] = useState(true);
  const [icNumber, setIcNumber] = useState('');
  const [checkingByIC, setCheckingByIC] = useState(false);
  const [verifiedICNumber, setVerifiedICNumber] = useState<string | null>(null);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const [submittedContribution, setSubmittedContribution] = useState<{
    id: string;
    paymentId?: string;
    amount: number;
    paymentMethod: string;
    payerName: string;
    status: string;
  } | null>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check for persisted success state on mount
  useEffect(() => {
    const savedSuccess = sessionStorage.getItem(`payment-success-${mosqueId}`);
    if (savedSuccess) {
      try {
        const savedData = JSON.parse(savedSuccess);
        setSubmittedContribution(savedData);
        setSubmittedSuccessfully(true);
        sessionStorage.removeItem(`payment-success-${mosqueId}`); // Clear after loading
      } catch (error) {
        console.error('Error loading saved payment data:', error);
      }
    }
  }, [mosqueId]);

  // Fetch initial data (no login required)
  useEffect(() => {

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch mosque data
        const mosqueRes = await getMosque(mosqueId);
        if (mosqueRes.success && mosqueRes.data) {
          setMosque(mosqueRes.data);
        }

        // Check if user is mosque admin (only if logged in)
        let isAdmin = false;
        if (user?.id) {
          try {
            const adminCheck = await isUserMosqueAdmin(user.id, mosqueId);
            isAdmin = adminCheck;
            setIsMosqueAdmin(adminCheck);
          } catch (error) {
            console.error('Error checking admin status:', error);
          }
        }

        // Don't auto-check membership - user must verify manually
        // Admin can always view (but not submit)
        if (isAdmin) {
          setIsKhairatMember(true);
        } else {
          // All users (logged in or not) need to verify membership manually
          setIsKhairatMember(false);
        }

        // Fetch khairat settings
        const settingsRes = await getMosqueKhairatSettings(mosqueId);
        if (settingsRes.success && settingsRes.data) {
          setKhairatSettings(settingsRes.data);
          // Auto-fill amount if fixed price (only for non-admin users)
          if (!isAdmin && settingsRes.data.fixed_price && settingsRes.data.fixed_price > 0) {
            setAmount(settingsRes.data.fixed_price.toString());
          }
        }

        // Load payment method settings from mosque
        let paymentMethodsEnabled = {
          online_payment: true,
          bank_transfer: true,
          cash: true,
        };
        
        if (mosqueRes.success && mosqueRes.data) {
          const settings = mosqueRes.data.settings as Record<string, any> | undefined;
          const paymentMethods = settings?.enabled_payment_methods || {};
          
          // Check subscription plan
          const { getMosqueSubscription } = await import('@/lib/subscription');
          let subscriptionPlan = 'free';
          try {
            const subscription = await getMosqueSubscription(mosqueId);
            subscriptionPlan = subscription?.plan || 'free';
          } catch (error) {
            console.error('Error fetching subscription:', error);
          }
          
          const isFreePlan = subscriptionPlan === 'free';
          
          paymentMethodsEnabled = {
            online_payment: isFreePlan ? false : (paymentMethods.online_payment !== false),
            bank_transfer: paymentMethods.bank_transfer !== false,
            cash: paymentMethods.cash !== false,
          };
          
          setEnabledPaymentMethods(paymentMethodsEnabled);
        }

        // Check payment providers (only if online payment is enabled)
        if (paymentMethodsEnabled.online_payment) {
          await checkPaymentProvider(mosqueId);
        }

        // Pre-populate data if user is logged in and NOT admin
        if (user?.id && !isAdmin) {
          // Fetch user profile for auto-fill
          const { data, error } = await supabase
            .from('user_profiles')
            .select('full_name, phone, ic_passport_number')
            .eq('id', user.id)
            .single();

        if (data && !error) {
            if (data.full_name) {
              setPayerName(data.full_name);
            }
            if (data.phone) {
              setPayerMobile(data.phone);
            }
            // Pre-fill IC number from profile (but don't auto-check)
            if (data.ic_passport_number) {
              setIcNumber(normalizeMalaysiaIc(data.ic_passport_number).slice(0, 12));
            }
          }

          if (user.email) {
            setPayerEmail(user.email);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load payment form');
      } finally {
        setLoading(false);
        setCheckingMembership(false);
      }
    };

    fetchData();
  }, [user?.id, mosqueId, locale]);

  // Function to check membership by IC number (for all users)
  const handleCheckMembershipByIC = async () => {
    if (!icNumber || !icNumber.trim()) {
      toast.error('Please enter your IC number');
      return;
    }

    const normalizedIc = normalizeMalaysiaIc(icNumber).slice(0, 12);
    if (!isValidMalaysiaIc(normalizedIc)) {
      toast.error('Invalid IC number.');
      return;
    }

    setCheckingByIC(true);
    try {
      const members = await getKhairatMembers({
        mosque_id: mosqueId,
        ic_passport_number: normalizedIc,
      });
      
      // Check if user has active or approved membership
      const hasActiveMembership = members.some(
        member => member.status === 'active' || member.status === 'approved'
      );
      
      if (hasActiveMembership) {
        setIsKhairatMember(true);
        // Store verified IC number to display
        setVerifiedICNumber(normalizedIc);
        // SECURITY: Do NOT auto-fill form with data from IC number
        // Only verify membership status. User must enter their own payment details.
        // For logged-in users, their info will be pre-filled from their profile (handled separately)
        toast.success('Membership verified! You can proceed with payment.');
      } else {
        setIsKhairatMember(false);
        toast.error('No active membership found for this IC number. Please register first.');
      }
    } catch (error: any) {
      console.error('Error checking membership:', error);
      toast.error(error?.message || 'Failed to verify membership. Please try again.');
      setIsKhairatMember(false);
    } finally {
      setCheckingByIC(false);
    }
  };

  const checkPaymentProvider = async (mosqueId: string) => {
    setCheckingPaymentProvider(true);
    try {
      const response = await fetch(
        `${window.location.origin}/api/admin/payment-providers?mosqueId=${mosqueId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to check payment providers: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const providers: string[] = [];

      // Only check for ToyyibPay (Billplz no longer used)
      if (data.toyyibpay && data.hasToyyibpay) {
        providers.push('toyyibpay');
      }

      setAvailableProviders(providers);
      setHasOnlinePayment(providers.length > 0);
    } catch (error) {
      console.error('Error checking payment provider:', error);
      setHasOnlinePayment(false);
      setAvailableProviders([]);
    } finally {
      setCheckingPaymentProvider(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if user is mosque admin
    if (isMosqueAdmin) {
      toast.error('Mosque administrators cannot submit payments. This page is for viewing purposes only.');
      return;
    }

    // For non-logged in users, must have verified membership by IC
    if (!user && !isKhairatMember) {
      toast.error('Please verify your membership by entering your IC number first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    // Validate online payment fields (ToyyibPay only)
    if (paymentMethod === 'toyyibpay') {
      // Phone number is required for ToyyibPay
      if (!payerMobile || payerMobile.trim() === '') {
        toast.error('Mobile number is required for ToyyibPay');
        return;
      }

      // Validate mobile format
      if (payerMobile && !/^\+?[0-9\s-()]{8,}$/.test(payerMobile)) {
        toast.error('Please enter a valid mobile number');
        return;
      }
    }

    if ((paymentMethod === 'bank_transfer' || paymentMethod === 'cash') && paymentReceipts.length === 0) {
      toast.error('Please upload payment receipt');
      return;
    }

    setSubmitting(true);
    try {
      const paymentData = {
        mosque_id: mosqueId,
        contributor_id: user?.id || undefined, // Can be null for non-logged in users
        contributor_name: payerName || undefined,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        payment_reference: undefined, // No longer used, receipts are uploaded separately
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
                  mosqueId: mosqueId,
                  amount: parseFloat(amount),
                  payerName: payerName.trim(),
                  payerEmail: payerEmail.trim(),
                  payerMobile: payerMobile.trim() || undefined,
                  description: `Khairat contribution - ${mosqueId}`,
                  providerType: paymentMethod,
                }),
              }
            );

            if (!paymentResponse.ok) {
              throw new Error('Failed to create payment');
            }

            const paymentData = await paymentResponse.json();

            if (paymentData.success && paymentData.paymentUrl) {
              // Redirect to payment gateway
              window.location.href = paymentData.paymentUrl;
              return;
            } else {
              throw new Error(paymentData.error || 'Failed to create payment');
            }
          } catch (error) {
            console.error('Error creating online payment:', error);
            toast.error('Payment created but failed to redirect to payment gateway. Please contact support.');
          }
        } else {
          // For offline payments (bank_transfer, cash), upload receipts if provided
          if ((paymentMethod === 'bank_transfer' || paymentMethod === 'cash') && paymentReceipts.length > 0) {
            try {
              // Upload receipts
              for (const receiptFile of paymentReceipts) {
                const formData = new FormData();
                formData.append('file', receiptFile);
                if (user?.id) {
                  formData.append('uploadedBy', user.id);
                }

                const uploadResponse = await fetch(
                  `${window.location.origin}/api/khairat-contributions/${contributionId}/receipts`,
                  {
                    method: 'POST',
                    body: formData,
                  }
                );

                if (!uploadResponse.ok) {
                  const errorData = await uploadResponse.json();
                  console.error('Failed to upload receipt:', receiptFile.name, errorData);
                }
              }
            } catch (error) {
              console.error('Error uploading receipts:', error);
              // Don't fail the payment if receipt upload fails
            }
          }

          // Show success page instead of redirecting
          const contributionData = {
            id: contributionId,
            paymentId: response.data.payment_id,
            amount: parseFloat(amount),
            paymentMethod: paymentMethod,
            payerName: payerName || user?.email || 'Anonymous',
            status: 'pending',
          };
          setSubmittedContribution(contributionData);
          setSubmittedSuccessfully(true);
          
          // Persist to sessionStorage in case of page refresh
          sessionStorage.setItem(`payment-success-${mosqueId}`, JSON.stringify(contributionData));
        }
      } else {
        throw new Error(response.error || 'Failed to create payment');
      }
    } catch (error: any) {
      console.error('Error submitting payment:', error);
      toast.error(error?.message || 'Failed to submit payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (!submittedContribution || !mosque) return;

    // Create PDF receipt
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = margin;

    // Helper function to add text with wrapping
    const addText = (text: string, x: number, y: number, fontSize: number = 12, isBold: boolean = false, align: 'left' | 'center' | 'right' = 'left') => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
      doc.text(lines, x, y, { align });
      return y + (lines.length * fontSize * 0.4);
    };

    // Header
    doc.setFillColor(16, 185, 129); // emerald-600
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    yPos = addText('PAYMENT RECEIPT', pageWidth / 2, 25, 20, true, 'center');
    
    doc.setTextColor(0, 0, 0);
    yPos = 50;

    // Mosque Information
    yPos = addText('Mosque Information', margin, yPos, 14, true);
    yPos += 5;
    yPos = addText(mosque.name, margin, yPos, 12, true);
    if (mosque.address) {
      yPos = addText(mosque.address, margin, yPos + 3, 10);
    }
    yPos += 10;

    // Payment Details Section
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    yPos = addText('Payment Details', margin, yPos, 14, true);
    yPos += 8;

    const paymentDate = new Date().toLocaleString('ms-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const details = [
      submittedContribution.paymentId ? ['Payment ID:', submittedContribution.paymentId] : null,
      ['Amount:', `RM ${submittedContribution.amount.toFixed(2)}`],
      ['Payment Method:', submittedContribution.paymentMethod?.replace('_', ' ').toUpperCase() || 'N/A'],
      ['Payer Name:', submittedContribution.payerName],
      ['Status:', submittedContribution.status.toUpperCase()],
      ['Date:', paymentDate],
    ].filter(Boolean) as [string, string][];

    details.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(label, margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 60, yPos);
      yPos += 7;
    });

    yPos += 5;

    // Note for bank transfer/cash
    if (submittedContribution.paymentMethod === 'bank_transfer' || submittedContribution.paymentMethod === 'cash') {
      doc.setDrawColor(255, 193, 7); // amber
      doc.setFillColor(255, 251, 235); // amber-50
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 15, 3, 3, 'FD');
      doc.setTextColor(146, 64, 14); // amber-800
      doc.setFontSize(9);
      doc.text('Note: Payment receipt has been uploaded and will be reviewed by the mosque administrator.', margin + 5, yPos + 10, { maxWidth: pageWidth - 2 * margin - 10 });
      doc.setTextColor(0, 0, 0);
      yPos += 20;
    }

    // Footer
    yPos = doc.internal.pageSize.getHeight() - 30;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for your payment!', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text('This is a system-generated receipt.', pageWidth / 2, yPos, { align: 'center' });

    // Download PDF
    const fileName = `payment-receipt-${submittedContribution.paymentId || submittedContribution.id}.pdf`;
    doc.save(fileName);
  };

  // Show success page after submission
  if (submittedSuccessfully && submittedContribution) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <Link href={`/${locale}/mosques/${mosqueId}`}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {tKhairat('payPage.backToMosque')}
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {tKhairat('payPage.successTitle')}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {tKhairat('payPage.successSubtitle')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                  <strong>{tKhairat('payPage.successAlertTitle')}</strong>
                  <p className="mt-2">
                    {tKhairat('payPage.successAlertBody', {
                      mosqueName: mosque?.name || '',
                    })}
                  </p>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-semibold mb-2">
                    {tKhairat('payPage.successPaymentDetailsTitle')}
                  </h4>
                  <div className="space-y-2 text-sm">
                    {submittedContribution.paymentId && (
                      <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">{tKhairat('paymentsTable.paymentId')}:</span>
                        <span className="font-medium font-mono">{submittedContribution.paymentId}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          {tKhairat('payPage.successAmountLabel')}:
                        </span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('ms-MY', {
                          style: 'currency',
                          currency: 'MYR',
                        }).format(submittedContribution.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">
                        {tKhairat('payPage.successPaymentMethodLabel')}:
                      </span>
                      <span className="font-medium capitalize">
                        {submittedContribution.paymentMethod?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">
                        {tKhairat('payPage.successPayerNameLabel')}:
                      </span>
                      <span className="font-medium">{submittedContribution.payerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">
                        {tKhairat('payPage.successStatusLabel')}:
                      </span>
                      <Badge variant="outline" className="capitalize">
                        {submittedContribution.status}
                      </Badge>
                    </div>
                    {mosque?.name && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          {tKhairat('payPage.successMosqueLabel')}:
                        </span>
                        <span className="font-medium">{mosque.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <strong>{tKhairat('payPage.whatHappensNext')}</strong>
                  </p>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                    <li>{tKhairat('payPage.nextStepVerify')}</li>
                    <li>{tKhairat('payPage.nextStepUpdate')}</li>
                    {user && <li>{tKhairat('payPage.nextStepDashboard')}</li>}
                    {(submittedContribution.paymentMethod === 'bank_transfer' || submittedContribution.paymentMethod === 'cash') && (
                      <li>{tKhairat('payPage.nextStepReceipt')}</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  onClick={handleDownloadReceipt}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {tKhairat('payPage.downloadReceipt')}
                </Button>
                <div className="flex gap-4">
                  <Button
                    onClick={() => {
                      setSubmittedSuccessfully(false);
                      setSubmittedContribution(null);
                      setAmount('');
                      setPayerName('');
                      setPaymentMethod('');
                      setPaymentReceipts([]);
                      setNotes('');
                      setPayerMobile('');
                      setVerifiedICNumber(null);
                      setIsKhairatMember(false);
                      setIcNumber('');
                      window.scrollTo(0, 0);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <HandCoins className="h-4 w-4 mr-2" />
                    {tKhairat('payPage.makeNewPayment')}
                  </Button>
                  <Link href={`/${locale}/mosques/${mosqueId}`} className="flex-1">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      {tKhairat('payPage.backToMosque')}
                    </Button>
                  </Link>
                </div>
                {user && (
                  <Link href={`/${locale}/payments`} className="block">
                    <Button variant="outline" className="w-full">
                      {tKhairat('payPage.viewPaymentHistory')}
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading || checkingMembership) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600 mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            {tKhairat('payPage.loadingForm')}
          </p>
        </div>
      </div>
    );
  }

  // Show IC verification form for all users who haven't verified yet (except admin)
  if (!isKhairatMember && !isMosqueAdmin && !checkingMembership) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link href={`/${locale}/mosques/${mosqueId}`}>
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {tKhairat('payPage.backToMosque')}
              </Button>
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <HandCoins className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {t('makePayment') || 'Pay Khairat'}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  {mosque?.name &&
                    tKhairat('payPage.headerSubtitle', {
                      mosqueName: mosque.name,
                    })}
                </p>
              </div>
            </div>
          </div>

          {/* Login Encouragement (only for non-logged in users) */}
          {!user && (
            <Alert className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>{tKhairat('payPage.notLoggedInTitle')}</strong>{' '}
                    {tKhairat('payPage.notLoggedInDescription')}{' '}
                    <Link href={`/${locale}/login?returnUrl=/${locale}/khairat/pay/${mosqueId}`} className="underline font-semibold">
                      {tKhairat('payPage.login')}
                    </Link>{' '}
                  </div>
                  <Link href={`/${locale}/login?returnUrl=/${locale}/khairat/pay/${mosqueId}`}>
                    <Button size="sm" variant="outline" className="ml-4">
                      {tKhairat('payPage.login')}
                    </Button>
                  </Link>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{tKhairat('payPage.icVerificationTitle')}</CardTitle>
              <CardDescription>
                {tKhairat('payPage.icVerificationSubtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ic_verification">
                    {tKhairat('payPage.icNumberLabel')}{' '}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ic_verification"
                    value={icNumber}
                    onChange={(e) =>
                      setIcNumber(normalizeMalaysiaIc(e.target.value).slice(0, 12))
                    }
                    placeholder={tKhairat('payPage.icNumberPlaceholder')}
                    maxLength={12}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCheckMembershipByIC();
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {tKhairat('payPage.icNumberHelp')}
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    onClick={handleCheckMembershipByIC}
                    disabled={checkingByIC || !icNumber.trim()}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {checkingByIC ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {tKhairat('payPage.verifying')}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {tKhairat('payPage.verifyMembership')}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  {tKhairat('payPage.notMemberQuestion')}
                </p>
                <Link href={`/${locale}/khairat/register/${mosqueId}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {tKhairat('payPage.registerForKhairat')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show registration required message if logged in but not a member
  if (user && !isKhairatMember && !isMosqueAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link href={`/${locale}/mosques/${mosqueId}`}>
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {tKhairat('payPage.backToMosque')}
              </Button>
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <HandCoins className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {t('makePayment') || 'Pay Khairat'}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  {mosque?.name &&
                    tKhairat('payPage.headerSubtitle', {
                      mosqueName: mosque.name,
                    })}
                </p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                {tKhairat('payPage.registrationRequiredTitle')}
              </CardTitle>
              <CardDescription>
                {tKhairat('payPage.registrationRequiredDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  {tKhairat('payPage.registrationRequiredBody')}
                </AlertDescription>
              </Alert>

              <div className="pt-4">
                <Link href={`/${locale}/khairat/register/${mosqueId}`} className="w-full">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-11" size="lg">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {tKhairat('payPage.registerForKhairat')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/${locale}/mosques/${mosqueId}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {tKhairat('payPage.backToMosque')}
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <HandCoins className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {t('makePayment') || 'Pay Khairat'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {mosque?.name &&
                  tKhairat('payPage.headerSubtitle', {
                    mosqueName: mosque.name,
                  })}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Alert */}
        {isMosqueAdmin && (
          <Alert className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>{tKhairat('payPage.viewOnlyTitle')}</strong>
              {tKhairat('payPage.viewOnlyDescription')}
            </AlertDescription>
          </Alert>
        )}

        {/* Membership Verification Status */}
        {verifiedICNumber && isKhairatMember && (
          <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <strong>{tKhairat('payPage.membershipVerifiedTitle')}</strong>
                  <p className="text-sm mt-1">
                    {tKhairat('payPage.membershipVerifiedDescription', {
                      icNumber: verifiedICNumber || '',
                    })}
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
              <CardHeader>
                <CardTitle>{tKhairat('payPage.paymentDetailsTitle')}</CardTitle>
                <CardDescription>
                  {tKhairat('payPage.paymentDetailsDescription')}
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">
                  {tKhairat('payPage.amountLabel')}{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={tKhairat('payPage.amountPlaceholder')}
                  required
                  disabled={isMosqueAdmin || !!(khairatSettings?.fixed_price && khairatSettings.fixed_price > 0)}
                  className={khairatSettings?.fixed_price && khairatSettings.fixed_price > 0 ? "bg-slate-50 dark:bg-slate-800 cursor-not-allowed" : ""}
                />
                {khairatSettings?.fixed_price && khairatSettings.fixed_price > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {tKhairat('payPage.fixedPriceNote', {
                      amount: khairatSettings.fixed_price.toFixed(2),
                    })}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payer_name">
                  {tKhairat('payPage.payerNameLabel')}
                </Label>
                <Input
                  id="payer_name"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder={tKhairat('payPage.payerNamePlaceholder')}
                  disabled={isMosqueAdmin}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payer_email">
                  {tKhairat('payPage.emailLabel')}
                </Label>
                <Input
                  id="payer_email"
                  type="email"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  placeholder={tKhairat('payPage.emailPlaceholder')}
                  disabled={isMosqueAdmin || (user !== null && user !== undefined)}
                  className={user ? "bg-slate-50 dark:bg-slate-800 cursor-not-allowed" : ""}
                />
                {user && (
                  <p className="text-xs text-muted-foreground">
                    {tKhairat('payPage.emailFromAccount')}
                  </p>
                )}
              </div>

                <div className="space-y-2">
                  <Label htmlFor="payer_mobile">
                    {tKhairat('payPage.mobileNumberLabel')}
                  </Label>
                  <Input
                    id="payer_mobile"
                    type="tel"
                    value={payerMobile}
                    onChange={(e) => setPayerMobile(e.target.value)}
                    placeholder={tKhairat('payPage.mobileNumberPlaceholder')}
                    disabled={isMosqueAdmin}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  {tKhairat('payPage.paymentMethodLabel')}{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  {/* Online Payment Options - Always show but disable if not available/enabled */}
                  {/* ToyyibPay - Always show, but disable if not configured or not enabled */}
                  <div className={`flex items-center space-x-2 p-3 border rounded-lg ${!enabledPaymentMethods.online_payment || !hasOnlinePayment || !availableProviders.includes('toyyibpay') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <RadioGroupItem 
                      value="toyyibpay" 
                      id="toyyibpay" 
                      disabled={!enabledPaymentMethods.online_payment || !hasOnlinePayment || !availableProviders.includes('toyyibpay')}
                    />
                    <Label 
                      htmlFor="toyyibpay" 
                      className={`flex-1 ${enabledPaymentMethods.online_payment && hasOnlinePayment && availableProviders.includes('toyyibpay') ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>{tKhairat('payPage.onlinePaymentLabel')}</span>
                        {(!enabledPaymentMethods.online_payment || !hasOnlinePayment || !availableProviders.includes('toyyibpay')) && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({tKhairat('payPage.disabled')})
                          </span>
                        )}
                      </div>
                    </Label>
                  </div>
                  {/* Bank Transfer - Always show but disable if not enabled */}
                  <div className={`flex items-center space-x-2 p-3 border rounded-lg ${!enabledPaymentMethods.bank_transfer ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <RadioGroupItem 
                      value="bank_transfer" 
                      id="bank_transfer" 
                      disabled={!enabledPaymentMethods.bank_transfer}
                    />
                    <Label 
                      htmlFor="bank_transfer" 
                      className={`flex-1 ${enabledPaymentMethods.bank_transfer ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{tKhairat('payPage.bankTransferLabel')}</span>
                        {!enabledPaymentMethods.bank_transfer && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({tKhairat('payPage.disabled')})
                          </span>
                        )}
                      </div>
                    </Label>
                  </div>
                  {/* Cash - Always show but disable if not enabled */}
                  <div className={`flex items-center space-x-2 p-3 border rounded-lg ${!enabledPaymentMethods.cash ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <RadioGroupItem 
                      value="cash" 
                      id="cash" 
                      disabled={!enabledPaymentMethods.cash}
                    />
                    <Label 
                      htmlFor="cash" 
                      className={`flex-1 ${enabledPaymentMethods.cash ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        <span>{tKhairat('payPage.cashLabel')}</span>
                        {!enabledPaymentMethods.cash && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({tKhairat('payPage.disabled')})
                          </span>
                        )}
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {enabledPaymentMethods.bank_transfer && paymentMethod === 'bank_transfer' && (() => {
                const bankDetails = mosque?.settings?.bank_transfer_details;
                const hasBankDetails = bankDetails && typeof bankDetails === 'object' && bankDetails !== null;
                return (
                  <div className="space-y-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">
                        {tKhairat('payPage.bankTransferDetailsTitle')}
                      </h4>
                      {hasBankDetails ? (
                        <div className="space-y-2 text-sm">
                          {(bankDetails as any).bank_name && (
                            <p>
                              <span className="font-medium">Bank:</span>{' '}
                              {(bankDetails as any).bank_name}
                            </p>
                          )}
                          {(bankDetails as any).account_number && (
                            <p>
                              <span className="font-medium">Account Number:</span>{' '}
                              {(bankDetails as any).account_number}
                            </p>
                          )}
                          {(bankDetails as any).account_holder_name && (
                            <p>
                              <span className="font-medium">Account Holder:</span>{' '}
                              {(bankDetails as any).account_holder_name}
                            </p>
                          )}
                          {(bankDetails as any).reference_instructions && (
                            <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded border">
                              <p className="font-medium text-xs mb-1">
                                {tKhairat(
                                  'payPage.referenceInstructionsLabel'
                                )}
                                :
                              </p>
                              <p className="text-xs text-muted-foreground">{(bankDetails as any).reference_instructions}</p>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })()}
              
              {enabledPaymentMethods.cash && paymentMethod === 'cash' && (() => {
                const cashDetails = mosque?.settings?.cash_payment_details;
                const hasCashDetails = cashDetails && typeof cashDetails === 'object' && cashDetails !== null;
                return (
                  <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">
                        {tKhairat('payPage.cashPaymentDetailsTitle')}
                      </h4>
                      {hasCashDetails ? (
                        <div className="space-y-2 text-sm">
                          {(cashDetails as any).payment_location && (
                            <p>
                              <span className="font-medium">
                                {tKhairat('payPage.paymentLocationLabel')}:
                              </span>{' '}
                              {(cashDetails as any).payment_location}
                            </p>
                          )}
                          {(cashDetails as any).office_hours && (
                            <p>
                              <span className="font-medium">
                                {tKhairat('payPage.officeHoursLabel')}:
                              </span>{' '}
                              {(cashDetails as any).office_hours}
                            </p>
                          )}
                          {((cashDetails as any).contact_person || (cashDetails as any).contact_phone) && (
                            <div className="flex gap-4">
                              {(cashDetails as any).contact_person && (
                                <p>
                                  <span className="font-medium">
                                    {tKhairat('payPage.contactLabel')}:
                                  </span>{' '}
                                  {(cashDetails as any).contact_person}
                                </p>
                              )}
                              {(cashDetails as any).contact_phone && (
                                <p>
                                  <span className="font-medium">
                                    {tKhairat('payPage.phoneLabel')}:
                                  </span>{' '}
                                  {(cashDetails as any).contact_phone}
                                </p>
                              )}
                            </div>
                          )}
                          {(cashDetails as any).instructions && (
                            <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded border">
                              <p className="font-medium text-xs mb-1">
                                {tKhairat('payPage.paymentInstructionsLabel')}
                              :
                            </p>
                            <p className="text-xs text-muted-foreground">{(cashDetails as any).instructions}</p>
                          </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })()}
              {(paymentMethod === 'bank_transfer' || paymentMethod === 'cash') && (
                <div className="space-y-2">
                  <PaymentReceiptUpload
                    onReceiptsChange={(receipts) => {
                      // Handle both File[] and PaymentReceipt[] types
                      if (receipts.length > 0 && receipts[0] instanceof File) {
                        setPaymentReceipts(receipts as File[]);
                      } else {
                        // If receipts are already uploaded (PaymentReceipt[]), convert to empty array
                        // since we only need files for new uploads
                        setPaymentReceipts([]);
                      }
                    }}
                    maxFiles={1}
                    disabled={isMosqueAdmin}
                  />
                  <p className="text-xs text-muted-foreground">
                    {tKhairat('payPage.uploadReceiptHelp')}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">
                  {tKhairat('payPage.notesLabel')}
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={tKhairat('payPage.notesPlaceholder')}
                  rows={3}
                  disabled={isMosqueAdmin}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="pt-6">
            <Button
              type="submit"
              disabled={
                isMosqueAdmin ||
                submitting ||
                !amount ||
                !paymentMethod ||
                ((paymentMethod === 'bank_transfer' ||
                  paymentMethod === 'cash') &&
                  paymentReceipts.length === 0)
              }
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-11"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {tKhairat('payPage.processing')}
                </>
              ) : (
                <>
                  <HandCoins className="h-4 w-4 mr-2" />
                  {tKhairat('payPage.submitPayment')}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function KhairatPayPage() {
  return <KhairatPayPageContent />;
}

