'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Building } from 'lucide-react';

export interface MosqueProfileData {
  id?: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  capacity?: number;
  facilities?: string[];
}

interface MosqueProfileFormProps {
  initialData?: MosqueProfileData;
  onSubmit: (data: MosqueProfileData) => Promise<void>;
  isSubmitting?: boolean;
}

export default function MosqueProfileForm({
  initialData,
  onSubmit,
  isSubmitting = false,
}: MosqueProfileFormProps) {
  const [formData, setFormData] = useState<MosqueProfileData>({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    capacity: 0,
    facilities: [],
  });

  const [facilitiesInput, setFacilitiesInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setFacilitiesInput(initialData.facilities?.join(', ') || '');
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Mosque name is required';
    }

    if (!formData.address?.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const facilitiesArray = facilitiesInput
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const dataToSubmit = {
      ...formData,
      facilities: facilitiesArray,
    };

    await onSubmit(dataToSubmit);
  };

  const handleInputChange = (
    field: keyof MosqueProfileData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Mosque Profile
        </CardTitle>
        <CardDescription>
          Manage your mosque information and details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Mosque Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter mosque name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity || ''}
                  onChange={(e) =>
                    handleInputChange('capacity', parseInt(e.target.value) || 0)
                  }
                  placeholder="Enter mosque capacity"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                placeholder="Brief description of the mosque"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Complete mosque address"
                rows={2}
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && (
                <p className="text-sm text-red-500 mt-1">{errors.address}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+60X-XXX-XXXX"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="mosque@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://www.mosquename.com"
              />
            </div>
          </div>

          {/* Facilities */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Facilities & Services</h3>

            <div>
              <Label htmlFor="facilities">
                Facilities (separate with commas)
              </Label>
              <Textarea
                id="facilities"
                value={facilitiesInput}
                onChange={(e) => setFacilitiesInput(e.target.value)}
                placeholder="Prayer hall, Ablution area, Parking, Library, etc."
                rows={2}
              />
              <p className="text-sm text-gray-500 mt-1">
                Example: Prayer hall, Ablution area, Parking, Library, Meeting
                room
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting
                ? 'Saving...'
                : initialData?.id
                ? 'Update Profile'
                : 'Save Profile'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
