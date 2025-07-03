import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock,
  MapPin,
  MoreHorizontal,
  Eye,
  Edit,
  Check,
  X,
  Users,
  DollarSign,
  Phone,
  Mail
} from 'lucide-react';
import { User } from '../../App';
import { toast } from 'sonner@2.0.3';

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

interface BookingListProps {
  user: User;
}

export function BookingList({ user }: BookingListProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [facilityFilter, setFacilityFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  // Mock data
  const bookings: Booking[] = [
    {
      id: 'BK001',
      facilityName: 'Dewan Serbaguna',
      eventName: 'Majlis Perkahwinan Anak Ahmad',
      bookedBy: 'En. Ahmad bin Hassan',
      contactPhone: '019-234-5678',
      contactEmail: 'ahmad@example.com',
      eventDate: '2025-06-25',
      startTime: '18:00',
      endTime: '23:00',
      status: 'pending',
      purpose: 'Majlis perkahwinan',
      expectedAttendees: 300,
      totalCost: 1500,
      paymentStatus: 'unpaid',
      bookingDate: '2025-06-10',
      notes: 'Memerlukan sistem bunyi dan mikrofon'
    },
    {
      id: 'BK002',
      facilityName: 'Bilik Kelas 1',
      eventName: 'Kelas Tadika Al-Hikmah',
      bookedBy: 'Ustazah Fatimah',
      contactPhone: '012-345-6789',
      contactEmail: 'fatimah@alhikmah.edu.my',
      eventDate: '2025-06-20',
      startTime: '09:00',
      endTime: '12:00',
      status: 'approved',
      purpose: 'Kelas tadika',
      expectedAttendees: 25,
      totalCost: 200,
      paymentStatus: 'paid',
      bookingDate: '2025-06-01'
    },
    {
      id: 'BK003',
      facilityName: 'Halaman Depan',
      eventName: 'Gotong-royong Komuniti',
      bookedBy: 'MPKJ',
      contactPhone: '03-8000-8000',
      contactEmail: 'komuniti@mpkj.gov.my',
      eventDate: '2025-06-15',
      startTime: '07:00',
      endTime: '12:00',
      status: 'approved',
      purpose: 'Aktiviti gotong-royong',
      expectedAttendees: 50,
      totalCost: 0,
      paymentStatus: 'paid',
      bookingDate: '2025-05-20'
    },
    {
      id: 'BK004',
      facilityName: 'Dewan Utama Masjid',
      eventName: 'Ceramah Motivasi Pemuda',
      bookedBy: 'Persatuan Pemuda Taman Harmoni',
      contactPhone: '011-567-8901',
      contactEmail: 'pemuda@harmoni.org',
      eventDate: '2025-07-05',
      startTime: '20:00',
      endTime: '22:00',
      status: 'pending',
      purpose: 'Ceramah motivasi',
      expectedAttendees: 100,
      totalCost: 500,
      paymentStatus: 'partial',
      bookingDate: '2025-06-12',
      notes: 'Penceramah jemputan dari luar negeri'
    }
  ];

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.bookedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.facilityName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesFacility = facilityFilter === 'all' || booking.facilityName === facilityFilter;
    
    return matchesSearch && matchesStatus && matchesFacility;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Menunggu</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Diluluskan</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Ditolak</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Dibayar</Badge>;
      case 'partial':
        return <Badge className="bg-orange-500">Sebahagian</Badge>;
      case 'unpaid':
        return <Badge variant="destructive">Belum Bayar</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleApproval = async (bookingId: string, approve: boolean) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(
        approve ? 'Tempahan telah diluluskan' : 'Tempahan telah ditolak'
      );
      
      setShowApprovalDialog(false);
      setSelectedBooking(null);
    } catch (error) {
      toast.error('Ralat berlaku. Sila cuba lagi.');
    }
  };

  const canManageBookings = user.role === 'super_admin' || user.role === 'mosque_admin';

  const facilities = [
    'Dewan Serbaguna',
    'Dewan Utama Masjid',
    'Bilik Kelas 1',
    'Bilik Kelas 2',
    'Halaman Depan',
    'Dapur Masjid',
    'Bilik Mesyuarat'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Tempahan Fasiliti</h1>
          <p className="text-muted-foreground">
            Uruskan tempahan dewan dan fasiliti masjid
          </p>
        </div>
        {canManageBookings && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tempahan Baru
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Jumlah Tempahan</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{bookings.length}</div>
            <p className="text-xs text-muted-foreground">
              Semua tempahan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Menunggu Kelulusan</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-yellow-600">
              {bookings.filter(b => b.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Perlu tindakan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Tempahan Diluluskan</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600">
              {bookings.filter(b => b.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Bulan ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              RM {bookings.reduce((sum, b) => sum + b.totalCost, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Jumlah tempahan
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
                placeholder="Cari tempahan..."
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
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="approved">Diluluskan</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={facilityFilter} onValueChange={setFacilityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Fasiliti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Fasiliti</SelectItem>
                {facilities.map((facility) => (
                  <SelectItem key={facility} value={facility}>
                    {facility}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Senarai Tempahan ({filteredBookings.length})</CardTitle>
          <CardDescription>
            Tempahan fasiliti dan ruang masjid
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Acara</TableHead>
                <TableHead>Fasiliti</TableHead>
                <TableHead>Tarikh & Masa</TableHead>
                <TableHead>Pempempah</TableHead>
                <TableHead>Peserta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bayaran</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.eventName}</div>
                      <div className="text-sm text-muted-foreground">
                        {booking.purpose}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{booking.facilityName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(booking.eventDate).toLocaleDateString('ms-MY')}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {booking.startTime} - {booking.endTime}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.bookedBy}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {booking.contactPhone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.expectedAttendees}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  <TableCell>
                    <div>
                      <div>RM {booking.totalCost.toLocaleString()}</div>
                      {getPaymentBadge(booking.paymentStatus)}
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
                        {canManageBookings && booking.status === 'pending' && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowApprovalDialog(true);
                              }}
                              className="text-green-600"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Luluskan
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleApproval(booking.id, false)}
                              className="text-red-600"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Tolak
                            </DropdownMenuItem>
                          </>
                        )}
                        {canManageBookings && (
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
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

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Luluskan Tempahan</DialogTitle>
            <DialogDescription>
              Adakah anda pasti ingin meluluskan tempahan ini?
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-2">
                <div><strong>Acara:</strong> {selectedBooking.eventName}</div>
                <div><strong>Fasiliti:</strong> {selectedBooking.facilityName}</div>
                <div><strong>Tarikh:</strong> {new Date(selectedBooking.eventDate).toLocaleDateString('ms-MY')}</div>
                <div><strong>Masa:</strong> {selectedBooking.startTime} - {selectedBooking.endTime}</div>
                <div><strong>Pempempah:</strong> {selectedBooking.bookedBy}</div>
                <div><strong>Peserta:</strong> {selectedBooking.expectedAttendees} orang</div>
                <div><strong>Kos:</strong> RM {selectedBooking.totalCost.toLocaleString()}</div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                  Batal
                </Button>
                <Button onClick={() => handleApproval(selectedBooking.id, true)}>
                  Luluskan Tempahan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}