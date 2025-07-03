'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Save,
  DollarSign,
  Receipt,
  CreditCard,
  Calendar,
} from 'lucide-react';

interface TransactionFormData {
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: string;
  method: 'cash' | 'bank' | 'online';
  reference: string;
  collectedBy: string;
  date: string;
  notes: string;
}

interface TransactionFormProps {
  transactionId?: string;
  onClose: () => void;
  onSave: (data: TransactionFormData) => void;
}

export function TransactionForm({
  transactionId,
  onClose,
  onSave,
}: TransactionFormProps) {
  const { t } = useLanguage();
  const isEdit = !!transactionId;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'income',
    category: '',
    description: '',
    amount: '',
    method: 'cash',
    reference: '',
    collectedBy: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const incomeCategories = [
    'weeklyDonation',
    'specialDonation',
    'membershipFee',
    'zakatFitrah',
    'zakatMaal',
    'infaq',
    'rental',
    'program',
    'other',
  ];

  const expenseCategories = [
    'utility',
    'maintenance',
    'salary',
    'supplies',
    'program',
    'equipment',
    'welfare',
    'other',
  ];

  const handleInputChange = (
    field: keyof TransactionFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentCategories =
    formData.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Back Button */}
      <div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? t('finance.editTransaction') : t('finance.addTransaction')}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit ? t('finance.editDescription') : t('finance.addDescription')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction Type & Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {t('finance.transactionDetails')}
            </CardTitle>
            <CardDescription>
              {t('finance.transactionDetailsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">{t('finance.transactionType')} *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => {
                    handleInputChange('type', value);
                    handleInputChange('category', ''); // Reset category when type changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('finance.selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">
                      {t('finance.income')}
                    </SelectItem>
                    <SelectItem value="expense">
                      {t('finance.expense')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{t('finance.category')} *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    handleInputChange('category', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('finance.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {currentCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {t(`finance.categories.${category}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('common.description')} *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                placeholder={t('finance.descriptionPlaceholder')}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">{t('finance.amount')} (RM) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      handleInputChange('amount', e.target.value)
                    }
                    placeholder="0.00"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">{t('common.date')} *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method & Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('finance.paymentDetails')}
            </CardTitle>
            <CardDescription>
              {t('finance.paymentDetailsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="method">{t('finance.paymentMethod')} *</Label>
              <Select
                value={formData.method}
                onValueChange={(value) => handleInputChange('method', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('finance.selectMethod')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t('finance.cash')}</SelectItem>
                  <SelectItem value="bank">{t('finance.bank')}</SelectItem>
                  <SelectItem value="online">{t('finance.online')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reference">{t('finance.reference')}</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) =>
                    handleInputChange('reference', e.target.value)
                  }
                  placeholder={t('finance.referencePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collectedBy">{t('finance.collectedBy')}</Label>
                <Input
                  id="collectedBy"
                  value={formData.collectedBy}
                  onChange={(e) =>
                    handleInputChange('collectedBy', e.target.value)
                  }
                  placeholder={t('finance.collectedByPlaceholder')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {t('finance.additionalInfo')}
            </CardTitle>
            <CardDescription>
              {t('finance.additionalInfoDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">{t('finance.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder={t('finance.notesPlaceholder')}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
