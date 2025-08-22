'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PaymentResultData {
  status: string;
  message: string;
  contributionId?: string;
  paymentId?: string;
  amount?: string;
  payerName?: string;
}

function PaymentResultContent() {
  const t = useTranslations('khairat');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [resultData, setResultData] = useState<PaymentResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Extract data from URL parameters
    const status = searchParams.get('status') || 'unknown';
    const message = searchParams.get('message') || t('paymentStatusUnknown');
    const contributionId = searchParams.get('contributionId');
    const paymentId = searchParams.get('paymentId');
    const amount = searchParams.get('amount');
    const payerName = searchParams.get('payerName');

    setResultData({
      status,
      message,
      contributionId: contributionId || undefined,
      paymentId: paymentId || undefined,
      amount: amount || undefined,
      payerName: payerName || undefined,
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
                onClick={() => router.push('/khairat')}
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
              <Badge className={getStatusColor(resultData.status)}>
                {resultData.status.toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-lg text-gray-700 mb-4">
                  {resultData.message}
                </p>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {t('paymentDetails')}
                </h3>

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

                {resultData.contributionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t('contributionId')}:
                    </span>
                    <span className="font-mono text-sm">
                      {resultData.contributionId}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => router.push('/khairat')}
                  variant="outline"
                  className="flex-1"
                >
                  {t('backToKhairat')}
                </Button>

                {resultData.status === 'success' && (
                  <Button
                    onClick={() => router.push('/khairat')}
                    className="flex-1"
                  >
                    {t('viewMyContributions')}
                  </Button>
                )}

                {resultData.status === 'failed' && (
                  <Button
                    onClick={() => router.push('/khairat')}
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
