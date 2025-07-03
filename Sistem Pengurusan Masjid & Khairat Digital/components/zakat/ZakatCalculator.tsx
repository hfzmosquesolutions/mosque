import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Calculator,
  DollarSign,
  Info,
  TrendingUp,
  Target,
  CheckCircle,
  FileText,
  Download,
  RefreshCw
} from 'lucide-react';
import { User } from '../../App';
import { toast } from 'sonner@2.0.3';

interface ZakatCalculatorProps {
  user: User;
}

interface ZakatCalculation {
  type: string;
  nisab: number;
  rate: number;
  amount: number;
  zakatDue: number;
  isEligible: boolean;
}

export function ZakatCalculator({ user }: ZakatCalculatorProps) {
  const [activeTab, setActiveTab] = useState('harta');
  
  // Form states for different zakat types
  const [hartalCalculation, setHartalCalculation] = useState({
    cash: 0,
    savings: 0,
    investments: 0,
    gold: 0,
    silver: 0,
    debts: 0
  });

  const [goldCalculation, setGoldCalculation] = useState({
    weight: 0,
    purity: 999,
    currentPrice: 280 // RM per gram
  });

  const [businessCalculation, setBusinessCalculation] = useState({
    inventory: 0,
    accounts_receivable: 0,
    cash_business: 0,
    business_debts: 0
  });

  const [fitrahCalculation, setFitrahCalculation] = useState({
    familyMembers: 1,
    ratePerPerson: 7 // RM per person for 2025
  });

  // Current nisab values (updated for 2025)
  const nisabValues = {
    cash: 14454, // RM (based on silver price)
    gold: 85, // grams
    silver: 595, // grams
    business: 14454 // RM
  };

  const zakatRates = {
    general: 0.025, // 2.5%
    fitrah: 7 // RM per person
  };

  const calculateHartaZakat = (): ZakatCalculation => {
    const totalAssets = hartalCalculation.cash + 
                       hartalCalculation.savings + 
                       hartalCalculation.investments + 
                       hartalCalculation.gold + 
                       hartalCalculation.silver;
    
    const netWorth = totalAssets - hartalCalculation.debts;
    const isEligible = netWorth >= nisabValues.cash;
    const zakatDue = isEligible ? netWorth * zakatRates.general : 0;

    return {
      type: 'Zakat Harta',
      nisab: nisabValues.cash,
      rate: zakatRates.general,
      amount: netWorth,
      zakatDue,
      isEligible
    };
  };

  const calculateGoldZakat = (): ZakatCalculation => {
    const totalValue = goldCalculation.weight * goldCalculation.currentPrice;
    const isEligible = goldCalculation.weight >= nisabValues.gold;
    const zakatDue = isEligible ? totalValue * zakatRates.general : 0;

    return {
      type: 'Zakat Emas',
      nisab: nisabValues.gold,
      rate: zakatRates.general,
      amount: totalValue,
      zakatDue,
      isEligible
    };
  };

  const calculateBusinessZakat = (): ZakatCalculation => {
    const totalAssets = businessCalculation.inventory + 
                       businessCalculation.accounts_receivable + 
                       businessCalculation.cash_business;
    
    const netBusinessWorth = totalAssets - businessCalculation.business_debts;
    const isEligible = netBusinessWorth >= nisabValues.business;
    const zakatDue = isEligible ? netBusinessWorth * zakatRates.general : 0;

    return {
      type: 'Zakat Perniagaan',
      nisab: nisabValues.business,
      rate: zakatRates.general,
      amount: netBusinessWorth,
      zakatDue,
      isEligible
    };
  };

  const calculateFitrahZakat = (): ZakatCalculation => {
    const zakatDue = fitrahCalculation.familyMembers * fitrahCalculation.ratePerPerson;

    return {
      type: 'Zakat Fitrah',
      nisab: 0,
      rate: fitrahCalculation.ratePerPerson,
      amount: fitrahCalculation.familyMembers,
      zakatDue,
      isEligible: true
    };
  };

  const getCurrentCalculation = (): ZakatCalculation => {
    switch (activeTab) {
      case 'harta':
        return calculateHartaZakat();
      case 'emas':
        return calculateGoldZakat();
      case 'perniagaan':
        return calculateBusinessZakat();
      case 'fitrah':
        return calculateFitrahZakat();
      default:
        return calculateHartaZakat();
    }
  };

  const handleSaveCalculation = () => {
    const calculation = getCurrentCalculation();
    toast.success(`Pengiraan ${calculation.type} berjaya disimpan`);
  };

  const handlePrintCalculation = () => {
    toast.success('Pengiraan sedang dicetak');
  };

  const handleReset = () => {
    switch (activeTab) {
      case 'harta':
        setHartalCalculation({
          cash: 0,
          savings: 0,
          investments: 0,
          gold: 0,
          silver: 0,
          debts: 0
        });
        break;
      case 'emas':
        setGoldCalculation({
          weight: 0,
          purity: 999,
          currentPrice: 280
        });
        break;
      case 'perniagaan':
        setBusinessCalculation({
          inventory: 0,
          accounts_receivable: 0,
          cash_business: 0,
          business_debts: 0
        });
        break;
      case 'fitrah':
        setFitrahCalculation({
          familyMembers: 1,
          ratePerPerson: 7
        });
        break;
    }
    toast.success('Borang telah dikosongkan');
  };

  const calculation = getCurrentCalculation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Kalkulator Zakat
          </h1>
          <p className="text-muted-foreground">
            Kira jumlah zakat yang perlu dibayar mengikut jenis harta
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSaveCalculation}>
            <FileText className="h-4 w-4 mr-2" />
            Simpan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculator Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Pengiraan Zakat</CardTitle>
              <CardDescription>
                Pilih jenis zakat dan masukkan maklumat harta anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="harta">Zakat Harta</TabsTrigger>
                  <TabsTrigger value="emas">Zakat Emas</TabsTrigger>
                  <TabsTrigger value="perniagaan">Perniagaan</TabsTrigger>
                  <TabsTrigger value="fitrah">Zakat Fitrah</TabsTrigger>
                </TabsList>

                <TabsContent value="harta" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Wang Tunai (RM)</Label>
                      <Input
                        type="number"
                        value={hartalCalculation.cash}
                        onChange={(e) => setHartalCalculation(prev => ({
                          ...prev,
                          cash: parseFloat(e.target.value) || 0
                        }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Simpanan Bank (RM)</Label>
                      <Input
                        type="number"
                        value={hartalCalculation.savings}
                        onChange={(e) => setHartalCalculation(prev => ({
                          ...prev,
                          savings: parseFloat(e.target.value) || 0
                        }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pelaburan (RM)</Label>
                      <Input
                        type="number"
                        value={hartalCalculation.investments}
                        onChange={(e) => setHartalCalculation(prev => ({
                          ...prev,
                          investments: parseFloat(e.target.value) || 0
                        }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nilai Emas (RM)</Label>
                      <Input
                        type="number"
                        value={hartalCalculation.gold}
                        onChange={(e) => setHartalCalculation(prev => ({
                          ...prev,
                          gold: parseFloat(e.target.value) || 0
                        }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nilai Perak (RM)</Label>
                      <Input
                        type="number"
                        value={hartalCalculation.silver}
                        onChange={(e) => setHartalCalculation(prev => ({
                          ...prev,
                          silver: parseFloat(e.target.value) || 0
                        }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hutang (RM)</Label>
                      <Input
                        type="number"
                        value={hartalCalculation.debts}
                        onChange={(e) => setHartalCalculation(prev => ({
                          ...prev,
                          debts: parseFloat(e.target.value) || 0
                        }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900">Panduan Pengiraan Zakat Harta:</p>
                        <ul className="mt-2 space-y-1 text-blue-800">
                          <li>• Nisab semasa: RM {nisabValues.cash.toLocaleString()}</li>
                          <li>• Kadar zakat: 2.5% dari jumlah harta bersih</li>
                          <li>• Harta mesti dimiliki selama 1 tahun penuh (haul)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="emas" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Berat Emas (gram)</Label>
                      <Input
                        type="number"
                        value={goldCalculation.weight}
                        onChange={(e) => setGoldCalculation(prev => ({
                          ...prev,
                          weight: parseFloat(e.target.value) || 0
                        }))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Karat Emas</Label>
                      <Select 
                        value={goldCalculation.purity.toString()} 
                        onValueChange={(value) => setGoldCalculation(prev => ({
                          ...prev,
                          purity: parseInt(value)
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="999">24K (99.9%)</SelectItem>
                          <SelectItem value="916">22K (91.6%)</SelectItem>
                          <SelectItem value="750">18K (75.0%)</SelectItem>
                          <SelectItem value="585">14K (58.5%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Harga Emas Semasa (RM/gram)</Label>
                      <Input
                        type="number"
                        value={goldCalculation.currentPrice}
                        onChange={(e) => setGoldCalculation(prev => ({
                          ...prev,
                          currentPrice: parseFloat(e.target.value) || 280
                        }))}
                        placeholder="280.00"
                      />
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-900">Panduan Pengiraan Zakat Emas:</p>
                        <ul className="mt-2 space-y-1 text-yellow-800">
                          <li>• Nisab emas: {nisabValues.gold} gram</li>
                          <li>• Kadar zakat: 2.5% dari nilai emas</li>
                          <li>• Termasuk emas hiasan yang jarang dipakai</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="perniagaan" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nilai Inventori (RM)</Label>
                      <Input
                        type="number"
                        value={businessCalculation.inventory}
                        onChange={(e) => setBusinessCalculation(prev => ({
                          ...prev,
                          inventory: parseFloat(e.target.value) || 0
                        }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Akaun Belum Terima (RM)</Label>
                      <Input
                        type="number"
                        value={businessCalculation.accounts_receivable}
                        onChange={(e) => setBusinessCalculation(prev => ({
                          ...prev,
                          accounts_receivable: parseFloat(e.target.value) || 0
                        }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Wang Tunai Perniagaan (RM)</Label>
                      <Input
                        type="number"
                        value={businessCalculation.cash_business}
                        onChange={(e) => setBusinessCalculation(prev => ({
                          ...prev,
                          cash_business: parseFloat(e.target.value) || 0
                        }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hutang Perniagaan (RM)</Label>
                      <Input
                        type="number"
                        value={businessCalculation.business_debts}
                        onChange={(e) => setBusinessCalculation(prev => ({
                          ...prev,
                          business_debts: parseFloat(e.target.value) || 0
                        }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-900">Panduan Pengiraan Zakat Perniagaan:</p>
                        <ul className="mt-2 space-y-1 text-green-800">
                          <li>• Nisab perniagaan: RM {nisabValues.business.toLocaleString()}</li>
                          <li>• Kadar zakat: 2.5% dari modal perniagaan bersih</li>
                          <li>• Dinilai pada tarikh tutup akaun tahunan</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="fitrah" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bilangan Ahli Keluarga</Label>
                      <Input
                        type="number"
                        value={fitrahCalculation.familyMembers}
                        onChange={(e) => setFitrahCalculation(prev => ({
                          ...prev,
                          familyMembers: parseInt(e.target.value) || 1
                        }))}
                        placeholder="1"
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Kadar Per Orang (RM)</Label>
                      <Input
                        type="number"
                        value={fitrahCalculation.ratePerPerson}
                        onChange={(e) => setFitrahCalculation(prev => ({
                          ...prev,
                          ratePerPerson: parseFloat(e.target.value) || 7
                        }))}
                        placeholder="7.00"
                      />
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-purple-900">Panduan Zakat Fitrah:</p>
                        <ul className="mt-2 space-y-1 text-purple-800">
                          <li>• Wajib bagi semua Muslim yang mampu</li>
                          <li>• Kadar 2025: RM {zakatRates.fitrah} seorang</li>
                          <li>• Dibayar sebelum solat Eid</li>
                          <li>• Termasuk ahli keluarga yang ditanggung</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Calculation Results */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Hasil Pengiraan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  RM {calculation.zakatDue.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {calculation.type} yang perlu dibayar
                </p>
              </div>

              <div className="space-y-3">
                {calculation.type !== 'Zakat Fitrah' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Nisab:</span>
                      <span>RM {calculation.nisab.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Jumlah Harta:</span>
                      <span>RM {calculation.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Kadar Zakat:</span>
                      <span>{(calculation.rate * 100).toFixed(1)}%</span>
                    </div>
                  </>
                )}

                {calculation.type === 'Zakat Fitrah' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Bilangan Orang:</span>
                      <span>{calculation.amount} orang</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Kadar Per Orang:</span>
                      <span>RM {calculation.rate}</span>
                    </div>
                  </>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Status Kewajipan:</span>
                    {calculation.isEligible ? (
                      <Badge className="bg-red-500">Wajib Bayar</Badge>
                    ) : (
                      <Badge className="bg-green-500">Tidak Wajib</Badge>
                    )}
                  </div>
                </div>
              </div>

              {calculation.zakatDue > 0 && (
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={() => toast.success('Diarahkan ke portal pembayaran')}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Bayar Sekarang
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handlePrintCalculation}>
                    <Download className="h-4 w-4 mr-2" />
                    Cetak Pengiraan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Maklumat Tambahan</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                <strong>Tempoh Haul:</strong> Harta mesti dimiliki selama 1 tahun hijrah penuh.
              </p>
              <p>
                <strong>Pembayaran:</strong> Zakat boleh dibayar secara ansuran atau sekaligus.
              </p>
              <p>
                <strong>Penerima:</strong> Zakat diagihkan kepada 8 asnaf yang layak.
              </p>
              <p className="text-muted-foreground text-xs">
                *Pengiraan ini adalah anggaran. Sila rujuk pihak berkuasa agama untuk pengesahan.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}