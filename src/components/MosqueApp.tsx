'use client';

import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { LoginPage } from './auth/LoginPage';
import { Dashboard } from './dashboard/Dashboard';
import { MemberList } from './members/MemberList';
import { FinanceOverview } from './finance/FinanceOverview';
import { KhairatDashboard } from './khairat/KhairatDashboard';
import { ZakatDashboard } from './zakat/ZakatDashboard';
import { ReportsOverview } from './reports/ReportsOverview';
import { Layout } from './layout/Layout';

// Types
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
  year: number;
  zakatType: 'harta' | 'fitrah' | 'perniagaan' | 'emas' | 'perak';
  amount: number;
  paymentDate: string;
  status: 'paid' | 'pending' | 'calculated';
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
  membershipType?: 'kariah' | 'khairat' | 'zakat' | 'all';
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

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    // Mock authentication - in real app, this would be an API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock user data based on email
    let mockUser: User;

    if (email === 'superadmin@masjid.gov.my') {
      mockUser = {
        id: '1',
        name: 'Ahmad Superadmin',
        email: email,
        role: 'super_admin',
        permissions: ['all'],
      };
    } else if (email === 'admin@masjidalnur.my') {
      mockUser = {
        id: '2',
        name: 'Ustaz Abdullah',
        email: email,
        role: 'mosque_admin',
        mosqueId: 'masjid_1',
        mosqueName: 'Masjid Al-Nur',
        permissions: [
          'manage_members',
          'manage_finance',
          'manage_programs',
          'manage_khairat',
          'manage_zakat',
          'view_reports',
        ],
      };
    } else if (email === 'imam@masjidalnur.my') {
      mockUser = {
        id: '3',
        name: 'Ustaz Hassan',
        email: email,
        role: 'ajk',
        mosqueId: 'masjid_1',
        mosqueName: 'Masjid Al-Nur',
        permissions: [
          'view_members',
          'manage_programs',
          'view_zakat',
          'view_finance',
        ],
      };
    } else {
      mockUser = {
        id: '4',
        name: 'Ali Ahmad',
        email: email,
        role: 'member',
        mosqueId: 'masjid_1',
        mosqueName: 'Masjid Al-Nur',
        permissions: ['view_profile', 'make_payments', 'calculate_zakat'],
        icNumber: '850123-14-5678',
        phone: '019-234-5678',
        address: 'No. 123, Jalan Mawar, Taman Seri, 50000 Kuala Lumpur',
        membershipId: 'AL001234',
        joinDate: '2023-01-15',
        membershipType: 'all',
        zakatEligible: true,
        beneficiaries: [
          {
            id: 'B001',
            name: 'Fatimah binti Ahmad',
            icNumber: '870456-03-1234',
            relationship: 'Isteri',
            phone: '012-345-6789',
            address: 'No. 123, Jalan Mawar, Taman Seri, 50000 Kuala Lumpur',
            percentage: 60,
            isPrimary: true,
          },
        ],
        emergencyContact: {
          name: 'Fatimah binti Ahmad',
          phone: '012-345-6789',
          relationship: 'Isteri',
        },
        zakatRecords: [
          {
            id: 'ZR001',
            year: 2024,
            zakatType: 'harta',
            amount: 1250,
            paymentDate: '2024-04-15',
            status: 'paid',
          },
        ],
      };
    }

    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={login} isLoading={isLoading} />;
  }

  return (
    <Layout user={user} onLogout={logout}>
      <Routes>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/members" element={<MemberList user={user} />} />
        <Route path="/finance" element={<FinanceOverview user={user} />} />
        <Route path="/khairat" element={<KhairatDashboard user={user} />} />
        <Route path="/zakat" element={<ZakatDashboard user={user} />} />
        <Route path="/reports" element={<ReportsOverview user={user} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export function MosqueApp() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
