import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
  Printer
} from 'lucide-react';
import { User } from '../../App';
import { toast } from 'sonner@2.0.3';

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
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState('2025-06');
  const [selectedYear, setSelectedYear] = useState('2025');

  // Mock data
  const monthlyData: ReportData[] = [
    {
      period: 'Jun 2025',
      totalIncome: 18750,
      totalExpenses: 12300,
      netIncome: 6450,
      memberGrowth: 12,
      programCount: 8,
      attendanceRate: 78
    },
    {
      period: 'Mei 2025',
      totalIncome: 16200,
      totalExpenses: 11800,
      netIncome: 4400,
      memberGrowth: 8,
      programCount: 6,
      attendanceRate: 82
    },
    {
      period: 'Apr 2025',
      totalIncome: 19500,
      totalExpenses: 13200,
      netIncome: 6300,
      memberGrowth: 15,
      programCount: 10,
      attendanceRate: 75
    },
    {
      period: 'Mar 2025',
      totalIncome: 17800,
      totalExpenses: 12100,
      netIncome: 5700,
      memberGrowth: 11,
      programCount: 7,
      attendanceRate: 80
    },
    {
      period: 'Feb 2025',
      totalIncome: 15600,
      totalExpenses: 10900,
      netIncome: 4700,
      memberGrowth: 6,
      programCount: 5,
      attendanceRate: 85
    },
    {
      period: 'Jan 2025',
      totalIncome: 21200,
      totalExpenses: 14500,
      netIncome: 6700,
      memberGrowth: 18,
      programCount: 9,
      attendanceRate: 72
    }
  ];

  const topContributors: TopContributor[] = [
    { name: 'Syarikat ABC Sdn Bhd', amount: 5000, type: 'corporate' },
    { name: 'Datuk Ahmad bin Hassan', amount: 2500, type: 'individual' },
    { name: 'Yayasan Kebajikan XYZ', amount: 3500, type: 'corporate' },
    { name: 'En. Zainuddin bin Ali', amount: 1800, type: 'individual' },
    { name: 'Keluarga Fatimah', amount: 1200, type: 'individual' }
  ];

  const incomeCategories = [
    { category: 'Kutipan Jumaat', amount: 3400, percentage: 18.1 },
    { category: 'Derma Korporat', amount: 8500, percentage: 45.3 },
    { category: 'Yuran Khairat', amount: 3750, percentage: 20.0 },
    { category: 'Sewa Dewan', amount: 2100, percentage: 11.2 },
    { category: 'Lain-lain', amount: 1000, percentage: 5.3 }
  ];

  const expenseCategories = [
    { category: 'Utiliti', amount: 2800, percentage: 22.8 },
    { category: 'Penyelenggaraan', amount: 4200, percentage: 34.1 },
    { category: 'Program & Aktiviti', amount: 2500, percentage: 20.3 },
    { category: 'Elaun AJK', amount: 1800, percentage: 14.6 },
    { category: 'Lain-lain', amount: 1000, percentage: 8.1 }
  ];

  const currentPeriodData = monthlyData[0]; // Latest month

  const handleExportReport = (format: 'pdf' | 'excel') => {
    toast.success(`Laporan sedang dimuat turun dalam format ${format.toUpperCase()}`);
  };

  const handlePrintReport = () => {
    toast.success('Laporan sedang disediakan untuk dicetak');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Laporan & Analitik</h1>
          <p className="text-muted-foreground">
            Laporan kewangan dan statistik prestasi masjid
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrintReport}>
            <Printer className="h-4 w-4 mr-2" />
            Cetak
          </Button>
          <Button variant="outline" onClick={() => handleExportReport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={() => handleExportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2">
              <Label>Tempoh Laporan</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="quarterly">Suku Tahunan</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedPeriod === 'monthly' && (
              <div className="space-y-2">
                <Label>Bulan</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025-06">Jun 2025</SelectItem>
                    <SelectItem value="2025-05">Mei 2025</SelectItem>
                    <SelectItem value="2025-04">April 2025</SelectItem>
                    <SelectItem value="2025-03">Mac 2025</SelectItem>
                    <SelectItem value="2025-02">Feb 2025</SelectItem>
                    <SelectItem value="2025-01">Jan 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {(selectedPeriod === 'quarterly' || selectedPeriod === 'yearly') && (
              <div className="space-y-2">
                <Label>Tahun</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button>
              <Filter className="h-4 w-4 mr-2" />
              Jana Laporan
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Ringkasan</TabsTrigger>
          <TabsTrigger value="financial">Kewangan</TabsTrigger>
          <TabsTrigger value="membership">Keahlian</TabsTrigger>
          <TabsTrigger value="programs">Program</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Pendapatan Bersih</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-green-600">
                  RM {currentPeriodData.netIncome.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  +12.5% dari bulan lepas
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Pertumbuhan Ahli</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">+{currentPeriodData.memberGrowth}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  Ahli baru bulan ini
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Program Berlangsung</CardTitle>
                <Activity className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{currentPeriodData.programCount}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Program bulan ini
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Kadar Kehadiran</CardTitle>
                <BarChart3 className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{currentPeriodData.attendanceRate}%</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingDown className="h-3 w-3 text-orange-500" />
                  -4% dari bulan lepas
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Prestasi (6 Bulan Terakhir)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tempoh</TableHead>
                    <TableHead>Pendapatan</TableHead>
                    <TableHead>Perbelanjaan</TableHead>
                    <TableHead>Pendapatan Bersih</TableHead>
                    <TableHead>Ahli Baru</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Kehadiran</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((data, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{data.period}</TableCell>
                      <TableCell className="text-green-600">
                        RM {data.totalIncome.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-red-600">
                        RM {data.totalExpenses.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-blue-600">
                        RM {data.netIncome.toLocaleString()}
                      </TableCell>
                      <TableCell>+{data.memberGrowth}</TableCell>
                      <TableCell>{data.programCount}</TableCell>
                      <TableCell>{data.attendanceRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Pecahan Pendapatan</CardTitle>
                <CardDescription>
                  Sumber pendapatan mengikut kategori
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incomeCategories.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{category.category}</span>
                        <span className="text-sm text-muted-foreground">
                          RM {category.amount.toLocaleString()} ({category.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Pecahan Perbelanjaan</CardTitle>
                <CardDescription>
                  Perbelanjaan mengikut kategori
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenseCategories.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{category.category}</span>
                        <span className="text-sm text-muted-foreground">
                          RM {category.amount.toLocaleString()} ({category.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Contributors */}
          <Card>
            <CardHeader>
              <CardTitle>Penyumbang Utama</CardTitle>
              <CardDescription>
                Individu dan organisasi dengan sumbangan tertinggi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topContributors.map((contributor, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{contributor.name}</TableCell>
                      <TableCell>
                        <Badge variant={contributor.type === 'corporate' ? 'default' : 'secondary'}>
                          {contributor.type === 'corporate' ? 'Korporat' : 'Individu'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        RM {contributor.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="membership" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Statistik Keahlian</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Jumlah Ahli Aktif</span>
                  <span className="font-medium">847</span>
                </div>
                <div className="flex justify-between">
                  <span>Ahli Kariah</span>
                  <span className="font-medium">623</span>
                </div>
                <div className="flex justify-between">
                  <span>Ahli Khairat</span>
                  <span className="font-medium">589</span>
                </div>
                <div className="flex justify-between">
                  <span>Ahli Baru (Bulan Ini)</span>
                  <span className="font-medium text-green-600">+12</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taburan Umur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>18-30 tahun</span>
                  <span className="font-medium">123 (14.5%)</span>
                </div>
                <div className="flex justify-between">
                  <span>31-50 tahun</span>
                  <span className="font-medium">387 (45.7%)</span>
                </div>
                <div className="flex justify-between">
                  <span>51-65 tahun</span>
                  <span className="font-medium">267 (31.5%)</span>
                </div>
                <div className="flex justify-between">
                  <span>65+ tahun</span>
                  <span className="font-medium">70 (8.3%)</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Terkini</span>
                  <span className="font-medium text-green-600">756 (89.3%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Lewat 1-3 bulan</span>
                  <span className="font-medium text-orange-600">67 (7.9%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Lewat &gt;3 bulan</span>
                  <span className="font-medium text-red-600">24 (2.8%)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Prestasi Program</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Program Bulan Ini</span>
                  <span className="font-medium">8</span>
                </div>
                <div className="flex justify-between">
                  <span>Jumlah Peserta</span>
                  <span className="font-medium">342</span>
                </div>
                <div className="flex justify-between">
                  <span>Purata Kehadiran</span>
                  <span className="font-medium">78%</span>
                </div>
                <div className="flex justify-between">
                  <span>Maklum Balas Positif</span>
                  <span className="font-medium text-green-600">94%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Jenis Program Terpopular</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Ceramah Maghrib</span>
                  <span className="font-medium">156 peserta</span>
                </div>
                <div className="flex justify-between">
                  <span>Kelas Mengaji</span>
                  <span className="font-medium">89 peserta</span>
                </div>
                <div className="flex justify-between">
                  <span>Program Kanak-kanak</span>
                  <span className="font-medium">67 peserta</span>
                </div>
                <div className="flex justify-between">
                  <span>Gotong-royong</span>
                  <span className="font-medium">30 peserta</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}