'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Heart,
  DollarSign,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Eye,
  Edit,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useTranslation';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'mosque_admin' | 'ajk' | 'member';
  permissions: string[];
}

interface KhairatApplication {
  id: string;
  deceased: string;
  applicant: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed';
  dateSubmitted: string;
  relationship: string;
  deathDate: string;
}

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

interface KhairatDashboardProps {
  user: User;
  onAddApplication?: () => void;
  onEditApplication?: (application: any) => void;
}

const mockApplications: KhairatApplication[] = [
  {
    id: 'APP001',
    deceased: 'Allahyarham Ahmad bin Hassan',
    applicant: 'Fatimah binti Ahmad',
    amount: 'RM 5,000',
    status: 'pending',
    dateSubmitted: '2024-01-10',
    relationship: 'Isteri',
    deathDate: '2024-01-08',
  },
  {
    id: 'APP002',
    deceased: 'Allahyarhamah Siti Khadijah',
    applicant: 'Muhammad Rizqi bin Omar',
    amount: 'RM 5,000',
    status: 'approved',
    dateSubmitted: '2024-01-05',
    relationship: 'Anak',
    deathDate: '2024-01-03',
  },
  {
    id: 'APP003',
    deceased: 'Allahyarham Ibrahim bin Yusuf',
    applicant: 'Aminah binti Ibrahim',
    amount: 'RM 5,000',
    status: 'disbursed',
    dateSubmitted: '2023-12-20',
    relationship: 'Anak',
    deathDate: '2023-12-18',
  },
];

export default function KhairatDashboard({
  user,
  onAddApplication,
  onEditApplication,
}: KhairatDashboardProps) {
  const t = useTranslation();
  const formatCurrency = useCurrency();
  const [applications, setApplications] =
    useState<KhairatApplication[]>(mockApplications);

  const handleAddApplication = (
    applicationData: KhairatApplicationFormData
  ) => {
    const newApplication: KhairatApplication = {
      id: `APP${(applications.length + 1).toString().padStart(3, '0')}`,
      deceased: applicationData.deceased,
      applicant: applicationData.applicant,
      amount: 'RM 5,000', // Default benefit amount
      status: 'pending',
      dateSubmitted: new Date().toISOString().split('T')[0],
      relationship: applicationData.relationship,
      deathDate: applicationData.deathDate,
    };

    setApplications([newApplication, ...applications]);
  };

  // Mock statistics
  const stats = {
    totalMembers: 623,
    activeMembers: 598,
    totalFunds: 156780,
    monthlyCollection: 12450,
    pendingApplications: applications.filter((app) => app.status === 'pending')
      .length,
    approvedThisMonth: applications.filter((app) => app.status === 'approved')
      .length,
    totalDisbursed: 45600,
    deathRecords: 18,
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      disbursed: 'bg-blue-100 text-blue-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />;
      case 'disbursed':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('khairat.title')}</h1>
          <p className="text-gray-600">{t('khairat.subtitle')}</p>
        </div>
        <Button
          onClick={() => onAddApplication?.()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('khairat.newApplication')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t('khairat.totalMembers')}
                </p>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
                <p className="text-xs text-green-600">
                  {stats.activeMembers} {t('khairat.active')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t('khairat.totalFunds')}
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalFunds)}
                </p>
                <p className="text-xs text-green-600">
                  +{formatCurrency(stats.monthlyCollection)}{' '}
                  {t('khairat.thisMonth')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t('khairat.pendingApplications')}
                </p>
                <p className="text-2xl font-bold">
                  {stats.pendingApplications}
                </p>
                <p className="text-xs text-blue-600">
                  {stats.approvedThisMonth} {t('khairat.approvedThisMonth')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t('khairat.totalDisbursed')}
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalDisbursed)}
                </p>
                <p className="text-xs text-gray-600">
                  {stats.deathRecords} {t('khairat.deathRecords')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fund Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('khairat.fundPerformance')}
            </CardTitle>
            <CardDescription>
              {t('khairat.monthlyCollectionVsDisbursement')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{t('khairat.monthlyCollection')}</span>
                  <span>{formatCurrency(stats.monthlyCollection)}</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>
                    {t('khairat.target')}: {formatCurrency(15000)}
                  </span>
                  <span>75%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('khairat.membershipStatus')}
            </CardTitle>
            <CardDescription>
              {t('khairat.activeVsInactiveMembers')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{t('khairat.activeMembers')}</span>
                  <span>
                    {stats.activeMembers} / {stats.totalMembers}
                  </span>
                </div>
                <Progress
                  value={(stats.activeMembers / stats.totalMembers) * 100}
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>{t('khairat.participationRate')}</span>
                  <span>
                    {Math.round(
                      (stats.activeMembers / stats.totalMembers) * 100
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <CardTitle>{t('khairat.recentApplications')}</CardTitle>
          <CardDescription>
            {t('khairat.latestBenefitApplications')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('khairat.applicationId')}</TableHead>
                <TableHead>{t('khairat.deceased')}</TableHead>
                <TableHead>{t('khairat.applicant')}</TableHead>
                <TableHead>{t('khairat.relationship')}</TableHead>
                <TableHead>{t('common.amount')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('khairat.dateSubmitted')}</TableHead>
                <TableHead>{t('common.action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">
                    {application.id}
                  </TableCell>
                  <TableCell>{application.deceased}</TableCell>
                  <TableCell>{application.applicant}</TableCell>
                  <TableCell>{application.relationship}</TableCell>
                  <TableCell className="font-semibold">
                    {application.amount}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(application.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(application.status)}
                        {t(`khairat.statuses.${application.status}`)}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(application.dateSubmitted).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {user.role !== 'member' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditApplication?.(application)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">{t('khairat.manageMembers')}</h3>
            <p className="text-sm text-gray-600">
              {t('khairat.manageMembersDesc')}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">
              {t('khairat.processApplications')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('khairat.processApplicationsDesc')}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Heart className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">{t('khairat.deathRecords')}</h3>
            <p className="text-sm text-gray-600">
              {t('khairat.deathRecordsDesc')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { KhairatDashboard };
