'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAuth } from '@/hooks/useAuth';
import { MemberForm } from '@/components/members/MemberForm';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Users,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  UserPlus,
  UserCheck,
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipNumber: string;
  status: 'active' | 'inactive';
  joinDate: string;
  address: string;
  emergencyContact: string;
  membershipType: 'regular' | 'family' | 'student' | 'senior';
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  occupation?: string;
  emergencyPhone?: string;
  notes?: string;
}

function MembersPageContent() {
  const { t } = useLanguage();
  const { user: authUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<string | undefined>();

  // Sample data - in real app this would come from API
  const [members, setMembers] = useState<Member[]>([
    {
      id: '1',
      name: 'Ahmad Abdullah',
      email: 'ahmad@example.com',
      phone: '+60123456789',
      membershipNumber: 'MEM001',
      status: 'active',
      joinDate: '2024-01-15',
      address: 'Jalan Masjid 1, Kuala Lumpur',
      emergencyContact: '+60123456788',
      membershipType: 'regular',
      dateOfBirth: '1980-05-15',
      gender: 'male',
      occupation: 'Engineer',
    },
    {
      id: '2',
      name: 'Siti Aminah',
      email: 'siti@example.com',
      phone: '+60134567890',
      membershipNumber: 'MEM002',
      status: 'active',
      joinDate: '2024-02-20',
      address: 'Jalan Soleh 2, Petaling Jaya',
      emergencyContact: '+60134567889',
      membershipType: 'family',
      dateOfBirth: '1985-08-22',
      gender: 'female',
      occupation: 'Teacher',
    },
    {
      id: '3',
      name: 'Muhammad Hafiz',
      email: 'hafiz@example.com',
      phone: '+60145678901',
      membershipNumber: 'MEM003',
      status: 'active',
      joinDate: '2024-03-10',
      address: 'Jalan Islam 3, Shah Alam',
      emergencyContact: '+60176543210',
      membershipType: 'student',
      dateOfBirth: '2000-12-10',
      gender: 'male',
      occupation: 'Student',
    },
  ]);

  // Handler functions
  const handleAddMember = () => {
    setEditingMember(undefined);
    setShowForm(true);
  };

  const handleEditMember = (memberId: string) => {
    setEditingMember(memberId);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMember(undefined);
  };

  const handleSaveMember = (formData: any) => {
    console.log('Saving member:', formData);
    // In real app, this would save to API
    if (editingMember) {
      // Update existing member
      setMembers((prev) =>
        prev.map((member) =>
          member.id === editingMember ? { ...member, ...formData } : member
        )
      );
    } else {
      // Add new member
      const newMember: Member = {
        id: `MEM${(members.length + 1).toString().padStart(3, '0')}`,
        ...formData,
        membershipNumber: `MEM${(members.length + 1)
          .toString()
          .padStart(3, '0')}`,
        status: 'active' as const,
        joinDate: new Date().toISOString().split('T')[0],
      };
      setMembers((prev) => [...prev, newMember]);
    }
    setShowForm(false);
    setEditingMember(undefined);
  };

  // If form is open, show only the form
  if (showForm) {
    return (
      <MemberForm
        memberId={editingMember}
        onClose={handleCloseForm}
        onSave={handleSaveMember}
      />
    );
  }

  const getStatusBadge = (status: Member['status']) => {
    const statusConfig = {
      active: {
        label: t('members.activeStatus'),
        variant: 'default' as const,
      },
      inactive: {
        label: t('members.inactiveStatus'),
        variant: 'secondary' as const,
      },
    };
    return statusConfig[status];
  };

  const getTypeBadge = (type: Member['membershipType']) => {
    const typeConfig = {
      regular: {
        label: t('members.types.regular'),
        color: 'bg-blue-100 text-blue-800',
      },
      family: {
        label: t('members.types.family'),
        color: 'bg-purple-100 text-purple-800',
      },
      student: {
        label: t('members.types.student'),
        color: 'bg-yellow-100 text-yellow-800',
      },
      senior: {
        label: t('members.types.senior'),
        color: 'bg-gray-100 text-gray-800',
      },
    };
    return typeConfig[type];
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.membershipNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || member.status === statusFilter;
    const matchesType =
      typeFilter === 'all' || member.membershipType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const statsData = {
    totalMembers: members.length,
    activeMembers: members.filter((m) => m.status === 'active').length,
    newThisMonth: members.filter((m) => {
      const joinDate = new Date(m.joinDate);
      const now = new Date();
      return (
        joinDate.getMonth() === now.getMonth() &&
        joinDate.getFullYear() === now.getFullYear()
      );
    }).length,
    familyMembers: members.filter((m) => m.membershipType === 'family').length,
  };

  const canManageMembers =
    authUser?.role === 'super_admin' ||
    authUser?.role === 'mosque_admin' ||
    authUser?.role === 'ajk';

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('members.title')}
          </h1>
          <p className="text-gray-600 mt-1">{t('members.subtitle')}</p>
        </div>
        {canManageMembers && (
          <Button onClick={handleAddMember}>
            <Plus className="h-4 w-4 mr-2" />
            {t('members.addMember')}
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('members.totalMembers')}
                </p>
                <p className="text-2xl font-bold">{statsData.totalMembers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('members.activeMembers')}
                </p>
                <p className="text-2xl font-bold">{statsData.activeMembers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('members.newThisMonth')}
                </p>
                <p className="text-2xl font-bold">{statsData.newThisMonth}</p>
              </div>
              <UserPlus className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('members.familyMembers')}
                </p>
                <p className="text-2xl font-bold">{statsData.familyMembers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('members.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t('members.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="active">
                  {t('members.activeStatus')}
                </SelectItem>
                <SelectItem value="inactive">
                  {t('members.inactiveStatus')}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t('members.filterByType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="regular">
                  {t('members.types.regular')}
                </SelectItem>
                <SelectItem value="family">
                  {t('members.types.family')}
                </SelectItem>
                <SelectItem value="student">
                  {t('members.types.student')}
                </SelectItem>
                <SelectItem value="senior">
                  {t('members.types.senior')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('members.memberList')}</CardTitle>
          <CardDescription>
            {filteredMembers.length} {t('common.total').toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('members.noMembers')}
              </h3>
              <p className="text-gray-500 mb-6">
                {t('members.noMembersDescription')}
              </p>
              {canManageMembers && (
                <Button onClick={handleAddMember}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('members.addFirstMember')}
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('members.memberNumber')}</TableHead>
                    <TableHead>{t('common.name')}</TableHead>
                    <TableHead>{t('members.membershipType')}</TableHead>
                    <TableHead>{t('common.email')}</TableHead>
                    <TableHead>{t('common.phone')}</TableHead>
                    <TableHead>{t('members.joinDate')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => {
                    const statusBadge = getStatusBadge(member.status);
                    const typeBadge = getTypeBadge(member.membershipType);

                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="font-medium">
                            {member.membershipNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-gray-500">
                              {member.gender === 'male'
                                ? t('members.male')
                                : t('members.female')}
                              {member.occupation && ` • ${member.occupation}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={typeBadge.color}>
                            {typeBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {member.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {member.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(member.joinDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadge.variant}>
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                {t('members.viewDetails')}
                              </DropdownMenuItem>
                              {canManageMembers && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleEditMember(member.id)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    {t('common.edit')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {t('common.delete')}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function MembersPage() {
  return (
    <AuthLayout>
      <MembersPageContent />
    </AuthLayout>
  );
}
