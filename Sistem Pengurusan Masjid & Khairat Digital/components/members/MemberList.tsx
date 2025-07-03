import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  UserX,
  Download,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { User } from '../../App';

interface Member {
  id: string;
  icNumber: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  membershipType: 'kariah' | 'khairat' | 'both';
  status: 'active' | 'inactive' | 'suspended';
  joinDate: string;
  lastPayment?: string;
  totalContributions: number;
}

interface MemberListProps {
  user: User;
}

export function MemberList({ user }: MemberListProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Mock data - in real app, this would come from API
  const members: Member[] = [
    {
      id: '1',
      icNumber: '850123-14-5678',
      name: 'Ahmad Zainuddin bin Abdullah',
      email: 'ahmad.zainuddin@example.com',
      phone: '019-234-5678',
      address: 'No. 123, Jalan Mawar, Taman Seri, 50000 Kuala Lumpur',
      membershipType: 'both',
      status: 'active',
      joinDate: '2023-01-15',
      lastPayment: '2025-06-01',
      totalContributions: 2400
    },
    {
      id: '2',
      icNumber: '920456-03-1234',
      name: 'Fatimah binti Hassan',
      email: 'fatimah.hassan@example.com',
      phone: '012-345-6789',
      address: 'No. 456, Jalan Kenanga, Taman Damai, 47000 Petaling Jaya',
      membershipType: 'kariah',
      status: 'active',
      joinDate: '2023-03-22',
      lastPayment: '2025-05-15',
      totalContributions: 1800
    },
    {
      id: '3',
      icNumber: '780912-08-9876',
      name: 'Muhammad Rizqi bin Omar',
      email: 'rizqi.omar@example.com',
      phone: '013-456-7890',
      address: 'No. 789, Jalan Cempaka, Bandar Baru, 40000 Shah Alam',
      membershipType: 'khairat',
      status: 'inactive',
      joinDate: '2022-11-10',
      lastPayment: '2025-04-01',
      totalContributions: 3200
    },
    {
      id: '4',
      icNumber: '901234-05-6789',
      name: 'Siti Nurhaliza binti Ahmad',
      email: 'siti.nurhaliza@example.com',
      phone: '014-567-8901',
      address: 'No. 321, Jalan Melur, Taman Harmoni, 43000 Kajang',
      membershipType: 'both',
      status: 'suspended',
      joinDate: '2023-08-05',
      lastPayment: '2025-03-20',
      totalContributions: 1200
    }
  ];

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.icNumber.includes(searchTerm) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesType = typeFilter === 'all' || member.membershipType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

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

  const getTypeBadge = (type: string) => {
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

  const handleSuspendMember = (member: Member) => {
    setSelectedMember(member);
    setShowSuspendDialog(true);
  };

  const canManageMembers = user.role === 'super_admin' || user.role === 'mosque_admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Pengurusan Ahli Kariah</h1>
          <p className="text-muted-foreground">
            Uruskan maklumat ahli kariah dan khairat
          </p>
        </div>
        {canManageMembers && (
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Eksport
            </Button>
            <Button onClick={() => navigate('/ahli/baru')}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Ahli
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari ahli (nama, IC, email)..."
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Jenis Ahli" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="kariah">Kariah</SelectItem>
                <SelectItem value="khairat">Khairat</SelectItem>
                <SelectItem value="both">Kariah + Khairat</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Senarai Ahli ({filteredMembers.length})</CardTitle>
          <CardDescription>
            Maklumat lengkap ahli kariah dan khairat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ahli</TableHead>
                <TableHead>No. IC</TableHead>
                <TableHead>Hubungan</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tarikh Daftar</TableHead>
                <TableHead>Bayaran Terakhir</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {member.phone}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{member.icNumber}</TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground flex items-start gap-1">
                      <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{member.address}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(member.membershipType)}</TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell>
                    {new Date(member.joinDate).toLocaleDateString('ms-MY')}
                  </TableCell>
                  <TableCell>
                    {member.lastPayment ? (
                      <div>
                        <div>{new Date(member.lastPayment).toLocaleDateString('ms-MY')}</div>
                        <div className="text-xs text-muted-foreground">
                          RM {member.totalContributions.toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/ahli/${member.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Lihat Detail
                        </DropdownMenuItem>
                        {canManageMembers && (
                          <>
                            <DropdownMenuItem onClick={() => navigate(`/ahli/${member.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSuspendMember(member)}
                              className="text-destructive"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Gantung Ahli
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

      {/* Suspend Member Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gantung Keahlian</DialogTitle>
            <DialogDescription>
              Adakah anda pasti ingin menggantung keahlian {selectedMember?.name}?
              Tindakan ini akan menghalang ahli daripada mengakses perkhidmatan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={() => setShowSuspendDialog(false)}>
              Gantung Ahli
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}