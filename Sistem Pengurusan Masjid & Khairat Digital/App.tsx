import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './components/auth/LoginPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { MemberList } from './components/members/MemberList';
import { MemberForm } from './components/members/MemberForm';
import { ProgramList } from './components/programs/ProgramList';
import { ProgramForm } from './components/programs/ProgramForm';
import { FinanceOverview } from './components/finance/FinanceOverview';
import { BookingList } from './components/bookings/BookingList';
import { CommitteeList } from './components/committee/CommitteeList';
import { KhairatDashboard } from './components/khairat/KhairatDashboard';
import { KhairatMembers } from './components/khairat/KhairatMembers';
import { DeathRecords } from './components/khairat/DeathRecords';
import { BenefitApplications } from './components/khairat/BenefitApplications';
import { ZakatDashboard } from './components/zakat/ZakatDashboard';
import { ZakatCalculator } from './components/zakat/ZakatCalculator';
import { ZakatApplications } from './components/zakat/ZakatApplications';
import { ReportsOverview } from './components/reports/ReportsOverview';
import { MemberPortal } from './components/portal/MemberPortal';
import { AdminPanel } from './components/admin/AdminPanel';
import { CommunicationCenter } from './components/communication/CommunicationCenter';
import { Toaster } from './components/ui/sonner';

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
  mosqueId?: string;
  mosqueName?: string;
  permissions?: string[];
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

export default function App() {
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user data based on email
    let mockUser: User;
    
    if (email === 'superadmin@masjid.gov.my') {
      mockUser = {
        id: '1',
        name: 'Ahmad Superadmin',
        email: email,
        role: 'super_admin',
        permissions: ['all']
      };
    } else if (email === 'admin@masjidalnur.my') {
      mockUser = {
        id: '2',
        name: 'Ustaz Abdullah',
        email: email,
        role: 'mosque_admin',
        mosqueId: 'masjid_1',
        mosqueName: 'Masjid Al-Nur',
        permissions: ['manage_members', 'manage_finance', 'manage_programs', 'manage_khairat', 'manage_zakat']
      };
    } else if (email === 'imam@masjidalnur.my') {
      mockUser = {
        id: '3',
        name: 'Ustaz Hassan',
        email: email,
        role: 'ajk',
        mosqueId: 'masjid_1',
        mosqueName: 'Masjid Al-Nur',
        permissions: ['view_members', 'manage_programs', 'view_zakat']
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
            isPrimary: true
          },
          {
            id: 'B002',
            name: 'Ahmad Faris bin Ali',
            icNumber: '051234-56-7890',
            relationship: 'Anak',
            phone: '013-456-7890',
            address: 'No. 123, Jalan Mawar, Taman Seri, 50000 Kuala Lumpur',
            percentage: 25,
            isPrimary: false
          },
          {
            id: 'B003',
            name: 'Aisha binti Ali',
            icNumber: '081234-56-7891',
            relationship: 'Anak',
            phone: '014-567-8901',
            address: 'No. 123, Jalan Mawar, Taman Seri, 50000 Kuala Lumpur',
            percentage: 15,
            isPrimary: false
          }
        ],
        emergencyContact: {
          name: 'Fatimah binti Ahmad',
          phone: '012-345-6789',
          relationship: 'Isteri'
        },
        zakatRecords: [
          {
            id: 'ZR001',
            year: 2024,
            zakatType: 'harta',
            amount: 1250,
            paymentDate: '2024-04-15',
            status: 'paid'
          },
          {
            id: 'ZR002',
            year: 2024,
            zakatType: 'fitrah',
            amount: 28,
            paymentDate: '2024-04-08',
            status: 'paid'
          },
          {
            id: 'ZR003',
            year: 2025,
            zakatType: 'fitrah',
            amount: 35,
            paymentDate: '2025-03-28',
            status: 'paid'
          }
        ],
        lastZakatCalculation: {
          date: '2025-06-01',
          type: 'Zakat Harta',
          amount: 65000,
          zakatDue: 1625
        }
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

  const authContext: AuthContextType = {
    user,
    login,
    logout,
    isLoading
  };

  if (isLoading) {
    return (
      <div className="size-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="size-full">
        {!user ? (
          <LoginPage onLogin={login} isLoading={isLoading} />
        ) : (
          <Layout user={user} onLogout={logout}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard user={user} />} />
              
              {/* Member Management */}
              <Route path="/ahli" element={<MemberList user={user} />} />
              <Route path="/ahli/baru" element={<MemberForm user={user} />} />
              <Route path="/ahli/:id" element={<MemberForm user={user} />} />
              <Route path="/ahli/:id/edit" element={<MemberForm user={user} />} />
              
              {/* Programs */}
              <Route path="/program" element={<ProgramList user={user} />} />
              <Route path="/program/baru" element={<ProgramForm user={user} />} />
              <Route path="/program/:id" element={<ProgramForm user={user} />} />
              <Route path="/program/:id/edit" element={<ProgramForm user={user} />} />
              
              {/* Finance */}
              <Route path="/kewangan" element={<FinanceOverview user={user} />} />
              
              {/* Bookings */}
              <Route path="/tempahan" element={<BookingList user={user} />} />
              
              {/* Committee */}
              <Route path="/ajk" element={<CommitteeList user={user} />} />
              
              {/* Communication */}
              <Route path="/komunikasi" element={<CommunicationCenter user={user} />} />
              
              {/* Khairat */}
              <Route path="/khairat" element={<KhairatDashboard user={user} />} />
              <Route path="/khairat/ahli" element={<KhairatMembers user={user} />} />
              <Route path="/khairat/kematian" element={<DeathRecords user={user} />} />
              <Route path="/khairat/permohonan" element={<BenefitApplications user={user} />} />
              
              {/* Zakat */}
              <Route path="/zakat" element={<ZakatDashboard user={user} />} />
              <Route path="/zakat/kalkulator" element={<ZakatCalculator user={user} />} />
              <Route path="/zakat/permohonan" element={<ZakatApplications user={user} />} />
              
              {/* Reports */}
              <Route path="/laporan" element={<ReportsOverview user={user} />} />
              
              {/* Member Portal */}
              <Route path="/portal" element={<MemberPortal user={user} />} />
              
              {/* Admin Panel (Super Admin only) */}
              {user.role === 'super_admin' && (
                <Route path="/admin" element={<AdminPanel user={user} />} />
              )}
              
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Layout>
        )}
        <Toaster />
      </div>
    </Router>
  );
}