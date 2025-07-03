import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Plus, 
  Search, 
  Heart, 
  DollarSign,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  AlertTriangle,
  Download,
  Users,
  TrendingUp,
  Clock
} from 'lucide-react';
import { User } from '../../App';

interface KhairatMember {
  id: string;
  membershipId: string;
  name: string;
  icNumber: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'suspended';
  monthlyContribution: number;
  totalContributions: number;
  lastPayment: string;
  beneficiaries: string[];
  paymentMethod: 'auto' | 'manual';
}

interface KhairatMembersProps {
  user: User;
}

export function KhairatMembers({ user }: KhairatMembersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Mock data
  const khairatMembers: KhairatMember[] = [
    {
      id: '1',
      membershipId: 'KH001',
      name: 'Ahmad bin Hassan',
      icNumber: '751123-14-5678',
      email: 'ahmad@example.com',
      phone: '019-234-5678',
      address: 'No. 123, Jalan Mawar, Taman Seri, 50000 KL',
      joinDate: '2020-01-15',
      status: 'active',
      monthlyContribution: 50,
      totalContributions: 3000,
      lastPayment: '2025-06-01',
      beneficiaries: ['Fatimah binti Ahmad (Isteri)', 'Ali bin Ahmad (Anak)'],
      paymentMethod: 'auto'
    },
    {
      id: '2',
      membershipId: 'KH002',
      name: 'Siti Khadijah binti Omar',
      icNumber: '820456-03-1234',
      email: 'siti@example.com',
      phone: '012-345-6789',
      address: 'No. 456, Jalan Kenanga, Bandar Baru, 47000 PJ',
      joinDate: '2021-03-20',
      status: 'active',
      monthlyContribution: 30,
      totalContributions: 1440,
      lastPayment: '2025-06-01',
      beneficiaries: ['Muhammad bin Omar (Anak)', 'Aminah binti Omar (Anak)'],
      paymentMethod: 'auto'
    },
    {
      id: '3',
      membershipId: 'KH003',
      name: 'Zainuddin bin Ali',
      icNumber: '690912-08-9876',
      email: 'zainuddin@example.com',
      phone: '013-456-7890',
      address: 'No. 789, Jalan Cempaka, Taman Damai, 40000 Shah Alam',
      joinDate: '2019-11-10',
      status: 'inactive',
      monthlyContribution: 40,
      totalContributions: 2560,
      lastPayment: '2025-03-01',
      beneficiaries: ['Aminah binti Zainuddin (Isteri)'],
      paymentMethod: 'manual'
    },
    {
      id: '4',
      membershipId: 'KH004',
      name: 'Fatimah binti Rahman',
      icNumber: '881234-05-6789',
      email: 'fatimah@example.com',
      phone: '014-567-8901',
      address: 'No. 321, Jalan Melur, Taman Harmoni, 43000 Kajang',
      joinDate: '2022-08-05',
      status: 'suspended',
      monthlyContribution: 25,
      totalContributions: 850,
      lastPayment: '2025-01-01',
      beneficiaries: ['Hassan bin Rahman (Suami)', 'Aisha binti Hassan (Anak)'],
      paymentMethod: 'manual'
    }
  ];

  const filteredMembers = khairatMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.membershipId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.icNumber.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    const matchesPayment = paymentFilter === 'all' || 
                          (paymentFilter === 'current' && isPaymentCurrent(member.lastPayment)) ||
                          (paymentFilter === 'overdue' && !isPaymentCurrent(member.lastPayment));
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const stats = {
    totalMembers: khairatMembers.length,
    activeMembers: khairatMembers.filter(m => m.status === 'active').length,
    totalFunds: khairatMembers.reduce((sum, m) => sum + m.totalContributions, 0),
    monthlyCollection: khairatMembers.filter(m => m.status === 'active').reduce((sum, m) => sum + m.monthlyContribution, 0),
    overdueMembers: khairatMembers.filter(m => !isPaymentCurrent(m.lastPayment)).length
  };

  function isPaymentCurrent(lastPayment: string): boolean {
    const lastPaymentDate = new Date(lastPayment);
    const currentDate = new Date();
    const daysDiff = Math.floor((currentDate.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 35; // Consider current if paid within last 35 days
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Aktif</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Tidak Aktif</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Digantung</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (lastPayment: string) => {
    const isCurrent = isPaymentCurrent(lastPayment);
    return isCurrent ? (
      <Badge className="bg-green-500">Terkini</Badge>
    ) : (
      <Badge variant="destructive">Tertunggak</Badge>
    );
  };

  const canManageKhairat = user.role === 'super_admin' || user.role === 'mosque_admin' || 
                          (user.role === 'ajk' && user.permissions?.includes('manage_khairat'));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Ahli Khairat Kematian</h1>
          <p className="text-muted-foreground">
            Pengurusan ahli dan sumbangan khairat kematian
          </p>
        </div>
        {canManageKhairat && (
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Eksport
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Ahli Khairat
            </Button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Jumlah Ahli</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Ahli khairat berdaftar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Ahli Aktif</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600">{stats.activeMembers}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.activeMembers / stats.totalMembers) * 100)}% daripada jumlah
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Dana Terkumpul</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">RM {stats.totalFunds.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Jumlah sumbangan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Kutipan Bulanan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">RM {stats.monthlyCollection}</div>
            <p className="text-xs text-muted-foreground">
              Sasaran bulanan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Bayaran Tertunggak</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-orange-600">{stats.overdueMembers}</div>
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
                placeholder="Cari ahli khairat..."
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
                <SelectItem value="suspended">Digantung</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status Bayaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bayaran</SelectItem>
                <SelectItem value="current">Terkini</SelectItem>
                <SelectItem value="overdue">Tertunggak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Senarai Ahli Khairat ({filteredMembers.length})</CardTitle>
          <CardDescription>
            Maklumat ahli khairat dan status sumbangan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ahli</TableHead>
                <TableHead>No. IC</TableHead>
                <TableHead>Sumbangan Bulanan</TableHead>
                <TableHead>Jumlah Sumbangan</TableHead>
                <TableHead>Bayaran Terakhir</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Waris</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {member.membershipId}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{member.icNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>RM {member.monthlyContribution}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {member.paymentMethod === 'auto' ? 'Auto Debit' : 'Manual'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>RM {member.totalContributions.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        Sejak {new Date(member.joinDate).getFullYear()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{new Date(member.lastPayment).toLocaleDateString('ms-MY')}</div>
                      {getPaymentStatusBadge(member.lastPayment)}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {member.beneficiaries.length > 0 ? (
                        <>
                          <div>{member.beneficiaries[0]}</div>
                          {member.beneficiaries.length > 1 && (
                            <div className="text-muted-foreground">
                              +{member.beneficiaries.length - 1} lagi
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">Tiada</span>
                      )}
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
                          <Calendar className="h-4 w-4 mr-2" />
                          Sejarah Bayaran
                        </DropdownMenuItem>
                        {canManageKhairat && (
                          <>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {member.status === 'active' && (
                              <DropdownMenuItem className="text-destructive">
                                <Ban className="h-4 w-4 mr-2" />
                                Gantung Ahli
                              </DropdownMenuItem>
                            )}
                            {member.status === 'suspended' && (
                              <DropdownMenuItem className="text-green-600">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Aktifkan Semula
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ahli Bayaran Tertunggak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-orange-600 mb-2">{stats.overdueMembers}</div>
            <Button variant="outline" size="sm" className="w-full">
              Hantar Peringatan
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Laporan Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl mb-2">Jun 2025</div>
            <Button variant="outline" size="sm" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Muat Turun
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Kempen Kutipan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl mb-2">Julai 2025</div>
            <Button variant="outline" size="sm" className="w-full">
              Mulakan Kempen
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}