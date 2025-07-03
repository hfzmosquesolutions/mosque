import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Users,
  Plus,
  Search,
  Filter,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Download
} from 'lucide-react';
import { User } from '../../App';
import { toast } from 'sonner@2.0.3';

interface ZakatApplicationsProps {
  user: User;
}

interface ZakatApplication {
  id: string;
  applicantName: string;
  applicantIc: string;
  asnafCategory: string;
  requestedAmount: number;
  monthlyIncome: number;
  familySize: number;
  reason: string;
  applicationDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'distributed';
  reviewedBy?: string;
  reviewDate?: string;
  approvedAmount?: number;
  documents: string[];
}

const asnafCategories = {
  fakir: 'Fakir - Tidak memiliki harta dan penghasilan',
  miskin: 'Miskin - Memiliki harta/penghasilan tidak mencukupi',
  amil: 'Amil - Pengurus/pentadbir zakat',
  muallaf: 'Muallaf - Orang yang baru memeluk Islam',
  riqab: 'Riqab - Memerdekakan hamba/tawanan',
  gharimin: 'Gharimin - Orang yang berhutang',
  fisabilillah: 'Fi Sabilillah - Untuk kepentingan agama',
  ibnu_sabil: 'Ibnu Sabil - Orang dalam perjalanan'
};

