'use client';

import { useState } from 'react';
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
import { ArrowLeft, Save, FileText } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface KhairatApplicationFormData {
  deceased: string;
  applicant: string;
  relationship: string;
  deathDate: string;
  applicantIc: string;
  applicantPhone: string;
  applicantAddress: string;
  deceasedIc: string;
  membershipNumber: string;
  deathCertificateNumber: string;
  bankAccount: string;
  bankName: string;
  notes: string;
}

interface KhairatApplicationFormProps {
  application?: KhairatApplicationFormData | null;
  onBack: () => void;
  onSubmit: (application: KhairatApplicationFormData) => void;
}

export function KhairatApplicationForm({
  application,
  onBack,
  onSubmit,
}: KhairatApplicationFormProps) {
  const t = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<KhairatApplicationFormData>(
    application || {
      deceased: '',
      applicant: '',
      relationship: '',
      deathDate: '',
      applicantIc: '',
      applicantPhone: '',
      applicantAddress: '',
      deceasedIc: '',
      membershipNumber: '',
      deathCertificateNumber: '',
      bankAccount: '',
      bankName: '',
      notes: '',
    }
  );

  const relationships = [
    'Isteri',
    'Suami',
    'Anak',
    'Ibu',
    'Bapa',
    'Adik-beradik',
    'Waris Terdekat',
    'Lain-lain',
  ];

  const malaysianBanks = [
    'Maybank',
    'CIMB Bank',
    'Public Bank',
    'RHB Bank',
    'Hong Leong Bank',
    'AmBank',
    'Bank Islam',
    'Bank Rakyat',
    'BSN',
    'Bank Muamalat',
    'OCBC Bank',
    'Standard Chartered',
    'Lain-lain',
  ];

  const handleInputChange = (
    field: keyof KhairatApplicationFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onSubmit(formData);
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isEditing = Boolean(application);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Back Button */}
      <div>
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing
            ? t('khairat.editApplication')
            : t('khairat.newApplication')}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditing
            ? t('khairat.editApplicationDescription')
            : t('khairat.newApplicationDescription')}
        </p>
      </div>

      <div className="text-sm text-muted-foreground">
        {isEditing
          ? t('khairat.editApplicationDescription')
          : t('khairat.newApplicationDescription')}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deceased Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('khairat.deceasedInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deceased">{t('khairat.deceasedName')} *</Label>
                <Input
                  id="deceased"
                  placeholder={t('khairat.deceasedNamePlaceholder')}
                  value={formData.deceased}
                  onChange={(e) =>
                    handleInputChange('deceased', e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deceasedIc">{t('khairat.deceasedIc')} *</Label>
                <Input
                  id="deceasedIc"
                  placeholder={t('khairat.icPlaceholder')}
                  value={formData.deceasedIc}
                  onChange={(e) =>
                    handleInputChange('deceasedIc', e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="membershipNumber">
                  {t('khairat.membershipNumber')} *
                </Label>
                <Input
                  id="membershipNumber"
                  placeholder={t('khairat.membershipNumberPlaceholder')}
                  value={formData.membershipNumber}
                  onChange={(e) =>
                    handleInputChange('membershipNumber', e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deathDate">{t('khairat.deathDate')} *</Label>
                <Input
                  id="deathDate"
                  type="date"
                  value={formData.deathDate}
                  onChange={(e) =>
                    handleInputChange('deathDate', e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deathCertificateNumber">
                {t('khairat.deathCertificateNumber')} *
              </Label>
              <Input
                id="deathCertificateNumber"
                placeholder={t('khairat.deathCertificateNumberPlaceholder')}
                value={formData.deathCertificateNumber}
                onChange={(e) =>
                  handleInputChange('deathCertificateNumber', e.target.value)
                }
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Applicant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('khairat.applicantInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicant">
                  {t('khairat.applicantName')} *
                </Label>
                <Input
                  id="applicant"
                  placeholder={t('khairat.applicantNamePlaceholder')}
                  value={formData.applicant}
                  onChange={(e) =>
                    handleInputChange('applicant', e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicantIc">
                  {t('khairat.applicantIc')} *
                </Label>
                <Input
                  id="applicantIc"
                  placeholder={t('khairat.icPlaceholder')}
                  value={formData.applicantIc}
                  onChange={(e) =>
                    handleInputChange('applicantIc', e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="relationship">
                  {t('khairat.relationship')} *
                </Label>
                <Select
                  value={formData.relationship}
                  onValueChange={(value) =>
                    handleInputChange('relationship', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t('khairat.selectRelationship')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {relationships.map((relationship) => (
                      <SelectItem key={relationship} value={relationship}>
                        {relationship}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicantPhone">
                  {t('khairat.applicantPhone')} *
                </Label>
                <Input
                  id="applicantPhone"
                  placeholder={t('khairat.phonePlaceholder')}
                  value={formData.applicantPhone}
                  onChange={(e) =>
                    handleInputChange('applicantPhone', e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicantAddress">
                {t('khairat.applicantAddress')} *
              </Label>
              <Textarea
                id="applicantAddress"
                placeholder={t('khairat.addressPlaceholder')}
                value={formData.applicantAddress}
                onChange={(e) =>
                  handleInputChange('applicantAddress', e.target.value)
                }
                required
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bank Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('khairat.bankInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">{t('khairat.bankName')} *</Label>
                <Select
                  value={formData.bankName}
                  onValueChange={(value) =>
                    handleInputChange('bankName', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('khairat.selectBank')} />
                  </SelectTrigger>
                  <SelectContent>
                    {malaysianBanks.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccount">
                  {t('khairat.bankAccount')} *
                </Label>
                <Input
                  id="bankAccount"
                  placeholder={t('khairat.bankAccountPlaceholder')}
                  value={formData.bankAccount}
                  onChange={(e) =>
                    handleInputChange('bankAccount', e.target.value)
                  }
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('khairat.additionalNotes')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('khairat.notes')}</Label>
              <Textarea
                id="notes"
                placeholder={t('khairat.notesPlaceholder')}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
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
                {isEditing
                  ? t('khairat.updateApplication')
                  : t('khairat.submitApplication')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
