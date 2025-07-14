// Types for the legacy components (to be migrated)
export interface Beneficiary {
  id: string;
  name: string;
  icNumber: string;
  relationship: string;
  phone: string;
  address: string;
  percentage: number;
  isPrimary: boolean;
}

export interface ZakatRecord {
  id: string;
  date: string;
  type: string;
  amount: number;
  zakatDue: number;
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'mosque_admin' | 'ajk' | 'member';
  permissions: string[];
  mosqueId?: string;
  mosqueName?: string;
  // Additional member details
  icNumber?: string;
  phone?: string;
  address?: string;
  membershipId?: string;
  joinDate?: string;
  membershipType?: 'kariah' | 'zakat' | 'all';
  beneficiaries?: Beneficiary[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  // Zakat-related data
  zakatRecords?: ZakatRecord[];
  zakatEligible?: boolean;
  lastZakatCalculation?: {
    date: string;
    type: string;
    amount: number;
    zakatDue: number;
  };
}
