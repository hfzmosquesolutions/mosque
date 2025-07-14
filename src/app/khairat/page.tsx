'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAuthState } from '@/hooks/useAuth.v2';
import { useKhairat } from '@/hooks/useKhairat';
import { KhairatRecordForm } from '@/components/khairat/KhairatRecordForm';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Calendar,
  Users,
  DollarSign,
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  User,
  Heart,
  Download,
  Phone,
  Mail,
} from 'lucide-react';
import {
  KhairatRecord,
  KhairatRecordWithProfile,
  KhairatPaymentMethod,
  KhairatStatus,
} from '@/types/database';

function KhairatPageContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user: authUser, profile } = useAuthState();
  const {
    records,
    stats,
    loading,
    error,
    userRecords,
    canManageRecords,
    loadRecords,
    deleteRecord,
    exportRecords,
    clearError,
  } = useKhairat();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [currentView, setCurrentView] = useState('list');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<string | undefined>();

  // Handle error with toast
  useEffect(() => {
    if (error) {
      toast.error(error, {
        action: {
          label: t('common.retry'),
          onClick: () => {
            clearError();
            loadRecords();
          },
        },
      });
    }
  }, [error, clearError, loadRecords, t]);

  // Load records on component mount
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const getStatusBadge = (status: KhairatStatus) => {
    const statusConfig = {
      pending: {
        label: t('khairat.statuses.pending'),
        variant: 'secondary' as const,
        icon: Clock,
      },
      approved: {
        label: t('khairat.statuses.approved'),
        variant: 'default' as const,
        icon: CheckCircle,
      },
      paid: {
        label: t('khairat.statuses.paid'),
        variant: 'outline' as const,
        icon: CheckCircle,
      },
      rejected: {
        label: t('khairat.statuses.rejected'),
        variant: 'destructive' as const,
        icon: AlertCircle,
      },
    };
    return statusConfig[status];
  };

  const getPaymentMethodBadge = (method: KhairatPaymentMethod) => {
    const methodConfig = {
      cash: {
        label: t('khairat.paymentMethods.cash'),
        color: 'bg-green-100 text-green-800',
      },
      bank_transfer: {
        label: t('khairat.paymentMethods.bankTransfer'),
        color: 'bg-blue-100 text-blue-800',
      },
      cheque: {
        label: t('khairat.paymentMethods.cheque'),
        color: 'bg-purple-100 text-purple-800',
      },
    };
    return methodConfig[method];
  };

  const filteredRecords = records.filter((record: KhairatRecordWithProfile) => {
    const memberName = record.profiles?.full_name || record.member_name || '';
    const memberEmail = record.profiles?.email || record.member_email || '';
    const matchesSearch =
      memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memberEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || record.status === statusFilter;
    const matchesPaymentMethod =
      paymentMethodFilter === 'all' ||
      record.payment_method === paymentMethodFilter;

    return matchesSearch && matchesStatus && matchesPaymentMethod;
  });

  const statsData = stats || {
    totalRecords: records.length,
    pendingRecords: records.filter((r: KhairatRecord) => r.status === 'pending')
      .length,
    approvedRecords: records.filter(
      (r: KhairatRecord) => r.status === 'approved'
    ).length,
    totalAmount:
      Math.round(
        records.reduce(
          (sum: number, r: KhairatRecord) => sum + (r.contribution_amount || 0),
          0
        ) * 100
      ) / 100,
  };

  // Handler functions
  const handleAddRecord = () => {
    setEditingRecord(undefined);
    setShowForm(true);
  };

  const handleEditRecord = (recordId: string) => {
    setEditingRecord(recordId);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecord(undefined);
  };

  const handleSaveRecord = (formData: any) => {
    // Show success toast
    toast.success(
      editingRecord
        ? t('khairat.recordUpdatedSuccess')
        : t('khairat.recordCreatedSuccess')
    );

    // Refresh records after save
    loadRecords();
    setShowForm(false);
    setEditingRecord(undefined);
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      await deleteRecord(recordId);
      toast.success(t('khairat.recordDeletedSuccess'));
      loadRecords();
    } catch (error) {
      toast.error(t('khairat.recordDeletedError'));
    }
  };

  const handleExportRecords = async () => {
    try {
      await exportRecords();
      toast.success(t('khairat.exportSuccess'));
    } catch (error) {
      toast.error(t('khairat.exportError'));
    }
  };

  // If form is open, show only the form
  if (showForm) {
    return (
      <KhairatRecordForm
        recordId={editingRecord}
        onClose={handleCloseForm}
        onSave={handleSaveRecord}
      />
    );
  }

  const isMember = profile?.role === 'member';

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">{t('common.loading')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            {t('khairat.title')}
          </h1>
          <p className="text-gray-600 mt-1">{t('khairat.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportRecords}>
            <Download className="h-4 w-4 mr-2" />
            {t('common.export')}
          </Button>
          <Button onClick={handleAddRecord}>
            <Plus className="h-4 w-4 mr-2" />
            {t('khairat.addRecord')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('khairat.totalRecords')}
                </p>
                <p className="text-2xl font-bold">{statsData.totalRecords}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('khairat.pendingRecords')}
                </p>
                <p className="text-2xl font-bold">{statsData.pendingRecords}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('khairat.approvedRecords')}
                </p>
                <p className="text-2xl font-bold">
                  {statsData.approvedRecords}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('khairat.totalAmount')}
                </p>
                <p className="text-2xl font-bold">
                  RM {statsData.totalAmount.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content based on user role */}
      {isMember ? (
        <MemberKhairatView
          records={filteredRecords.filter(
            (r: KhairatRecordWithProfile) =>
              (r.profiles?.email || r.member_email) === authUser?.email
          )}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          paymentMethodFilter={paymentMethodFilter}
          setPaymentMethodFilter={setPaymentMethodFilter}
          getStatusBadge={getStatusBadge}
          getPaymentMethodBadge={getPaymentMethodBadge}
          handleEditRecord={handleEditRecord}
        />
      ) : (
        <AdminKhairatView
          records={records}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          paymentMethodFilter={paymentMethodFilter}
          setPaymentMethodFilter={setPaymentMethodFilter}
          getStatusBadge={getStatusBadge}
          getPaymentMethodBadge={getPaymentMethodBadge}
          handleEditRecord={handleEditRecord}
          handleDeleteRecord={handleDeleteRecord}
        />
      )}
    </div>
  );
}

