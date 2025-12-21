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
  FileText,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Upload,
  UserPlus,
  CheckCircle,
  CheckCircle2,
  Download,
  Building,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { getMosque, checkOnboardingStatus, createClaim, uploadClaimDocument, isUserMosqueAdmin } from '@/lib/api';
import { Mosque } from '@/types/database';
import { toast } from 'sonner';
import Link from 'next/link';
import { ClaimDocumentUpload } from '@/components/khairat/ClaimDocumentUpload';
import { KhairatStandardHeader } from '@/components/khairat/KhairatStandardHeader';
import { KhairatLoadingHeader } from '@/components/khairat/KhairatLoadingHeader';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';
import { isValidMalaysiaIc, normalizeMalaysiaIc } from '@/lib/utils';

function KhairatClaimPageContent() {
  const params = useParams();
  const router = useRouter();
  const mosqueId = params.mosqueId as string;
  const locale = params.locale as string;
  const t = useTranslations('mosquePage');
  const tKhairat = useTranslations('khairat');
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
  const [verifiedMembershipNumber, setVerifiedMembershipNumber] = useState<string | null>(null);
  const [verifiedMemberInfo, setVerifiedMemberInfo] = useState<{
    full_name?: string;
    email?: string;
    phone?: string;
    status?: string;
  } | null>(null);
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
            setIcNumber(normalizeMalaysiaIc(data.ic_passport_number).slice(0, 12));
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
              setVerifiedKhairatMemberId(memberData.id);
              setVerifiedMembershipNumber(memberData.membership_number || null);
              // Store member's registered information for display
              setVerifiedMemberInfo({
                full_name: memberData.full_name || undefined,
                email: memberData.email || undefined,
                phone: memberData.phone || undefined,
                status: memberData.status || undefined,
              });
              // Set verified IC number if available
              if (data?.ic_passport_number) {
                setVerifiedICNumber(normalizeMalaysiaIc(data.ic_passport_number).slice(0, 12));
              }
            }
          } catch (error) {
            // Silently fail - user can still verify by IC
            console.error('Error checking logged-in user membership:', error);
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
      const hasActiveMembership = members.some(
        (member: any) => member.status === 'active' || member.status === 'approved'
      );
      
      if (hasActiveMembership) {
        setIsKhairatMember(true);
        // Store verified IC number to display
        setVerifiedICNumber(normalizedIc);
        // Store the khairat_member_id for submission
        const activeMember = members.find(
          (member: any) => member.status === 'active' || member.status === 'approved'
        );
        if (activeMember) {
          setVerifiedKhairatMemberId(activeMember.id);
          setVerifiedMembershipNumber(activeMember.membership_number || null);
          // Store member's registered information for display
          setVerifiedMemberInfo({
            full_name: activeMember.full_name || undefined,
            email: activeMember.email || undefined,
            phone: activeMember.phone || undefined,
            status: activeMember.status || undefined,
          });
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

    // Require at least one supporting document
    if (claimDocuments.length === 0) {
      toast.error(
        t('supportingDocumentsRequired') ||
          'Please upload at least one supporting document'
      );
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
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <KhairatLoadingHeader
          locale={locale}
          mosqueId={mosqueId}
          title={t('submitKhairatClaim') || 'Submit Khairat Claim'}
          subtitle={undefined}
          icon={FileText}
          iconBgColor="bg-green-50 dark:bg-green-950/20"
          iconColor="text-green-600 dark:text-green-400"
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600 mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading claim form...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show registration required message if not a member and not admin
  if (!isKhairatMember && !isMosqueAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <KhairatStandardHeader
          mosque={mosque}
          locale={locale}
          mosqueId={mosqueId}
          title={t('submitKhairatClaim') || 'Submit Khairat Claim'}
          subtitle={mosque?.name ? tKhairat('claimRequestSubtitle', { mosqueName: mosque.name }) : undefined}
          icon={FileText}
          iconBgColor="bg-green-50 dark:bg-green-950/20"
          iconColor="text-green-600 dark:text-green-400"
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">


          <Card>
            <CardHeader>
              <CardTitle>
                {tKhairat('payPage.icVerificationTitle')}
              </CardTitle>
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

                <Button
                  type="button"
                  onClick={handleCheckMembershipByIC}
                  disabled={!icNumber.trim() || checkingByIC}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {checkingByIC ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {tKhairat('payPage.verifying')}
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      {tKhairat('payPage.verifyMembership')}
                    </>
                  )}
                </Button>
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

  // Show success page if claim was submitted
  if (submittedSuccessfully && submittedClaim) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <KhairatStandardHeader
          mosque={mosque}
          locale={locale}
          mosqueId={mosqueId}
          title="Claim Submitted Successfully"
          subtitle={`Your claim has been submitted to ${mosque?.name || 'the mosque'}`}
          icon={CheckCircle2}
          iconBgColor="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">
          <Card>
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
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Status:</span>
                      <Badge 
                        variant={
                          submittedClaim.status === 'approved' ? 'default' :
                          submittedClaim.status === 'rejected' ? 'destructive' :
                          submittedClaim.status === 'pending' ? 'secondary' :
                          'outline'
                        }
                        className="capitalize"
                      >
                        {submittedClaim.status}
                      </Badge>
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
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <KhairatStandardHeader
        mosque={mosque}
        locale={locale}
        mosqueId={mosqueId}
        title={t('submitKhairatClaim') || 'Submit Khairat Claim'}
        subtitle={mosque?.name ? tKhairat('claimRequestSubtitle', { mosqueName: mosque.name }) : undefined}
        icon={FileText}
        iconBgColor="bg-green-50 dark:bg-green-950/20"
        iconColor="text-green-600 dark:text-green-400"
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">

        {/* Admin Alert */}
        {isMosqueAdmin && (
          <Alert className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>{tKhairat('viewOnlyModeTitle')}</strong> {tKhairat('viewOnlyModeDescription')}
            </AlertDescription>
          </Alert>
        )}

        {/* Membership Verification Status */}
        {(verifiedICNumber || verifiedKhairatMemberId) && isKhairatMember && (
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <strong className="text-slate-900 dark:text-slate-100">{tKhairat('payPage.membershipVerifiedTitle')}</strong>
              </div>
              {verifiedICNumber && (
                <div className="flex items-center gap-2 ml-6">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {tKhairat('payPage.icNumberLabel') || 'IC Number'}: <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{verifiedICNumber}</span>
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
              {(verifiedKhairatMemberId || verifiedMembershipNumber) && (
                <p className="text-sm text-slate-600 dark:text-slate-400 ml-6">
                  {tKhairat('payPage.memberIdLabel') || 'Member ID'}: <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{verifiedMembershipNumber || verifiedKhairatMemberId?.slice(0, 8).toUpperCase()}</span>
                </p>
              )}
              
              {/* Display Registered Information */}
              {verifiedMemberInfo && (verifiedMemberInfo.full_name || verifiedMemberInfo.email || verifiedMemberInfo.phone) && (
                <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 ml-6">
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {tKhairat('payPage.registeredInformationLabel') || 'Registered Information'}
                  </p>
                  <div className="space-y-2 text-sm">
                    {verifiedMemberInfo.full_name && (
                      <div className="flex items-start gap-3">
                        <span className="font-medium text-slate-600 dark:text-slate-400 min-w-[100px]">
                          {tKhairat('payPage.payerNameLabel')}:
                        </span>
                        <span className="text-slate-900 dark:text-slate-100 flex-1">
                          {verifiedMemberInfo.full_name}
                        </span>
                      </div>
                    )}
                    {verifiedMemberInfo.email && (
                      <div className="flex items-start gap-3">
                        <span className="font-medium text-slate-600 dark:text-slate-400 min-w-[100px]">
                          {tKhairat('payPage.emailLabel')}:
                        </span>
                        <span className="text-slate-900 dark:text-slate-100 flex-1 break-all">
                          {verifiedMemberInfo.email}
                        </span>
                      </div>
                    )}
                    {verifiedMemberInfo.phone && (
                      <div className="flex items-start gap-3">
                        <span className="font-medium text-slate-600 dark:text-slate-400 min-w-[100px]">
                          {tKhairat('payPage.mobileNumberLabel')}:
                        </span>
                        <span className="text-slate-900 dark:text-slate-100 flex-1">
                          {verifiedMemberInfo.phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{tKhairat('claimInformationTitle')}</CardTitle>
              <CardDescription>
                {tKhairat('claimInformationDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="claim_title">
                  {tKhairat('khairatClaimTitle')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="claim_title"
                  value={claimTitle}
                  onChange={(e) => setClaimTitle(e.target.value)}
                  placeholder={tKhairat('khairatClaimTitlePlaceholder') || 'E.g. Funeral assistance, Medical expenses'}
                  required
                  disabled={isMosqueAdmin}
                />
                <p className="text-xs text-muted-foreground">
                  {tKhairat('claimTitleHelp')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="claim_amount">
                  {tKhairat('claimAmountLabel')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="claim_amount"
                  type="number"
                  step="0.01"
                  min="1"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  placeholder={tKhairat('payPage.amountPlaceholder') || 'Enter amount'}
                  required
                  disabled={isMosqueAdmin}
                />
                <p className="text-xs text-muted-foreground">
                  {tKhairat('claimAmountHelp')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="claim_description">
                  {tKhairat('claimDescriptionLabel')}
                </Label>
                <Textarea
                  id="claim_description"
                  rows={5}
                  value={claimDescription}
                  onChange={(e) => setClaimDescription(e.target.value)}
                  placeholder={tKhairat('khairatClaimDescriptionPlaceholder') || 'Describe your situation and need for financial assistance'}
                  disabled={isMosqueAdmin}
                />
                <p className="text-xs text-muted-foreground">
                  {tKhairat('claimDescriptionHelp')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Supporting Documents */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {tKhairat('supportingDocumentsTitle')} <span className="text-red-500">*</span>
              </CardTitle>
              <CardDescription>
                {tKhairat('supportingDocumentsDescription')}
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
                    {tKhairat('documentsSelected', { count: claimDocuments.length })}
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
                  {tKhairat('submittingClaim')}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  {tKhairat('submitClaim')}
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

