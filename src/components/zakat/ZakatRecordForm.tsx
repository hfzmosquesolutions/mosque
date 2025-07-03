'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Calculator } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface ZakatRecordFormData {
  payerName: string;
  payerIc: string;
  payerPhone: string;
  payerAddress: string;
  zakatType: 'fitrah' | 'harta' | 'perniagaan' | 'emas' | 'pertanian';
  amount: number;
  paymentMethod: 'cash' | 'bank' | 'online';
  reference?: string;
  collectedBy: string;
  date: string;
  notes: string;
}

interface ZakatRecordFormProps {
  record?: ZakatRecord | null;
  onSave: (record: ZakatRecordFormData) => void;
  onCancel: () => void;
}

interface ZakatRecord {
  id: string;
  payerName: string;
  payerIc: string;
  amount: number;
  zakatType: 'harta' | 'fitrah' | 'perniagaan' | 'emas' | 'perak';
  paymentDate: string;
  status: 'completed' | 'pending' | 'verified';
  receiptNumber: string;
}

export function ZakatRecordForm({
  record,
  onSave,
  onCancel,
}: ZakatRecordFormProps) {
  const t = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ZakatRecordFormData>({
    payerName: '',
    payerIc: '',
    payerPhone: '',
    payerAddress: '',
    zakatType: 'fitrah',
    amount: 0,
    paymentMethod: 'cash',
    reference: '',
    collectedBy: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (record) {
      setFormData({
        payerName: record.payerName,
        payerIc: record.payerIc,
        payerPhone: '', // These fields don't exist in ZakatRecord, so keep empty
        payerAddress: '',
        zakatType:
          record.zakatType === 'harta'
            ? 'harta'
            : record.zakatType === 'fitrah'
            ? 'fitrah'
            : record.zakatType === 'perniagaan'
            ? 'perniagaan'
            : record.zakatType === 'emas'
            ? 'emas'
            : 'fitrah',
        amount: record.amount,
        paymentMethod: 'cash', // Default since not in ZakatRecord
        reference: record.receiptNumber,
        collectedBy: '',
        date: record.paymentDate,
        notes: '',
      });
    }
  }, [record]);

  const zakatTypes = [
    { value: 'fitrah', label: 'Zakat Fitrah' },
    { value: 'harta', label: 'Zakat Harta' },
    { value: 'perniagaan', label: 'Zakat Perniagaan' },
    { value: 'emas', label: 'Zakat Emas & Perak' },
    { value: 'pertanian', label: 'Zakat Pertanian' },
  ];

  const handleInputChange = (
    field: keyof ZakatRecordFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onSave(formData);
    } catch (error) {
      console.error('Error saving zakat record:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate suggested amount for Zakat Fitrah (current rate: RM 7 per person)
  const getSuggestedAmount = () => {
    if (formData.zakatType === 'fitrah') {
      return 7; // RM 7 per person for Zakat Fitrah
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Button variant="outline" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {record ? t('zakat.editRecord') : t('zakat.newRecord')}
        </h1>
        <p className="text-gray-600 mt-1">
          {record
            ? t('zakat.editRecordDescription')
            : t('zakat.newRecordDescription')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('zakat.payerInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payerName">{t('zakat.payerName')} *</Label>
                <Input
                  id="payerName"
                  placeholder="Nama pembayar zakat"
                  value={formData.payerName}
                  onChange={(e) =>
                    handleInputChange('payerName', e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payerIc">{t('zakat.payerIc')} *</Label>
                <Input
                  id="payerIc"
                  placeholder="123456-12-3456"
                  value={formData.payerIc}
                  onChange={(e) => handleInputChange('payerIc', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payerPhone">{t('zakat.payerPhone')}</Label>
                <Input
                  id="payerPhone"
                  placeholder="+60123456789"
                  value={formData.payerPhone}
                  onChange={(e) =>
                    handleInputChange('payerPhone', e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">{t('zakat.paymentDate')} *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payerAddress">{t('zakat.payerAddress')}</Label>
              <Textarea
                id="payerAddress"
                placeholder="Alamat pembayar zakat"
                value={formData.payerAddress}
                onChange={(e) =>
                  handleInputChange('payerAddress', e.target.value)
                }
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Zakat Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('zakat.zakatDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zakatType">{t('zakat.zakatType')} *</Label>
                <Select
                  value={formData.zakatType}
                  onValueChange={(
                    value:
                      | 'fitrah'
                      | 'harta'
                      | 'perniagaan'
                      | 'emas'
                      | 'pertanian'
                  ) => handleInputChange('zakatType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {zakatTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">{t('zakat.amount')} *</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount || ''}
                    onChange={(e) =>
                      handleInputChange(
                        'amount',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    required
                  />
                  {formData.zakatType === 'fitrah' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 text-xs"
                      onClick={() =>
                        handleInputChange('amount', getSuggestedAmount())
                      }
                    >
                      RM {getSuggestedAmount()}
                    </Button>
                  )}
                </div>
                {formData.zakatType === 'fitrah' && (
                  <p className="text-xs text-gray-500">
                    {t('zakat.fitrahSuggestion')}: RM {getSuggestedAmount()}{' '}
                    {t('zakat.perPerson')}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">
                  {t('zakat.paymentMethod')} *
                </Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value: 'cash' | 'bank' | 'online') =>
                    handleInputChange('paymentMethod', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t('finance.cash')}</SelectItem>
                    <SelectItem value="bank">{t('finance.bank')}</SelectItem>
                    <SelectItem value="online">
                      {t('finance.online')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="collectedBy">{t('zakat.collectedBy')} *</Label>
                <Input
                  id="collectedBy"
                  placeholder="Nama pengutip"
                  value={formData.collectedBy}
                  onChange={(e) =>
                    handleInputChange('collectedBy', e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">{t('zakat.reference')}</Label>
              <Input
                id="reference"
                placeholder="No. rujukan / resit"
                value={formData.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('zakat.additionalNotes')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('zakat.notes')}</Label>
              <Textarea
                id="notes"
                placeholder={t('zakat.notesPlaceholder')}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                {t('common.saving')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {record ? t('common.update') : t('zakat.addRecord')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
