import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Heart,
  HandCoins,
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  FileText,
  Settings,
  Plus,
  CreditCard,
  Download,
  BookOpen,
  Bell
} from 'lucide-react';
import { User } from '../../App';
import { toast } from 'sonner@2.0.3';

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const navigate = useNavigate();
  const [showAddMosqueDialog, setShowAddMosqueDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);

  // Mock data - in real app, this would come from API
  const stats = {
    totalMembers: 847,
    newMembersThisMonth: 12,
    totalPrograms: 24,
    upcomingPrograms: 8,
    totalFunds: 156780,
    monthlyIncome: 18750,
    pendingTasks: 5,
    completedTasks: 23,
    khairatMembers: 623,
    khairatFunds: 89450,
    // Zakat stats
    zakatCollected: 145600,
    zakatDistributed: 123400,
    zakatPendingApplications: 18,
    zakatEligibleMembers: 234,
    recentActivities: [
      {
        id: 1,
        type: 'member',
        message: 'Ahmad bin Hassan mendaftar sebagai ahli baru',
        time: '2 jam lalu',
        icon: Users
      },
      {
        id: 2,
        type: 'zakat',
        message: 'Zakat harta RM 1,250 diterima dari Fatimah binti Ali',
        time: '3 jam lalu',
        icon: HandCoins
      },
      {
        id: 3,
        type: 'payment',
        message: 'Derma RM 500 diterima dari Syarikat ABC',
        time: '4 jam lalu',
        icon: DollarSign
      },
      {
        id: 4,
        type: 'program',
        message: 'Program Ceramah Maghrib dijadualkan untuk esok',
        time: '6 jam lalu',
        icon: Calendar
      }
    ],
    upcomingEvents: [
      {
        id: 1,
        title: 'Ceramah Maghrib - Akhlak Islamiah',
        date: '2025-06-15',
        time: '19:30',
        attendees: 65
      },
      {
        id: 2,
        title: 'Kelas Mengaji Al-Quran',
        date: '2025-06-16',
        time: '20:00',
        attendees: 28
      },
      {
        id: 3,
        title: 'Gotong-royong Membersih Masjid',
        date: '2025-06-17',
        time: '08:00',
        attendees: 15
      }
    ]
  };

  // Navigation handlers for different roles
  const handleAddMosque = () => {
    setShowAddMosqueDialog(true);
  };

  const handleManageAdmins = () => {
    navigate('/admin');
  };

  const handleStateReports = () => {
    navigate('/laporan');
    toast.success('Membuka laporan peringkat negeri');
  };

  const handleSystemSettings = () => {
    navigate('/admin');
    toast.success('Membuka tetapan sistem');
  };

  const handleRegisterMember = () => {
    navigate('/ahli/baru');
  };

  const handleAddProgram = () => {
    navigate('/program/baru');
  };

  const handleFinanceRecords = () => {
    navigate('/kewangan');
  };

  const handleKhairatManagement = () => {
    navigate('/khairat');
  };

  const handleZakatManagement = () => {
    navigate('/zakat');
  };

  const handleZakatCalculator = () => {
    navigate('/zakat/kalkulator');
  };

  const handleZakatApplications = () => {
    navigate('/zakat/permohonan');
  };

  const handleProgramSchedule = () => {
    navigate('/program');
  };

  const handleAttendanceList = () => {
    navigate('/program');
    toast.success('Membuka senarai kehadiran');
  };

  const handleMyTasks = () => {
    setShowTaskDialog(true);
  };

  const handleReports = () => {
    navigate('/laporan');
  };

  const handlePayFees = () => {
    setShowPaymentDialog(true);
  };

  const handleRegisterProgram = () => {
    navigate('/program');
    toast.success('Membuka senarai program untuk pendaftaran');
  };

  const handleAccountStatement = () => {
    navigate('/portal');
    toast.success('Membuka penyata akaun');
  };

  const handleKhairatStatus = () => {
    navigate('/portal');
    toast.success('Membuka status khairat');
  };

  // Dialog components
  const AddMosqueDialog = () => (
    <Dialog open={showAddMosqueDialog} onOpenChange={setShowAddMosqueDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Masjid Baru</DialogTitle>
          <DialogDescription>
            Daftarkan masjid baru dalam sistem
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Masjid</Label>
              <Input placeholder="Masjid..." />
            </div>
            <div className="space-y-2">
              <Label>Negeri</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih negeri" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="selangor">Selangor</SelectItem>
                  <SelectItem value="kl">Kuala Lumpur</SelectItem>
                  <SelectItem value="johor">Johor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Alamat</Label>
            <Textarea placeholder="Alamat lengkap masjid" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Admin</Label>
              <Input placeholder="Nama admin masjid" />
            </div>
            <div className="space-y-2">
              <Label>Email Admin</Label>
              <Input type="email" placeholder="admin@masjid.my" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddMosqueDialog(false)}>
              Batal
            </Button>
            <Button onClick={() => {
              toast.success('Masjid baru berjaya didaftarkan');
              setShowAddMosqueDialog(false);
            }}>
              Daftar Masjid
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const PaymentDialog = () => (
    <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bayar Yuran</DialogTitle>
          <DialogDescription>
            Pilih jenis yuran dan kaedah pembayaran
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Jenis Yuran</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis yuran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="khairat">Yuran Khairat - RM 50</SelectItem>
                <SelectItem value="kariah">Yuran Kariah - RM 30</SelectItem>
                <SelectItem value="zakat_fitrah">Zakat Fitrah - RM 7</SelectItem>
                <SelectItem value="derma">Derma Masjid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kaedah Pembayaran</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-16 flex-col">
                <CreditCard className="h-6 w-6 mb-1" />
                FPX
              </Button>
              <Button variant="outline" className="h-16 flex-col">
                <DollarSign className="h-6 w-6 mb-1" />
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

  const TaskDialog = () => (
    <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tugasan Saya</DialogTitle>
          <DialogDescription>
            Tugasan yang perlu diselesaikan
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            {[
              'Semak senarai kehadiran program minggu lepas',
              'Sahkan permohonan bantuan zakat dari Aminah binti Yusof',
              'Sediakan laporan program bulanan',
              'Hantar notifikasi program akan datang',
              'Kemas kini maklumat ahli baru'
            ].map((task, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded">
                <input type="checkbox" className="rounded" />
                <span className="flex-1">{task}</span>
                <Badge variant="outline">Pending</Badge>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => {
              toast.success('Tugasan dikemas kini');
              setShowTaskDialog(false);
            }}>
              Kemas Kini
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Selamat Datang, {user.name}</h1>
          <p className="text-muted-foreground">
            {user.role === 'super_admin' && 'Panel Pentadbiran Pusat'}
            {user.role === 'mosque_admin' && `${user.mosqueName} - Panel Pentadbiran`}
            {user.role === 'ajk' && `${user.mosqueName} - Panel AJK`}
            {user.role === 'member' && `${user.mosqueName} - Portal Ahli`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/laporan')}>
            <Download className="h-4 w-4 mr-2" />
            Laporan
          </Button>
          <Button onClick={() => navigate('/komunikasi')}>
            <Bell className="h-4 w-4 mr-2" />
            Notifikasi
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user.role === 'super_admin' && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Jumlah Masjid</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">247</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+3</span> dari bulan lepas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Ahli Aktif</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">89,453</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+1,247</span> bulan ini
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Kutipan Nasional</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">RM 2.8M</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+12%</span> dari bulan lepas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Zakat Terkumpul</CardTitle>
                <HandCoins className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">RM 1.2M</div>
                <p className="text-xs text-muted-foreground">
                  Seluruh Malaysia
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {(user.role === 'mosque_admin' || user.role === 'ajk') && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Jumlah Ahli</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{stats.totalMembers}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+{stats.newMembersThisMonth}</span> bulan ini
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Program Aktif</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{stats.totalPrograms}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.upcomingPrograms} akan datang
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Dana Masjid</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">RM {stats.totalFunds.toLocaleString()}</div>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +RM {stats.monthlyIncome.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Zakat</CardTitle>
                <HandCoins className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">RM {stats.zakatCollected.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.zakatPendingApplications} permohonan
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {user.role === 'member' && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Status Yuran</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-green-600">Terkini</div>
                <p className="text-xs text-muted-foreground">
                  Bayaran terakhir: Jun 2025
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Status Zakat</CardTitle>
                <HandCoins className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-orange-600">Perlu Bayar</div>
                <p className="text-xs text-muted-foreground">
                  {user.lastZakatCalculation && `RM ${user.lastZakatCalculation.zakatDue.toLocaleString()}`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Program Daftar</CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">3</div>
                <p className="text-xs text-muted-foreground">
                  program bulan ini
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Notifikasi</CardTitle>
                <Bell className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">2</div>
                <p className="text-xs text-muted-foreground">
                  mesej baru
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Tindakan Pantas</CardTitle>
          <CardDescription>
            Akses pantas kepada fungsi utama sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {user.role === 'super_admin' && (
              <>
                <Button variant="outline" className="h-20 flex flex-col" onClick={handleAddMosque}>
                  <MapPin className="h-6 w-6 mb-2" />
                  Tambah Masjid
                </Button>
                <Button variant="outline" className="h-20 flex flex-col" onClick={handleManageAdmins}>
                  <Users className="h-6 w-6 mb-2" />
                  Uruskan Admin
                </Button>
                <Button variant="outline" className="h-20 flex flex-col" onClick={handleStateReports}>
                  <FileText className="h-6 w-6 mb-2" />
                  Laporan Negeri
                </Button>
                <Button variant="outline" className="h-20 flex flex-col" onClick={handleSystemSettings}>
                  <Settings className="h-6 w-6 mb-2" />
                  Tetapan Sistem
                </Button>
              </>
            )}
            
            {user.role === 'mosque_admin' && (
              <>
                <Button variant="outline" className="h-20 flex flex-col" onClick={handleRegisterMember}>
                  <Users className="h-6 w-6 mb-2" />
                  Daftar Ahli
                </Button>
                <Button variant="outline" className="h-20 flex flex-col" onClick={handleAddProgram}>
                  <Calendar className="h-6 w-6 mb-2" />
                  Tambah Program
                </Button>
                <Button variant="outline" className="h-20 flex flex-col" onClick={handleZakatManagement}>
                  <HandCoins className="h-6 w-6 mb-2" />
                  Pengurusan Zakat
                </Button>
                <Button variant="outline" className="h-20 flex flex-col" onClick={handleKhairatManagement}>
                  <Heart className="h-6 w-6 mb-2" />
                  Urusan Khairat
                </Button>
              </>
            )}
            
            {user.role === 'ajk' && (
              <>
                <Button variant="outline" className="h-20 flex flex-col" onClick={handleProgramSchedule}>
                  <Calendar className="h-6 w-6 mb-2" />
                  Jadual Program
                </Button>
                <Button variant="outline" className="h-20 flex flex-col" onClick={handleZakatApplications}>
                  <HandCoins className="h-6 w-6 mb-2" />
                  Permohonan Zakat
                </Button>
                <Button variant="outline" className="h-20 flex flex-col" onClick={handleMyTasks}>
                  <CheckCircle className="h-6 w-6 mb-2" />
                  Tugasan Saya
                </Button>
                <Button variant="outline" className="h-20 flex flex-col" onClick={handleReports}>
                  <FileText className="h-6 w-6 mb-2" />
                  Laporan
                </Button>
              </>
            )}
            
            {user.role === 'member' && (
              <>
                <Button variant="outline" className="h-20 flex flex-col" onClick={handleZakatCalculator}>
                  <Calculator className="h-6 w-6 mb-2" />
                  Kalkulator Zakat
                </Button>
                <Button variant="outline" className="h-20 flex flex-col" onClick={handlePayFees}>
                  <DollarSign className="h-6 w-6 mb-2" />
                  Bayar Yuran
                </Button>
                <Button variant="outline" className="h-20 flex flex-col" onClick={handleRegisterProgram}>
                  <Calendar className="h-6 w-6 mb-2" />
                  Daftar Program
                </Button>
                <Button variant="outline" className="h-20 flex flex-col" onClick={handleAccountStatement}>
                  <FileText className="h-6 w-6 mb-2" />
                  Penyata Akaun
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aktiviti Terkini</CardTitle>
            <CardDescription>
              Aktiviti dan perubahan terbaru dalam sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivities.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="p-2 bg-accent rounded-lg">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/komunikasi')}>
              Lihat Semua Aktiviti
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Program Akan Datang</CardTitle>
            <CardDescription>
              Program dan aktiviti yang dijadualkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start justify-between border-l-4 border-primary pl-4">
                  <div>
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleDateString('ms-MY')} • {event.time}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.attendees} peserta
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate('/program')}>
                    Lihat
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/program')}>
              Lihat Semua Program
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Zakat Summary for Admin/AJK */}
      {(user.role === 'mosque_admin' || user.role === 'ajk') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandCoins className="h-5 w-5" />
              Ringkasan Zakat
            </CardTitle>
            <CardDescription>
              Status kutipan dan agihan zakat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl text-green-600">RM {stats.zakatCollected.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Jumlah Kutipan</p>
              </div>
              <div className="text-center">
                <div className="text-2xl text-blue-600">RM {stats.zakatDistributed.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Jumlah Agihan</p>
              </div>
              <div className="text-center">
                <div className="text-2xl text-orange-600">{stats.zakatPendingApplications}</div>
                <p className="text-sm text-muted-foreground">Permohonan Menunggu</p>
              </div>
            </div>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate('/zakat')}>
                <HandCoins className="h-4 w-4 mr-2" />
                Lihat Pengurusan Zakat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zakat Status for Members */}
      {user.role === 'member' && user.zakatEligible && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandCoins className="h-5 w-5" />
              Status Zakat Anda
            </CardTitle>
            <CardDescription>
              Maklumat zakat dan kewajipan pembayaran
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.lastZakatCalculation && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-orange-900">Zakat Perlu Dibayar</p>
                      <p className="text-sm text-orange-700">
                        {user.lastZakatCalculation.type}: RM {user.lastZakatCalculation.zakatDue.toLocaleString()}
                      </p>
                      <p className="text-xs text-orange-600">
                        Dikira pada: {new Date(user.lastZakatCalculation.date).toLocaleDateString('ms-MY')}
                      </p>
                    </div>
                    <Button onClick={() => navigate('/zakat/kalkulator')}>
                      Bayar Zakat
                    </Button>
                  </div>
                </div>
              )}
              
              {user.zakatRecords && user.zakatRecords.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Sejarah Pembayaran Zakat</h4>
                  <div className="space-y-2">
                    {user.zakatRecords.slice(0, 3).map((record) => (
                      <div key={record.id} className="flex justify-between text-sm">
                        <span>{record.zakatType} ({record.year})</span>
                        <span>RM {record.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/zakat/kalkulator')}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Kalkulator Zakat
                </Button>
                <Button variant="outline" onClick={() => navigate('/portal')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Lihat Sejarah
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AddMosqueDialog />
      <PaymentDialog />
      <TaskDialog />
    </div>
  );
}