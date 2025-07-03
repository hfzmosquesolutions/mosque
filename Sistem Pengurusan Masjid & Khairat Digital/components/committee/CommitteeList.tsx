import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  Plus, 
  Search, 
  Users, 
  Phone,
  Mail,
  Calendar,
  MapPin,
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
  UserPlus,
  Crown,
  Shield,
  User as UserIcon
} from 'lucide-react';
import { User } from '../../App';
import { toast } from 'sonner@2.0.3';

interface CommitteeMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'resigned';
  permissions: string[];
  address: string;
  icNumber: string;
  emergencyContact: string;
  emergencyPhone: string;
}

interface CommitteeListProps {
  user: User;
}

export function CommitteeList({ user }: CommitteeListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Mock data
  const committeeMembers: CommitteeMember[] = [
    {
      id: '1',
      name: 'Ustaz Abdullah bin Rahman',
      email: 'abdullah@masjidalnur.my',
      phone: '019-234-5678',
      position: 'Imam',
      department: 'Urusan Agama',
      joinDate: '2020-01-15',
      status: 'active',
      permissions: ['manage_programs', 'manage_members', 'view_finance'],
      address: 'No. 123, Jalan Mawar, Taman Seri',
      icNumber: '750123-14-5678',
      emergencyContact: 'Puan Fatimah',
      emergencyPhone: '012-345-6789'
    },
    {
      id: '2',
      name: 'En. Ahmad bin Hassan',
      email: 'ahmad@masjidalnur.my',
      phone: '012-345-6789',
      position: 'Bendahari',
      department: 'Kewangan',
      joinDate: '2020-03-01',
      status: 'active',
      permissions: ['manage_finance', 'view_members'],
      address: 'No. 456, Jalan Kenanga, Taman Damai',
      icNumber: '680912-05-1234',
      emergencyContact: 'En. Hassan',
      emergencyPhone: '013-456-7890'
    },
    {
      id: '3',
      name: 'Ustaz Hassan bin Omar',
      email: 'hassan@masjidalnur.my',
      phone: '013-456-7890',
      position: 'Setiausaha',
      department: 'Pentadbiran',
      joinDate: '2020-05-20',
      status: 'active',
      permissions: ['manage_programs', 'view_members'],
      address: 'No. 789, Jalan Melati, Bandar Baru',
      icNumber: '720456-08-9876',
      emergencyContact: 'Ustazah Khadijah',
      emergencyPhone: '014-567-8901'
    },
    {
      id: '4',
      name: 'En. Muhammad bin Ali',
      email: 'muhammad@masjidalnur.my',
      phone: '014-567-8901',
      position: 'AJK Khairat',
      department: 'Khairat',
      joinDate: '2021-02-10',
      status: 'active',
      permissions: ['manage_khairat', 'view_members'],
      address: 'No. 321, Jalan Cempaka, Taman Harmoni',
      icNumber: '850789-03-5678',
      emergencyContact: 'Puan Aminah',
      emergencyPhone: '015-678-9012'
    },
    {
      id: '5',
      name: 'En. Zainuddin bin Ahmad',
      email: 'zainuddin@masjidalnur.my',
      phone: '015-678-9012',
      position: 'AJK Program',
      department: 'Program & Aktiviti',
      joinDate: '2021-08-15',
      status: 'resigned',
      permissions: ['manage_programs'],
      address: 'No. 654, Jalan Orkid, Taman Indah',
      icNumber: '770321-14-2468',
      emergencyContact: 'En. Ahmad',
      emergencyPhone: '016-789-0123'
    }
  ];

  const filteredMembers = committeeMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || member.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Aktif</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Tidak Aktif</Badge>;
      case 'resigned':
        return <Badge variant="destructive">Meletak Jawatan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPositionIcon = (position: string) => {
    if (position.toLowerCase().includes('imam')) {
      return <Crown className="h-4 w-4 text-yellow-500" />;
    } else if (position.toLowerCase().includes('bendahari')) {
      return <Shield className="h-4 w-4 text-blue-500" />;
    } else {
      return <UserIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const departments = [
    'Urusan Agama',
    'Kewangan',
    'Pentadbiran',
    'Program & Aktiviti',
    'Khairat',
    'Fasiliti',
    'Komunikasi'
  ];

  const positions = [
    'Imam',
    'Bendahari',
    'Setiausaha',
    'AJK Khairat',
    'AJK Program',
    'AJK Fasiliti',
    'AJK Komunikasi'
  ];

  const canManageCommittee = user.role === 'super_admin' || user.role === 'mosque_admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>AJK Masjid</h1>
          <p className="text-muted-foreground">
            Pengurusan Ahli Jawatankuasa Masjid
          </p>
        </div>
        {canManageCommittee && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah AJK
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Jumlah AJK</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{committeeMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              Ahli jawatankuasa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">AJK Aktif</CardTitle>
            <UserIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600">
              {committeeMembers.filter(m => m.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Bertugas aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Jabatan</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{departments.length}</div>
            <p className="text-xs text-muted-foreground">
              Jabatan berbeza
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Tempoh Purata</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">4.2</div>
            <p className="text-xs text-muted-foreground">
              Tahun berkhidmat
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
                placeholder="Cari AJK..."
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
                <SelectItem value="resigned">Meletak Jawatan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Jabatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jabatan</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Committee Table */}
      <Card>
        <CardHeader>
          <CardTitle>Senarai AJK ({filteredMembers.length})</CardTitle>
          <CardDescription>
            Maklumat ahli jawatankuasa masjid
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama & Jawatan</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Hubungan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tarikh Lantikan</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {getPositionIcon(member.position)}
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {member.position}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{member.department}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1 mb-1">
                        <Phone className="h-3 w-3" />
                        {member.phone}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(member.joinDate).toLocaleDateString('ms-MY')}
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
                        {canManageCommittee && (
                          <>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash className="h-4 w-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
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

      {/* Add Committee Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah AJK Baru</DialogTitle>
            <DialogDescription>
              Masukkan maklumat ahli jawatankuasa baru
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Penuh</Label>
                <Input id="name" placeholder="Nama penuh AJK" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icNumber">No. IC</Label>
                <Input id="icNumber" placeholder="123456-78-9012" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Jawatan</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jawatan" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Jabatan</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jabatan" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">No. Telefon</Label>
                <Input id="phone" placeholder="012-345-6789" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Textarea id="address" placeholder="Alamat penuh" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Nama Waris</Label>
                <Input id="emergencyContact" placeholder="Nama orang untuk dihubungi" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Telefon Waris</Label>
                <Input id="emergencyPhone" placeholder="012-345-6789" />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Batal
              </Button>
              <Button onClick={() => {
                toast.success('AJK baru berjaya ditambah');
                setShowAddDialog(false);
              }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Tambah AJK
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}