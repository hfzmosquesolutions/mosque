import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { 
  Plus, 
  Search, 
  Heart, 
  Calendar,
  MapPin,
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
  Download,
  FileText,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  User as UserIcon,
  Phone,
  Mail
} from 'lucide-react';
import { User } from '../../App';
import { toast } from 'sonner@2.0.3';

interface DeathRecord {
  id: string;
  membershipId: string;
  name: string;
  icNumber: string;
  age: number;
  dateOfDeath: string;
  timeOfDeath: string;
  placeOfDeath: string;
  causeOfDeath: string;
  burialLocation: string;
  burialDate: string;
  burialTime: string;
  nextOfKin: {
    name: string;
    relationship: string;
    phone: string;
    address: string;
  };
  benefitStatus: 'pending' | 'approved' | 'paid' | 'rejected';
  benefitAmount: number;
  applicationDate?: string;
  remarks?: string;
  documents: string[];
}

interface DeathRecordsProps {
  user: User;
}

export function DeathRecords({ user }: DeathRecordsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DeathRecord | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Mock data
  const deathRecords: DeathRecord[] = [
    {
      id: 'DR001',
      membershipId: 'KH001',
      name: 'Allahyarham Ahmad bin Hassan',
      icNumber: '751123-14-5678',
      age: 68,
      dateOfDeath: '2025-06-09',
      timeOfDeath: '14:30',
      placeOfDeath: 'Hospital Kuala Lumpur',
      causeOfDeath: 'Sakit jantung',
      burialLocation: 'Kubur Islam Cheras',
      burialDate: '2025-06-10',
      burialTime: '15:00',
      nextOfKin: {
        name: 'Fatimah binti Ahmad',
        relationship: 'Isteri',
        phone: '019-234-5678',
        address: 'No. 123, Jalan Mawar, Taman Seri, 50000 KL'
      },
      benefitStatus: 'paid',
      benefitAmount: 5000,
      applicationDate: '2025-06-10',
      remarks: 'Bantuan telah disalurkan kepada waris.',
      documents: ['Sijil Kematian', 'Surat Pengesahan Hospital', 'Resit Pembayaran']
    },
    {
      id: 'DR002',
      membershipId: 'KH002',
      name: 'Allahyarhamah Siti Khadijah binti Omar',
      icNumber: '820456-03-1234',
      age: 74,
      dateOfDeath: '2025-06-07',
      timeOfDeath: '09:15',
      placeOfDeath: 'Rumah',
      causeOfDeath: 'Usia tua',
      burialLocation: 'Kubur Islam Ampang',
      burialDate: '2025-06-08',
      burialTime: '11:30',
      nextOfKin: {
        name: 'Muhammad bin Omar',
        relationship: 'Anak',
        phone: '012-345-6789',
        address: 'No. 456, Jalan Kenanga, Bandar Baru, 47000 PJ'
      },
      benefitStatus: 'approved',
      benefitAmount: 3500,
      applicationDate: '2025-06-08',
      remarks: 'Menunggu proses pembayaran.',
      documents: ['Sijil Kematian', 'Borang Permohonan']
    },
    {
      id: 'DR003',
      membershipId: 'KH015',
      name: 'Allahyarham Ibrahim bin Yusuf',
      icNumber: '690912-08-9876',
      age: 82,
      dateOfDeath: '2025-05-28',
      timeOfDeath: '22:45',
      placeOfDeath: 'Hospital Selayang',
      causeOfDeath: 'Komplikasi diabetes',
      burialLocation: 'Kubur Islam Rawang',
      burialDate: '2025-05-29',
      burialTime: '14:00',
      nextOfKin: {
        name: 'Zainab binti Ibrahim',
        relationship: 'Anak',
        phone: '013-456-7890',
        address: 'No. 789, Jalan Cempaka, Taman Damai, 40000 Shah Alam'
      },
      benefitStatus: 'pending',
      benefitAmount: 4200,
      applicationDate: '2025-05-30',
      remarks: 'Menunggu pengesahan dokumen.',
      documents: ['Sijil Kematian']
    },
    {
      id: 'DR004',
      membershipId: 'KH032',
      name: 'Allahyarham Zainul Abidin bin Rahman',
      icNumber: '771025-11-3456',
      age: 65,
      dateOfDeath: '2025-05-15',
      timeOfDeath: '06:20',
      placeOfDeath: 'Rumah',
      causeOfDeath: 'Serangan jantung',
      burialLocation: 'Kubur Islam Kajang',
      burialDate: '2025-05-15',
      burialTime: '16:30',
      nextOfKin: {
        name: 'Khadijah binti Ahmad',
        relationship: 'Isteri',
        phone: '014-567-8901',
        address: 'No. 321, Jalan Melur, Taman Harmoni, 43000 Kajang'
      },
      benefitStatus: 'paid',
      benefitAmount: 5000,
      applicationDate: '2025-05-16',
      remarks: 'Bantuan telah disalurkan melalui bank.',
      documents: ['Sijil Kematian', 'Surat Pengesahan Hospital', 'Resit Pembayaran']
    }
  ];

  const filteredRecords = deathRecords.filter(record => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.membershipId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.icNumber.includes(searchTerm) ||
                         record.nextOfKin.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.benefitStatus === statusFilter;
    
    const recordYear = new Date(record.dateOfDeath).getFullYear().toString();
    const matchesYear = yearFilter === 'all' || recordYear === yearFilter;
    
    return matchesSearch && matchesStatus && matchesYear;
  });

  const stats = {
    totalDeaths: deathRecords.length,
    thisYear: deathRecords.filter(r => new Date(r.dateOfDeath).getFullYear() === 2025).length,
    totalBenefitsPaid: deathRecords.filter(r => r.benefitStatus === 'paid').reduce((sum, r) => sum + r.benefitAmount, 0),
    pendingApplications: deathRecords.filter(r => r.benefitStatus === 'pending').length
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Menunggu</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500"><CheckCircle className="h-3 w-3 mr-1" />Diluluskan</Badge>;
      case 'paid':
        return <Badge className="bg-green-500"><DollarSign className="h-3 w-3 mr-1" />Dibayar</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canManageKhairat = user.role === 'super_admin' || user.role === 'mosque_admin' || 
                          (user.role === 'ajk' && user.permissions?.includes('manage_khairat'));

  const handleViewDetails = (record: DeathRecord) => {
    setSelectedRecord(record);
    setShowDetailsDialog(true);
  };

  const handleStatusUpdate = (recordId: string, newStatus: string) => {
    toast.success(`Status rekod berjaya dikemas kini kepada ${newStatus}`);
  };

  const handleAddNewRecord = () => {
    setShowAddDialog(true);
  };

  const AddRecordDialog = () => (
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Rekod Kematian Baru</DialogTitle>
          <DialogDescription>
            Masukkan maklumat lengkap ahli yang telah meninggal dunia
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Member Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Maklumat Ahli</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID Keahlian</Label>
                <Input placeholder="KH001" />
              </div>
              <div className="space-y-2">
                <Label>Nama Penuh</Label>
                <Input placeholder="Nama ahli yang meninggal" />
              </div>
              <div className="space-y-2">
                <Label>No. Kad Pengenalan</Label>
                <Input placeholder="123456-78-9012" />
              </div>
              <div className="space-y-2">
                <Label>Umur</Label>
                <Input type="number" placeholder="68" />
              </div>
            </div>
          </div>

          {/* Death Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Maklumat Kematian</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tarikh Kematian</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Masa Kematian</Label>
                <Input type="time" />
              </div>
              <div className="space-y-2">
                <Label>Tempat Kematian</Label>
                <Input placeholder="Hospital/Rumah" />
              </div>
              <div className="space-y-2">
                <Label>Punca Kematian</Label>
                <Input placeholder="Sebab kematian" />
              </div>
            </div>
          </div>

          {/* Burial Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Maklumat Pengebumian</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lokasi Kubur</Label>
                <Input placeholder="Kubur Islam Cheras" />
              </div>
              <div className="space-y-2">
                <Label>Tarikh Pengebumian</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Masa Pengebumian</Label>
                <Input type="time" />
              </div>
            </div>
          </div>

          {/* Next of Kin */}
          <div className="space-y-4">
            <h3 className="font-medium">Maklumat Waris</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Waris</Label>
                <Input placeholder="Nama waris terdekat" />
              </div>
              <div className="space-y-2">
                <Label>Hubungan</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih hubungan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="isteri">Isteri</SelectItem>
                    <SelectItem value="suami">Suami</SelectItem>
                    <SelectItem value="anak">Anak</SelectItem>
                    <SelectItem value="ibu_bapa">Ibu/Bapa</SelectItem>
                    <SelectItem value="adik_beradik">Adik Beradik</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>No. Telefon</Label>
                <Input placeholder="012-345-6789" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alamat Waris</Label>
              <Textarea placeholder="Alamat lengkap waris" />
            </div>
          </div>

          {/* Benefit Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Maklumat Bantuan</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jumlah Bantuan (RM)</Label>
                <Input type="number" placeholder="5000" />
              </div>
              <div className="space-y-2">
                <Label>Status Bantuan</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="approved">Diluluskan</SelectItem>
                    <SelectItem value="paid">Dibayar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea placeholder="Catatan tambahan" />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Batal
            </Button>
            <Button onClick={() => {
              toast.success('Rekod kematian baru berjaya ditambah');
              setShowAddDialog(false);
            }}>
              Simpan Rekod
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const DetailsDialog = () => (
    <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Maklumat Lengkap Rekod Kematian</DialogTitle>
        </DialogHeader>
        {selectedRecord && (
          <div className="space-y-6">
            {/* Member Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Maklumat Ahli</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">ID Keahlian:</span>
                    <p className="font-medium">{selectedRecord.membershipId}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Nama:</span>
                    <p className="font-medium">{selectedRecord.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">No. IC:</span>
                    <p className="font-medium">{selectedRecord.icNumber}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Umur:</span>
                    <p className="font-medium">{selectedRecord.age} tahun</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Death Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Maklumat Kematian</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Tarikh:</span>
                    <p className="font-medium">{new Date(selectedRecord.dateOfDeath).toLocaleDateString('ms-MY')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Masa:</span>
                    <p className="font-medium">{selectedRecord.timeOfDeath}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Tempat:</span>
                    <p className="font-medium">{selectedRecord.placeOfDeath}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Punca:</span>
                    <p className="font-medium">{selectedRecord.causeOfDeath}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Burial Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Maklumat Pengebumian</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Lokasi:</span>
                    <p className="font-medium">{selectedRecord.burialLocation}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Tarikh:</span>
                    <p className="font-medium">{new Date(selectedRecord.burialDate).toLocaleDateString('ms-MY')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Masa:</span>
                    <p className="font-medium">{selectedRecord.burialTime}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next of Kin */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Maklumat Waris</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Nama:</span>
                    <p className="font-medium">{selectedRecord.nextOfKin.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Hubungan:</span>
                    <p className="font-medium">{selectedRecord.nextOfKin.relationship}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Telefon:</span>
                    <p className="font-medium">{selectedRecord.nextOfKin.phone}</p>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Alamat:</span>
                  <p className="font-medium">{selectedRecord.nextOfKin.address}</p>
                </div>
              </CardContent>
            </Card>

            {/* Benefit Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Maklumat Bantuan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Jumlah:</span>
                    <p className="font-medium">RM {selectedRecord.benefitAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <div>{getStatusBadge(selectedRecord.benefitStatus)}</div>
                  </div>
                </div>
                {selectedRecord.remarks && (
                  <div>
                    <span className="text-sm text-muted-foreground">Catatan:</span>
                    <p className="font-medium">{selectedRecord.remarks}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dokumen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedRecord.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {doc}
                      </span>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Rekod Kematian</h1>
          <p className="text-muted-foreground">
            Senarai ahli khairat yang telah meninggal dunia
          </p>
        </div>
        {canManageKhairat && (
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Eksport
            </Button>
            <Button onClick={handleAddNewRecord}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Rekod
            </Button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Jumlah Kematian</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.totalDeaths}</div>
            <p className="text-xs text-muted-foreground">
              Rekod kematian
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Tahun Ini</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.thisYear}</div>
            <p className="text-xs text-muted-foreground">
              Kematian 2025
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Bantuan Dibayar</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">RM {stats.totalBenefitsPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Jumlah bantuan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Permohonan Menunggu</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.pendingApplications}</div>
            <p className="text-xs text-muted-foreground">
              Perlu tindakan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari rekod kematian..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status Bantuan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="approved">Diluluskan</SelectItem>
                <SelectItem value="paid">Dibayar</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Senarai Rekod Kematian ({filteredRecords.length})</CardTitle>
          <CardDescription>
            Rekod kematian ahli khairat dan status bantuan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ahli</TableHead>
                <TableHead>Tarikh Kematian</TableHead>
                <TableHead>Pengebumian</TableHead>
                <TableHead>Waris</TableHead>
                <TableHead>Bantuan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{record.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {record.membershipId} • {record.age} tahun
                      </div>
                      <div className="text-sm text-muted-foreground">
                        IC: {record.icNumber}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{new Date(record.dateOfDeath).toLocaleDateString('ms-MY')}</div>
                      <div className="text-sm text-muted-foreground">
                        {record.timeOfDeath}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {record.placeOfDeath}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {record.burialLocation}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(record.burialDate).toLocaleDateString('ms-MY')} • {record.burialTime}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{record.nextOfKin.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {record.nextOfKin.relationship}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {record.nextOfKin.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">RM {record.benefitAmount.toLocaleString()}</div>
                      {record.applicationDate && (
                        <div className="text-sm text-muted-foreground">
                          Mohon: {new Date(record.applicationDate).toLocaleDateString('ms-MY')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(record.benefitStatus)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(record)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Lihat Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Sijil Kematian
                        </DropdownMenuItem>
                        {canManageKhairat && (
                          <>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Rekod
                            </DropdownMenuItem>
                            {record.benefitStatus === 'approved' && (
                              <DropdownMenuItem 
                                className="text-green-600"
                                onClick={() => handleStatusUpdate(record.id, 'paid')}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Tandakan Dibayar
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddRecordDialog />
      <DetailsDialog />
    </div>
  );
}