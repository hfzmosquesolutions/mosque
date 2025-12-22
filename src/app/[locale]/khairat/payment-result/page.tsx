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

  // Determine the correct redirect path based on user role
  const getKhairatPath = () => {
    if (resultData?.mosqueId) {
      return `/mosques/${resultData.mosqueId}`;
    }
    return hasAdminAccess ? '/payments' : '/mosques';
  };

  const handleDownloadReceipt = () => {
    if (!resultData) return;
    const doc = new jsPDF();
    const title = t('paymentDetails');
    const statusText = getStatusText(resultData.status);
    doc.setFontSize(18);
    doc.text(title, 20, 20);
    doc.setFontSize(12);
    doc.text(`${t('payerName')}: ${resultData.payerName || '-'}`, 20, 40);
    doc.text(`${t('amount')}: RM ${resultData.amount ? parseFloat(resultData.amount).toFixed(2) : '-'}`, 20, 50);
    doc.text(`${t('paymentId')}: ${resultData.paymentId || '-'}`, 20, 60);
    doc.text(`${t('billId')}: ${resultData.billId || '-'}`, 20, 70);
    doc.text(`${t('khairatId')}: ${resultData.membershipNumber || '-'}`, 20, 80);
    doc.text(`${t('status')}: ${statusText}`, 20, 90);
    doc.text(`${t('note')}: ${resultData.message || '-'}`, 20, 100);
    const fileName = `resit-${resultData.paymentId || resultData.contributionId || 'khairat'}.pdf`;
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
    setIsLoading(false);
  }, [searchParams]);

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