// Member View Component
function MemberKhairatView({
  records,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  paymentMethodFilter,
  setPaymentMethodFilter,
  getStatusBadge,
  getPaymentMethodBadge,
  handleEditRecord,
}: any) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('khairat.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t('khairat.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="pending">
                  {t('khairat.statuses.pending')}
                </SelectItem>
                <SelectItem value="approved">
                  {t('khairat.statuses.approved')}
                </SelectItem>
                <SelectItem value="paid">
                  {t('khairat.statuses.paid')}
                </SelectItem>
                <SelectItem value="rejected">
                  {t('khairat.statuses.rejected')}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={paymentMethodFilter}
              onValueChange={setPaymentMethodFilter}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t('khairat.filterByPaymentMethod')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="cash">
                  {t('khairat.paymentMethods.cash')}
                </SelectItem>
                <SelectItem value="bank_transfer">
                  {t('khairat.paymentMethods.bankTransfer')}
                </SelectItem>
                <SelectItem value="cheque">
                  {t('khairat.paymentMethods.cheque')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* My Records */}
      <Card>
        <CardHeader>
          <CardTitle>{t('khairat.myRecords')}</CardTitle>
          <CardDescription>
            {records.length} {t('common.total').toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('khairat.noRecords')}
              </h3>
              <p className="text-gray-500 mb-6">
                {t('khairat.noRecordsDescription')}
              </p>
              <Button onClick={() => handleEditRecord('new')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('khairat.addFirstRecord')}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('khairat.contributionAmount')}</TableHead>
                    <TableHead>{t('khairat.paymentMethod')}</TableHead>
                    <TableHead>{t('khairat.paymentDate')}</TableHead>
                    <TableHead>{t('khairat.status')}</TableHead>
                    <TableHead>{t('khairat.submittedDate')}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record: KhairatRecordWithProfile) => {
                    const statusBadge = getStatusBadge(record.status);
                    const paymentMethodBadge = getPaymentMethodBadge(
                      record.payment_method
                    );

                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="font-medium">
                            RM {record.contribution_amount}
                          </div>
                          {record.receipt_number && (
                            <div className="text-sm text-gray-500">
                              #{record.receipt_number}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={paymentMethodBadge.color}>
                            {paymentMethodBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(record.payment_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadge.variant}>
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(record.submitted_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditRecord(record.id)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                {t('khairat.viewDetails')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditRecord(record.id)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                {t('common.edit')}
                              </DropdownMenuItem>
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

// Admin View Component
function AdminKhairatView({
  records,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  paymentMethodFilter,
  setPaymentMethodFilter,
  getStatusBadge,
  getPaymentMethodBadge,
  handleEditRecord,
  handleDeleteRecord,
}: any) {
  const { t } = useLanguage();

  const handleDeleteClick = (recordId: string, recordName: string) => {
    toast.promise(handleDeleteRecord(recordId), {
      loading: t('khairat.deletingRecord'),
      success: t('khairat.recordDeletedSuccess'),
      error: t('khairat.recordDeletedError'),
    });
  };

  // Filter records for admin view
  const filteredRecords = records.filter((record: KhairatRecordWithProfile) => {
    const memberName = record.profiles?.full_name || record.member_name || '';
    const memberEmail = record.profiles?.email || record.member_email || '';
    const matchesSearch =
      memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memberEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || record.status === statusFilter;
    const matchesPaymentMethod =
      paymentMethodFilter === 'all' ||
      record.payment_method === paymentMethodFilter;

    return matchesSearch && matchesStatus && matchesPaymentMethod;
  });

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('khairat.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t('khairat.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="pending">
                  {t('khairat.statuses.pending')}
                </SelectItem>
                <SelectItem value="approved">
                  {t('khairat.statuses.approved')}
                </SelectItem>
                <SelectItem value="paid">
                  {t('khairat.statuses.paid')}
                </SelectItem>
                <SelectItem value="rejected">
                  {t('khairat.statuses.rejected')}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={paymentMethodFilter}
              onValueChange={setPaymentMethodFilter}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t('khairat.filterByPaymentMethod')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="cash">
                  {t('khairat.paymentMethods.cash')}
                </SelectItem>
                <SelectItem value="bank_transfer">
                  {t('khairat.paymentMethods.bankTransfer')}
                </SelectItem>
                <SelectItem value="cheque">
                  {t('khairat.paymentMethods.cheque')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records Management */}
      <Card>
        <CardHeader>
          <CardTitle>{t('khairat.recordsManagement')}</CardTitle>
          <CardDescription>
            {filteredRecords.length} {t('common.total').toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('khairat.noRecords')}
              </h3>
              <p className="text-gray-500 mb-6">
                {t('khairat.noRecordsDescription')}
              </p>
              <Button onClick={() => handleEditRecord(undefined)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('khairat.addFirstRecord')}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('khairat.memberName')}</TableHead>
                    <TableHead>{t('khairat.contributionAmount')}</TableHead>
                    <TableHead>{t('khairat.paymentMethod')}</TableHead>
                    <TableHead>{t('khairat.paymentDate')}</TableHead>
                    <TableHead>{t('khairat.status')}</TableHead>
                    <TableHead>{t('khairat.submittedDate')}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record: KhairatRecordWithProfile) => {
                    const statusBadge = getStatusBadge(record.status);
                    const paymentMethodBadge = getPaymentMethodBadge(
                      record.payment_method
                    );

                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {record.profiles?.full_name || record.member_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {(record.profiles?.phone ||
                                record.member_phone) && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {record.profiles?.phone ||
                                    record.member_phone}
                                </div>
                              )}
                              {(record.profiles?.email ||
                                record.member_email) && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {record.profiles?.email ||
                                    record.member_email}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            RM {record.contribution_amount}
                          </div>
                          {record.receipt_number && (
                            <div className="text-sm text-gray-500">
                              #{record.receipt_number}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={paymentMethodBadge.color}>
                            {paymentMethodBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(record.payment_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadge.variant}>
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(record.submitted_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditRecord(record.id)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                {t('khairat.viewDetails')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditRecord(record.id)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                {t('common.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() =>
                                  handleDeleteClick(
                                    record.id,
                                    record.profiles?.full_name ||
                                      record.member_name
                                  )
                                }
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                {t('common.delete')}
                              </DropdownMenuItem>
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

export default function KhairatPage() {
  return (
    <AuthLayout>
      <KhairatPageContent />
    </AuthLayout>
  );
}
