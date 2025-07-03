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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Calendar, Users, MapPin, Clock } from 'lucide-react';

interface ProgramFormData {
  title: string;
  type: string;
  description: string;
  date: string;
  time: string;
  endTime: string;
  location: string;
  speaker: string;
  maxParticipants: string;
  cost: string;
  registrationRequired: boolean;
  organizer: string;
  speakerFee: string;
  notes: string;
}

interface ProgramFormProps {
  programId?: string;
  onClose: () => void;
  onSave: (data: ProgramFormData) => void;
}

export function ProgramForm({ programId, onClose, onSave }: ProgramFormProps) {
  const { t } = useLanguage();
  const isEdit = !!programId;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<ProgramFormData>({
    title: '',
    type: 'ceramah',
    description: '',
    date: '',
    time: '',
    endTime: '',
    location: '',
    speaker: '',
    maxParticipants: '',
    cost: '0',
    registrationRequired: false,
    organizer: '',
    speakerFee: '0',
    notes: '',
  });

  const handleInputChange = (
    field: keyof ProgramFormData,
    value: string | boolean
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
      console.error('Error saving program:', error);
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
          {isEdit ? t('programs.editProgram') : t('programs.addProgram')}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit
            ? t('programs.editDescription')
            : t('programs.addDescription')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('programs.basicInfo')}
            </CardTitle>
            <CardDescription>
              {t('programs.basicInfoDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('programs.programTitle')} *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder={t('programs.titlePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">{t('programs.programType')} *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('programs.selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ceramah">
                      {t('programs.types.ceramah')}
                    </SelectItem>
                    <SelectItem value="kelas">
                      {t('programs.types.kelas')}
                    </SelectItem>
                    <SelectItem value="kenduri">
                      {t('programs.types.kenduri')}
                    </SelectItem>
                    <SelectItem value="gotong-royong">
                      {t('programs.types.gotongRoyong')}
                    </SelectItem>
                    <SelectItem value="lain">
                      {t('programs.types.lain')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('programs.description')} *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                placeholder={t('programs.descriptionPlaceholder')}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">{t('programs.date')} *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">{t('programs.startTime')} *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">{t('programs.endTime')}</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location and Speaker */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t('programs.locationSpeaker')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">{t('programs.location')} *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange('location', e.target.value)
                  }
                  placeholder={t('programs.locationPlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="speaker">{t('programs.speaker')}</Label>
                <Input
                  id="speaker"
                  value={formData.speaker}
                  onChange={(e) => handleInputChange('speaker', e.target.value)}
                  placeholder={t('programs.speakerPlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizer">{t('programs.organizer')} *</Label>
              <Input
                id="organizer"
                value={formData.organizer}
                onChange={(e) => handleInputChange('organizer', e.target.value)}
                placeholder={t('programs.organizerPlaceholder')}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Participants and Cost */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('programs.participantsCost')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxParticipants">
                  {t('programs.maxParticipants')}
                </Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min="1"
                  value={formData.maxParticipants}
                  onChange={(e) =>
                    handleInputChange('maxParticipants', e.target.value)
                  }
                  placeholder="50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">{t('programs.participationFee')}</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="speakerFee">{t('programs.speakerFee')}</Label>
                <Input
                  id="speakerFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.speakerFee}
                  onChange={(e) =>
                    handleInputChange('speakerFee', e.target.value)
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="registrationRequired"
                checked={formData.registrationRequired}
                onCheckedChange={(checked) =>
                  handleInputChange('registrationRequired', checked as boolean)
                }
              />
              <Label
                htmlFor="registrationRequired"
                className="text-sm font-medium"
              >
                {t('programs.registrationRequired')}
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>{t('programs.additionalInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('programs.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder={t('programs.notesPlaceholder')}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
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
