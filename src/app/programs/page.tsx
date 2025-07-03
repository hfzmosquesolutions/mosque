'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAuth } from '@/hooks/useAuth';
import { ProgramForm } from '@/components/programs/ProgramForm';
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
  Copy,
  Trash,
  Clock,
  CheckCircle,
  DollarSign,
  CalendarDays,
  List,
} from 'lucide-react';

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

function ProgramsPageContent() {
  const { t } = useLanguage();
  const { user: authUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentView, setCurrentView] = useState('list');
  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<string | undefined>();

  // Sample data - in real app this would come from API
  const [programs] = useState<Program[]>([
    {
      id: '1',
      title: 'Ceramah Jumaat - Akhlak Mulia',
      type: 'ceramah',
      description:
        'Ceramah mengenai kepentingan akhlak mulia dalam kehidupan seharian',
      date: '2024-01-12',
      time: '14:30',
      location: 'Dewan Utama',
      speaker: 'Ustaz Ahmad Rahman',
      maxParticipants: 200,
      currentParticipants: 45,
      status: 'upcoming',
      organizer: 'Jawatankuasa Dakwah',
      cost: 0,
      registrationRequired: false,
    },
    {
      id: '2',
      title: 'Kelas Mengaji Al-Quran',
      type: 'kelas',
      description: 'Kelas bacaan dan tajwid Al-Quran untuk dewasa',
      date: '2024-01-15',
      time: '20:00',
      location: 'Bilik Kelas A',
      speaker: 'Ustazah Fatimah',
      maxParticipants: 30,
      currentParticipants: 28,
      status: 'ongoing',
      organizer: 'Unit Pendidikan',
      cost: 50,
      registrationRequired: true,
    },
    {
      id: '3',
      title: 'Kenduri Kesyukuran',
      type: 'kenduri',
      description: 'Kenduri kesyukuran sempena majlis akikah',
      date: '2024-01-20',
      time: '12:00',
      location: 'Dewan Makan',
      maxParticipants: 150,
      currentParticipants: 89,
      status: 'upcoming',
      organizer: 'Keluarga Ahmad',
      cost: 20,
      registrationRequired: true,
    },
  ]);

  const getStatusBadge = (status: Program['status']) => {
    const statusConfig = {
      upcoming: {
        label: t('programs.upcoming'),
        variant: 'secondary' as const,
      },
      ongoing: { label: t('programs.ongoing'), variant: 'default' as const },
      completed: {
        label: t('programs.completed'),
        variant: 'outline' as const,
      },
      cancelled: {
        label: t('programs.cancelled'),
        variant: 'destructive' as const,
      },
    };
    return statusConfig[status];
  };

  const getTypeBadge = (type: Program['type']) => {
    const typeConfig = {
      ceramah: {
        label: t('programs.types.ceramah'),
        color: 'bg-blue-100 text-blue-800',
      },
      kelas: {
        label: t('programs.types.kelas'),
        color: 'bg-green-100 text-green-800',
      },
      kenduri: {
        label: t('programs.types.kenduri'),
        color: 'bg-orange-100 text-orange-800',
      },
      'gotong-royong': {
        label: t('programs.types.gotongRoyong'),
        color: 'bg-purple-100 text-purple-800',
      },
      lain: {
        label: t('programs.types.lain'),
        color: 'bg-gray-100 text-gray-800',
      },
    };
    return typeConfig[type];
  };

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch =
      program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || program.status === statusFilter;
    const matchesType = typeFilter === 'all' || program.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const statsData = {
    totalPrograms: programs.length,
    upcomingPrograms: programs.filter((p) => p.status === 'upcoming').length,
    ongoingPrograms: programs.filter((p) => p.status === 'ongoing').length,
    totalParticipants: programs.reduce(
      (sum, p) => sum + p.currentParticipants,
      0
    ),
  };

  // Handler functions
  const handleAddProgram = () => {
    setEditingProgram(undefined);
    setShowForm(true);
  };

  const handleEditProgram = (programId: string) => {
    setEditingProgram(programId);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProgram(undefined);
  };

  const handleSaveProgram = (formData: any) => {
    console.log('Saving program:', formData);
    // In real app, this would save to API
    // For now, just close the form
    setShowForm(false);
    setEditingProgram(undefined);
  };

  // If form is open, show only the form
  if (showForm) {
    return (
      <ProgramForm
        programId={editingProgram}
        onClose={handleCloseForm}
        onSave={handleSaveProgram}
      />
    );
  }

  const canManagePrograms =
    authUser?.role === 'super_admin' ||
    authUser?.role === 'mosque_admin' ||
    authUser?.role === 'ajk';

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('programs.title')}
          </h1>
          <p className="text-gray-600 mt-1">{t('programs.subtitle')}</p>
        </div>
        {canManagePrograms && (
          <Button onClick={handleAddProgram}>
            <Plus className="h-4 w-4 mr-2" />
            {t('programs.addProgram')}
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
                  {t('programs.totalPrograms')}
                </p>
                <p className="text-2xl font-bold">{statsData.totalPrograms}</p>
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
                  {t('programs.upcomingPrograms')}
                </p>
                <p className="text-2xl font-bold">
                  {statsData.upcomingPrograms}
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
                  {t('programs.ongoingPrograms')}
                </p>
                <p className="text-2xl font-bold">
                  {statsData.ongoingPrograms}
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
                  {t('programs.totalParticipants')}
                </p>
                <p className="text-2xl font-bold">
                  {statsData.totalParticipants}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('programs.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('programs.filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="upcoming">
                    {t('programs.upcoming')}
                  </SelectItem>
                  <SelectItem value="ongoing">
                    {t('programs.ongoing')}
                  </SelectItem>
                  <SelectItem value="completed">
                    {t('programs.completed')}
                  </SelectItem>
                  <SelectItem value="cancelled">
                    {t('programs.cancelled')}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('programs.filterByType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="ceramah">
                    {t('programs.types.ceramah')}
                  </SelectItem>
                  <SelectItem value="kelas">
                    {t('programs.types.kelas')}
                  </SelectItem>
                  <SelectItem value="kenduri">
                    {t('programs.types.kenduri')}
                  </SelectItem>
                  <SelectItem value="gotong-royong">
                    {t('programs.types.gotongRoyong')}
                  </SelectItem>
                  <SelectItem value="lain">
                    {t('programs.types.lain')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant={currentView === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={currentView === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('calendar')}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={currentView} onValueChange={setCurrentView}>
            <TabsContent value="list">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('programs.programName')}</TableHead>
                    <TableHead>{t('programs.type')}</TableHead>
                    <TableHead>{t('programs.dateTime')}</TableHead>
                    <TableHead>{t('programs.location')}</TableHead>
                    <TableHead>{t('programs.participants')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead className="text-right">
                      {t('common.action')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrograms.map((program) => {
                    const statusBadge = getStatusBadge(program.status);
                    const typeBadge = getTypeBadge(program.type);

                    return (
                      <TableRow key={program.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{program.title}</div>
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {program.description}
                            </div>
                            {program.speaker && (
                              <div className="text-xs text-blue-600 mt-1">
                                {program.speaker}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={typeBadge.color}>
                            {typeBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">
                                {new Date(program.date).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500">
                                {program.time}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{program.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {program.currentParticipants}
                              {program.maxParticipants &&
                                `/${program.maxParticipants}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadge.variant}>
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                {t('common.view')}
                              </DropdownMenuItem>
                              {canManagePrograms && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleEditProgram(program.id)
                                    }
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    {t('common.edit')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Copy className="h-4 w-4 mr-2" />
                                    {t('programs.duplicate')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash className="h-4 w-4 mr-2" />
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

              {filteredPrograms.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">
                    {t('programs.noPrograms')}
                  </h3>
                  <p className="text-gray-500">
                    {t('programs.noProgramsDescription')}
                  </p>
                  {canManagePrograms && (
                    <Button className="mt-4" onClick={handleAddProgram}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('programs.addFirstProgram')}
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="calendar">
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  {t('programs.calendarView')}
                </h3>
                <p className="text-gray-500">
                  {t('programs.calendarViewDescription')}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProgramsPage() {
  return (
    <AuthLayout>
      <ProgramsPageContent />
    </AuthLayout>
  );
}
