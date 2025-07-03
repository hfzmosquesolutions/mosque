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
  Calendar,
  Users,
  MapPin,
  Clock,
  Phone,
  Mail,
} from 'lucide-react';

interface BookingFormData {
  eventName: string;
  facility: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  bookedBy: string;
  contactPhone: string;
  contactEmail: string;
  purpose: string;
  expectedAttendees: string;
  cost: string;
  paymentStatus: string;
  notes: string;
}

interface BookingFormProps {
  bookingId?: string;
  onClose: () => void;
  onSave: (data: BookingFormData) => void;
}

export function BookingForm({ bookingId, onClose, onSave }: BookingFormProps) {
  const { t } = useLanguage();
  const isEdit = !!bookingId;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<BookingFormData>({
    eventName: '',
    facility: 'dewanSerbaguna',
    eventDate: '',
    startTime: '',
    endTime: '',
    bookedBy: '',
    contactPhone: '',
    contactEmail: '',
    purpose: '',
    expectedAttendees: '',
    cost: '0',
    paymentStatus: 'unpaid',
    notes: '',
  });

  const handleInputChange = (field: keyof BookingFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving booking:', error);
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
          {isEdit ? t('bookings.editBooking') : t('bookings.addBooking')}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit
            ? t('bookings.editDescription')
            : t('bookings.addDescription')}
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
                <Label htmlFor="eventName">{t('bookings.eventName')} *</Label>
                <Input
                  id="eventName"
                  value={formData.eventName}
                  onChange={(e) =>
                    handleInputChange('eventName', e.target.value)
                  }
                  placeholder={t('bookings.eventNamePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facility">{t('bookings.facility')} *</Label>
                <Select
                  value={formData.facility}
                  onValueChange={(value) =>
                    handleInputChange('facility', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('bookings.selectFacility')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dewanSerbaguna">
                      {t('bookings.facilities.dewanSerbaguna')}
                    </SelectItem>
                    <SelectItem value="dewanUtama">
                      {t('bookings.facilities.dewanUtama')}
                    </SelectItem>
                    <SelectItem value="bilikKelas">
                      {t('bookings.facilities.bilikKelas')}
                    </SelectItem>
                    <SelectItem value="halamanDepan">
                      {t('bookings.facilities.halamanDepan')}
                    </SelectItem>
                    <SelectItem value="halamanBelakang">
                      {t('bookings.facilities.halamanBelakang')}
                    </SelectItem>
                    <SelectItem value="ruangMeeting">
                      {t('bookings.facilities.ruangMeeting')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">{t('bookings.purpose')} *</Label>
              <Textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => handleInputChange('purpose', e.target.value)}
                placeholder={t('bookings.purposePlaceholder')}
                rows={3}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('common.date')} & {t('common.time')}
            </CardTitle>
            <CardDescription>
              Tarikh dan masa penggunaan kemudahan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventDate">{t('bookings.eventDate')} *</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) =>
                    handleInputChange('eventDate', e.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">{t('bookings.startTime')} *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    handleInputChange('startTime', e.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">{t('bookings.endTime')} *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('bookings.contactInfo')}
            </CardTitle>
            <CardDescription>Maklumat hubungan penempah</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bookedBy">{t('bookings.bookedBy')} *</Label>
              <Input
                id="bookedBy"
                value={formData.bookedBy}
                onChange={(e) => handleInputChange('bookedBy', e.target.value)}
                placeholder={t('bookings.bookedByPlaceholder')}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPhone">
                  {t('bookings.contactPhone')} *
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) =>
                      handleInputChange('contactPhone', e.target.value)
                    }
                    placeholder={t('bookings.contactPhonePlaceholder')}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">
                  {t('bookings.contactEmail')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) =>
                      handleInputChange('contactEmail', e.target.value)
                    }
                    placeholder={t('bookings.contactEmailPlaceholder')}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Butiran Acara
            </CardTitle>
            <CardDescription>Maklumat tambahan mengenai acara</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expectedAttendees">
                  {t('bookings.expectedAttendees')}
                </Label>
                <Input
                  id="expectedAttendees"
                  type="number"
                  min="1"
                  value={formData.expectedAttendees}
                  onChange={(e) =>
                    handleInputChange('expectedAttendees', e.target.value)
                  }
                  placeholder={t('bookings.attendeesPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">{t('bookings.cost')}</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', e.target.value)}
                  placeholder={t('bookings.costPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentStatus">
                  {t('bookings.paymentStatus')}
                </Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={(value) =>
                    handleInputChange('paymentStatus', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">
                      {t('bookings.unpaid')}
                    </SelectItem>
                    <SelectItem value="partial">
                      {t('bookings.partial')}
                    </SelectItem>
                    <SelectItem value="paid">{t('bookings.paid')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('bookings.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder={t('bookings.notesPlaceholder')}
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
