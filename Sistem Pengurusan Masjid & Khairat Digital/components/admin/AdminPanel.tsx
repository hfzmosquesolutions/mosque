import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { 
  Plus, 
  Search, 
  Building2, 
  Users, 
  DollarSign,
  Activity,
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
  Settings,
  Shield,
  Database,
  Server,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { User } from '../../App';
import { toast } from 'sonner@2.0.3';

interface Mosque {
  id: string;
  name: string;
  address: string;
  state: string;
  district: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  totalMembers: number;
  totalPrograms: number;
  monthlyCollection: number;
  status: 'active' | 'inactive' | 'pending';
  registrationDate: string;
  lastActivity: string;
}

interface SystemStats {
  totalMosques: number;
  activeMosques: number;
  totalMembers: number;
  totalPrograms: number;
  monthlyRevenue: number;
  systemUptime: string;
}

interface AdminPanelProps {
  user: User;
}

export function AdminPanel({ user }: AdminPanelProps) {
  const [selectedTab, setSelectedTab] = useState('mosques');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [showAddMosqueDialog, setShowAddMosqueDialog] = useState(false);

  // Mock data
  const systemStats: SystemStats = {
    totalMosques: 247,
    activeMosques: 231,
    totalMembers: 89453,
    totalPrograms: 1247,
    monthlyRevenue: 2847500,
    systemUptime: '99.9%'
  };

  const mosques: Mosque[] = [
    {
      id: 'masjid_1',
      name: 'Masjid Al-Nur',
      address: 'Jalan Mawar, Taman Seri, 50000 Kuala Lumpur',
      state: 'Kuala Lumpur',
      district: 'Kuala Lumpur',
      adminName: 'Ustaz Abdullah bin Rahman',
      adminEmail: 'admin@masjidalnur.my',
      adminPhone: '019-234-5678',
      totalMembers: 847,
      totalPrograms: 24,
      monthlyCollection: 18750,
      status: 'active',
      registrationDate: '2023-01-15',
      lastActivity: '2025-06-13T10:30:00'
    },
    {
      id: 'masjid_2',
      name: 'Masjid Ar-Rahman',
      address: 'Jalan Kenanga, Bandar Baru, 47000 Petaling Jaya',
      state: 'Selangor',
      district: 'Petaling',
      adminName: 'Ustaz Hassan bin Omar',
      adminEmail: 'admin@masjidarrahman.my',
      adminPhone: '012-345-6789',
      totalMembers: 623,
      totalPrograms: 18,
      monthlyCollection: 14200,
      status: 'active',
      registrationDate: '2023-03-20',
      lastActivity: '2025-06-13T09:15:00'
    },
    {
      id: 'masjid_3',
      name: 'Masjid Al-Hikmah',
      address: 'Jalan Cempaka, Taman Indah, 40000 Shah Alam',
      state: 'Selangor',
      district: 'Klang',
      adminName: 'Ustaz Ahmad bin Ali',
      adminEmail: 'admin@masjidhikmah.my',
      adminPhone: '013-456-7890',
      totalMembers: 1205,
      totalPrograms: 31,
      monthlyCollection: 25600,
      status: 'active',
      registrationDate: '2022-11-10',
      lastActivity: '2025-06-12T16:45:00'
    },
    {
      id: 'masjid_4',
      name: 'Masjid As-Syakirin',
      address: 'Jalan Melur, Bandar Seri, 43000 Kajang',
      state: 'Selangor',
      district: 'Hulu Langat',
      adminName: 'Ustaz Zainuddin bin Hassan',
      adminEmail: 'admin@masjidsyakirin.my',
      adminPhone: '014-567-8901',
      totalMembers: 892,
      totalPrograms: 22,
      monthlyCollection: 16800,
      status: 'pending',
      registrationDate: '2025-06-01',
      lastActivity: '2025-06-10T14:20:00'
    }
  ];

  const filteredMosques = mosques.filter(mosque => {
    const matchesSearch = mosque.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mosque.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mosque.adminName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || mosque.status === statusFilter;
    const matchesState = stateFilter === 'all' || mosque.state === stateFilter;
    
    return matchesSearch && matchesStatus && matchesState;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Aktif</Badge>;
      case 'inactive':
        return <Badge variant="destructive">Tidak Aktif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Menunggu Kelulusan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const malaysianStates = [
    'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Melaka',
    'Negeri Sembilan', 'Pahang', 'Penang', 'Perak', 'Perlis', 'Putrajaya',
    'Sabah', 'Sarawak', 'Selangor', 'Terengganu'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Panel Admin Pusat</h1>
          <p className="text-muted-foreground">
            Pengurusan sistem masjid di seluruh Malaysia
          </p>
        </div>
        <Button onClick={() => setShowAddMosqueDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Daftar Masjid Baru
        </Button>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Jumlah Masjid</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{systemStats.totalMosques}</div>
            <p className="text-xs text-muted-foreground">
              Berdaftar dalam sistem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Masjid Aktif</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600">{systemStats.activeMosques}</div>
            <p className="text-xs text-muted-foreground">
              Beroperasi sepenuhnya
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Jumlah Ahli</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{systemStats.totalMembers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Ahli kariah & khairat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Program Aktif</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{systemStats.totalPrograms}</div>
            <p className="text-xs text-muted-foreground">
              Program dijadualkan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Kutipan Bulanan</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">RM {(systemStats.monthlyRevenue / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">
              Semua masjid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Sistem Uptime</CardTitle>
            <Server className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{systemStats.systemUptime}</div>
            <p className="text-xs text-muted-foreground">
              Bulan ini
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="mosques">Senarai Masjid</TabsTrigger>
          <TabsTrigger value="analytics">Analitik Sistem</TabsTrigger>
          <TabsTrigger value="settings">Tetapan Sistem</TabsTrigger>
        </TabsList>

        <TabsContent value="mosques" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari masjid..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Negeri" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Negeri</SelectItem>
                    {malaysianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Mosques Table */}
          <Card>
            <CardHeader>
              <CardTitle>Senarai Masjid ({filteredMosques.length})</CardTitle>
              <CardDescription>
                Masjid yang berdaftar dalam sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Masjid</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Ahli</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Kutipan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aktiviti Terakhir</TableHead>
                    <TableHead className="text-right">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMosques.map((mosque) => (
                    <TableRow key={mosque.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{mosque.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {mosque.district}, {mosque.state}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{mosque.adminName}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {mosque.adminPhone}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{mosque.totalMembers}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span>{mosque.totalPrograms}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>RM {mosque.monthlyCollection.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(mosque.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(mosque.lastActivity).toLocaleDateString('ms-MY')}</div>
                          <div className="text-muted-foreground">
                            {new Date(mosque.lastActivity).toLocaleTimeString('ms-MY', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Masjid
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Tetapan
                            </DropdownMenuItem>
                            {mosque.status === 'pending' && (
                              <DropdownMenuItem className="text-green-600">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Luluskan
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive">
                              <Trash className="h-4 w-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Taburan Masjid Mengikut Negeri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Selangor</span>
                    <span>89 masjid</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Kuala Lumpur</span>
                    <span>67 masjid</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Johor</span>
                    <span>43 masjid</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Perak</span>
                    <span>31 masjid</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Lain-lain</span>
                    <span>17 masjid</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prestasi Bulanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Pendaftaran Ahli Baru</span>
                    <span className="text-green-600">+1,247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Program Dijadualkan</span>
                    <span className="text-blue-600">234</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Kutipan Yuran</span>
                    <span className="text-green-600">RM 1.2M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tempahan Fasiliti</span>
                    <span className="text-purple-600">189</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tetapan Sistem</CardTitle>
                <CardDescription>
                  Konfigurasi sistem peringkat pusat
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Had Ahli Per Masjid</Label>
                  <Input defaultValue="10000" />
                </div>
                <div className="space-y-2">
                  <Label>Yuran Pembaharuan Tahunan (RM)</Label>
                  <Input defaultValue="1200" />
                </div>
                <div className="space-y-2">
                  <Label>Tempoh Percubaan (Hari)</Label>
                  <Input defaultValue="30" />
                </div>
                <Button>Simpan Tetapan</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sandaran & Keselamatan</CardTitle>
                <CardDescription>
                  Pengurusan data dan keselamatan sistem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Sandaran Automatik</div>
                    <div className="text-sm text-muted-foreground">Harian pada 2:00 AM</div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Sandaran Terakhir</div>
                    <div className="text-sm text-muted-foreground">13 Jun 2025, 2:00 AM</div>
                  </div>
                  <Button variant="outline" size="sm">Lihat</Button>
                </div>
                <Button variant="outline" className="w-full">
                  <Database className="h-4 w-4 mr-2" />
                  Jalankan Sandaran Manual
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Mosque Dialog */}
      <Dialog open={showAddMosqueDialog} onOpenChange={setShowAddMosqueDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Daftar Masjid Baru</DialogTitle>
            <DialogDescription>
              Masukkan maklumat masjid yang ingin didaftarkan dalam sistem
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mosqueName">Nama Masjid</Label>
                <Input id="mosqueName" placeholder="Masjid..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Negeri</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih negeri" />
                  </SelectTrigger>
                  <SelectContent>
                    {malaysianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat Lengkap</Label>
              <Textarea id="address" placeholder="Alamat penuh masjid" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminName">Nama Admin</Label>
                <Input id="adminName" placeholder="Nama penuh admin masjid" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email Admin</Label>
                <Input id="adminEmail" type="email" placeholder="admin@masjid.my" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPhone">No. Telefon Admin</Label>
              <Input id="adminPhone" placeholder="012-345-6789" />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddMosqueDialog(false)}>
                Batal
              </Button>
              <Button onClick={() => {
                toast.success('Masjid baru berjaya didaftarkan');
                setShowAddMosqueDialog(false);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Daftar Masjid
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}