'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAuth } from '@/hooks/useAuth';
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
import { Badge } from '@/components/ui/badge';
import {
  Building,
  MapPin,
  Phone,
  Users,
  Calendar,
  CreditCard,
  Clock,
} from 'lucide-react';

function MosqueProfileContent() {
  const { t } = useLanguage();
  const { user: authUser } = useAuth();

  // Mosque profile data
  const [mosque, setMosque] = useState({
    id: 'MSJ001',
    name: 'Masjid Al-Hidayah',
    address: 'Jalan Masjid Al-Hidayah, Kampung Baru',
    city: 'Kuala Lumpur',
    state: 'Wilayah Persekutuan',
    postcode: '50300',
    phone: '+603-2691-1234',
    email: 'admin@masjidhidayah.my',
    website: 'www.masjidhidayah.my',
    capacity: 500,
    establishedDate: '1985-06-15',
    registrationNumber: 'PPM-001/WP/1985',
    imam: 'Ustaz Abdullah Rahman',
    chairman: 'Haji Ahmad Ibrahim',
    bankAccount: '1234567890 (Bank Islam)',
    services: [
      'Solat 5 Waktu',
      'Solat Jumaat',
      'Kelas Mengaji',
      'Majlis Tahlil',
      'Khairat Kematian',
      'Zakat',
    ],
    operatingHours: {
      subuh: '5:30 AM - 7:00 AM',
      zohor: '1:00 PM - 2:30 PM',
      asar: '4:30 PM - 6:00 PM',
      maghrib: '7:15 PM - 8:00 PM',
      isyak: '8:30 PM - 10:00 PM',
    },
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setMosque((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    console.log('Saving mosque profile:', mosque);
    setIsEditing(false);
    // Show success message
  };

  // Check if user has permission to edit mosque profile
  const canEdit =
    authUser?.role === 'super_admin' || authUser?.role === 'mosque_admin';

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('mosqueProfile.title')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('mosqueProfile.subtitle')}
              </p>
            </div>
            {canEdit && (
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? 'outline' : 'default'}
                className="w-full sm:w-auto"
              >
                {isEditing ? t('common.cancel') : t('common.edit')}
              </Button>
            )}
          </div>
        </div>

        {/* Mosque Overview Section */}
        <div className="mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="h-24 w-24 md:h-32 md:w-32 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                    <Building className="h-12 w-12 md:h-16 md:w-16 text-white" />
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {mosque.name}
                    </h2>
                    <p className="text-gray-600 flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4" />
                      {mosque.city}, {mosque.state}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="bg-white">
                      ID: {mosque.id}
                    </Badge>
                    <Badge variant="secondary">
                      Est. {new Date(mosque.establishedDate).getFullYear()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                      <div className="text-sm font-medium text-blue-900">
                        {mosque.capacity}
                      </div>
                      <div className="text-xs text-blue-600">Capacity</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <Building className="h-5 w-5 text-green-600 mx-auto mb-1" />
                      <div className="text-sm font-medium text-green-900">
                        {mosque.services.length}
                      </div>
                      <div className="text-xs text-green-600">Services</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                      <div className="text-sm font-medium text-purple-900">
                        {new Date().getFullYear() -
                          new Date(mosque.establishedDate).getFullYear()}
                      </div>
                      <div className="text-xs text-purple-600">Years</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <Phone className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                      <div className="text-sm font-medium text-orange-900">
                        Active
                      </div>
                      <div className="text-xs text-orange-600">Status</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {t('mosqueProfile.basicInfo')}
                </CardTitle>
                <CardDescription>
                  {t('mosqueProfile.aboutMosque')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mosqueName">
                      {t('mosqueProfile.mosqueName')}
                    </Label>
                    <Input
                      id="mosqueName"
                      value={mosque.name}
                      onChange={(e) =>
                        handleInputChange('name', e.target.value)
                      }
                      disabled={!isEditing}
                      className="transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mosqueId">
                      {t('mosqueProfile.mosqueId')}
                    </Label>
                    <Input
                      id="mosqueId"
                      value={mosque.id}
                      disabled
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">
                      {t('mosqueProfile.capacity')}
                    </Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={mosque.capacity}
                      onChange={(e) =>
                        handleInputChange('capacity', e.target.value)
                      }
                      disabled={!isEditing}
                      className="transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="establishedDate">
                      {t('mosqueProfile.establishedDate')}
                    </Label>
                    <Input
                      id="establishedDate"
                      type="date"
                      value={mosque.establishedDate}
                      onChange={(e) =>
                        handleInputChange('establishedDate', e.target.value)
                      }
                      disabled={!isEditing}
                      className="transition-colors"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('mosqueProfile.phone')}</Label>
                    <Input
                      id="phone"
                      value={mosque.phone}
                      onChange={(e) =>
                        handleInputChange('phone', e.target.value)
                      }
                      disabled={!isEditing}
                      className="transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('mosqueProfile.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={mosque.email}
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                      disabled={!isEditing}
                      className="transition-colors"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="website">
                      {t('mosqueProfile.website')}
                    </Label>
                    <Input
                      id="website"
                      value={mosque.website}
                      onChange={(e) =>
                        handleInputChange('website', e.target.value)
                      }
                      disabled={!isEditing}
                      className="transition-colors"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Address Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={mosque.address}
                      onChange={(e) =>
                        handleInputChange('address', e.target.value)
                      }
                      disabled={!isEditing}
                      className="transition-colors min-h-[80px]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={mosque.city}
                        onChange={(e) =>
                          handleInputChange('city', e.target.value)
                        }
                        disabled={!isEditing}
                        className="transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={mosque.state}
                        onChange={(e) =>
                          handleInputChange('state', e.target.value)
                        }
                        disabled={!isEditing}
                        className="transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input
                        id="postcode"
                        value={mosque.postcode}
                        onChange={(e) =>
                          handleInputChange('postcode', e.target.value)
                        }
                        disabled={!isEditing}
                        className="transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leadership */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Leadership
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="imam">Imam</Label>
                    <Input
                      id="imam"
                      value={mosque.imam}
                      onChange={(e) =>
                        handleInputChange('imam', e.target.value)
                      }
                      disabled={!isEditing}
                      className="transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chairman">Chairman</Label>
                    <Input
                      id="chairman"
                      value={mosque.chairman}
                      onChange={(e) =>
                        handleInputChange('chairman', e.target.value)
                      }
                      disabled={!isEditing}
                      className="transition-colors"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="registrationNumber">
                      Registration Number
                    </Label>
                    <Input
                      id="registrationNumber"
                      value={mosque.registrationNumber}
                      onChange={(e) =>
                        handleInputChange('registrationNumber', e.target.value)
                      }
                      disabled={!isEditing}
                      className="transition-colors"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Account */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {t('mosqueProfile.bankAccount')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">
                    {t('mosqueProfile.bankAccount')}
                  </Label>
                  <Input
                    id="bankAccount"
                    value={mosque.bankAccount}
                    onChange={(e) =>
                      handleInputChange('bankAccount', e.target.value)
                    }
                    disabled={!isEditing}
                    className="transition-colors"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section - Services & Operating Hours */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Services */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle>{t('mosqueProfile.services')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {mosque.services.map((service, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs bg-white"
                  >
                    {service}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('mosqueProfile.operatingHours')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(mosque.operatingHours).map(([prayer, time]) => (
                  <div
                    key={prayer}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <span className="font-medium capitalize text-gray-700">
                      {prayer}
                    </span>
                    <span className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                      {time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Actions */}
        {isEditing && canEdit && (
          <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="order-2 sm:order-1"
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveProfile} className="order-1 sm:order-2">
              {t('mosqueProfile.updateProfile')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MosqueProfilePage() {
  return (
    <AuthLayout>
      <MosqueProfileContent />
    </AuthLayout>
  );
}
