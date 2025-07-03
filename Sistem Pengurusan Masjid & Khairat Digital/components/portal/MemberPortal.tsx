import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  User as UserIcon, 
  CreditCard, 
  Calendar, 
  Heart,
  DollarSign,
  FileText,
  Bell,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Edit,
  Phone,
  Mail,
  MapPin,
  Settings,
  Receipt,
  Bookmark,
  Users,
  Plus,
  MoreHorizontal,
  Trash
} from 'lucide-react';
import { User, Beneficiary } from '../../App';
import { toast } from 'sonner@2.0.3';

interface MemberPortalProps {
  user: User;
}

export function MemberPortal({ user }: MemberPortalProps) {
  const [selectedPaymentType, setSelectedPaymentType] = useState<'khairat' | 'derma'>('khairat');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBeneficiaryDialog, setShowBeneficiaryDialog] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);

  // Mock member data
  const memberInfo = {
    membershipId: 'AL001234',
    joinDate: '2023-01-15',
    membershipType: 'both',
    status: 'active',
    totalContributions: 2400,
    lastPayment: '2025-06-01',
    khairatBalance: 0,
    emergencyContact: 'Fatimah binti Ahmad',
    emergencyPhone: '012-345-6789',
    icNumber: '850123-14-5678',
    phone: '019-234-5678',
    address: 'No. 123, Jalan Mawar, Taman Seri, 50000 Kuala Lumpur',
    monthlyKhairat: 50,
    nextPaymentDue: '2025-07-01'
  };

  const paymentHistory = [
    {
      id: 'PAY001',
      date: '2025-06-01',
      type: 'Yuran Khairat',
      amount: 50,
      method: 'FPX',
      status: 'completed',
      reference: 'FPX20250601001'
    },
    {
      id: 'PAY002',
      date: '2025-05-15',
      type: 'Derma Masjid',
      amount: 100,
      method: 'DuitNow',
      status: 'completed',
      reference: 'DN20250515001'
    },
    {
      id: 'PAY003',
      date: '2025-05-01',
      type: 'Yuran Khairat',
      amount: 50,
      method: 'FPX',
      status: 'completed',
      reference: 'FPX20250501001'
    },
    {
      id: 'PAY004',
      date: '2025-04-01',
      type: 'Yuran Khairat',
      amount: 50,
      method: 'Online Banking',
      status: 'completed',
      reference: 'OB20250401001'
    }
  ];

  const upcomingPrograms = [
    {
      id: 'P001',
      title: 'Ceramah Maghrib - Akhlak Islamiah',
      date: '2025-06-15',
      time: '19:30',
      location: 'Dewan Utama',
      registered: false,
      capacity: 100,
      currentAttendees: 65,
      description: 'Ceramah mingguan selepas solat Maghrib tentang akhlak dalam Islam'
    },
    {
      id: 'P002',
      title: 'Kelas Mengaji Al-Quran',
      date: '2025-06-16',
      time: '20:00',
      location: 'Bilik Kelas 1',
      registered: true,
      capacity: 30,
      currentAttendees: 28,
      description: 'Kelas mingguan untuk pembelajaran bacaan Al-Quran bagi orang dewasa'
    },
    {
      id: 'P003',
      title: 'Gotong-royong Membersih Masjid',
      date: '2025-06-17',
      time: '08:00',
      location: 'Kawasan Masjid',
      registered: false,
      capacity: null,
      currentAttendees: 15,
      description: 'Aktiviti bersama membersihkan kawasan masjid dan taman'
    }
  ];

  const notifications = [
    {
      id: 'N001',
      title: 'Yuran Khairat Bulan Julai',
      message: 'Peringatan: Yuran khairat untuk bulan Julai akan matang pada 1 Julai 2025.',
      date: '2025-06-25',
      type: 'payment',
      read: false
    },
    {
      id: 'N002',
      title: 'Program Baru: Ceramah Khas',
      message: 'Program ceramah khas akan diadakan pada 20 Jun 2025. Jemput hadir!',
      date: '2025-06-10',
      type: 'program',
      read: true
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Aktif</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Tidak Aktif</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMembershipTypeBadge = (type: string) => {
    switch (type) {
      case 'kariah':
        return <Badge variant="outline">Kariah</Badge>;
      case 'khairat':
        return <Badge className="bg-blue-500">Khairat</Badge>;
      case 'both':
        return <Badge className="bg-purple-500">Kariah + Khairat</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const handlePayment = (type: 'khairat' | 'derma') => {
    setSelectedPaymentType(type);
    setShowPaymentDialog(true);
  };

  const handleProgramRegistration = (programId: string, register: boolean) => {
    toast.success(register ? 'Berjaya mendaftar program' : 'Berjaya membatalkan pendaftaran');
  };

  const handleDownloadReceipt = (paymentId: string) => {
    toast.success('Resit sedang dimuat turun');
  };

  const PaymentDialog = () => (
    <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {selectedPaymentType === 'khairat' ? 'Bayar Yuran Khairat' : 'Derma Masjid'}
          </DialogTitle>
          <DialogDescription>
            Pilih kaedah pembayaran yang sesuai
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {selectedPaymentType === 'khairat' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span>Yuran Bulanan:</span>
                <span className="font-medium">RM {memberInfo.monthlyKhairat}</span>
              </div>
              <div className="flex justify-between">
                <span>Tempoh:</span>
                <span className="font-medium">Julai 2025</span>
              </div>
            </div>
          )}
          
          {selectedPaymentType === 'derma' && (
            <div className="space-y-2">
              <Label>Jumlah Derma (RM)</Label>
              <Input placeholder="Masukkan jumlah derma" />
            </div>
          )}

          <div className="space-y-2">
            <Label>Kaedah Pembayaran</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-16 flex-col">
                <CreditCard className="h-6 w-6 mb-1" />
                FPX
              </Button>
              <Button variant="outline" className="h-16 flex-col">
                <Phone className="h-6 w-6 mb-1" />
                DuitNow
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Batal
            </Button>
            <Button onClick={() => {
              toast.success('Pembayaran berjaya diproses');
              setShowPaymentDialog(false);
            }}>
              Bayar Sekarang
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const handleAddBeneficiary = () => {
    setEditingBeneficiary(null);
    setShowBeneficiaryDialog(true);
  };

  const handleEditBeneficiary = (beneficiary: Beneficiary) => {
    setEditingBeneficiary(beneficiary);
    setShowBeneficiaryDialog(true);
  };

  const handleDeleteBeneficiary = (beneficiaryId: string) => {
    toast.success('Waris berjaya dipadamkan');
  };

  const EditProfileDialog = () => (
    <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Maklumat Peribadi</DialogTitle>
          <DialogDescription>
            Kemas kini maklumat peribadi anda
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Penuh</Label>
              <Input defaultValue={user.name} />
            </div>
            <div className="space-y-2">
              <Label>No. Kad Pengenalan</Label>
              <Input defaultValue={user.icNumber || memberInfo.icNumber} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue={user.email} />
            </div>
            <div className="space-y-2">
              <Label>No. Telefon</Label>
              <Input defaultValue={user.phone || memberInfo.phone} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Alamat</Label>
            <Textarea defaultValue={user.address || memberInfo.address} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Kontakt Kecemasan</Label>
              <Input defaultValue={user.emergencyContact?.name || memberInfo.emergencyContact} />
            </div>
            <div className="space-y-2">
              <Label>Telefon Kontakt Kecemasan</Label>
              <Input defaultValue={user.emergencyContact?.phone || memberInfo.emergencyPhone} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Batal
            </Button>
            <Button onClick={() => {
              toast.success('Maklumat berjaya dikemas kini');
              setShowEditDialog(false);
            }}>
              Simpan Perubahan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const BeneficiaryDialog = () => (
    <Dialog open={showBeneficiaryDialog} onOpenChange={setShowBeneficiaryDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingBeneficiary ? 'Edit Maklumat Waris' : 'Tambah Waris Baru'}
          </DialogTitle>
          <DialogDescription>
            {editingBeneficiary ? 'Kemas kini maklumat waris' : 'Masukkan maklumat waris untuk khairat kematian'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Penuh Waris</Label>
              <Input 
                placeholder="Nama waris"
                defaultValue={editingBeneficiary?.name || ''}
              />
            </div>
            <div className="space-y-2">
              <Label>No. Kad Pengenalan</Label>
              <Input 
                placeholder="123456-78-9012"
                defaultValue={editingBeneficiary?.icNumber || ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hubungan</Label>
              <Select defaultValue={editingBeneficiary?.relationship || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih hubungan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="isteri">Isteri</SelectItem>
                  <SelectItem value="suami">Suami</SelectItem>
                  <SelectItem value="anak">Anak</SelectItem>
                  <SelectItem value="ibu">Ibu</SelectItem>
                  <SelectItem value="bapa">Bapa</SelectItem>
                  <SelectItem value="adik_beradik">Adik Beradik</SelectItem>
                  <SelectItem value="lain-lain">Lain-lain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>No. Telefon</Label>
              <Input 
                placeholder="012-345-6789"
                defaultValue={editingBeneficiary?.phone || ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Alamat</Label>
            <Textarea 
              placeholder="Alamat lengkap waris"
              defaultValue={editingBeneficiary?.address || ''}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Peratusan Warisan (%)</Label>
              <Input 
                type="number"
                min="1"
                max="100"
                placeholder="25"
                defaultValue={editingBeneficiary?.percentage || ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Status Waris</Label>
              <Select defaultValue={editingBeneficiary?.isPrimary ? 'primary' : 'secondary'}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Waris Utama</SelectItem>
                  <SelectItem value="secondary">Waris Sekunder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Jumlah peratusan semua waris mestilah 100%. 
              Pastikan peratusan yang dimasukkan adalah tepat.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBeneficiaryDialog(false)}>
              Batal
            </Button>
            <Button onClick={() => {
              toast.success(editingBeneficiary ? 'Maklumat waris berjaya dikemas kini' : 'Waris baru berjaya ditambah');
              setShowBeneficiaryDialog(false);
            }}>
              {editingBeneficiary ? 'Kemas Kini' : 'Tambah Waris'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1>Portal Jemaah</h1>
        <p className="text-muted-foreground">
          Akses maklumat peribadi dan perkhidmatan masjid
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Status Keahlian</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {getStatusBadge(memberInfo.status)}
            <p className="text-xs text-muted-foreground mt-1">
              Ahli sejak {new Date(memberInfo.joinDate).getFullYear()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Jumlah Sumbangan</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">RM {memberInfo.totalContributions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Sejak menyertai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Bayaran Seterusnya</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg">RM {memberInfo.monthlyKhairat}</div>
            <p className="text-xs text-muted-foreground">
              {new Date(memberInfo.nextPaymentDue).toLocaleDateString('ms-MY')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Notifikasi</CardTitle>
            <Bell className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{notifications.filter(n => !n.read).length}</div>
            <p className="text-xs text-muted-foreground">
              Belum dibaca
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Member Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Maklumat Keahlian
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="font-medium mb-3">Maklumat Peribadi</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nama</p>
                <p className="font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ID Keahlian</p>
                <p className="font-medium">{user.membershipId || memberInfo.membershipId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jenis Keahlian</p>
                {getMembershipTypeBadge(user.membershipType || memberInfo.membershipType)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">No. Kad Pengenalan</p>
                <p className="font-medium">{user.icNumber || memberInfo.icNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefon</p>
                <p className="font-medium">{user.phone || memberInfo.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                {getStatusBadge(memberInfo.status)}
              </div>
            </div>
            {user.address && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Alamat</p>
                <p className="font-medium">{user.address}</p>
              </div>
            )}
          </div>

          {/* Emergency Contact */}
          {user.emergencyContact && (
            <div>
              <h3 className="font-medium mb-3">Kontakt Kecemasan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nama</p>
                  <p className="font-medium">{user.emergencyContact.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hubungan</p>
                  <p className="font-medium">{user.emergencyContact.relationship}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefon</p>
                  <p className="font-medium">{user.emergencyContact.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Beneficiaries */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Maklumat Waris</h3>
              <Button variant="outline" size="sm" onClick={handleAddBeneficiary}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Waris
              </Button>
            </div>
            
            {user.beneficiaries && user.beneficiaries.length > 0 ? (
              <>
                <div className="space-y-4">
                  {user.beneficiaries.map((beneficiary, index) => (
                    <div key={beneficiary.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{beneficiary.name}</h4>
                          {beneficiary.isPrimary && (
                            <Badge className="bg-blue-500">Waris Utama</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{beneficiary.percentage}%</Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditBeneficiary(beneficiary)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteBeneficiary(beneficiary.id)}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Padam
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">No. IC</p>
                          <p className="font-medium">{beneficiary.icNumber}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Hubungan</p>
                          <p className="font-medium">{beneficiary.relationship}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Telefon</p>
                          <p className="font-medium">{beneficiary.phone}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Peratusan</p>
                          <p className="font-medium">{beneficiary.percentage}%</p>
                        </div>
                      </div>
                      {beneficiary.address && (
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground">Alamat</p>
                          <p className="text-sm font-medium">{beneficiary.address}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Beneficiary Summary */}
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span>Jumlah Waris:</span>
                    <span className="font-medium">{user.beneficiaries.length} orang</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Jumlah Peratusan:</span>
                    <span className={`font-medium ${
                      user.beneficiaries.reduce((sum, b) => sum + b.percentage, 0) === 100 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {user.beneficiaries.reduce((sum, b) => sum + b.percentage, 0)}%
                    </span>
                  </div>
                  {user.beneficiaries.reduce((sum, b) => sum + b.percentage, 0) !== 100 && (
                    <div className="mt-2 text-xs text-orange-600">
                      ⚠️ Jumlah peratusan hendaklah 100%
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Belum ada waris didaftarkan</p>
                <Button variant="outline" onClick={handleAddBeneficiary}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Waris Pertama
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Pembayaran</TabsTrigger>
          <TabsTrigger value="programs">Program</TabsTrigger>
          <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
          <TabsTrigger value="documents">Dokumen</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Sejarah Pembayaran</CardTitle>
                <CardDescription>
                  Rekod pembayaran dan sumbangan anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarikh</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Kaedah</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.date).toLocaleDateString('ms-MY')}</TableCell>
                        <TableCell>{payment.type}</TableCell>
                        <TableCell>RM {payment.amount}</TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-500">Selesai</Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadReceipt(payment.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Buat Pembayaran</CardTitle>
                <CardDescription>
                  Bayar yuran atau buat derma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full"
                  onClick={() => handlePayment('khairat')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Bayar Yuran Khairat
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handlePayment('derma')}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Derma Masjid
                </Button>
                
                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-2">Pembayaran Seterusnya</div>
                  <div className="flex justify-between items-center">
                    <span>Yuran Khairat</span>
                    <span className="font-medium">RM {memberInfo.monthlyKhairat}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Matang: {new Date(memberInfo.nextPaymentDue).toLocaleDateString('ms-MY')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Program Akan Datang</CardTitle>
              <CardDescription>
                Program dan aktiviti yang boleh anda sertai
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingPrograms.map((program) => (
                  <div key={program.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{program.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {program.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(program.date).toLocaleDateString('ms-MY')} • {program.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {program.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {program.currentAttendees}{program.capacity && `/${program.capacity}`}
                          </span>
                        </div>
                        {program.capacity && (
                          <div className="mt-2">
                            <Progress 
                              value={(program.currentAttendees / program.capacity) * 100} 
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant={program.registered ? "secondary" : "default"}
                        onClick={() => handleProgramRegistration(program.id, !program.registered)}
                      >
                        {program.registered ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Telah Daftar
                          </>
                        ) : (
                          <>
                            <Bookmark className="h-4 w-4 mr-2" />
                            Daftar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifikasi</CardTitle>
              <CardDescription>
                Maklumat terkini dan peringatan penting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`border rounded-lg p-4 ${!notification.read ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{notification.title}</h4>
                          {!notification.read && (
                            <Badge className="bg-blue-500">Baru</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.date).toLocaleDateString('ms-MY')}
                        </p>
                      </div>
                      <div className="ml-4">
                        {notification.type === 'payment' && (
                          <DollarSign className="h-5 w-5 text-orange-500" />
                        )}
                        {notification.type === 'program' && (
                          <Calendar className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dokumen</CardTitle>
              <CardDescription>
                Resit, sijil dan dokumen berkaitan keahlian
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <h4 className="font-medium">Sijil Keahlian</h4>
                        <p className="text-sm text-muted-foreground">
                          Sijil rasmi keahlian masjid
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Muat Turun
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Receipt className="h-8 w-8 text-green-500" />
                      <div>
                        <h4 className="font-medium">Penyata Tahunan 2024</h4>
                        <p className="text-sm text-muted-foreground">
                          Ringkasan pembayaran dan sumbangan
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Muat Turun
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-orange-500" />
                      <div>
                        <h4 className="font-medium">Borang Kemas Kini Maklumat</h4>
                        <p className="text-sm text-muted-foreground">
                          Borang untuk mengemas kini maklumat peribadi
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Muat Turun
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PaymentDialog />
      <EditProfileDialog />
      <BeneficiaryDialog />
    </div>
  );
}