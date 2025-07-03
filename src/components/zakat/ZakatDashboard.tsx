'use client';

import { useState, lazy, Suspense, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Calculator,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Heart,
  HandCoins,
  PieChart,
  FileText,
  Download,
  Plus,
  Calendar,
  Target,
  CheckCircle,
  Clock,
  Eye,
  Edit,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useTranslation';

// Lazy load the heavy ZakatCalculator component
const ZakatCalculator = lazy(() =>
  import('./ZakatCalculator').then((module) => ({
    default: module.ZakatCalculator,
  }))
);

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'mosque_admin' | 'ajk' | 'member';
  permissions: string[];
}

interface ZakatRecord {
  id: string;
  payerName: string;
  payerIc: string;
  amount: number;
  zakatType: 'harta' | 'fitrah' | 'perniagaan' | 'emas' | 'perak';
  paymentDate: string;
  status: 'completed' | 'pending' | 'verified';
  receiptNumber: string;
}

interface ZakatDistribution {
  id: string;
  beneficiaryName: string;
  beneficiaryIc: string;
  asnafCategory:
    | 'fakir'
    | 'miskin'
    | 'amil'
    | 'muallaf'
    | 'riqab'
    | 'gharimin'
    | 'fisabilillah'
    | 'ibnu_sabil';
  amount: number;
  distributionDate: string;
  purpose: string;
}

interface ZakatDashboardProps {
  user: User;
  onAddRecord?: () => void;
  onEditRecord?: (record: ZakatRecord) => void;
}

const mockZakatRecords: ZakatRecord[] = [
  {
    id: 'ZKT001',
    payerName: 'Ahmad Abdullah',
    payerIc: '800101-01-1234',
    amount: 2500,
    zakatType: 'harta',
    paymentDate: '2024-01-15',
    status: 'completed',
    receiptNumber: 'RCP240115001',
  },
  {
    id: 'ZKT002',
    payerName: 'Fatimah Hassan',
    payerIc: '850202-02-5678',
    amount: 120,
    zakatType: 'fitrah',
    paymentDate: '2024-01-10',
    status: 'verified',
    receiptNumber: 'RCP240110002',
  },
  {
    id: 'ZKT003',
    payerName: 'Muhammad Hafiz',
    payerIc: '900303-03-9012',
    amount: 1800,
    zakatType: 'perniagaan',
    paymentDate: '2024-01-12',
    status: 'pending',
    receiptNumber: 'RCP240112003',
  },
];

const mockDistributions: ZakatDistribution[] = [
  {
    id: 'DIST001',
    beneficiaryName: 'Maryam binti Omar',
    beneficiaryIc: '750404-04-3456',
    asnafCategory: 'fakir',
    amount: 500,
    distributionDate: '2024-01-20',
    purpose: 'Bantuan sara hidup',
  },
  {
    id: 'DIST002',
    beneficiaryName: 'Yusuf bin Ahmad',
    beneficiaryIc: '880505-05-7890',
    asnafCategory: 'miskin',
    amount: 300,
    distributionDate: '2024-01-18',
    purpose: 'Bantuan perubatan',
  },
];

