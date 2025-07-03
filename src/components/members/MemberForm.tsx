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
import { ArrowLeft, Save, User, Users, Phone, Mail } from 'lucide-react';

interface MemberFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  membershipType: 'regular' | 'family' | 'student' | 'senior';
  dateOfBirth: string;
  gender: 'male' | 'female';
  occupation: string;
  notes: string;
}

interface MemberFormProps {
  memberId?: string;
  onClose: () => void;
  onSave: (data: MemberFormData) => void;
}

export function MemberForm({ memberId, onClose, onSave }: MemberFormProps) {
  const { t } = useLanguage();
  const isEdit = !!memberId;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<MemberFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    membershipType: 'regular',
    dateOfBirth: '',
    gender: 'male',
    occupation: '',
    notes: '',
  });

  const handleInputChange = (field: keyof MemberFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving member:', error);
    } finally {
      setLoading(false);
    }
  };

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
          {isEdit ? t('members.editMember') : t('members.addMember')}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit ? t('members.editDescription') : t('members.addDescription')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('members.basicInfo')}
            </CardTitle>
            <CardDescription>
              {t('members.basicInfoDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('common.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('members.namePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="membershipType">
                  {t('members.membershipType')} *
                </Label>
                <Select
                  value={formData.membershipType}
                  onValueChange={(value) =>
                    handleInputChange('membershipType', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('members.selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">
                      {t('members.types.regular')}
                    </SelectItem>
                    <SelectItem value="family">
                      {t('members.types.family')}
                    </SelectItem>
                    <SelectItem value="student">
                      {t('members.types.student')}
                    </SelectItem>
                    <SelectItem value="senior">
                      {t('members.types.senior')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">{t('members.dateOfBirth')}</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    handleInputChange('dateOfBirth', e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">{t('members.gender')}</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t('members.male')}</SelectItem>
                    <SelectItem value="female">
                      {t('members.female')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">{t('members.occupation')}</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) =>
                  handleInputChange('occupation', e.target.value)
                }
                placeholder={t('members.occupationPlaceholder')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t('members.contactInfo')}
            </CardTitle>
            <CardDescription>
              {t('members.contactInfoDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('common.email')} *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={t('members.emailPlaceholder')}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('common.phone')} *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder={t('members.phonePlaceholder')}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t('common.address')} *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder={t('members.addressPlaceholder')}
                rows={3}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('members.emergencyContact')}
            </CardTitle>
            <CardDescription>
              {t('members.emergencyContactDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">
                  {t('members.emergencyContactName')} *
                </Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    handleInputChange('emergencyContact', e.target.value)
                  }
                  placeholder={t('members.emergencyContactPlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">
                  {t('members.emergencyPhone')} *
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) =>
                      handleInputChange('emergencyPhone', e.target.value)
                    }
                    placeholder={t('members.emergencyPhonePlaceholder')}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('members.additionalInfo')}
            </CardTitle>
            <CardDescription>
              {t('members.additionalInfoDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">{t('members.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder={t('members.notesPlaceholder')}
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
