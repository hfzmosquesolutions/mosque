'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  UserPlus,
  Clock,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  Shield,
  Heart,
  BookOpen,
  Wrench,
  Building,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthState } from '@/hooks/useAuth.v2';
import { useMembers } from '@/hooks/useMembers';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { MemberApplicationForm } from '@/components/members/MemberApplicationForm';
import { supabase } from '@/lib/supabase';

function MembersPageContent() {
  const { t } = useLanguage();
  const { profile } = useAuthState();
  const [selectedMosqueId, setSelectedMosqueId] = useState<string>('');
  const [userMosques, setUserMosques] = useState<any[]>([]);
  const [loadingMosques, setLoadingMosques] = useState(true);

  const {
    members,
    stats: statistics,
    applications,
    loading,
    createApplication,
    updateMember,
    deleteMember,
    approveApplication,
    rejectApplication,
  } = useMembers(selectedMosqueId);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberDetails, setShowMemberDetails] = useState(false);

  // Load user's mosques
  useEffect(() => {
    const loadUserMosques = async () => {
      if (!profile?.id) return;

      try {
        setLoadingMosques(true);
        const { data, error } = await supabase
          .from('members')
          .select(
            `
            id,
            status,
            membership_type,
            mosque_id,
            mosques!inner(
              id,
              name,
              address
            )
          `
          )
          .eq('profile_id', profile.id)
          .in('status', ['active', 'inactive', 'suspended']);

        if (error) throw error;

        const mosquesWithStatus =
          data
            ?.map((membership: any) => ({
              ...membership.mosques,
              membershipStatus: membership.status,
              membershipType: membership.membership_type,
            }))
            .filter(Boolean) || [];
        setUserMosques(mosquesWithStatus);

        // Auto-select first mosque if available
        if (mosquesWithStatus.length > 0 && !selectedMosqueId) {
          setSelectedMosqueId(mosquesWithStatus[0].id);
        }
      } catch (error) {
        console.error('Error loading user mosques:', error);
      } finally {
        setLoadingMosques(false);
      }
    };

    loadUserMosques();
  }, [profile?.id, selectedMosqueId]);

  const isMember = profile?.role === 'member';
  const canManageMembers =
    profile?.role === 'mosque_admin' ||
    profile?.role === 'ajk' ||
    profile?.role === 'super_admin';

  const getMembershipTypeBadge = (type: string) => {
    const types = {
      regular: {
        label: t('members.types.regular'),
        color: 'bg-blue-100 text-blue-800',
        icon: Users,
      },
      committee: {
        label: t('members.types.committee'),
        color: 'bg-purple-100 text-purple-800',
        icon: Shield,
      },
      imam: {
        label: t('members.types.imam'),
        color: 'bg-green-100 text-green-800',
        icon: BookOpen,
      },
      volunteer: {
        label: t('members.types.volunteer'),
        color: 'bg-orange-100 text-orange-800',
        icon: Heart,
      },
      maintenance: {
        label: t('members.types.maintenance'),
        color: 'bg-gray-100 text-gray-800',
        icon: Wrench,
      },
    };
    return types[type as keyof typeof types] || types.regular;
  };

  const getMembershipStatusBadge = (status: string) => {
    const statuses = {
      active: {
        label: t('members.status.active'),
        variant: 'default' as const,
        icon: UserCheck,
      },
      inactive: {
        label: t('members.status.inactive'),
        variant: 'secondary' as const,
        icon: Users,
      },
      suspended: {
        label: t('members.status.suspended'),
        variant: 'destructive' as const,
        icon: Users,
      },
    };
    return statuses[status as keyof typeof statuses] || statuses.active;
  };

  const handleApplyMembership = async (data: any) => {
    try {
      await createApplication(data);
      setShowApplicationForm(false);
    } catch (error) {
      console.error('Error applying for membership:', error);
    }
  };

  const handleSaveMember = async (data: any) => {
    try {
      await updateMember(data.id, data);
    } catch (error) {
      console.error('Error updating member:', error);
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      await deleteMember(id);
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };

  const handleApproveApplication = async (id: string) => {
    try {
      await approveApplication(id);
    } catch (error) {
      console.error('Error approving application:', error);
    }
  };

  const handleRejectApplication = async (id: string) => {
    try {
      await rejectApplication(id);
    } catch (error) {
      console.error('Error rejecting application:', error);
    }
  };

  const filteredMembers = members.filter((member: any) => {
    const matchesSearch =
      member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || member.status === statusFilter;
    const matchesType =
      typeFilter === 'all' || member.membership_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loadingMosques) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }
  {
  }
  if (userMosques.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('members.noMosqueAccess')}
          </h3>
          <p className="text-gray-600 mb-4">
            {t('members.noMosqueAccessDescription')}
          </p>
          <Button onClick={() => setShowApplicationForm(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            {t('members.applyMembership')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('members.title')}
          </h1>
          <p className="text-muted-foreground">{t('members.description')}</p>
        </div>
        {canManageMembers && (
          <Button onClick={() => setShowApplicationForm(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t('members.addMember')}
          </Button>
        )}
      </div>

      {/* Application Form Modal */}
      {showApplicationForm && (
        <MemberApplicationForm
          onSave={handleApplyMembership}
          onClose={() => setShowApplicationForm(false)}
        />
      )}

      {/* Main Content - Hidden when application form is shown */}
      {!showApplicationForm && (
        <>
          {/* Mosque Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {t('members.selectMosque')}
              </CardTitle>
              <CardDescription>
                {t('members.selectMosqueDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedMosqueId}
                onValueChange={setSelectedMosqueId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('members.chooseMosque')} />
                </SelectTrigger>
                <SelectContent>
                  {userMosques.map((mosque: any) => {
                    const status = mosque.membershipStatus || 'unknown';
                    const statusColors = {
                      active: 'text-green-600',
                      inactive: 'text-yellow-600',
                      suspended: 'text-red-600',
                      unknown: 'text-gray-600',
                    };

                    return (
                      <SelectItem key={mosque.id} value={mosque.id}>
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{mosque.name}</span>
                            <span
                              className={`text-xs font-medium ${
                                statusColors[
                                  status as keyof typeof statusColors
                                ]
                              }`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </div>
                          {mosque.address && (
                            <span className="text-sm text-gray-500">
                              {mosque.address}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Apply for Additional Membership */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    Apply for Additional Membership
                  </h3>
                  <p className="text-sm text-gray-600">
                    Join another mosque community
                  </p>
                </div>
                <Button
                  onClick={() => setShowApplicationForm(true)}
                  variant="outline"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('members.applyMembership')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Membership Status Alert */}
          {selectedMosqueId &&
            userMosques.length > 0 &&
            (() => {
              const selectedMosque = userMosques.find(
                (m) => m.id === selectedMosqueId
              );
              const status = selectedMosque?.membershipStatus;

              if (status === 'inactive') {
                return (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">Membership Inactive</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        Your membership for {selectedMosque?.name} is currently
                        inactive. Please contact the mosque administration for
                        assistance.
                      </p>
                    </CardContent>
                  </Card>
                );
              }

              if (status === 'suspended') {
                return (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-red-800">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">
                          Membership Suspended
                        </span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">
                        Your membership for {selectedMosque?.name} has been
                        suspended. Please contact the mosque administration for
                        more information.
                      </p>
                    </CardContent>
                  </Card>
                );
              }

              return null;
            })()}

          {!selectedMosqueId ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('members.selectMosqueFirst')}
              </h3>
              <p className="text-gray-600">
                {t('members.selectMosqueFirstDescription')}
              </p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>{t('common.loading')}</p>
              </div>
            </div>
          ) : isMember ? (
            <MemberMembersView
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              filteredMembers={filteredMembers}
              getMembershipTypeBadge={getMembershipTypeBadge}
              getMembershipStatusBadge={getMembershipStatusBadge}
              profile={profile}
              t={t}
            />
          ) : (
            <AdminMembersView
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              filteredMembers={filteredMembers}
              getMembershipTypeBadge={getMembershipTypeBadge}
              getMembershipStatusBadge={getMembershipStatusBadge}
              statistics={statistics}
              applications={applications}
              canManageMembers={canManageMembers}
              handleDeleteMember={handleDeleteMember}
              handleApproveApplication={handleApproveApplication}
              handleRejectApplication={handleRejectApplication}
              setShowApplicationForm={setShowApplicationForm}
              loading={loading}
              t={t}
            />
          )}
        </>
      )}
    </div>
  );
}