export function ZakatApplications({ user }: ZakatApplicationsProps) {
  const [showNewApplicationDialog, setShowNewApplicationDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ZakatApplication | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [asnafFilter, setAsnafFilter] = useState('all');

  // Mock data
  const applications: ZakatApplication[] = [
    {
      id: 'ZA001',
      applicantName: 'Aminah binti Yusof',
      applicantIc: '650123-10-1234',
      asnafCategory: 'fakir',
      requestedAmount: 500,
      monthlyIncome: 800,
      familySize: 5,
      reason: 'Bantuan sara hidup bulanan untuk keluarga. Suami tidak bekerja kerana sakit.',
      applicationDate: '2025-06-01',
      status: 'pending',
      documents: ['ic_copy.pdf', 'income_statement.pdf', 'medical_report.pdf']
    },
    {
      id: 'ZA002',
      applicantName: 'Omar bin Abdullah',
      applicantIc: '720456-03-5678',
      asnafCategory: 'miskin',
      requestedAmount: 1000,
      monthlyIncome: 1200,
      familySize: 3,
      reason: 'Bantuan perubatan untuk rawatan kanak-kanak yang sakit kronik.',
      applicationDate: '2025-05-28',
      status: 'approved',
      reviewedBy: 'Ustaz Abdullah',
      reviewDate: '2025-06-05',
      approvedAmount: 800,
      documents: ['ic_copy.pdf', 'medical_report.pdf', 'hospital_bill.pdf']
    },
    {
      id: 'ZA003',
      applicantName: 'Siti binti Rahman',
      applicantIc: '680789-14-9012',
      asnafCategory: 'fisabilillah',
      requestedAmount: 2000,
      monthlyIncome: 2500,
      familySize: 2,
      reason: 'Biasiswa pendidikan untuk anak melanjutkan pengajian ke universiti.',
      applicationDate: '2025-05-25',
      status: 'distributed',
      reviewedBy: 'Ustaz Hassan',
      reviewDate: '2025-06-02',
      approvedAmount: 1500,
      documents: ['ic_copy.pdf', 'student_certificate.pdf', 'university_offer.pdf']
    },
    {
      id: 'ZA004',
      applicantName: 'Hassan bin Ahmad',
      applicantIc: '751234-56-7890',
      asnafCategory: 'gharimin',
      requestedAmount: 3000,
      monthlyIncome: 1800,
      familySize: 4,
      reason: 'Bantuan menyelesaikan hutang perubatan yang tertunggak.',
      applicationDate: '2025-05-20',
      status: 'rejected',
      reviewedBy: 'Ustaz Abdullah',
      reviewDate: '2025-06-03',
      documents: ['ic_copy.pdf', 'debt_statement.pdf']
    }
  ];

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.applicantIc.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesAsnaf = asnafFilter === 'all' || app.asnafCategory === asnafFilter;
    
    return matchesSearch && matchesStatus && matchesAsnaf;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Menunggu</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500">Diluluskan</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Ditolak</Badge>;
      case 'distributed':
        return <Badge className="bg-green-500">Diagihkan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleViewApplication = (application: ZakatApplication) => {
    setSelectedApplication(application);
    setShowDetailDialog(true);
  };

  const handleApproveApplication = (applicationId: string) => {
    toast.success('Permohonan telah diluluskan');
  };

  const handleRejectApplication = (applicationId: string) => {
    toast.success('Permohonan telah ditolak');
  };

  const handleDistribute = (applicationId: string) => {
    toast.success('Zakat telah diagihkan kepada pemohon');
  };

  const NewApplicationDialog = () => (
    <Dialog open={showNewApplicationDialog} onOpenChange={setShowNewApplicationDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Permohonan Bantuan Zakat Baru</DialogTitle>
          <DialogDescription>
            Isikan maklumat pemohon untuk bantuan zakat
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Penuh</Label>
              <Input placeholder="Nama pemohon" />
            </div>
            <div className="space-y-2">
              <Label>No. Kad Pengenalan</Label>
              <Input placeholder="123456-78-9012" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kategori Asnaf</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori asnaf" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(asnafCategories).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jumlah Dipohon (RM)</Label>
              <Input type="number" placeholder="0.00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pendapatan Bulanan (RM)</Label>
              <Input type="number" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Bilangan Tanggungan</Label>
              <Input type="number" placeholder="0" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sebab Permohonan</Label>
            <Textarea 
              placeholder="Nyatakan sebab dan keperluan bantuan zakat"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Dokumen Sokongan</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag & drop dokumen atau klik untuk pilih
              </p>
              <Button variant="outline" size="sm">
                Pilih Fail
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Muat naik: Salinan IC, Slip gaji, Laporan perubatan (jika ada)
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewApplicationDialog(false)}>
              Batal
            </Button>
            <Button onClick={() => {
              toast.success('Permohonan berjaya dihantar');
              setShowNewApplicationDialog(false);
            }}>
              Hantar Permohonan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const ApplicationDetailDialog = () => (
    <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
      <DialogContent className="max-w-3xl">
        {selectedApplication && (
          <>
            <DialogHeader>
              <DialogTitle>Butiran Permohonan #{selectedApplication.id}</DialogTitle>
              <DialogDescription>
                Maklumat lengkap permohonan bantuan zakat
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Applicant Information */}
              <div>
                <h3 className="font-medium mb-3">Maklumat Pemohon</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nama</p>
                    <p className="font-medium">{selectedApplication.applicantName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">No. IC</p>
                    <p className="font-medium">{selectedApplication.applicantIc}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Kategori Asnaf</p>
                    <p className="font-medium">
                      {asnafCategories[selectedApplication.asnafCategory as keyof typeof asnafCategories]}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    {getStatusBadge(selectedApplication.status)}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pendapatan Bulanan</p>
                    <p className="font-medium">RM {selectedApplication.monthlyIncome.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Bilangan Tanggungan</p>
                    <p className="font-medium">{selectedApplication.familySize} orang</p>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div>
                <h3 className="font-medium mb-3">Butiran Permohonan</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Jumlah Dipohon</p>
                    <p className="font-medium">RM {selectedApplication.requestedAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tarikh Permohonan</p>
                    <p className="font-medium">
                      {new Date(selectedApplication.applicationDate).toLocaleDateString('ms-MY')}
                    </p>
                  </div>
                  {selectedApplication.approvedAmount && (
                    <div>
                      <p className="text-muted-foreground">Jumlah Diluluskan</p>
                      <p className="font-medium">RM {selectedApplication.approvedAmount.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedApplication.reviewedBy && (
                    <div>
                      <p className="text-muted-foreground">Disemak Oleh</p>
                      <p className="font-medium">{selectedApplication.reviewedBy}</p>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-muted-foreground text-sm">Sebab Permohonan</p>
                  <p className="font-medium mt-1">{selectedApplication.reason}</p>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-medium mb-3">Dokumen Sokongan</h3>
                <div className="space-y-2">
                  {selectedApplication.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{doc}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {selectedApplication.status === 'pending' && user.role !== 'member' && (
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleRejectApplication(selectedApplication.id)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Tolak
                  </Button>
                  <Button onClick={() => handleApproveApplication(selectedApplication.id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Luluskan
                  </Button>
                </div>
              )}

              {selectedApplication.status === 'approved' && user.role !== 'member' && (
                <div className="flex justify-end">
                  <Button onClick={() => handleDistribute(selectedApplication.id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Agihkan Zakat
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Permohonan Bantuan Zakat
          </h1>
          <p className="text-muted-foreground">
            Pengurusan permohonan bantuan daripada asnaf
          </p>
        </div>
        <Button onClick={() => setShowNewApplicationDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Permohonan Baru
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tapisan & Carian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau No. IC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="approved">Diluluskan</SelectItem>
                  <SelectItem value="distributed">Diagihkan</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={asnafFilter} onValueChange={setAsnafFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Asnaf" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Asnaf</SelectItem>
                  {Object.entries(asnafCategories).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.split(' - ')[0]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Senarai Permohonan</CardTitle>
          <CardDescription>
            {filteredApplications.length} permohonan ditemui
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Pemohon</TableHead>
                <TableHead>No. IC</TableHead>
                <TableHead>Kategori Asnaf</TableHead>
                <TableHead>Jumlah Dipohon</TableHead>
                <TableHead>Tarikh</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">{application.applicantName}</TableCell>
                  <TableCell>{application.applicantIc}</TableCell>
                  <TableCell>
                    {asnafCategories[application.asnafCategory as keyof typeof asnafCategories].split(' - ')[0]}
                  </TableCell>
                  <TableCell>RM {application.requestedAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    {new Date(application.applicationDate).toLocaleDateString('ms-MY')}
                  </TableCell>
                  <TableCell>{getStatusBadge(application.status)}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewApplication(application)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <NewApplicationDialog />
      <ApplicationDetailDialog />
    </div>
  );
}