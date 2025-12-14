'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Upload,
  UserPlus,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { getMosque, checkOnboardingStatus, createClaim, uploadClaimDocument, isUserMosqueAdmin } from '@/lib/api';
import { getKhairatMembers } from '@/lib/api/khairat-members';
import { Mosque } from '@/types/database';
import { toast } from 'sonner';
import Link from 'next/link';
import { ClaimDocumentUpload } from '@/components/khairat/ClaimDocumentUpload';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';

function KhairatClaimPageContent() {
  const params = useParams();
  const router = useRouter();
  const mosqueId = params.mosqueId as string;
  const locale = params.locale as string;
  const t = useTranslations('mosquePage');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [claimTitle, setClaimTitle] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimDescription, setClaimDescription] = useState('');
  const [claimDocuments, setClaimDocuments] = useState<File[]>([]);
  const [isMosqueAdmin, setIsMosqueAdmin] = useState(false);
  const [isKhairatMember, setIsKhairatMember] = useState(false);
  const [checkingMembership, setCheckingMembership] = useState(true);
  const [icNumber, setIcNumber] = useState('');
  const [checkingByIC, setCheckingByIC] = useState(false);
  const [verifiedICNumber, setVerifiedICNumber] = useState<string | null>(null);
  const [verifiedKhairatMemberId, setVerifiedKhairatMemberId] = useState<string | null>(null);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState<{
    id: string;
    claimId?: string;
    title: string;
    requestedAmount: number;
    description: string;
    status: string;
  } | null>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check for persisted success state on mount
  useEffect(() => {
    const savedSuccess = sessionStorage.getItem(`claim-success-${mosqueId}`);
    if (savedSuccess) {
      try {
        const savedData = JSON.parse(savedSuccess);
        setSubmittedClaim(savedData);
        setSubmittedSuccessfully(true);
        sessionStorage.removeItem(`claim-success-${mosqueId}`); // Clear after loading
      } catch (error) {
        console.error('Error loading saved claim data:', error);
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

        // Pre-fill IC number if user is logged in and NOT admin
        if (user?.id && !isAdmin) {
          // Fetch user profile for auto-fill
          const { data, error } = await supabase
            .from('user_profiles')
            .select('ic_passport_number')
            .eq('id', user.id)
            .single();

          if (data && !error && data.ic_passport_number) {
            // Pre-fill IC number from profile (but don't auto-check)
            setIcNumber(data.ic_passport_number);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load claim form');
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

    setCheckingByIC(true);
    try {
      const members = await getKhairatMembers({
        mosque_id: mosqueId,
        ic_passport_number: icNumber.trim(),
      });
      
      // Check if user has active or approved membership
      const hasActiveMembership = members.some(
        member => member.status === 'active' || member.status === 'approved'
      );
      
      if (hasActiveMembership) {
        setIsKhairatMember(true);
        // Store verified IC number to display
        setVerifiedICNumber(icNumber.trim());
        // Store the khairat_member_id for submission
        const activeMember = members.find(
          member => member.status === 'active' || member.status === 'approved'
        );
        if (activeMember) {
          setVerifiedKhairatMemberId(activeMember.id);
        }
        // SECURITY: Do NOT auto-fill form with data from IC number
        // Only verify membership status
        toast.success('Membership verified! You can proceed with your claim.');
      } else {
        setIsKhairatMember(false);
        toast.error('No active membership found for this IC number. Please register first.');
      }
    } catch (error: any) {
      console.error('Error checking membership:', error);
      toast.error(error?.message || 'Failed to verify membership. Please try again.');
    } finally {
      setCheckingByIC(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (!submittedClaim || !mosque) return;

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
    yPos = addText('CLAIM SUBMISSION RECEIPT', pageWidth / 2, 25, 20, true, 'center');
    
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

    // Claim Details Section
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    yPos = addText('Claim Details', margin, yPos, 14, true);
    yPos += 8;

    const claimDate = new Date().toLocaleString('ms-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const details = [
      submittedClaim.claimId ? ['Claim ID:', submittedClaim.claimId] : null,
      ['Title:', submittedClaim.title],
      ['Requested Amount:', `RM ${submittedClaim.requestedAmount.toFixed(2)}`],
      ['Status:', submittedClaim.status.toUpperCase()],
      ['Date:', claimDate],
    ].filter(Boolean) as [string, string][];

    details.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(label, margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 60, yPos);
      yPos += 7;
    });

    if (submittedClaim.description) {
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Description:', margin, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(submittedClaim.description, pageWidth - 2 * margin);
      doc.text(descLines, margin, yPos);
      yPos += descLines.length * 4;
    }

    yPos += 5;

    // Note
    doc.setDrawColor(255, 193, 7); // amber
    doc.setFillColor(255, 251, 235); // amber-50
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 15, 3, 3, 'FD');
    doc.setTextColor(146, 64, 14); // amber-800
    doc.setFontSize(9);
    doc.text('Note: Your claim has been submitted and will be reviewed by the mosque administrator.', margin + 5, yPos + 10, { maxWidth: pageWidth - 2 * margin - 10 });
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
    const fileName = `claim-receipt-${submittedClaim.claimId || submittedClaim.id}.pdf`;
    doc.save(fileName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if user is mosque admin
    if (isMosqueAdmin) {
      toast.error('Mosque administrators cannot submit claims. This page is for viewing purposes only.');
      return;
    }

    if (!mosque) return;
    
    if (!claimTitle || !claimAmount) {
      toast.error(t('pleaseFillRequired') || 'Please fill in all required fields');
      return;
    }

    const amountNum = parseFloat(claimAmount);
    if (!(amountNum > 0)) {
      toast.error(t('invalidAmount') || 'Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        claimant_id: user?.id || undefined, // Optional for anonymous submissions
        khairat_member_id: verifiedKhairatMemberId || undefined, // Pass verified member ID (required for anonymous)
        mosque_id: mosque.id,
        title: claimTitle,
        description: claimDescription || undefined,
        requested_amount: amountNum,
        priority: 'medium' as const,
      };

      const res = await createClaim(payload as any);
      
      if ((res as any)?.success) {
        const claimId = (res as any).data?.id;
        const claimData = (res as any).data;
        
        // If there are documents to upload, upload them now
        if (claimDocuments.length > 0) {
          toast.info('Claim created. Uploading supporting documents...');
          
          // Upload each document (use user.id if logged in, otherwise null for anonymous)
          for (const file of claimDocuments) {
            try {
              const uploadResponse = await uploadClaimDocument(claimId, file, user?.id || null);
              if (!uploadResponse.success) {
                console.error('Failed to upload document:', uploadResponse.error);
                toast.error(`Failed to upload ${file.name}`);
              }
            } catch (error) {
              console.error('Error uploading document:', error);
              toast.error(`Failed to upload ${file.name}`);
            }
          }
        }
        
        // Show success page instead of redirecting
        const submittedClaimData = {
          id: claimId,
          claimId: claimData.claim_id,
          title: claimTitle,
          requestedAmount: amountNum,
          description: claimDescription || '',
          status: claimData.status || 'pending',
        };
        setSubmittedClaim(submittedClaimData);
        setSubmittedSuccessfully(true);
        
        // Persist to sessionStorage in case of page refresh
        sessionStorage.setItem(`claim-success-${mosqueId}`, JSON.stringify(submittedClaimData));
      } else {
        toast.error((res as any)?.error || t('errorSubmittingKhairatClaim') || 'Failed to submit claim');
      }
    } catch (e: any) {
      console.error('Error submitting claim:', e);
      toast.error(e?.message || t('errorSubmittingKhairatClaim') || 'Failed to submit claim');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || checkingMembership) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600 mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading claim form...</p>
        </div>
      </div>
    );
  }

  // Show registration required message if not a member and not admin
  if (!isKhairatMember && !isMosqueAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link href={`/${locale}/mosques/${mosqueId}`}>
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Mosque
              </Button>
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {t('submitKhairatClaim') || 'Submit Khairat Claim'}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  {mosque?.name && `Submit a claim request to ${mosque.name}`}
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
                    <strong>Not logged in?</strong> We encourage you to{' '}
                    <Link href={`/${locale}/login?returnUrl=/${locale}/khairat/claim/${mosqueId}`} className="underline font-semibold">
                      log in
                    </Link>{' '}
                    for easier claim tracking and history.
                  </div>
                  <Link href={`/${locale}/login?returnUrl=/${locale}/khairat/claim/${mosqueId}`}>
                    <Button size="sm" variant="outline" className="ml-4">
                      Log In
                    </Button>
                  </Link>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                Submit Claim - Verify Membership
              </CardTitle>
              <CardDescription>
                To process your claim, we need to verify that you are a registered Khairat member. Please enter your IC number that you used during registration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ic_verification">
                    IC Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ic_verification"
                    value={icNumber}
                    onChange={(e) => setIcNumber(e.target.value)}
                    placeholder="Enter your IC number"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCheckMembershipByIC();
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the IC number you used when registering for Khairat
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleCheckMembershipByIC}
                  disabled={!icNumber.trim() || checkingByIC}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {checkingByIC ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Verify Membership
                    </>
                  )}
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  Not a member yet?
                </p>
                <Link href={`/${locale}/khairat/register/${mosqueId}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register for Khairat
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show success page if claim was submitted
  if (submittedSuccessfully && submittedClaim) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Claim Submitted Successfully</CardTitle>
                  <CardDescription>
                    Your claim has been submitted to {mosque?.name}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                  <strong>Thank you for your submission!</strong>
                  <p className="mt-2">
                    Your claim to <strong>{mosque?.name}</strong> has been submitted successfully and is now pending review by the mosque administrator.
                  </p>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-semibold mb-2">Claim Details</h4>
                  <div className="space-y-2 text-sm">
                    {submittedClaim.claimId && (
                      <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">Claim ID:</span>
                        <span className="font-medium font-mono">{submittedClaim.claimId}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Title:</span>
                      <span className="font-medium">{submittedClaim.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Requested Amount:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('ms-MY', {
                          style: 'currency',
                          currency: 'MYR',
                        }).format(submittedClaim.requestedAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Status:</span>
                      <span className="font-medium capitalize">{submittedClaim.status}</span>
                    </div>
                    {submittedClaim.description && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400 block mb-1">Description:</span>
                        <span className="font-medium">{submittedClaim.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  onClick={handleDownloadReceipt}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
                <div className="flex gap-4">
                  <Button
                    onClick={() => {
                      setSubmittedSuccessfully(false);
                      setSubmittedClaim(null);
                      setClaimTitle('');
                      setClaimAmount('');
                      setClaimDescription('');
                      setClaimDocuments([]);
                      setVerifiedICNumber(null);
                      setVerifiedKhairatMemberId(null);
                      setIsKhairatMember(false);
                      setIcNumber('');
                      window.scrollTo(0, 0);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Make New Claim
                  </Button>
                  <Link href={`/${locale}/mosques/${mosqueId}`} className="flex-1">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Back to Mosque
                    </Button>
                  </Link>
                </div>
                {user && (
                  <Link href={`/${locale}/claims`} className="block">
                    <Button variant="outline" className="w-full">
                      View My Claims
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/${locale}/mosques/${mosqueId}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Mosque
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {t('submitKhairatClaim') || 'Submit Khairat Claim'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {mosque?.name && `Submit a claim request to ${mosque.name}`}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Alert */}
        {isMosqueAdmin && (
          <Alert className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>View Only Mode</strong> - As a mosque administrator, you can view this form to see what users will experience, but you cannot submit claims.
            </AlertDescription>
          </Alert>
        )}

        {/* Info Alert */}
        {!isMosqueAdmin && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please provide clear and detailed information about your claim. This helps administrators make accurate decisions.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Claim Information</CardTitle>
              <CardDescription>
                Fill in the details about your claim request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="claim_title">
                  Claim Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="claim_title"
                  value={claimTitle}
                  onChange={(e) => setClaimTitle(e.target.value)}
                  placeholder={t('khairatClaimTitlePlaceholder') || 'E.g. Funeral assistance, Medical expenses'}
                  required
                  disabled={isMosqueAdmin}
                />
                <p className="text-xs text-muted-foreground">
                  Provide a clear, concise title for your claim
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="claim_amount">
                  Amount (RM) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="claim_amount"
                  type="number"
                  step="0.01"
                  min="1"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  placeholder={t('amountPlaceholder') || 'Enter amount'}
                  required
                  disabled={isMosqueAdmin}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the amount you are requesting
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="claim_description">
                  Description (Optional)
                </Label>
                <Textarea
                  id="claim_description"
                  rows={5}
                  value={claimDescription}
                  onChange={(e) => setClaimDescription(e.target.value)}
                  placeholder={t('khairatClaimDescriptionPlaceholder') || 'Describe your situation and need for financial assistance'}
                  disabled={isMosqueAdmin}
                />
                <p className="text-xs text-muted-foreground">
                  Provide detailed information about your situation and why you need this assistance
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Supporting Documents */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Supporting Documents (Optional)
              </CardTitle>
              <CardDescription>
                Upload documents like medical bills, death certificates, or other supporting evidence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClaimDocumentUpload
                onDocumentsChange={(docs) => {
                  if (Array.isArray(docs) && docs.length > 0 && docs[0] instanceof File) {
                    setClaimDocuments(docs as File[]);
                  } else {
                    setClaimDocuments([]);
                  }
                }}
                maxFiles={5}
                disabled={isMosqueAdmin}
              />
              {claimDocuments.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>{claimDocuments.length}</strong> document{claimDocuments.length > 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="pt-6">
            <Button
              type="submit"
              disabled={isMosqueAdmin || submitting || !claimTitle || !claimAmount}
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-11"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Submit Claim
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function KhairatClaimPage() {
  return <KhairatClaimPageContent />;
}