function MemberMembersView({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  filteredMembers,
  getMembershipTypeBadge,
  getMembershipStatusBadge,
  profile,
  t,
}: any) {
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('members.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('members.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="active">
                {t('members.status.active')}
              </SelectItem>
              <SelectItem value="inactive">
                {t('members.status.inactive')}
              </SelectItem>
              <SelectItem value="suspended">
                {t('members.status.suspended')}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('members.filterByType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="regular">
                {t('members.types.regular')}
              </SelectItem>
              <SelectItem value="committee">
                {t('members.types.committee')}
              </SelectItem>
              <SelectItem value="imam">{t('members.types.imam')}</SelectItem>
              <SelectItem value="volunteer">
                {t('members.types.volunteer')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('members.myMembership')}</CardTitle>
          <CardDescription>
            {t('members.myMembershipDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {t('members.table.name')}
                  </label>
                  <p className="text-lg font-semibold">{profile.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {t('members.table.email')}
                  </label>
                  <p className="text-lg">{profile.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {t('members.table.type')}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const typeBadge = getMembershipTypeBadge(
                        profile.membership_type
                      );
                      const TypeIcon = typeBadge?.icon;
                      return (
                        <>
                          {TypeIcon && <TypeIcon className="h-4 w-4" />}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${typeBadge?.color}`}
                          >
                            {typeBadge?.label}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {t('members.table.status')}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const statusBadge = getMembershipStatusBadge(
                        profile.status
                      );
                      const StatusIcon = statusBadge?.icon;
                      return (
                        <>
                          {StatusIcon && <StatusIcon className="h-4 w-4" />}
                          <Badge variant={statusBadge?.variant}>
                            {statusBadge?.label}
                          </Badge>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('members.allMembers')}</CardTitle>
          <CardDescription>
            {t('members.allMembersDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('members.table.name')}</TableHead>
                <TableHead>{t('members.table.email')}</TableHead>
                <TableHead>{t('members.table.type')}</TableHead>
                <TableHead>{t('members.table.status')}</TableHead>
                <TableHead>{t('members.table.joinedDate')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member: any) => {
                const typeBadge = getMembershipTypeBadge(
                  member.membership_type
                );
                const statusBadge = getMembershipStatusBadge(member.status);
                const TypeIcon = typeBadge?.icon;
                const StatusIcon = statusBadge?.icon;

                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.full_name}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {TypeIcon && <TypeIcon className="h-4 w-4" />}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${typeBadge?.color}`}
                        >
                          {typeBadge?.label}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {StatusIcon && <StatusIcon className="h-4 w-4" />}
                        <Badge variant={statusBadge?.variant}>
                          {statusBadge?.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(member.joined_date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function AdminMembersView({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  filteredMembers,
  getMembershipTypeBadge,
  getMembershipStatusBadge,
  statistics,
  applications,
  canManageMembers,
  handleDeleteMember,
  handleApproveApplication,
  handleRejectApplication,
  setShowApplicationForm,
  loading,
  t,
}: any) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('members.stats.total')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('members.stats.active')}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.active || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('members.stats.pending')}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('members.stats.committee')}
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.committee || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">{t('members.tabs.list')}</TabsTrigger>
          {canManageMembers && (
            <TabsTrigger value="applications">
              {t('members.tabs.applications')}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('members.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t('members.filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="active">
                    {t('members.status.active')}
                  </SelectItem>
                  <SelectItem value="inactive">
                    {t('members.status.inactive')}
                  </SelectItem>
                  <SelectItem value="suspended">
                    {t('members.status.suspended')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t('members.filterByType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="regular">
                    {t('members.types.regular')}
                  </SelectItem>
                  <SelectItem value="committee">
                    {t('members.types.committee')}
                  </SelectItem>
                  <SelectItem value="imam">
                    {t('members.types.imam')}
                  </SelectItem>
                  <SelectItem value="volunteer">
                    {t('members.types.volunteer')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('members.table.title')}</CardTitle>
              <CardDescription>
                {t('members.table.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('members.table.name')}</TableHead>
                    <TableHead>{t('members.table.email')}</TableHead>
                    <TableHead>{t('members.table.type')}</TableHead>
                    <TableHead>{t('members.table.status')}</TableHead>
                    <TableHead>{t('members.table.joinedDate')}</TableHead>
                    {canManageMembers && (
                      <TableHead className="text-right">
                        {t('common.actions')}
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member: any) => {
                    const typeBadge = getMembershipTypeBadge(
                      member.membership_type
                    );
                    const statusBadge = getMembershipStatusBadge(member.status);
                    const TypeIcon = typeBadge?.icon;
                    const StatusIcon = statusBadge?.icon;

                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.full_name}
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {TypeIcon && <TypeIcon className="h-4 w-4" />}
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${typeBadge?.color}`}
                            >
                              {typeBadge?.label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {StatusIcon && <StatusIcon className="h-4 w-4" />}
                            <Badge variant={statusBadge?.variant}>
                              {statusBadge?.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(member.joined_date).toLocaleDateString()}
                        </TableCell>
                        {canManageMembers && (
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {t('common.view')}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  {t('common.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteMember(member.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t('common.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {canManageMembers && (
          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('members.pendingApplications')}</CardTitle>
                <CardDescription>
                  {t('members.pendingApplicationsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">
                      {t('members.noPendingApplications')}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('members.table.name')}</TableHead>
                        <TableHead>{t('members.table.email')}</TableHead>
                        <TableHead>{t('members.table.type')}</TableHead>
                        <TableHead>{t('members.table.appliedDate')}</TableHead>
                        <TableHead className="text-right">
                          {t('common.actions')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((application: any) => {
                        const typeBadge = getMembershipTypeBadge(
                          application.membership_type
                        );
                        const TypeIcon = typeBadge?.icon;

                        return (
                          <TableRow key={application.id}>
                            <TableCell className="font-medium">
                              {application.full_name}
                            </TableCell>
                            <TableCell>{application.email}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {TypeIcon && <TypeIcon className="h-4 w-4" />}
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${typeBadge?.color}`}
                                >
                                  {typeBadge?.label}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(
                                application.created_at
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleApproveApplication(application.id)
                                  }
                                  disabled={loading}
                                >
                                  {t('common.approve')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleRejectApplication(application.id)
                                  }
                                  disabled={loading}
                                >
                                  {t('common.reject')}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}

export default function MembersPage() {
  return (
    <AuthLayout>
      <MembersPageContent />
    </AuthLayout>
  );
}
