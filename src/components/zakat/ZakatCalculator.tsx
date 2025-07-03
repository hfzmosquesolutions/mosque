'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calculator,
  Info,
  Coins,
  Building2,
  Wheat,
  Gem,
  DollarSign,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { ZakatResults } from './ZakatResults';
import { useTranslation } from '@/hooks/useTranslation';

interface ZakatCalculatorProps {
  onCalculationComplete?: (result: ZakatCalculationResult) => void;
}

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

export function ZakatCalculator({
  onCalculationComplete,
}: ZakatCalculatorProps) {
  const t = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('harta');
  const [calculationResult, setCalculationResult] =
    useState<ZakatCalculationResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Current rates (these would normally come from an API or config)
  const rates = {
    goldPrice: 280, // RM per gram
    silverPrice: 3.5, // RM per gram
    nisabGold: 85, // grams
    nisabSilver: 595, // grams
    zakatRate: 2.5, // percentage
    fitrahRate: 7, // RM per person
  };

  // Wealth Zakat Calculator
  const [wealthData, setWealthData] = useState({
    cash: 0,
    bankSavings: 0,
    investments: 0,
    gold: 0,
    silver: 0,
    businessAssets: 0,
    debts: 0,
    expenses: 0,
  });

  // Business Zakat Calculator
  const [businessData, setBusinessData] = useState({
    inventory: 0,
    receivables: 0,
    cash: 0,
    payables: 0,
    expenses: 0,
  });

  // Agricultural Zakat Calculator
  const [agricultureData, setAgricultureData] = useState({
    totalHarvest: 0,
    irrigationType: 'rain', // rain or irrigation
    marketValue: 0,
  });

  // Fitrah Calculator
  const [fitrahData, setFitrahData] = useState({
    numberOfPeople: 1,
    customRate: rates.fitrahRate,
  });

  const calculateWealthZakat = (): ZakatCalculationResult => {
    const totalAssets =
      wealthData.cash +
      wealthData.bankSavings +
      wealthData.investments +
      wealthData.gold * rates.goldPrice +
      wealthData.silver * rates.silverPrice +
      wealthData.businessAssets;

    const totalDeductions = wealthData.debts + wealthData.expenses;
    const netWealth = totalAssets - totalDeductions;

    const nisab = rates.nisabGold * rates.goldPrice; // Using gold nisab
    const isEligible = netWealth >= nisab;
    const zakatDue = isEligible ? (netWealth * rates.zakatRate) / 100 : 0;

    return {
      zakatType: 'harta',
      totalWealth: netWealth,
      nisab,
      zakatDue,
      isEligible,
      calculations: {
        totalAssets,
        totalDeductions,
        goldValue: wealthData.gold * rates.goldPrice,
        silverValue: wealthData.silver * rates.silverPrice,
      },
    };
  };

  const calculateBusinessZakat = (): ZakatCalculationResult => {
    const totalAssets =
      businessData.inventory + businessData.receivables + businessData.cash;

    const totalDeductions = businessData.payables + businessData.expenses;
    const netBusinessWealth = totalAssets - totalDeductions;

    const nisab = rates.nisabGold * rates.goldPrice;
    const isEligible = netBusinessWealth >= nisab;
    const zakatDue = isEligible
      ? (netBusinessWealth * rates.zakatRate) / 100
      : 0;

    return {
      zakatType: 'perniagaan',
      totalWealth: netBusinessWealth,
      nisab,
      zakatDue,
      isEligible,
      calculations: {
        totalAssets,
        totalDeductions,
      },
    };
  };

  const calculateAgricultureZakat = (): ZakatCalculationResult => {
    const zakatRate = agricultureData.irrigationType === 'rain' ? 10 : 5; // 10% for rain-fed, 5% for irrigation
    const nisabValue = 653; // kg of rice equivalent, converted to RM value
    const totalValue =
      agricultureData.totalHarvest * agricultureData.marketValue;

    const isEligible = totalValue >= nisabValue;
    const zakatDue = isEligible ? (totalValue * zakatRate) / 100 : 0;

    return {
      zakatType: 'pertanian',
      totalWealth: totalValue,
      nisab: nisabValue,
      zakatDue,
      isEligible,
      calculations: {
        harvestValue: totalValue,
        zakatRate,
      },
    };
  };

  const calculateFitrahZakat = (): ZakatCalculationResult => {
    const zakatDue = fitrahData.numberOfPeople * fitrahData.customRate;

    return {
      zakatType: 'fitrah',
      totalWealth: 0,
      nisab: 0,
      zakatDue,
      isEligible: true,
      calculations: {
        numberOfPeople: fitrahData.numberOfPeople,
        ratePerPerson: fitrahData.customRate,
      },
    };
  };

  const handleCalculate = () => {
    let result: ZakatCalculationResult;

    switch (activeTab) {
      case 'harta':
        result = calculateWealthZakat();
        break;
      case 'perniagaan':
        result = calculateBusinessZakat();
        break;
      case 'pertanian':
        result = calculateAgricultureZakat();
        break;
      case 'fitrah':
        result = calculateFitrahZakat();
        break;
      default:
        return;
    }

    setCalculationResult(result);
    setShowResults(true);
    onCalculationComplete?.(result);
  };

  const handleNewCalculation = () => {
    setShowResults(false);
    setCalculationResult(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const resetForm = () => {
    setWealthData({
      cash: 0,
      bankSavings: 0,
      investments: 0,
      gold: 0,
      silver: 0,
      businessAssets: 0,
      debts: 0,
      expenses: 0,
    });
    setBusinessData({
      inventory: 0,
      receivables: 0,
      cash: 0,
      payables: 0,
      expenses: 0,
    });
    setAgricultureData({
      totalHarvest: 0,
      irrigationType: 'rain',
      marketValue: 0,
    });
    setFitrahData({
      numberOfPeople: 1,
      customRate: rates.fitrahRate,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Calculator className="mr-2 h-4 w-4" />
          {t('zakat.calculator')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {t('zakat.calculatorTitle')}
          </DialogTitle>
          <DialogDescription>{t('zakat.calculateAmounts')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {showResults && calculationResult ? (
            <ZakatResults result={calculationResult} />
          ) : (
            <>
              {/* Current Rates Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Current Rates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium">{t('zakat.goldPrice')}</p>
                      <p className="text-yellow-600">
                        {formatCurrency(rates.goldPrice)}/gram
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">{t('zakat.silverPrice')}</p>
                      <p className="text-gray-600">
                        {formatCurrency(rates.silverPrice)}/gram
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">{t('zakat.zakatRate')}</p>
                      <p className="text-green-600">{rates.zakatRate}%</p>
                    </div>
                    <div>
                      <p className="font-medium">Zakat Fitrah</p>
                      <p className="text-blue-600">
                        {formatCurrency(rates.fitrahRate)}/person
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Calculator Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger
                    value="harta"
                    className="flex items-center gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    {t('zakat.zakatTypes.harta')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="perniagaan"
                    className="flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    {t('zakat.zakatTypes.perniagaan')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="pertanian"
                    className="flex items-center gap-2"
                  >
                    <Wheat className="h-4 w-4" />
                    Agriculture
                  </TabsTrigger>
                  <TabsTrigger
                    value="fitrah"
                    className="flex items-center gap-2"
                  >
                    <Coins className="h-4 w-4" />
                    {t('zakat.zakatTypes.fitrah')}
                  </TabsTrigger>
                </TabsList>

                {/* Wealth Zakat Calculator */}
                <TabsContent value="harta" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Wealth Zakat Calculator</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cash">Cash in Hand</Label>
                          <Input
                            id="cash"
                            type="number"
                            step="0.01"
                            value={wealthData.cash || ''}
                            onChange={(e) =>
                              setWealthData((prev) => ({
                                ...prev,
                                cash: parseFloat(e.target.value) || 0,
                              }))
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bankSavings">Bank Savings</Label>
                          <Input
                            id="bankSavings"
                            type="number"
                            step="0.01"
                            value={wealthData.bankSavings || ''}
                            onChange={(e) =>
                              setWealthData((prev) => ({
                                ...prev,
                                bankSavings: parseFloat(e.target.value) || 0,
                              }))
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="investments">Investments</Label>
                          <Input
                            id="investments"
                            type="number"
                            step="0.01"
                            value={wealthData.investments || ''}
                            onChange={(e) =>
                              setWealthData((prev) => ({
                                ...prev,
                                investments: parseFloat(e.target.value) || 0,
                              }))
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessAssets">
                            Business Assets
                          </Label>
                          <Input
                            id="businessAssets"
                            type="number"
                            step="0.01"
                            value={wealthData.businessAssets || ''}
                            onChange={(e) =>
                              setWealthData((prev) => ({
                                ...prev,
                                businessAssets: parseFloat(e.target.value) || 0,
                              }))
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="gold">Gold (grams)</Label>
                          <Input
                            id="gold"
                            type="number"
                            step="0.01"
                            value={wealthData.gold || ''}
                            onChange={(e) =>
                              setWealthData((prev) => ({
                                ...prev,
                                gold: parseFloat(e.target.value) || 0,
                              }))
                            }
                            placeholder="0.00"
                          />
                          <p className="text-xs text-gray-500">
                            Value:{' '}
                            {formatCurrency(wealthData.gold * rates.goldPrice)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="silver">Silver (grams)</Label>
                          <Input
                            id="silver"
                            type="number"
                            step="0.01"
                            value={wealthData.silver || ''}
                            onChange={(e) =>
                              setWealthData((prev) => ({
                                ...prev,
                                silver: parseFloat(e.target.value) || 0,
                              }))
                            }
                            placeholder="0.00"
                          />
                          <p className="text-xs text-gray-500">
                            Value:{' '}
                            {formatCurrency(
                              wealthData.silver * rates.silverPrice
                            )}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="debts">Outstanding Debts</Label>
                          <Input
                            id="debts"
                            type="number"
                            step="0.01"
                            value={wealthData.debts || ''}
                            onChange={(e) =>
                              setWealthData((prev) => ({
                                ...prev,
                                debts: parseFloat(e.target.value) || 0,
                              }))
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expenses">
                            Basic Living Expenses (Monthly)
                          </Label>
                          <Input
                            id="expenses"
                            type="number"
                            step="0.01"
                            value={wealthData.expenses || ''}
                            onChange={(e) =>
                              setWealthData((prev) => ({
                                ...prev,
                                expenses: parseFloat(e.target.value) || 0,
                              }))
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Business Zakat Calculator */}
                <TabsContent value="perniagaan" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Business Zakat Calculator</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="inventory">Inventory Value</Label>
                          <Input
                            id="inventory"
                            type="number"
                            step="0.01"
                            value={businessData.inventory || ''}
                            onChange={(e) =>
                              setBusinessData((prev) => ({
                                ...prev,
                                inventory: parseFloat(e.target.value) || 0,
                              }))
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="receivables">
                            Accounts Receivable
                          </Label>
                          <Input
                            id="receivables"
                            type="number"
                            step="0.01"
                            value={businessData.receivables || ''}
                            onChange={(e) =>
                              setBusinessData((prev) => ({
                                ...prev,
                                receivables: parseFloat(e.target.value) || 0,
                              }))
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessCash">Business Cash</Label>
                          <Input
                            id="businessCash"
                            type="number"
                            step="0.01"
                            value={businessData.cash || ''}
                            onChange={(e) =>
                              setBusinessData((prev) => ({
                                ...prev,
                                cash: parseFloat(e.target.value) || 0,
                              }))
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="payables">Accounts Payable</Label>
                          <Input
                            id="payables"
                            type="number"
                            step="0.01"
                            value={businessData.payables || ''}
                            onChange={(e) =>
                              setBusinessData((prev) => ({
                                ...prev,
                                payables: parseFloat(e.target.value) || 0,
                              }))
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="businessExpenses">
                          Business Expenses
                        </Label>
                        <Input
                          id="businessExpenses"
                          type="number"
                          step="0.01"
                          value={businessData.expenses || ''}
                          onChange={(e) =>
                            setBusinessData((prev) => ({
                              ...prev,
                              expenses: parseFloat(e.target.value) || 0,
                            }))
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Agriculture Zakat Calculator */}
                <TabsContent value="pertanian" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Agricultural Zakat Calculator</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="totalHarvest">
                            Total Harvest (kg)
                          </Label>
                          <Input
                            id="totalHarvest"
                            type="number"
                            step="0.01"
                            value={agricultureData.totalHarvest || ''}
                            onChange={(e) =>
                              setAgricultureData((prev) => ({
                                ...prev,
                                totalHarvest: parseFloat(e.target.value) || 0,
                              }))
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="marketValue">
                            Market Value per kg (RM)
                          </Label>
                          <Input
                            id="marketValue"
                            type="number"
                            step="0.01"
                            value={agricultureData.marketValue || ''}
                            onChange={(e) =>
                              setAgricultureData((prev) => ({
                                ...prev,
                                marketValue: parseFloat(e.target.value) || 0,
                              }))
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="irrigationType">Irrigation Type</Label>
                        <Select
                          value={agricultureData.irrigationType}
                          onValueChange={(value: 'rain' | 'irrigation') =>
                            setAgricultureData((prev) => ({
                              ...prev,
                              irrigationType: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rain">
                              Rain-fed (10% rate)
                            </SelectItem>
                            <SelectItem value="irrigation">
                              Irrigated (5% rate)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Rain-fed crops: 10% zakat rate. Irrigated crops: 5%
                          zakat rate. Minimum nisab: 653 kg of rice equivalent.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Fitrah Zakat Calculator */}
                <TabsContent value="fitrah" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Zakat Fitrah Calculator</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="numberOfPeople">
                            Number of People
                          </Label>
                          <Input
                            id="numberOfPeople"
                            type="number"
                            min="1"
                            value={fitrahData.numberOfPeople || ''}
                            onChange={(e) =>
                              setFitrahData((prev) => ({
                                ...prev,
                                numberOfPeople: parseInt(e.target.value) || 1,
                              }))
                            }
                            placeholder="1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customRate">
                            Rate per Person (RM)
                          </Label>
                          <Input
                            id="customRate"
                            type="number"
                            step="0.01"
                            value={fitrahData.customRate || ''}
                            onChange={(e) =>
                              setFitrahData((prev) => ({
                                ...prev,
                                customRate:
                                  parseFloat(e.target.value) ||
                                  rates.fitrahRate,
                              }))
                            }
                            placeholder={rates.fitrahRate.toString()}
                          />
                        </div>
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Zakat Fitrah is mandatory for every Muslim who has
                          sufficient means. Current rate:{' '}
                          {formatCurrency(rates.fitrahRate)} per person.
                        </AlertDescription>
                      </Alert>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="font-medium text-green-800">
                          Total Zakat Fitrah:{' '}
                          {formatCurrency(
                            fitrahData.numberOfPeople * fitrahData.customRate
                          )}
                        </p>
                        <p className="text-sm text-green-600">
                          {fitrahData.numberOfPeople} people ×{' '}
                          {formatCurrency(fitrahData.customRate)} per person
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {showResults && (
              <Button
                type="button"
                variant="outline"
                onClick={handleNewCalculation}
              >
                New Calculation
              </Button>
            )}
            {!showResults && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Reset
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              {t('common.close')}
            </Button>
          </div>
          {!showResults && (
            <Button onClick={handleCalculate}>
              <Calculator className="mr-2 h-4 w-4" />
              {t('zakat.calculate')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
