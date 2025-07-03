'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  XCircle,
  DollarSign,
  TrendingUp,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface ZakatCalculationResult {
  zakatType: string;
  totalWealth: number;
  nisab: number;
  zakatDue: number;
  isEligible: boolean;
  calculations: {
    [key: string]: number;
  };
}

interface ZakatResultsProps {
  result: ZakatCalculationResult;
}

export function ZakatResults({ result }: ZakatResultsProps) {
  const t = useTranslation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const getZakatTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      harta: t('zakat.zakatTypes.harta'),
      perniagaan: t('zakat.zakatTypes.perniagaan'),
      pertanian: 'Zakat Pertanian',
      fitrah: t('zakat.zakatTypes.fitrah'),
    };
    return labels[type] || type;
  };

  const getEligibilityMessage = () => {
    if (result.zakatType === 'fitrah') {
      return {
        title: 'Zakat Fitrah is Mandatory',
        description:
          'Zakat Fitrah is obligatory for every Muslim who has sufficient means.',
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        variant: 'default' as const,
      };
    }

    if (result.isEligible) {
      return {
        title: t('zakat.eligible'),
        description: `Your wealth exceeds the nisab threshold of ${formatCurrency(
          result.nisab
        )}. You are required to pay zakat.`,
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        variant: 'default' as const,
      };
    } else {
      return {
        title: t('zakat.notEligible'),
        description: `Your wealth is below the nisab threshold of ${formatCurrency(
          result.nisab
        )}. You are not required to pay zakat at this time.`,
        icon: <XCircle className="h-5 w-5 text-red-600" />,
        variant: 'destructive' as const,
      };
    }
  };

  const eligibilityInfo = getEligibilityMessage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Zakat Calculation Results</h2>
        <Badge variant="outline" className="text-sm">
          {getZakatTypeLabel(result.zakatType)}
        </Badge>
      </div>

      {/* Eligibility Status */}
      <Alert variant={eligibilityInfo.variant}>
        <div className="flex items-center gap-2">
          {eligibilityInfo.icon}
          <div>
            <h4 className="font-medium">{eligibilityInfo.title}</h4>
            <p className="text-sm">{eligibilityInfo.description}</p>
          </div>
        </div>
      </Alert>

      {/* Main Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {result.zakatType !== 'fitrah' && (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t('zakat.totalWealth')}
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(result.totalWealth)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t('zakat.nisab')}
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(result.nisab)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Card
          className={
            result.isEligible
              ? 'border-green-200 bg-green-50'
              : 'border-gray-200'
          }
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  result.isEligible ? 'bg-green-100' : 'bg-gray-100'
                }`}
              >
                {result.isEligible ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('zakat.zakatDue')}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    result.isEligible ? 'text-green-600' : 'text-gray-600'
                  }`}
                >
                  {formatCurrency(result.zakatDue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      {result.zakatType !== 'fitrah' &&
        Object.keys(result.calculations).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Calculation Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.zakatType === 'harta' && (
                <>
                  <div className="flex justify-between">
                    <span>Total Assets</span>
                    <span className="font-medium">
                      {formatCurrency(result.calculations.totalAssets || 0)}
                    </span>
                  </div>
                  {result.calculations.goldValue > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="ml-4">• Gold Value</span>
                      <span>
                        {formatCurrency(result.calculations.goldValue)}
                      </span>
                    </div>
                  )}
                  {result.calculations.silverValue > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="ml-4">• Silver Value</span>
                      <span>
                        {formatCurrency(result.calculations.silverValue)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Total Deductions</span>
                    <span className="font-medium text-red-600">
                      -
                      {formatCurrency(result.calculations.totalDeductions || 0)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Net Wealth</span>
                    <span>{formatCurrency(result.totalWealth)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Zakat Rate</span>
                    <span>2.5%</span>
                  </div>
                </>
              )}

              {result.zakatType === 'perniagaan' && (
                <>
                  <div className="flex justify-between">
                    <span>Total Business Assets</span>
                    <span className="font-medium">
                      {formatCurrency(result.calculations.totalAssets || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Deductions</span>
                    <span className="font-medium text-red-600">
                      -
                      {formatCurrency(result.calculations.totalDeductions || 0)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Net Business Wealth</span>
                    <span>{formatCurrency(result.totalWealth)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Zakat Rate</span>
                    <span>2.5%</span>
                  </div>
                </>
              )}

              {result.zakatType === 'pertanian' && (
                <>
                  <div className="flex justify-between">
                    <span>Total Harvest Value</span>
                    <span className="font-medium">
                      {formatCurrency(result.calculations.harvestValue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Zakat Rate</span>
                    <span>{result.calculations.zakatRate}%</span>
                  </div>
                </>
              )}

              {result.zakatType === 'fitrah' && (
                <>
                  <div className="flex justify-between">
                    <span>Number of People</span>
                    <span className="font-medium">
                      {result.calculations.numberOfPeople}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate per Person</span>
                    <span className="font-medium">
                      {formatCurrency(result.calculations.ratePerPerson || 0)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total Zakat Fitrah</span>
                    <span>{formatCurrency(result.zakatDue)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

      {/* Important Notes */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> This calculation is for estimation
          purposes only. Please consult with a qualified Islamic scholar or
          religious authority for final zakat obligations. Ensure you have held
          the wealth for a full Islamic year (Haul) before calculating zakat on
          wealth and business assets.
        </AlertDescription>
      </Alert>

      {/* Haul Information for applicable zakat types */}
      {(result.zakatType === 'harta' || result.zakatType === 'perniagaan') && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>{t('zakat.haul')}:</strong> For wealth and business zakat to
            be obligatory, you must have possessed the minimum threshold (nisab)
            for a complete Islamic year.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
