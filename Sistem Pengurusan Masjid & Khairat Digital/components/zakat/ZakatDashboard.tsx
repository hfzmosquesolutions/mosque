import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Progress } from '../ui/progress';
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
  Clock
} from 'lucide-react';
import { User } from '../../App';
import { toast } from 'sonner@2.0.3';

interface ZakatDashboardProps {
  user: User;
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
  asnafCategory: 'fakir' | 'miskin' | 'amil' | 'muallaf' | 'riqab' | 'gharimin' | 'fisabilillah' | 'ibnu_sabil';
  amount: number;
  distributionDate: string;
  purpose: string;
  status: 'approved' | 'pending' | 'distributed';
}

const asnafCategories = {
  fakir: 'Fakir',
  miskin: 'Miskin', 
  amil: 'Amil',
  muallaf: 'Muallaf',
  riqab: 'Riqab',
  gharimin: 'Gharimin',
  fisabilillah: 'Fi Sabilillah',
  ibnu_sabil: 'Ibnu Sabil'
};

const zakatTypes = {
  harta: 'Zakat Harta',
  fitrah: 'Zakat Fitrah',
  perniagaan: 'Zakat Perniagaan',
  emas: 'Zakat Emas',
  perak: 'Zakat Perak'
};

export function ZakatDashboard({ user }: ZakatDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('month');

  // Mock data - in real app, this would come from API
  const zakatStats = {
    totalCollected: 156750,
    totalDistributed: 128450,
    pendingApplications: 23,
    activeRecipients: 78,
    monthlyGrowth: 12.5,
    fitrahCollected: 45600,
    hartalCollected: 111150,
    distributionsByAsnaf: [
      { category: 'fakir', amount: 45600, recipients: 32 },
      { category: 'miskin', amount: 38200, recipients: 25 },
      { category: 'amil', amount: 15685, recipients: 8 },
      { category: 'fisabilillah', amount: 28965, recipients: 13 }
    ]
  };

  const recentCollections: ZakatRecord[] = [
    {
      id: 'ZC001',
      payerName: 'Ahmad bin Ibrahim',
      payerIc: '780123-10-1234',
      amount: 850,
      zakatType: 'harta',
      paymentDate: '2025-06-10',
      status: 'completed',
      receiptNumber: 'ZR20250610001'
    },
    {
      id: 'ZC002',
      payerName: 'Fatimah binti Hassan',
      payerIc: '850456-03-5678',
      amount: 1200,
      zakatType: 'perniagaan',
      paymentDate: '2025-06-09',
      status: 'completed',
      receiptNumber: 'ZR20250609001'
    },
    {
      id: 'ZC003',
      payerName: 'Muhammad bin Ali',
      payerIc: '900789-14-9012',
      amount: 25,
      zakatType: 'fitrah',
      paymentDate: '2025-06-08',
      status: 'verified',
      receiptNumber: 'ZR20250608001'
    }
  ];

  const recentDistributions: ZakatDistribution[] = [
    {
      id: 'ZD001',
      beneficiaryName: 'Aminah binti Yusof',
      beneficiaryIc: '650123-10-1234',
      asnafCategory: 'fakir',
      amount: 500,
      distributionDate: '2025-06-08',
      purpose: 'Bantuan sara hidup bulanan',
      status: 'distributed'
    },
    {
      id: 'ZD002',
      beneficiaryName: 'Omar bin Abdullah',
      beneficiaryIc: '720456-03-5678',
      asnafCategory: 'miskin',
      amount: 800,
      distributionDate: '2025-06-07',
      purpose: 'Bantuan perubatan',
      status: 'distributed'
    },
    {
      id: 'ZD003',
      beneficiaryName: 'Siti binti Rahman',
      beneficiaryIc: '680789-14-9012',
      asnafCategory: 'fisabilillah',
      amount: 1500,
      distributionDate: '2025-06-06',
      purpose: 'Biasiswa pendidikan anak',
      status: 'approved'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'distributed':
        return <Badge className="bg-green-500">Selesai</Badge>;
      case 'verified':
      case 'approved':
        return <Badge className="bg-blue-500">Diluluskan</Badge>;
      case 'pending':
        return <Badge variant="outline">Menunggu</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleGenerateReport = () => {
    toast.success('Laporan zakat sedang dijana');
  };

  const handleExportData = () => {
    toast.success('Data zakat sedang dieksport');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="flex items-center gap-2">
            <HandCoins className="h-6 w-6" />
            Pengurusan Zakat
          </h1>
          <p className="text-muted-foreground">
            Sistem pengurusan kutipan dan agihan zakat masjid
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateReport}>
            <FileText className="h-4 w-4 mr-2" />
            Jana Laporan
          </Button>
          <Button onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Jumlah Kutipan</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">RM {zakatStats.totalCollected.toLocaleString()}</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{zakatStats.monthlyGrowth}% bulan ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Jumlah Agihan</CardTitle>
            <Heart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">RM {zakatStats.totalDistributed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Kepada {zakatStats.activeRecipients} penerima
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Permohonan Bantuan</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{zakatStats.pendingApplications}</div>
            <p className="text-xs text-muted-foreground">
              Menunggu kelulusan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Baki Dana</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">RM {(zakatStats.totalCollected - zakatStats.totalDistributed).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Sedia untuk agihan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Tindakan Pantas</CardTitle>
          <CardDescription>
            Akses pantas kepada fungsi utama zakat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col">
              <Calculator className="h-6 w-6 mb-2" />
              Kalkulator Zakat
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <Plus className="h-6 w-6 mb-2" />
              Rekod Kutipan
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <Users className="h-6 w-6 mb-2" />
              Agihan Zakat
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <FileText className="h-6 w-6 mb-2" />
              Laporan Bulanan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts and Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Kutipan Mengikut Jenis</CardTitle>
            <CardDescription>
              Pecahan kutipan zakat mengikut kategori
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Zakat Harta</span>
                <span className="text-sm font-medium">RM {zakatStats.hartalCollected.toLocaleString()}</span>
              </div>
              <Progress value={(zakatStats.hartalCollected / zakatStats.totalCollected) * 100} />
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Zakat Fitrah</span>
                <span className="text-sm font-medium">RM {zakatStats.fitrahCollected.toLocaleString()}</span>
              </div>
              <Progress value={(zakatStats.fitrahCollected / zakatStats.totalCollected) * 100} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agihan Mengikut Asnaf</CardTitle>
            <CardDescription>
              Pecahan agihan kepada 8 asnaf
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {zakatStats.distributionsByAsnaf.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="text-sm">{asnafCategories[item.category as keyof typeof asnafCategories]}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">RM {item.amount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{item.recipients} penerima</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <Tabs defaultValue="collections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="collections">Kutipan Terkini</TabsTrigger>
          <TabsTrigger value="distributions">Agihan Terkini</TabsTrigger>
          <TabsTrigger value="applications">Permohonan</TabsTrigger>
        </TabsList>

        <TabsContent value="collections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kutipan Zakat Terkini</CardTitle>
              <CardDescription>
                Senarai kutipan zakat yang diterima
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Pembayar</TableHead>
                    <TableHead>No. IC</TableHead>
                    <TableHead>Jenis Zakat</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Tarikh</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCollections.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.payerName}</TableCell>
                      <TableCell>{record.payerIc}</TableCell>
                      <TableCell>{zakatTypes[record.zakatType]}</TableCell>
                      <TableCell>RM {record.amount.toLocaleString()}</TableCell>
                      <TableCell>{new Date(record.paymentDate).toLocaleDateString('ms-MY')}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distributions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agihan Zakat Terkini</CardTitle>
              <CardDescription>
                Senarai agihan zakat kepada asnaf
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Penerima</TableHead>
                    <TableHead>No. IC</TableHead>
                    <TableHead>Kategori Asnaf</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Tujuan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDistributions.map((distribution) => (
                    <TableRow key={distribution.id}>
                      <TableCell className="font-medium">{distribution.beneficiaryName}</TableCell>
                      <TableCell>{distribution.beneficiaryIc}</TableCell>
                      <TableCell>{asnafCategories[distribution.asnafCategory]}</TableCell>
                      <TableCell>RM {distribution.amount.toLocaleString()}</TableCell>
                      <TableCell className="max-w-48 truncate">{distribution.purpose}</TableCell>
                      <TableCell>{getStatusBadge(distribution.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permohonan Bantuan Zakat</CardTitle>
              <CardDescription>
                Permohonan bantuan yang menunggu kelulusan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Senarai permohonan akan dipaparkan di sini
                </p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Permohonan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}