export default function ZakatDashboard({
  user,
  onAddRecord,
  onEditRecord,
}: ZakatDashboardProps) {
  const t = useTranslation();
  const formatCurrency = useCurrency();
  const [zakatRecords, setZakatRecords] =
    useState<ZakatRecord[]>(mockZakatRecords);
  const [distributions] = useState<ZakatDistribution[]>(mockDistributions);

  // Memoize heavy calculations
  const stats = useMemo(() => {
    const totalCollected = zakatRecords.reduce(
      (sum, record) => sum + record.amount,
      0
    );
    const totalDistributed = distributions.reduce(
      (sum, dist) => sum + dist.amount,
      0
    );

    return {
      totalCollected,
      totalDistributed,
      pendingRecords: zakatRecords.filter((r) => r.status === 'pending').length,
      verifiedRecords: zakatRecords.filter((r) => r.status === 'verified')
        .length,
      completedRecords: zakatRecords.filter((r) => r.status === 'completed')
        .length,
      activeBeneficiaries: distributions.length,
      monthlyTarget: 50000,
    };
  }, [zakatRecords, distributions]);

  // Memoize computed values
  const availableFunds = useMemo(() => {
    return stats.totalCollected - stats.totalDistributed;
  }, [stats.totalCollected, stats.totalDistributed]);

  // Memoize progress calculation
  const progressPercentage = useMemo(() => {
    return Math.round((stats.totalCollected / stats.monthlyTarget) * 100);
  }, [stats.totalCollected, stats.monthlyTarget]);

  // Memoize utility functions
  const getStatusColor = useCallback((status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-blue-100 text-blue-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'verified':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  }, []);

  const getZakatTypeColor = useCallback((type: string) => {
    const colors = {
      harta: 'bg-purple-100 text-purple-800',
      fitrah: 'bg-green-100 text-green-800',
      perniagaan: 'bg-blue-100 text-blue-800',
      emas: 'bg-yellow-100 text-yellow-800',
      perak: 'bg-gray-100 text-gray-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }, []);

  const getAsnafColor = useCallback((category: string) => {
    const colors = {
      fakir: 'bg-red-100 text-red-800',
      miskin: 'bg-orange-100 text-orange-800',
      amil: 'bg-blue-100 text-blue-800',
      muallaf: 'bg-green-100 text-green-800',
      riqab: 'bg-purple-100 text-purple-800',
      gharimin: 'bg-yellow-100 text-yellow-800',
      fisabilillah: 'bg-indigo-100 text-indigo-800',
      ibnu_sabil: 'bg-pink-100 text-pink-800',
    };
    return (
      colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    );
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('zakat.title')}</h1>
          <p className="text-gray-600">{t('zakat.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Suspense
            fallback={
              <Button variant="outline" disabled>
                Loading Calculator...
              </Button>
            }
          >
            <ZakatCalculator />
          </Suspense>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => onAddRecord?.()}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('zakat.newRecord')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t('zakat.totalCollected')}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalCollected)}
                </p>
                <p className="text-xs text-gray-600">
                  {zakatRecords.length} {t('zakat.records')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HandCoins className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t('zakat.totalDistributed')}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.totalDistributed)}
                </p>
                <p className="text-xs text-gray-600">
                  {distributions.length} {t('zakat.distributions')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t('zakat.availableFunds')}
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(availableFunds)}
                </p>
                <p className="text-xs text-gray-600">
                  {t('zakat.readyForDistribution')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t('zakat.activeBeneficiaries')}
                </p>
                <p className="text-2xl font-bold">
                  {stats.activeBeneficiaries}
                </p>
                <p className="text-xs text-green-600">
                  {t('zakat.asnafCategoriesLabel')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t('zakat.monthlyCollectionProgress')}
            </CardTitle>
            <CardDescription>
              {t('zakat.progressTowardsTarget')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>
                    {t('zakat.collected')}:{' '}
                    {formatCurrency(stats.totalCollected)}
                  </span>
                  <span>
                    {t('zakat.target')}: {formatCurrency(stats.monthlyTarget)}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
              </div>
              <div className="text-center text-sm text-gray-600">
                {progressPercentage}% {t('zakat.ofMonthlyTargetAchieved')}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              {t('zakat.recordStatusOverview')}
            </CardTitle>
            <CardDescription>{t('zakat.statusBreakdown')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {t('zakat.statuses.completed')}
                </span>
                <span className="font-semibold">{stats.completedRecords}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  {t('zakat.statuses.verified')}
                </span>
                <span className="font-semibold">{stats.verifiedRecords}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  {t('zakat.statuses.pending')}
                </span>
                <span className="font-semibold">{stats.pendingRecords}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zakat Records and Distributions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('zakat.managementTitle')}</CardTitle>
          <CardDescription>{t('zakat.managementDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="collection" className="w-full">
            <TabsList>
              <TabsTrigger value="collection">
                {t('zakat.collectionRecordsTitle')}
              </TabsTrigger>
              <TabsTrigger value="distribution">
                {t('zakat.distributionRecordsTitle')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="collection" className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {t('zakat.collectionRecordsTitle')}
                </h3>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('zakat.receiptNumber')}</TableHead>
                    <TableHead>{t('zakat.payerName')}</TableHead>
                    <TableHead>{t('zakat.icNumber')}</TableHead>
                    <TableHead>{t('zakat.zakatType')}</TableHead>
                    <TableHead>{t('zakat.amount')}</TableHead>
                    <TableHead>{t('zakat.paymentDate')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('zakat.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zakatRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.receiptNumber}
                      </TableCell>
                      <TableCell>{record.payerName}</TableCell>
                      <TableCell>{record.payerIc}</TableCell>
                      <TableCell>
                        <Badge className={getZakatTypeColor(record.zakatType)}>
                          {t(`zakat.zakatTypes.${record.zakatType}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        RM {record.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(record.paymentDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(record.status)}
                            {t(`zakat.statuses.${record.status}`)}
                          </span>
                        </Badge>
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
                              onClick={() => onEditRecord?.(record)}
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
            </TabsContent>

            <TabsContent value="distribution" className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {t('zakat.distributionRecordsTitle')}
                </h3>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  {t('common.export')}
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('zakat.distributionId')}</TableHead>
                    <TableHead>{t('zakat.beneficiaryName')}</TableHead>
                    <TableHead>{t('zakat.icNumber')}</TableHead>
                    <TableHead>{t('zakat.asnafCategory')}</TableHead>
                    <TableHead>{t('zakat.amount')}</TableHead>
                    <TableHead>{t('zakat.distributionDate')}</TableHead>
                    <TableHead>{t('zakat.purpose')}</TableHead>
                    <TableHead>{t('zakat.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributions.map((distribution) => (
                    <TableRow key={distribution.id}>
                      <TableCell className="font-medium">
                        {distribution.id}
                      </TableCell>
                      <TableCell>{distribution.beneficiaryName}</TableCell>
                      <TableCell>{distribution.beneficiaryIc}</TableCell>
                      <TableCell>
                        <Badge
                          className={getAsnafColor(distribution.asnafCategory)}
                        >
                          {t(
                            `zakat.asnafCategories.${distribution.asnafCategory}`
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        RM {distribution.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(
                          distribution.distributionDate
                        ).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{distribution.purpose}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user.role !== 'member' && (
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Calculator className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">{t('zakat.calculatorTitle')}</h3>
            <p className="text-sm text-gray-600">
              {t('zakat.calculateAmounts')}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <HandCoins className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">{t('zakat.distributeZakat')}</h3>
            <p className="text-sm text-gray-600">{t('zakat.allocateFunds')}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">{t('zakat.generateReports')}</h3>
            <p className="text-sm text-gray-600">
              {t('zakat.createDetailedReports')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { ZakatDashboard };
