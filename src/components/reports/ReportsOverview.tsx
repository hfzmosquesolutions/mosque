'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  Calendar,
  DollarSign,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  FileText,
  Filter,
  Eye,
  Printer,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useTranslation';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'mosque_admin' | 'ajk' | 'member';
  permissions: string[];
  mosqueName?: string;
}

interface ReportData {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  memberGrowth: number;
  programCount: number;
  attendanceRate: number;
}

interface TopContributor {
  name: string;
  amount: number;
  type: 'individual' | 'corporate';
}

interface ReportsOverviewProps {
  user: User;
}

export function ReportsOverview({ user }: ReportsOverviewProps) {
  const t = useTranslation();
  const formatCurrency = useCurrency();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState('2025-06');
  const [selectedYear, setSelectedYear] = useState('2025');

  // Mock data
  const reportData: ReportData[] = [
    {
      period: '2025-06',
      totalIncome: 125000,
      totalExpenses: 78000,
      netIncome: 47000,
      memberGrowth: 12,
      programCount: 8,
      attendanceRate: 85,
    },
    {
      period: '2025-05',
      totalIncome: 118000,
      totalExpenses: 82000,
      netIncome: 36000,
      memberGrowth: 8,
      programCount: 6,
      attendanceRate: 78,
    },
    {
      period: '2025-04',
      totalIncome: 132000,
      totalExpenses: 75000,
      netIncome: 57000,
      memberGrowth: 15,
      programCount: 10,
      attendanceRate: 92,
    },
  ];

  const topContributors: TopContributor[] = [
    { name: 'Ahmad Trading Sdn Bhd', amount: 25000, type: 'corporate' },
    { name: 'Datuk Seri Ibrahim', amount: 15000, type: 'individual' },
    { name: 'Yayasan Kebajikan Islam', amount: 12000, type: 'corporate' },
    { name: 'Hajjah Fatimah', amount: 8000, type: 'individual' },
    { name: 'Ali & Associates', amount: 7500, type: 'corporate' },
  ];

  const getCurrentData = () => {
    return (
      reportData.find((data) => data.period === selectedMonth) || reportData[0]
    );
  };

  const generateReport = (type: string) => {
    console.log(`Generating ${type} report for ${selectedPeriod}`);
    // In a real app, this would trigger report generation
    alert(`Report ${type} akan dimuat turun sebentar lagi.`);
  };

  const currentData = getCurrentData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('reports.title')}
          </h1>
          <p className="text-gray-600">
            {t('reports.subtitle')} {user.mosqueName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">
                {t('reports.periods.daily')}
              </SelectItem>
              <SelectItem value="weekly">
                {t('reports.periods.weekly')}
              </SelectItem>
              <SelectItem value="monthly">
                {t('reports.periods.monthly')}
              </SelectItem>
              <SelectItem value="quarterly">
                {t('reports.periods.quarterly')}
              </SelectItem>
              <SelectItem value="yearly">
                {t('reports.periods.yearly')}
              </SelectItem>
            </SelectContent>
          </Select>
          {selectedPeriod === 'monthly' && (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025-06">
                  {t('reports.months.june2025')}
                </SelectItem>
                <SelectItem value="2025-05">
                  {t('reports.months.may2025')}
                </SelectItem>
                <SelectItem value="2025-04">
                  {t('reports.months.april2025')}
                </SelectItem>
                <SelectItem value="2025-03">
                  {t('reports.months.march2025')}
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('reports.totalIncome')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(currentData.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {t('reports.growthFromLastMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('reports.totalExpenses')}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(currentData.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 mr-1" />
              {t('reports.decreaseFromLastMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('reports.netIncome')}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(currentData.netIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {t('reports.increaseFromLastMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('reports.memberGrowth')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{currentData.memberGrowth}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('common.newMembersThisMonth')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList>
          <TabsTrigger value="financial">
            {t('reports.financialReport')}
          </TabsTrigger>
          <TabsTrigger value="members">
            {t('reports.membershipReport')}
          </TabsTrigger>
          <TabsTrigger value="programs">
            {t('reports.programReport')}
          </TabsTrigger>
          <TabsTrigger value="export">{t('reports.exportToPDF')}</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income vs Expenses Chart */}
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.incomeVsExpenses')}</CardTitle>
                <CardDescription>
                  {t('reports.comparisonBetweenPeriods')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.map((data) => (
                    <div key={data.period} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          {new Date(data.period).toLocaleDateString('ms-MY', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(data.netIncome)}
                        </span>
                      </div>
                      <div className="relative h-2 bg-gray-200 rounded">
                        <div
                          className="absolute top-0 left-0 h-full bg-green-500 rounded"
                          style={{
                            width: `${
                              (data.totalIncome /
                                Math.max(
                                  ...reportData.map((d) => d.totalIncome)
                                )) *
                              100
                            }%`,
                          }}
                        />
                        <div
                          className="absolute top-0 left-0 h-full bg-red-500 rounded opacity-60"
                          style={{
                            width: `${
                              (data.totalExpenses /
                                Math.max(
                                  ...reportData.map((d) => d.totalIncome)
                                )) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span>{t('reports.income')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded" />
                    <span>{t('reports.expenses')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Contributors */}
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.topContributors')}</CardTitle>
                <CardDescription>
                  {t('reports.topContributorsSection')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topContributors.map((contributor, index) => (
                    <div
                      key={contributor.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-300">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {contributor.name}
                          </p>
                          <Badge
                            variant={
                              contributor.type === 'corporate'
                                ? 'default'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {contributor.type === 'corporate'
                              ? t('reports.corporate')
                              : t('reports.individual')}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(contributor.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistik Keahlian</CardTitle>
              <CardDescription>
                Analisis pertumbuhan dan jenis keahlian
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">850</div>
                    <div className="text-sm text-gray-600">Jumlah Ahli</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      +{currentData.memberGrowth}
                    </div>
                    <div className="text-sm text-gray-600">Ahli Baru</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      95%
                    </div>
                    <div className="text-sm text-gray-600">Kadar Keaktifan</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistik Program</CardTitle>
              <CardDescription>
                Analisis kehadiran dan keberkesanan program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {currentData.programCount}
                    </div>
                    <div className="text-sm text-gray-600">
                      Program Bulan Ini
                    </div>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">
                      {currentData.attendanceRate}%
                    </div>
                    <div className="text-sm text-gray-600">Kadar Kehadiran</div>
                  </div>
                  <div className="text-center p-4 bg-teal-50 rounded-lg">
                    <div className="text-2xl font-bold text-teal-600">4.8</div>
                    <div className="text-sm text-gray-600">Rating Purata</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.exportToPDF')}</CardTitle>
              <CardDescription>
                {t('reports.downloadReportsInVariousFormats')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => generateReport('financial')}
                >
                  <FileText className="h-6 w-6" />
                  <span>{t('reports.financialReport')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => generateReport('members')}
                >
                  <Users className="h-6 w-6" />
                  <span>{t('reports.membershipReport')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => generateReport('programs')}
                >
                  <Calendar className="h-6 w-6" />
                  <span>{t('reports.programReport')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => generateReport('zakat')}
                >
                  <Download className="h-6 w-6" />
                  <span>{t('reports.zakatReport')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => generateReport('comprehensive')}
                >
                  <BarChart3 className="h-6 w-6" />
                  <span>{t('reports.comprehensiveReport')}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
