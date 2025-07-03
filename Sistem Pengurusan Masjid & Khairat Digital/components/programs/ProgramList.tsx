import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  MapPin,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash,
  Clock,
  CheckCircle,
  DollarSign,
  CalendarDays,
  List
} from 'lucide-react';
import { User } from '../../App';

interface Program {
  id: string;
  title: string;
  type: 'ceramah' | 'kelas' | 'kenduri' | 'gotong-royong' | 'lain';
  description: string;
  date: string;
  time: string;
  location: string;
  speaker?: string;
  maxParticipants?: number;
  currentParticipants: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  organizer: string;
  cost: number;
  registrationRequired: boolean;
}

interface ProgramListProps {
  user: User;
}

export function ProgramList({ user }: ProgramListProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Mock data
  const programs: Program[] = [
    {
      id: '1',
      title: 'Ceramah Maghrib - Tema: Akhlak Islamiah',
      type: 'ceramah',
      description: 'Ceramah mingguan selepas solat Maghrib tentang akhlak dalam Islam',
      date: '2025-06-15',
      time: '19:30',
      location: 'Dewan Utama Masjid',
      speaker: 'Ustaz Abdullah Rahman',
      maxParticipants: 100,
      currentParticipants: 65,
      status: 'upcoming',
      organizer: 'Ustaz Hassan',
      cost: 0,
      registrationRequired: false
    },
    {
      id: '2',
      title: 'Kelas Mengaji Al-Quran Dewasa',
      type: 'kelas',
      description: 'Kelas mingguan untuk pembelajaran bacaan Al-Quran bagi orang dewasa',
      date: '2025-06-16',
      time: '20:00',
      location: 'Bilik Kelas 1',
      speaker: 'Ustazah Fatimah',
      maxParticipants: 30,
      currentParticipants: 28,
      status: 'ongoing',
      organizer: 'Ustazah Fatimah',
      cost: 0,
      registrationRequired: true
    },
    {
      id: '3',
      title: 'Gotong-royong Membersih Masjid',
      type: 'gotong-royong',
      description: 'Aktiviti bersama membersihkan kawasan masjid dan taman',
      date: '2025-06-17',
      time: '08:00',
      location: 'Kawasan Masjid',
      currentParticipants: 15,
      status: 'upcoming',
      organizer: 'En. Ahmad (Bendahari)',
      cost: 0,
      registrationRequired: false
    },
    {
      id: '4',
      title: 'Kenduri Aqiqah Keluarga Zainuddin',
      type: 'kenduri',
      description: 'Majlis aqiqah anak En. Zainuddin, jemput semua jemaah',
      date: '2025-06-20',
      time: '12:30',
      location: 'Dewan Serbaguna',
      currentParticipants: 120,
      status: 'upcoming',
      organizer: 'En. Zainuddin',
      cost: 500,
      registrationRequired: false
    },
    {
      id: '5',
      title: 'Ceramah Jumaat - Bulan Ramadan',
      type: 'ceramah',
      description: 'Ceramah khusus menyambut bulan Ramadan Al-Mubarak',
      date: '2025-05-30',
      time: '13:00',
      location: 'Dewan Utama Masjid',
      speaker: 'Ustaz Dr. Mahmud',
      currentParticipants: 200,
      status: 'completed',
      organizer: 'Ustaz Hassan',
      cost: 200,
      registrationRequired: false
    },
    // Additional programs for calendar view
    {
      id: '6',
      title: 'Program Kanak-kanak',
      type: 'kelas',
      description: 'Aktiviti belajar dan bermain untuk kanak-kanak',
      date: '2025-06-22',
      time: '16:00',
      location: 'Dewan Serbaguna',
      speaker: 'Cikgu Aminah',
      maxParticipants: 50,
      currentParticipants: 32,
      status: 'upcoming',
      organizer: 'Ustazah Khadijah',
      cost: 0,
      registrationRequired: true
    },
    {
      id: '7',
      title: 'Majlis Tahlil Bulanan',
      type: 'ceramah',
      description: 'Majlis tahlil dan doa selamat bulanan',
      date: '2025-06-25',
      time: '20:30',
      location: 'Dewan Utama Masjid',
      currentParticipants: 80,
      status: 'upcoming',
      organizer: 'Ustaz Ahmad',
      cost: 0,
      registrationRequired: false
    }
  ];

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (program.speaker && program.speaker.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || program.status === statusFilter;
    const matchesType = typeFilter === 'all' || program.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" />Akan Datang</Badge>;
      case 'ongoing':
        return <Badge className="bg-green-500"><Calendar className="h-3 w-3 mr-1" />Sedang Berjalan</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500"><CheckCircle className="h-3 w-3 mr-1" />Selesai</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabels = {
      'ceramah': 'Ceramah',
      'kelas': 'Kelas',
      'kenduri': 'Kenduri',
      'gotong-royong': 'Gotong-royong',
      'lain': 'Lain-lain'
    };
    return <Badge variant="outline">{typeLabels[type as keyof typeof typeLabels]}</Badge>;
  };

  // Calendar view helper functions
  const generateCalendarDays = (month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
    const firstDay = new Date(year, monthNum - 1, 1);
    const lastDay = new Date(year, monthNum, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getProgramsForDate = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredPrograms.filter(program => program.date === dateStr);
  };

  const canManagePrograms = user.role === 'super_admin' || user.role === 'mosque_admin' || 
                           (user.role === 'ajk' && user.permissions?.includes('manage_programs'));

  const CalendarView = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const days = generateCalendarDays(selectedMonth);
    const dayNames = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Kalendar Program</CardTitle>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025-06">Jun 2025</SelectItem>
                <SelectItem value="2025-07">Julai 2025</SelectItem>
                <SelectItem value="2025-08">Ogos 2025</SelectItem>
                <SelectItem value="2025-05">Mei 2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center font-medium text-sm bg-muted rounded">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="h-24 border rounded"></div>;
              }
              
              const dayPrograms = getProgramsForDate(year, month, day);
              const isToday = new Date().toDateString() === new Date(year, month - 1, day).toDateString();
              
              return (
                <div 
                  key={day} 
                  className={`h-24 border rounded p-1 overflow-hidden ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}
                >
                  <div className={`text-sm mb-1 ${isToday ? 'font-medium text-blue-600' : ''}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayPrograms.slice(0, 2).map(program => (
                      <div 
                        key={program.id}
                        className="text-xs p-1 bg-green-100 text-green-800 rounded cursor-pointer hover:bg-green-200"
                        onClick={() => navigate(`/program/${program.id}`)}
                      >
                        <div className="font-medium truncate">{program.time}</div>
                        <div className="truncate">{program.title}</div>
                      </div>
                    ))}
                    {dayPrograms.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayPrograms.length - 2} lagi
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Program & Aktiviti</h1>
          <p className="text-muted-foreground">
            Pengurusan program dan aktiviti masjid
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4 mr-2" />
              Senarai
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="rounded-l-none"
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Kalendar
            </Button>
          </div>
          {canManagePrograms && (
            <Button onClick={() => navigate('/program/baru')}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Program
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari program..."
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
                <SelectItem value="upcoming">Akan Datang</SelectItem>
                <SelectItem value="ongoing">Sedang Berjalan</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Jenis Program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="ceramah">Ceramah</SelectItem>
                <SelectItem value="kelas">Kelas</SelectItem>
                <SelectItem value="kenduri">Kenduri</SelectItem>
                <SelectItem value="gotong-royong">Gotong-royong</SelectItem>
                <SelectItem value="lain">Lain-lain</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content based on view mode */}
      {viewMode === 'calendar' ? (
        <CalendarView />
      ) : (
        <>
          {/* Programs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Senarai Program ({filteredPrograms.length})</CardTitle>
              <CardDescription>
                Program dan aktiviti yang dijadualkan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program</TableHead>
                    <TableHead>Tarikh & Masa</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Penceramah/PIC</TableHead>
                    <TableHead>Peserta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrograms.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{program.title}</div>
                          <div className="flex items-center gap-2">
                            {getTypeBadge(program.type)}
                            {program.cost > 0 && (
                              <Badge variant="secondary">RM {program.cost}</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {program.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div>{new Date(program.date).toLocaleDateString('ms-MY')}</div>
                            <div className="text-sm text-muted-foreground">{program.time}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{program.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {program.speaker || program.organizer}
                          </div>
                          {program.speaker && program.organizer !== program.speaker && (
                            <div className="text-sm text-muted-foreground">
                              PIC: {program.organizer}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div>{program.currentParticipants}</div>
                            {program.maxParticipants && (
                              <div className="text-sm text-muted-foreground">
                                / {program.maxParticipants}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(program.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/program/${program.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            {canManagePrograms && (
                              <>
                                <DropdownMenuItem onClick={() => navigate(`/program/${program.id}/edit`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Salin Program
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

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Program Bulan Ini</p>
                    <p className="text-2xl">{filteredPrograms.filter(p => new Date(p.date).getMonth() === new Date().getMonth()).length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Jumlah Peserta</p>
                    <p className="text-2xl">{filteredPrograms.reduce((sum, p) => sum + p.currentParticipants, 0)}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Program Aktif</p>
                    <p className="text-2xl">{filteredPrograms.filter(p => p.status === 'upcoming' || p.status === 'ongoing').length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Kos Program</p>
                    <p className="text-2xl">RM {filteredPrograms.reduce((sum, p) => sum + p.cost, 0).toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}