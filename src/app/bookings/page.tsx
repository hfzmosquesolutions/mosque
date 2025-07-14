'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAuthState } from '@/hooks/useAuth.v2';
import { BookingForm } from '@/components/bookings/BookingForm';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Calendar,
  Users,
  MapPin,
  MoreHorizontal,
  Eye,
  Edit,
  Check,
  X,
  Clock,
  CheckCircle,
  DollarSign,
  CalendarDays,
  CalendarCheck,
  Phone,
  Mail,
} from 'lucide-react';

interface Booking {
  id: string;
  facilityName: string;
  eventName: string;
  bookedBy: string;
  contactPhone: string;
  contactEmail: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  purpose: string;
  expectedAttendees: number;
  totalCost: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  bookingDate: string;
  notes?: string;
}

function BookingsPageContent() {
  const { t } = useLanguage();
  const { user: authUser } = useAuthState();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [currentView, setCurrentView] = useState('list');
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<string | undefined>();

  // Sample data - in real app this would come from API
  const [bookings] = useState<Booking[]>([
    {
      id: 'BK001',
      facilityName: 'Dewan Serbaguna',
      eventName: 'Majlis Perkahwinan Anak Ahmad',
      bookedBy: 'En. Ahmad bin Hassan',
      contactPhone: '019-234-5678',
      contactEmail: 'ahmad@example.com',
      eventDate: '2025-07-25',
      startTime: '18:00',
      endTime: '23:00',
      status: 'pending',
      purpose: 'Majlis perkahwinan',
      expectedAttendees: 300,
      totalCost: 1500,
      paymentStatus: 'unpaid',
      bookingDate: '2025-07-10',
      notes: 'Memerlukan sistem bunyi dan mikrofon',
    },
    {
      id: 'BK002',
      facilityName: 'Bilik Kelas 1',
      eventName: 'Kelas Tadika Al-Hikmah',
      bookedBy: 'Ustazah Fatimah',
      contactPhone: '012-345-6789',
      contactEmail: 'fatimah@alhikmah.edu.my',
      eventDate: '2025-07-20',
      startTime: '09:00',
      endTime: '12:00',
      status: 'approved',
      purpose: 'Kelas tadika',
      expectedAttendees: 25,
      totalCost: 200,
      paymentStatus: 'paid',
      bookingDate: '2025-07-01',
    },
    {
      id: 'BK003',
      facilityName: 'Halaman Depan',
      eventName: 'Gotong-royong Komuniti',
      bookedBy: 'MPKJ',
      contactPhone: '03-8000-8000',
      contactEmail: 'komuniti@mpkj.gov.my',
      eventDate: '2025-07-15',
      startTime: '07:00',
      endTime: '12:00',
      status: 'approved',
      purpose: 'Aktiviti gotong-royong',
      expectedAttendees: 50,
      totalCost: 0,
      paymentStatus: 'paid',
      bookingDate: '2025-06-20',
    },
    {
      id: 'BK004',
      facilityName: 'Dewan Utama Masjid',
      eventName: 'Ceramah Motivasi Pemuda',
      bookedBy: 'Persatuan Pemuda Taman Harmoni',
      contactPhone: '011-567-8901',
      contactEmail: 'pemuda@harmoni.org',
      eventDate: '2025-08-05',
      startTime: '20:00',
      endTime: '22:00',
      status: 'pending',
      purpose: 'Ceramah motivasi',
      expectedAttendees: 100,
      totalCost: 500,
      paymentStatus: 'partial',
      bookingDate: '2025-07-12',
      notes: 'Penceramah jemputan dari luar negeri',
    },
  ]);

  // Handler functions
  const handleAddBooking = () => {
    setEditingBooking(undefined);
    setShowForm(true);
  };

  const handleEditBooking = (bookingId: string) => {
    setEditingBooking(bookingId);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBooking(undefined);
  };

  const handleSaveBooking = (formData: any) => {
    console.log('Saving booking:', formData);
    // In real app, this would save to API
    // For now, just close the form
    setShowForm(false);
    setEditingBooking(undefined);
  };

  // If form is open, show only the form
  if (showForm) {
    return (
      <BookingForm
        bookingId={editingBooking}
        onClose={handleCloseForm}
        onSave={handleSaveBooking}
      />
    );
  }

  const getStatusBadge = (status: Booking['status']) => {
    const statusConfig = {
      pending: {
        label: t('bookings.pending'),
        variant: 'secondary' as const,
      },
      approved: { label: t('bookings.approved'), variant: 'default' as const },
      rejected: {
        label: t('bookings.rejected'),
        variant: 'destructive' as const,
      },
      cancelled: {
        label: t('bookings.cancelled'),
        variant: 'outline' as const,
      },
    };
    return statusConfig[status];
  };

  const getPaymentStatusBadge = (paymentStatus: Booking['paymentStatus']) => {
    const statusConfig = {
      unpaid: {
        label: t('bookings.unpaid'),
        color: 'bg-red-100 text-red-800',
      },
      partial: {
        label: t('bookings.partial'),
        color: 'bg-yellow-100 text-yellow-800',
      },
      paid: {
        label: t('bookings.paid'),
        color: 'bg-green-100 text-green-800',
      },
    };
    return statusConfig[paymentStatus];
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bookedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.facilityName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || booking.status === statusFilter;
    const matchesFacility =
      facilityFilter === 'all' || booking.facilityName === facilityFilter;

    return matchesSearch && matchesStatus && matchesFacility;
  });

  const statsData = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter((b) => b.status === 'pending').length,
    approvedBookings: bookings.filter((b) => b.status === 'approved').length,
    totalRevenue: bookings.reduce((sum, b) => sum + b.totalCost, 0),
  };

  const canManageBookings =
    authUser?.role === 'super_admin' ||
    authUser?.role === 'mosque_admin' ||
    authUser?.role === 'ajk';

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('bookings.title')}
          </h1>
          <p className="text-gray-600 mt-1">{t('bookings.subtitle')}</p>
        </div>
        {canManageBookings && (
          <Button onClick={handleAddBooking}>
            <Plus className="h-4 w-4 mr-2" />
            {t('bookings.addBooking')}
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
                  {t('bookings.totalBookings')}
                </p>
                <p className="text-2xl font-bold">{statsData.totalBookings}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('bookings.pendingBookings')}
                </p>
                <p className="text-2xl font-bold">
                  {statsData.pendingBookings}
                </p>
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
                  {t('bookings.approvedBookings')}
                </p>
                <p className="text-2xl font-bold">
                  {statsData.approvedBookings}
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
                  {t('bookings.totalRevenue')}
                </p>
                <p className="text-2xl font-bold">
                  RM {statsData.totalRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
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
                  placeholder={t('bookings.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t('bookings.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="pending">{t('bookings.pending')}</SelectItem>
                <SelectItem value="approved">
                  {t('bookings.approved')}
                </SelectItem>
                <SelectItem value="rejected">
                  {t('bookings.rejected')}
                </SelectItem>
                <SelectItem value="cancelled">
                  {t('bookings.cancelled')}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={facilityFilter} onValueChange={setFacilityFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t('bookings.filterByFacility')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="Dewan Serbaguna">
                  {t('bookings.facilities.dewanSerbaguna')}
                </SelectItem>
                <SelectItem value="Dewan Utama Masjid">
                  {t('bookings.facilities.dewanUtama')}
                </SelectItem>
                <SelectItem value="Bilik Kelas 1">
                  {t('bookings.facilities.bilikKelas')}
                </SelectItem>
                <SelectItem value="Halaman Depan">
                  {t('bookings.facilities.halamanDepan')}
                </SelectItem>
                <SelectItem value="Halaman Belakang">
                  {t('bookings.facilities.halamanBelakang')}
                </SelectItem>
                <SelectItem value="Ruang Meeting">
                  {t('bookings.facilities.ruangMeeting')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('bookings.title')}</CardTitle>
          <CardDescription>
            {filteredBookings.length} {t('common.total').toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <CalendarCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('bookings.noBookings')}
              </h3>
              <p className="text-gray-500 mb-6">
                {t('bookings.noBookingsDescription')}
              </p>
              {canManageBookings && (
                <Button onClick={handleAddBooking}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('bookings.addFirstBooking')}
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('bookings.eventName')}</TableHead>
                    <TableHead>{t('bookings.facility')}</TableHead>
                    <TableHead>{t('bookings.bookedBy')}</TableHead>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('common.time')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('bookings.paymentStatus')}</TableHead>
                    <TableHead>{t('bookings.cost')}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => {
                    const statusBadge = getStatusBadge(booking.status);
                    const paymentBadge = getPaymentStatusBadge(
                      booking.paymentStatus
                    );

                    return (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {booking.eventName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.purpose}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {booking.facilityName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {booking.bookedBy}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {booking.contactPhone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {new Date(booking.eventDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {booking.startTime} - {booking.endTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadge.variant}>
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={paymentBadge.color}>
                            {paymentBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            RM {booking.totalCost.toLocaleString()}
                          </div>
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
                                {t('bookings.viewDetails')}
                              </DropdownMenuItem>
                              {canManageBookings && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleEditBooking(booking.id)
                                    }
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    {t('common.edit')}
                                  </DropdownMenuItem>
                                  {booking.status === 'pending' && (
                                    <>
                                      <DropdownMenuItem>
                                        <Check className="h-4 w-4 mr-2" />
                                        {t('bookings.approve')}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <X className="h-4 w-4 mr-2" />
                                        {t('bookings.reject')}
                                      </DropdownMenuItem>
                                    </>
                                  )}
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

export default function BookingsPage() {
  return (
    <AuthLayout>
      <BookingsPageContent />
    </AuthLayout>
  );
}
