'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAdminAccess } from '@/hooks/useUserRole';
import jsPDF from 'jspdf';
import { getMosque } from '@/lib/api';
import { Mosque } from '@/types/database';

interface PaymentResultData {
  status: string;
  message: string;
  contributionId?: string;
  paymentId?: string;
  billId?: string;
  amount?: string;
  payerName?: string;
  mosqueId?: string;
  membershipNumber?: string;
}

function PaymentResultContent() {
  const t = useTranslations('khairat');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { hasAdminAccess } = useAdminAccess();
  const [resultData, setResultData] = useState<PaymentResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mosque, setMosque] = useState<Mosque | null>(null);

  // Determine the correct redirect path based on user role
  const getKhairatPath = () => {
    if (resultData?.mosqueId) {
      return `/mosques/${resultData.mosqueId}`;
    }
    return hasAdminAccess ? '/payments' : '/mosques';
  };

  const handleDownloadReceipt = () => {
    if (!resultData) return;

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
    if (mosque) {
      yPos = addText('Mosque Information', margin, yPos, 14, true);
      yPos += 5;
      yPos = addText(mosque.name, margin, yPos, 12, true);
      if (mosque.address) {
        yPos = addText(mosque.address, margin, yPos + 3, 10);
      }
      yPos += 10;
    }

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

    const statusText = getStatusText(resultData.status);
    const details = [
      resultData.paymentId ? ['Payment ID:', resultData.paymentId] : null,
      resultData.billId ? ['Bill ID:', resultData.billId] : null,
      resultData.payerName ? ['Payer Name:', resultData.payerName] : null,
      resultData.amount ? ['Amount:', `RM ${parseFloat(resultData.amount).toFixed(2)}`] : null,
      resultData.membershipNumber ? ['Membership Number:', resultData.membershipNumber] : null,
      ['Status:', statusText.toUpperCase()],
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

    if (resultData.message) {
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Note:', margin, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      const messageLines = doc.splitTextToSize(resultData.message, pageWidth - 2 * margin);
      doc.text(messageLines, margin, yPos);
      yPos += messageLines.length * 4;
    }

    yPos += 5;

    // Note
    doc.setDrawColor(255, 193, 7); // amber
    doc.setFillColor(255, 251, 235); // amber-50
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 15, 3, 3, 'FD');
    doc.setTextColor(146, 64, 14); // amber-800
    doc.setFontSize(9);
    const noteText = resultData.status === 'success' 
      ? 'Your payment has been successfully processed. Thank you for your contribution!'
      : resultData.status === 'pending'
      ? 'Your payment is being processed. Please wait for confirmation.'
      : 'Please contact the mosque administrator if you have any questions.';
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
    doc.text('Thank you for your payment!', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text('This is a system-generated receipt.', pageWidth / 2, yPos, { align: 'center' });

    // Download PDF
    const fileName = `payment-receipt-${resultData.paymentId || resultData.contributionId || 'khairat'}.pdf`;
    doc.save(fileName);
  };

  useEffect(() => {
    // Extract data from URL parameters
    const status = searchParams.get('status') || 'unknown';
    const message = searchParams.get('message') || t('paymentStatusUnknown');
    const contributionId = searchParams.get('contributionId');
    const paymentId = searchParams.get('paymentId');
    const billId = searchParams.get('billId');
    const amount = searchParams.get('amount');
    const payerName = searchParams.get('payerName');
    const mosqueId = searchParams.get('mosqueId');
    const membershipNumber = searchParams.get('membershipNumber');

    setResultData({
      status,
      message,
      contributionId: contributionId || undefined,
      paymentId: paymentId || undefined,
      billId: billId || undefined,
      amount: amount || undefined,
      payerName: payerName || undefined,
      mosqueId: mosqueId || undefined,
      membershipNumber: membershipNumber || undefined,
    });

    // Fetch mosque information if mosqueId is available
    const fetchMosque = async () => {
      if (mosqueId) {
        try {
          const res = await getMosque(mosqueId);
          if (res.success && res.data) {
            setMosque(res.data);
          }
        } catch (error) {
          console.error('Error fetching mosque:', error);
          // Don't show error to user, just continue without mosque info
        }
      }
      setIsLoading(false);
    };

    fetchMosque();
  }, [searchParams, t]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-500" />;
      case 'pending':
        return <Clock className="h-16 w-16 text-yellow-500" />;
      case 'expired':
        return <AlertCircle className="h-16 w-16 text-orange-500" />;
      default:
        return <AlertCircle className="h-16 w-16 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return t('paymentSuccessful');
      case 'failed':
        return t('paymentFailed');
      case 'pending':
        return t('paymentPending');
      case 'expired':
        return t('paymentExpired');
      default:
        return t('paymentStatusUnknown');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {t('noPaymentInformation')}
              </h2>
              <p className="text-gray-600 mb-4">
                {t('unableToRetrieveDetails')}
              </p>
              <Button
                onClick={() => router.push(getKhairatPath())}
                className="w-full"
              >
                {t('backToKhairat')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {getStatusIcon(resultData.status)}
              </div>
              <CardTitle className="text-2xl mb-2">
                {getStatusText(resultData.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-lg text-gray-700 mb-4">
                  {resultData.status === 'success'
                    ? t('paymentCompletedSuccessfully')
                    : resultData.status === 'failed'
                    ? t('paymentFailedMessage')
                    : resultData.status === 'pending'
                    ? t('paymentProcessingMessage')
                    : resultData.status === 'expired'
                    ? t('paymentExpiredMessage')
                    : t('paymentStatusUnknown')}
                </p>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {t('paymentDetails')}
                </h3>
                <div>
                  <Badge className={getStatusColor(resultData.status)}>
                    {getStatusText(resultData.status)}
                  </Badge>
                </div>

                {resultData.payerName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('payerName')}:</span>
                    <span className="font-medium">{resultData.payerName}</span>
                  </div>
                )}

                {resultData.amount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('amount')}:</span>
                    <span className="font-medium">
                      RM {parseFloat(resultData.amount).toFixed(2)}
                    </span>
                  </div>
                )}

                {resultData.paymentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('paymentId')}:</span>
                    <span className="font-mono text-sm">
                      {resultData.paymentId}
                    </span>
                  </div>
                )}
                
                {resultData.billId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('billId')}:</span>
                    <span className="font-mono text-sm">
                      {resultData.billId}
                    </span>
                  </div>
                )}

                {resultData.membershipNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('khairatId')}:</span>
                    <span className="font-mono text-sm">
                      {resultData.membershipNumber}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => router.push(getKhairatPath())}
                  variant="outline"
                  className="flex-1"
                >
                  {t('backToKhairat')}
                </Button>

                {resultData.status === 'success' && (
                  <Button
                    onClick={handleDownloadReceipt}
                    className="flex-1"
                  >
                    {t('downloadReceipt')}
                  </Button>
                )}

                {resultData.status === 'failed' && (
                  <Button
                    onClick={() => router.push(getKhairatPath())}
                    className="flex-1"
                  >
                    {t('tryAgain')}
                  </Button>
                )}
              </div>

              {/* Additional Information */}
              {resultData.status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>{t('note')}:</strong>{' '}
                    {t('paymentProcessingMessage')}
                  </p>
                </div>
              )}

              {resultData.status === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">
                    <strong>{t('paymentFailed')}:</strong>{' '}
                    {t('paymentFailedMessage')}
                  </p>
                </div>
              )}

              {resultData.status === 'expired' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-orange-800 text-sm">
                    <strong>{t('paymentExpired')}:</strong>{' '}
                    {t('paymentExpiredMessage')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function PaymentResultLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
    </div>
  );
}

// Main component with Suspense wrapper
export default function PaymentResultPage() {
  return (
    <Suspense fallback={<PaymentResultLoading />}>
      <PaymentResultContent />
    </Suspense>
  );
}
