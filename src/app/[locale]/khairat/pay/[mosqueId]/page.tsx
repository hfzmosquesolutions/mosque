'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Building,
  Upload,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { getMosque, getMosqueKhairatSettings, createKhairatContribution, checkOnboardingStatus } from '@/lib/api';
import { getKhairatMembers } from '@/lib/api/khairat-members';
import { Mosque, MosqueKhairatSettings } from '@/types/database';
import { toast } from 'sonner';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PaymentReceiptUpload } from '@/components/khairat/PaymentReceiptUpload';
import { KhairatStandardHeader } from '@/components/khairat/KhairatStandardHeader';
import { KhairatLoadingHeader } from '@/components/khairat/KhairatLoadingHeader';
import jsPDF from 'jspdf';
import { isValidMalaysiaIc, normalizeMalaysiaIc } from '@/lib/utils';

// Helper function to mask email for privacy
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [username, domain] = email.split('@');
  if (username.length <= 1) {
    return `*@${domain}`;
  }
  const firstChar = username[0];
  const maskedUsername = firstChar + '*'.repeat(Math.min(username.length - 1, 6));
  return `${maskedUsername}@${domain}`;
}

// Helper function to mask name for privacy (shows first name + first letter of last part)
function maskName(name: string): string {
  if (!name || name.trim().length === 0) return name;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return name;
  
  // Show first name fully if it's short, otherwise show first few characters
  const firstName = parts[0];
  if (firstName.length <= 4) {
    // Short first name - show fully
    if (parts.length === 1) return firstName;
    // Show first name + first letter of last part + asterisks
    const lastPart = parts[parts.length - 1];
    return `${firstName} ${lastPart[0]}***`;
  } else {
    // Long first name - show first 4 chars + asterisks
    if (parts.length === 1) return `${firstName.substring(0, 4)}***`;
    const lastPart = parts[parts.length - 1];
    return `${firstName.substring(0, 4)}*** ${lastPart[0]}***`;
  }
}

