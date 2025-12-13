'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations } from 'next-intl';

// Malaysian states
const MALAYSIAN_STATES = [
  { value: 'johor', label: 'Johor' },
  { value: 'kedah', label: 'Kedah' },
  { value: 'kelantan', label: 'Kelantan' },
  { value: 'kl', label: 'Kuala Lumpur' },
  { value: 'labuan', label: 'Labuan' },
  { value: 'malacca', label: 'Malacca' },
  { value: 'negeri-sembilan', label: 'Negeri Sembilan' },
  { value: 'pahang', label: 'Pahang' },
  { value: 'penang', label: 'Penang' },
  { value: 'perak', label: 'Perak' },
  { value: 'perlis', label: 'Perlis' },
  { value: 'putrajaya', label: 'Putrajaya' },
  { value: 'sabah', label: 'Sabah' },
  { value: 'sarawak', label: 'Sarawak' },
  { value: 'selangor', label: 'Selangor' },
  { value: 'terengganu', label: 'Terengganu' },
];

export interface AddressData {
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  full_address?: string; // For backward compatibility
}

interface AddressFormProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  disabled?: boolean;
  showFullAddress?: boolean;
  className?: string;
}

export function AddressForm({
  value,
  onChange,
  disabled = false,
  showFullAddress = true,
  className = '',
}: AddressFormProps) {
  const t = useTranslations('addressForm');
  const [address, setAddress] = useState<AddressData>({
    address_line1: value.address_line1 || '',
    address_line2: value.address_line2 || '',
    city: value.city || '',
    state: value.state || '',
    postcode: value.postcode || '',
    country: value.country || 'Malaysia',
    full_address: value.full_address || '',
  });

  // Update local state when value prop changes
  useEffect(() => {
    setAddress({
      address_line1: value.address_line1 || '',
      address_line2: value.address_line2 || '',
      city: value.city || '',
      state: value.state || '',
      postcode: value.postcode || '',
      country: value.country || 'Malaysia',
      full_address: value.full_address || '',
    });
  }, [value]);

  const handleFieldChange = (field: keyof AddressData, newValue: string) => {
    const updatedAddress = {
      ...address,
      [field]: newValue,
    };

    // Generate full address for backward compatibility
    const fullAddressParts = [
      updatedAddress.address_line1,
      updatedAddress.address_line2,
      updatedAddress.city,
      updatedAddress.state,
      updatedAddress.postcode,
      updatedAddress.country,
    ].filter(Boolean);

    updatedAddress.full_address = fullAddressParts.join(', ');

    setAddress(updatedAddress);
    onChange(updatedAddress);
  };

  return (
    <div className={`space-y-4 ${className}`}>
        <div className="space-y-2">
          <Label htmlFor="address_line1">{t('addressLine1')}</Label>
          <Input
            id="address_line1"
            value={address.address_line1}
            onChange={(e) => handleFieldChange('address_line1', e.target.value)}
            disabled={disabled}
            placeholder={t('addressLine1Placeholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address_line2">{t('addressLine2')}</Label>
          <Input
            id="address_line2"
            value={address.address_line2}
            onChange={(e) => handleFieldChange('address_line2', e.target.value)}
            disabled={disabled}
            placeholder={t('addressLine2Placeholder')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">{t('city')}</Label>
            <Input
              id="city"
              value={address.city}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              disabled={disabled}
              placeholder={t('cityPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postcode">{t('postcode')}</Label>
            <Input
              id="postcode"
              value={address.postcode}
              onChange={(e) => handleFieldChange('postcode', e.target.value)}
              disabled={disabled}
              placeholder={t('postcodePlaceholder')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="state">{t('state')}</Label>
            <Select
              value={address.state}
              onValueChange={(value) => handleFieldChange('state', value)}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('selectState')} />
              </SelectTrigger>
              <SelectContent>
                {MALAYSIAN_STATES.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">{t('country')}</Label>
            <Input
              id="country"
              value={address.country}
              onChange={(e) => handleFieldChange('country', e.target.value)}
              disabled={disabled}
              placeholder={t('countryPlaceholder')}
            />
          </div>
        </div>

        {showFullAddress && (
          <div className="space-y-2">
            <Label htmlFor="full_address">{t('fullAddress')}</Label>
            <Textarea
              id="full_address"
              value={address.full_address}
              disabled
              rows={2}
              className="bg-slate-50 dark:bg-slate-800"
            />
          </div>
        )}
    </div>
  );
}

// Helper function to parse existing address string into structured data
export function parseAddressString(addressString: string): AddressData {
  if (!addressString) {
    return {
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postcode: '',
      country: 'Malaysia',
      full_address: '',
    };
  }

  // Try to parse the address string
  const parts = addressString.split(',').map(part => part.trim());
  
  // Basic parsing logic - can be improved
  const address: AddressData = {
    address_line1: parts[0] || '',
    address_line2: parts[1] || '',
    city: parts[2] || '',
    state: parts[3] || '',
    postcode: parts[4] || '',
    country: parts[5] || 'Malaysia',
    full_address: addressString,
  };

  return address;
}

// Helper function to format address for display
export function formatAddressForDisplay(address: AddressData): string {
  const parts = [
    address.address_line1,
    address.address_line2,
    address.city,
    address.state,
    address.postcode,
    address.country,
  ].filter(Boolean);

  return parts.join(', ');
}