// Helper function to mask phone number for privacy
function maskPhone(phone: string): string {
  if (!phone || phone.trim().length === 0) return phone;
  // Remove all non-digit characters for processing
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length <= 4) {
    // Very short number - mask all but first digit
    return digitsOnly[0] + '*'.repeat(digitsOnly.length - 1);
  } else if (digitsOnly.length <= 7) {
    // Medium length - show first 2-3 digits, mask rest
    const showLength = Math.floor(digitsOnly.length / 3);
    return digitsOnly.substring(0, showLength) + '*'.repeat(digitsOnly.length - showLength);
  } else {
    // Standard phone number - show first 3-4 digits and last 2-3 digits
    const showStart = Math.min(4, Math.floor(digitsOnly.length / 3));
    const showEnd = Math.min(3, Math.floor(digitsOnly.length / 4));
    const start = digitsOnly.substring(0, showStart);
    const end = digitsOnly.substring(digitsOnly.length - showEnd);
    const masked = '*'.repeat(Math.max(3, digitsOnly.length - showStart - showEnd));
    return `${start}${masked}${end}`;
  }
}

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
  const [hasReceiptInDialog, setHasReceiptInDialog] = useState(false);
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
  const [isKhairatMember, setIsKhairatMember] = useState(false);
  const [checkingMembership, setCheckingMembership] = useState(true);
  const [icNumber, setIcNumber] = useState('');
  const [checkingByIC, setCheckingByIC] = useState(false);
  const [verifiedICNumber, setVerifiedICNumber] = useState<string | null>(null);
  const [verifiedMemberId, setVerifiedMemberId] = useState<string | null>(null);
  const [verifiedMembershipNumber, setVerifiedMembershipNumber] = useState<string | null>(null);
  const [verifiedMemberInfo, setVerifiedMemberInfo] = useState<{
    full_name?: string;
    email?: string;
    phone?: string;
    status?: string;
  } | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const [submittedContribution, setSubmittedContribution] = useState<{
    id: string;
    paymentId?: string;
    amount: number;
    paymentMethod: string;
    payerName: string;
    payerEmail?: string;
    payerMobile?: string;
    status: string;
    memberId?: string;
    membershipNumber?: string;
    memberName?: string;
  } | null>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sync hasReceiptInDialog when dialog opens or paymentReceipts changes
  useEffect(() => {
    if (isReceiptModalOpen) {
      setHasReceiptInDialog(paymentReceipts.length > 0);
    }
  }, [isReceiptModalOpen, paymentReceipts.length]);

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

  // Handle amount input change with validation
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty string
    if (value === '') {
      setAmount('');
      return;
    }
    
    // Only allow digits and one decimal point - remove ALL other characters including dashes
    let sanitized = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      sanitized = parts[0] + '.' + parts[1].slice(0, 2);
    }
    
    // Don't allow leading zeros (except 0.xx)
    if (sanitized.length > 1 && sanitized[0] === '0' && sanitized[1] !== '.') {
      sanitized = sanitized.slice(1);
    }
    
    setAmount(sanitized);
  }, []);

  // Prevent invalid keys from being entered
  const handleAmountKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, decimal point, and arrow keys
    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) ||
      (e.key === '.' && !amount.includes('.')) ||
      (e.key >= '0' && e.key <= '9') ||
      (e.ctrlKey || e.metaKey) // Allow Ctrl/Cmd + A, C, V, X, etc.
    ) {
      return;
    }
    
    // Block everything else including dashes, minus signs, etc.
    e.preventDefault();
  }, [amount]);

  // Handle paste events to sanitize pasted content
  const handleAmountPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    // Sanitize pasted content - only allow digits and one decimal point
    let sanitized = pastedText.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      sanitized = parts[0] + '.' + parts[1].slice(0, 2);
    }
    
    // Don't allow leading zeros (except 0.xx)
    if (sanitized.length > 1 && sanitized[0] === '0' && sanitized[1] !== '.') {
      sanitized = sanitized.slice(1);
    }
    
    setAmount(sanitized);
  }, []);

  // Set initial amount when payment method is selected and khairat settings are loaded
  useEffect(() => {
    if (paymentMethod && khairatSettings) {
      const fixedPrice = getFixedPriceForMethod(paymentMethod);
      if (fixedPrice && fixedPrice > 0) {
        setAmount(fixedPrice.toString());
      }
    }
  }, [paymentMethod, khairatSettings, getFixedPriceForMethod]);

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

        // Don't auto-check membership - user must verify manually
        // All users (logged in or not) need to verify membership manually
        setIsKhairatMember(false);

        // Fetch khairat settings
        const settingsRes = await getMosqueKhairatSettings(mosqueId);
        if (settingsRes.success && settingsRes.data) {
          setKhairatSettings(settingsRes.data);
          // Note: Amount will be auto-filled when payment method is selected
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
          paymentMethodsEnabled = {
            online_payment: paymentMethods.online_payment !== false,
            bank_transfer: paymentMethods.bank_transfer !== false,
            cash: paymentMethods.cash !== false,
          };
          
          setEnabledPaymentMethods(paymentMethodsEnabled);
        }

        // Check payment providers (only if online payment is enabled)
        if (paymentMethodsEnabled.online_payment) {
          await checkPaymentProvider(mosqueId);
        }

        // Pre-populate data if user is logged in
        if (user?.id) {
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

          // Check if logged-in user has khairat membership for this mosque
          try {
            // Fetch full member details including name, email, phone
            const { data: memberData, error: memberError } = await supabase
              .from('khairat_members')
              .select('id, status, membership_number, full_name, email, phone')
              .eq('user_id', user.id)
              .eq('mosque_id', mosqueId)
              .in('status', ['active', 'approved'])
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (!memberError && memberData) {
              setIsKhairatMember(true);
              setVerifiedMemberId(memberData.id);
              setVerifiedMembershipNumber(memberData.membership_number || null);
              // Store member's registered information for display
              setVerifiedMemberInfo({
                full_name: memberData.full_name || undefined,
                email: memberData.email || undefined,
                phone: memberData.phone || undefined,
                status: memberData.status || undefined,
              });
            }
          } catch (error) {
            // Silently fail - user can still verify by IC
            console.error('Error checking logged-in user membership:', error);
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
      // Use API endpoint instead of direct function call to bypass RLS and user_id restrictions
      const response = await fetch('/api/khairat-members/check-by-ic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mosqueId,
          ic: normalizedIc,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to verify membership');
      }

      const members = data.members || [];
      
      // Check if user has active or approved membership
      const activeMember = members.find(
        (member: any) => member.status === 'active' || member.status === 'approved'
      );
      
      if (activeMember) {
        setIsKhairatMember(true);
        // Store verified IC number to display
        setVerifiedICNumber(normalizedIc);
        // Store member ID and membership number
        setVerifiedMemberId(activeMember.id);
        setVerifiedMembershipNumber(activeMember.membership_number || null);
        // Store member's registered information for display
        setVerifiedMemberInfo({
          full_name: activeMember.full_name || undefined,
          email: activeMember.email || undefined,
          phone: activeMember.phone || undefined,
          status: activeMember.status || undefined,
        });
        // SECURITY: Do NOT auto-fill form with data from IC number
        // Only verify membership status. User must enter their own payment details.
        toast.success('Membership verified! You can proceed with payment.');
      } else {
        setIsKhairatMember(false);
        setVerifiedMemberId(null);
        setVerifiedMembershipNumber(null);
        setVerifiedMemberInfo(null);
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
      const mobileForValidation = payerMobile.trim();
      if (!mobileForValidation) {
        toast.error('Mobile number is required for ToyyibPay');
        return;
      }
      if (!/^\+?[0-9\s-()]{8,}$/.test(mobileForValidation)) {
        toast.error('Please enter a valid mobile number');
        return;
      }
    }

    if ((paymentMethod === 'bank_transfer' || paymentMethod === 'cash') && paymentReceipts.length === 0) {
      toast.error('Please upload payment receipt');
      return;
    }

    // Validate required fields
    if (!payerName || !payerName.trim()) {
      toast.error('Please enter payer name');
      return;
    }

    if (!payerEmail || !payerEmail.trim()) {
      toast.error('Please enter email address');
      return;
    }

    if (!payerMobile || !payerMobile.trim()) {
      toast.error('Please enter mobile number');
      return;
    }

    setSubmitting(true);
    try {
      // Always use form field values - user can pay for someone else
      const finalPayerName = payerName.trim();
      const finalPayerEmail = payerEmail.trim();
      const finalPayerMobile = payerMobile.trim();

      const paymentData = {
        mosque_id: mosqueId,
        contributor_id: user?.id || undefined, // Can be null for non-logged in users
        contributor_name: finalPayerName,
        khairat_member_id: verifiedMemberId || undefined, // Primary reference to link payment to member
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        payment_reference: verifiedMembershipNumber || undefined,
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
                  payerName: finalPayerName?.trim() || '',
                  payerEmail: finalPayerEmail?.trim() || '',
                  payerMobile: finalPayerMobile?.trim() || undefined,
                  description: `Khairat Payment - ${mosqueId}`,
                  membershipNumber: verifiedMembershipNumber || undefined,
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
            payerName: finalPayerName,
            payerEmail: finalPayerEmail,
            payerMobile: finalPayerMobile,
            status: 'pending',
            memberId: verifiedMemberId || undefined,
            membershipNumber: verifiedMembershipNumber || undefined,
            memberName: verifiedMemberInfo?.full_name || undefined,
          };
          setSubmittedContribution(contributionData);
          setSubmittedSuccessfully(true);
          
          // Persist to sessionStorage in case of page refresh
          sessionStorage.setItem(`payment-success-${mosqueId}`, JSON.stringify({
            ...contributionData,
            memberId: verifiedMemberId || undefined,
            membershipNumber: verifiedMembershipNumber || undefined,
            memberName: verifiedMemberInfo?.full_name || undefined,
          }));
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
      (submittedContribution.membershipNumber || submittedContribution.memberId) ? ['Member ID:', submittedContribution.membershipNumber || submittedContribution.memberId?.slice(0, 8).toUpperCase() || 'N/A'] : null,
      submittedContribution.memberName ? ['Member Name:', maskName(submittedContribution.memberName)] : null,
      ['Amount:', `RM ${submittedContribution.amount.toFixed(2)}`],
      ['Payment Method:', submittedContribution.paymentMethod?.replace('_', ' ').toUpperCase() || 'N/A'],
      ['Payer Name:', submittedContribution.payerName || 'N/A'],
      submittedContribution.payerEmail ? ['Payer Email:', maskEmail(submittedContribution.payerEmail)] : null,
      submittedContribution.payerMobile ? ['Payer Mobile:', maskPhone(submittedContribution.payerMobile)] : null,
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

    // Note Section (standardized like claim receipt)
    doc.setDrawColor(255, 193, 7); // amber
    doc.setFillColor(255, 251, 235); // amber-50
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 15, 3, 3, 'FD');
    doc.setTextColor(146, 64, 14); // amber-800
    doc.setFontSize(9);
    
    let noteText = '';
    if (submittedContribution.paymentMethod === 'bank_transfer' || submittedContribution.paymentMethod === 'cash') {
      noteText = 'Note: Your payment has been submitted and will be reviewed by the mosque administrator.';
    } else if (submittedContribution.paymentMethod === 'toyyibpay' || submittedContribution.paymentMethod === 'online_payment') {
      noteText = 'Note: Your payment has been submitted and will be reviewed by the mosque administrator.';
    } else {
      noteText = 'Note: Your payment has been submitted and will be reviewed by the mosque administrator.';
    }
    
    doc.text(noteText, margin + 5, yPos + 10, { maxWidth: pageWidth - 2 * margin - 10 });
    doc.setTextColor(0, 0, 0);
    yPos += 20;

    // Footer
    yPos = doc.internal.pageSize.getHeight() - 30;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for your submission!', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text('This is a system-generated receipt.', pageWidth / 2, yPos, { align: 'center' });

    // Download PDF
    const fileName = `payment-receipt-${submittedContribution.paymentId || submittedContribution.id}.pdf`;
    doc.save(fileName);
  };

  // Show success page after submission
  if (submittedSuccessfully && submittedContribution) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <KhairatStandardHeader
          mosque={mosque}
          locale={locale}
          mosqueId={mosqueId}
          title={tKhairat('payPage.successTitle')}
          subtitle={tKhairat('payPage.successSubtitle')}
          icon={CheckCircle2}
          iconBgColor="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <div className="max-w-2xl mx-auto px-4 pb-12">
          <Card>
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
                    {(submittedContribution.memberId || submittedContribution.membershipNumber) && (
                      <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">{tKhairat('payPage.memberIdLabel') || 'Member ID'}:</span>
                        <span className="font-medium font-mono">{submittedContribution.membershipNumber || submittedContribution.memberId?.slice(0, 8).toUpperCase()}</span>
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
                      <span className="font-medium">{submittedContribution.payerName ? maskName(submittedContribution.payerName) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">
                        {tKhairat('payPage.successStatusLabel')}:
                      </span>
                      <Badge 
                        variant={
                          submittedContribution.status === 'approved' || submittedContribution.status === 'completed' ? 'default' :
                          submittedContribution.status === 'rejected' ? 'destructive' :
                          submittedContribution.status === 'pending' ? 'secondary' :
                          'outline'
                        }
                        className="capitalize"
                      >
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
                      setVerifiedMemberId(null);
                      setVerifiedMembershipNumber(null);
                      setVerifiedMemberInfo(null);
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
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <KhairatLoadingHeader
          locale={locale}
          mosqueId={mosqueId}
          title={t('makePayment') || 'Pay Khairat'}
          subtitle={undefined}
          icon={HandCoins}
          iconBgColor="bg-orange-50 dark:bg-orange-950/20"
          iconColor="text-orange-600 dark:text-orange-400"
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600 mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              {tKhairat('payPage.loadingForm')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show IC verification form for all users who haven't verified yet
  if (!isKhairatMember && !checkingMembership) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <KhairatStandardHeader
          mosque={mosque}
          locale={locale}
          mosqueId={mosqueId}
          title={t('makePayment') || 'Pay Khairat'}
          subtitle={mosque?.name ? tKhairat('payPage.headerSubtitle', { mosqueName: mosque.name }) : undefined}
          icon={HandCoins}
          iconBgColor="bg-orange-50 dark:bg-orange-950/20"
          iconColor="text-orange-600 dark:text-orange-400"
        />
        <div className="max-w-3xl mx-auto px-4 pb-12">


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
  if (user && !isKhairatMember) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <KhairatStandardHeader
          mosque={mosque}
          locale={locale}
          mosqueId={mosqueId}
          title={t('makePayment') || 'Pay Khairat'}
          subtitle={mosque?.name ? tKhairat('payPage.headerSubtitle', { mosqueName: mosque.name }) : undefined}
          icon={HandCoins}
          iconBgColor="bg-orange-50 dark:bg-orange-950/20"
          iconColor="text-orange-600 dark:text-orange-400"
        />
        <div className="max-w-3xl mx-auto px-4 pb-12">

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
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <KhairatStandardHeader
        mosque={mosque}
        locale={locale}
        mosqueId={mosqueId}
        title={t('makePayment') || 'Pay Khairat'}
        subtitle={mosque?.name ? tKhairat('payPage.headerSubtitle', { mosqueName: mosque.name }) : undefined}
        icon={HandCoins}
        iconBgColor="bg-orange-50 dark:bg-orange-950/20"
        iconColor="text-orange-600 dark:text-orange-400"
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">
        {/* Membership Verification Status */}
        {(verifiedICNumber || verifiedMemberId) && isKhairatMember && (
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <strong className="text-slate-900 dark:text-slate-100">{tKhairat('payPage.membershipVerifiedTitle')}</strong>
              </div>
              {verifiedICNumber && (
                <div className="flex items-center gap-2 ml-6">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {tKhairat('payPage.icNumberLabel') || 'IC Number'}: <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {verifiedICNumber.slice(0, 6) + '******'}
                    </span>
                  </p>
                  {(verifiedMemberInfo?.status || isKhairatMember) && (
                    <Badge 
                      variant={
                        (verifiedMemberInfo?.status === 'active' || verifiedMemberInfo?.status === 'approved' || !verifiedMemberInfo?.status) ? 'default' :
                        verifiedMemberInfo.status === 'inactive' ? 'secondary' :
                        verifiedMemberInfo.status === 'pending' ? 'secondary' :
                        'outline'
                      }
                      className="capitalize"
                    >
                      {verifiedMemberInfo?.status === 'active' || !verifiedMemberInfo?.status ? (locale === 'ms' ? 'Aktif' : 'Active') :
                       verifiedMemberInfo.status === 'approved' ? (locale === 'ms' ? 'Diluluskan' : 'Approved') :
                       verifiedMemberInfo.status === 'inactive' ? (locale === 'ms' ? 'Tidak Aktif' : 'Inactive') :
                       verifiedMemberInfo.status === 'pending' ? (locale === 'ms' ? 'Menunggu' : 'Pending') :
                       verifiedMemberInfo.status || (locale === 'ms' ? 'Aktif' : 'Active')}
                    </Badge>
                  )}
                </div>
              )}
              {(verifiedMemberId || verifiedMembershipNumber) && (
                <p className="text-sm text-slate-600 dark:text-slate-400 ml-6">
                  {tKhairat('payPage.memberIdLabel') || 'Member ID'}: <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{verifiedMembershipNumber || verifiedMemberId?.slice(0, 8).toUpperCase()}</span>
                </p>
              )}
              
              {/* Display Name (Masked) for Confirmation */}
              {verifiedMemberInfo?.full_name && (
                <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 ml-6">
                  <div className="flex items-start gap-3">
                    <span className="font-medium text-slate-600 dark:text-slate-400 min-w-[100px] text-sm">
                      {tKhairat('payPage.memberNameLabel') || 'Member Name'}:
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 flex-1 text-sm">
                      {maskName(verifiedMemberInfo.full_name)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {tKhairat('payPage.confirmMemberInfo')}
                  </p>
                </div>
              )}
            </div>
          </div>
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
              {/* Always show payment information fields - user can pay for someone else */}
              <div className="space-y-2">
                <Label htmlFor="payer_name">
                  {tKhairat('payPage.payerNameLabel')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="payer_name"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder={tKhairat('payPage.payerNamePlaceholder')}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payer_email">
                    {tKhairat('payPage.emailLabel')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="payer_email"
                    type="email"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    placeholder={tKhairat('payPage.emailPlaceholder')}
                    disabled={user !== null && user !== undefined}
                    className={user ? "bg-slate-50 dark:bg-slate-800 cursor-not-allowed" : ""}
                    required
                  />
                  {user && (
                    <p className="text-xs text-muted-foreground">
                      {tKhairat('payPage.emailFromAccount')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payer_mobile">
                    {tKhairat('payPage.mobileNumberLabel')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="payer_mobile"
                    type="tel"
                    value={payerMobile}
                    onChange={(e) => setPayerMobile(e.target.value)}
                    placeholder={tKhairat('payPage.mobileNumberPlaceholder')}
                    required
                  />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <Label>
                  {tKhairat('payPage.paymentMethodLabel')}{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <RadioGroup value={paymentMethod} onValueChange={handlePaymentMethodChange}>
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
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span>{tKhairat('payPage.onlinePaymentLabel')}</span>
                        </div>
                        {(!enabledPaymentMethods.online_payment || !hasOnlinePayment || !availableProviders.includes('toyyibpay')) && (
                          <Badge variant="secondary" className="text-xs">
                            {tKhairat('userPaymentsTable.notAvailable')}
                          </Badge>
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
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{tKhairat('payPage.bankTransferLabel')}</span>
                        </div>
                        {!enabledPaymentMethods.bank_transfer && (
                          <Badge variant="secondary" className="text-xs">
                            {tKhairat('userPaymentsTable.notAvailable')}
                          </Badge>
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
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4" />
                          <span>{tKhairat('payPage.cashLabel')}</span>
                        </div>
                        {!enabledPaymentMethods.cash && (
                          <Badge variant="secondary" className="text-xs">
                            {tKhairat('userPaymentsTable.notAvailable')}
                          </Badge>
                        )}
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Amount Input - Show after payment method is selected */}
              {paymentMethod && (
                <>
                  {!(getFixedPriceForMethod(paymentMethod) && getFixedPriceForMethod(paymentMethod)! > 0) && (
                    <div className="space-y-2">
                      <Label htmlFor="amount">
                        {tKhairat('payPage.amountLabel')}{' '}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="amount"
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={handleAmountChange}
                        onKeyDown={handleAmountKeyDown}
                        onPaste={handleAmountPaste}
                        onBlur={(e) => {
                          // Validate on blur - ensure it's a valid number
                          const numValue = parseFloat(e.target.value);
                          if (e.target.value && (!numValue || numValue <= 0 || isNaN(numValue))) {
                            setAmount('');
                          } else if (e.target.value && numValue > 0) {
                            // Format to 2 decimal places
                            setAmount(numValue.toFixed(2));
                          }
                        }}
                        placeholder={tKhairat('payPage.amountPlaceholder')}
                        required
                        pattern="[0-9]*\.?[0-9]{0,2}"
                      />
                    </div>
                  )}

                  {/* Total Price Display - Show for both admin and regular users */}
                  {amount && parseFloat(amount) > 0 && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {tKhairat('payPage.totalAmountLabel') || 'Total Amount'}:
                        </span>
                        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {new Intl.NumberFormat('ms-MY', {
                            style: 'currency',
                            currency: 'MYR',
                          }).format(parseFloat(amount))}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {enabledPaymentMethods.bank_transfer && paymentMethod === 'bank_transfer' && (() => {
                const bankDetails = mosque?.settings?.bank_transfer_details;
                const hasBankDetails = bankDetails && typeof bankDetails === 'object' && bankDetails !== null;
                return (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {tKhairat('payPage.bankTransferDetailsTitle')}
                    </h4>
                    {hasBankDetails ? (
                      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        {(bankDetails as any).bank_name && (
                          <p>
                            <span className="font-medium text-slate-900 dark:text-slate-100">Bank:</span>{' '}
                            {(bankDetails as any).bank_name}
                          </p>
                        )}
                        {(bankDetails as any).account_number && (
                          <p>
                            <span className="font-medium text-slate-900 dark:text-slate-100">Account Number:</span>{' '}
                            <span className="font-mono">{(bankDetails as any).account_number}</span>
                          </p>
                        )}
                        {(bankDetails as any).account_holder_name && (
                          <p>
                            <span className="font-medium text-slate-900 dark:text-slate-100">Account Holder:</span>{' '}
                            {(bankDetails as any).account_holder_name}
                          </p>
                        )}
                        {(bankDetails as any).reference_instructions && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                            <p className="font-medium text-xs mb-1 text-slate-900 dark:text-slate-100">
                              {tKhairat('payPage.referenceInstructionsLabel')}:
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{(bankDetails as any).reference_instructions}</p>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })()}
              
              {enabledPaymentMethods.cash && paymentMethod === 'cash' && (() => {
                const cashDetails = mosque?.settings?.cash_payment_details;
                const hasCashDetails = cashDetails && typeof cashDetails === 'object' && cashDetails !== null;
                return (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {tKhairat('payPage.cashPaymentDetailsTitle')}
                    </h4>
                    {hasCashDetails ? (
                      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        {(cashDetails as any).payment_location && (
                          <p>
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {tKhairat('payPage.paymentLocationLabel')}:
                            </span>{' '}
                            {(cashDetails as any).payment_location}
                          </p>
                        )}
                        {(cashDetails as any).office_hours && (
                          <p>
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {tKhairat('payPage.officeHoursLabel')}:
                            </span>{' '}
                            {(cashDetails as any).office_hours}
                          </p>
                        )}
                        {((cashDetails as any).contact_person || (cashDetails as any).contact_phone) && (
                          <p>
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {tKhairat('payPage.contactLabel')}:
                            </span>{' '}
                            {(cashDetails as any).contact_person || (cashDetails as any).contact_phone}
                          </p>
                        )}
                        {(cashDetails as any).instructions && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                            <p className="font-medium text-xs mb-1 text-slate-900 dark:text-slate-100">
                              {tKhairat('payPage.paymentInstructionsLabel')}:
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{(cashDetails as any).instructions}</p>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })()}
              {(paymentMethod === 'bank_transfer' || paymentMethod === 'cash') && (
                <div className="space-y-2">
                  <Label>Payment Receipt</Label>
                  <Dialog 
                    open={isReceiptModalOpen} 
                    onOpenChange={(open) => {
                      setIsReceiptModalOpen(open);
                      if (!open) {
                        // Reset dialog state when closed
                        setHasReceiptInDialog(false);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                      >
                        {paymentReceipts.length > 0 ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" />
                            {tKhairat('payPage.receiptUploaded', {
                              count: paymentReceipts.length,
                            }) || `${paymentReceipts.length} ${paymentReceipts.length === 1 ? 'receipt' : 'receipts'} uploaded`}
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            {tKhairat('payPage.uploadReceiptButton') || 'Upload Payment Receipt'}
                          </>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{tKhairat('payPage.uploadPaymentReceiptTitle') || 'Upload Payment Receipt'}</DialogTitle>
                        <DialogDescription>
                          {tKhairat('payPage.uploadPaymentReceiptDescription') || 'Upload a payment receipt (JPEG, PNG, GIF, or PDF)'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <PaymentReceiptUpload
                          onReceiptsChange={(receipts) => {
                            // Handle both File[] and PaymentReceipt[] types
                            if (receipts && Array.isArray(receipts) && receipts.length > 0) {
                              if (receipts[0] instanceof File) {
                                // New files to upload - update state immediately
                                setPaymentReceipts(receipts as File[]);
                                setHasReceiptInDialog(true);
                              } else {
                                // Already uploaded receipts (PaymentReceipt[]), convert to empty array
                                // since we only need files for new uploads
                                setPaymentReceipts([]);
                                setHasReceiptInDialog(false);
                              }
                            } else {
                              // No receipts - clear the array
                              setPaymentReceipts([]);
                              setHasReceiptInDialog(false);
                            }
                          }}
                          maxFiles={1}
                        />
                        <p className="text-xs text-muted-foreground mt-3">
                          {tKhairat('payPage.uploadReceiptHelp')}
                        </p>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          onClick={() => setIsReceiptModalOpen(false)}
                          disabled={!hasReceiptInDialog && paymentReceipts.length === 0}
                          className="w-full sm:w-auto"
                        >
                          {tKhairat('payPage.confirm') || 'Confirm'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="pt-6">
            <Button
              type="submit"
              disabled={
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
