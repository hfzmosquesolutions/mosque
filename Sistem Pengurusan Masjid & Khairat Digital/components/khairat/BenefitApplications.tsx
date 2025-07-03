import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { 
  Plus, 
  Search, 
  FileText, 
  Calendar,
  DollarSign,
  MoreHorizontal,
  Eye,
  Edit,
  Check,
  X,
  Download,
  Upload,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  User as UserIcon,
  Phone,
  Mail,
  CreditCard
} from 'lucide-react';
import { User } from '../../App';
import { toast } from 'sonner@2.0.3';

interface BenefitApplication {
  id: string;
  applicationNumber: string;
  membershipId: string;
  deceasedName: string;
  deceasedIC: string;
  dateOfDeath: string;
  applicantName: string;
  applicantIC: string;
  applicantPhone: string;
  applicantEmail: string;
  relationship: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  benefitAmount: number;
  applicationDate: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'paid';
  documents: {
    name: string;
    uploaded: boolean;
    required: boolean;
  }[];
  reviewNotes?: string;
  reviewedBy?: string;
  reviewDate?: string;
  paymentDate?: string;
  rejectionReason?: string;
}

interface BenefitApplicationsProps {
  user: User;
}

export function BenefitApplications({ user }: BenefitApplicationsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showNewApplicationDialog, setShowNewApplicationDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<BenefitApplication | null>(null);

  // Mock data
  const applications: BenefitApplication[] = [
    {
      id: 'APP001',
      applicationNumber: 'KH2025001',
      membershipId: 'KH001',
      deceasedName: 'Allahyarham Ahmad bin Hassan',
      deceasedIC: '751123-14-5678',
      dateOfDeath: '2025-06-09',
      applicantName: 'Fatimah binti Ahmad',
      applicantIC: '780456-03-1234',
      applicantPhone: '019-234-5678',
      applicantEmail: 'fatimah@example.com',
      relationship: 'Isteri',
      bankDetails: {
        accountName: 'Fatimah binti Ahmad',
        accountNumber: '1234567890',
        bankName: 'Maybank'
      },
      benefitAmount: 5000,
      applicationDate: '2025-06-10',
      status: 'pending',
      documents: [
        { name: 'Sijil Kematian', uploaded: true, required: true },
        { name: 'Surat Pengesahan Hospital', uploaded: true, required: true },
        { name: 'Salinan IC Pemohon', uploaded: true, required: true },
        { name: 'Salinan IC Si Mati', uploaded: true, required: true },
        { name: 'Penyata Bank', uploaded: false, required: true },
        { name: 'Sijil Nikah', uploaded: true, required: false }
      ]
    },
    {
      id: 'APP002',
      applicationNumber: 'KH2025002',
      membershipId: 'KH002',
      deceasedName: 'Allahyarhamah Siti Khadijah binti Omar',
      deceasedIC: '820456-03-1234',
      dateOfDeath: '2025-06-07',
      applicantName: 'Muhammad bin Omar',
      applicantIC: '880123-45-6789',
      applicantPhone: '012-345-6789',
      applicantEmail: 'muhammad@example.com',
      relationship: 'Anak',
      bankDetails: {
        accountName: 'Muhammad bin Omar',
        accountNumber: '9876543210',
        bankName: 'CIMB Bank'
      },
      benefitAmount: 3500,
      applicationDate: '2025-06-08',
      status: 'approved',
      documents: [
        { name: 'Sijil Kematian', uploaded: true, required: true },
        { name: 'Surat Pengesahan Hospital', uploaded: true, required: true },
        { name: 'Salinan IC Pemohon', uploaded: true, required: true },
        { name: 'Salinan IC Si Mati', uploaded: true, required: true },
        { name: 'Penyata Bank', uploaded: true, required: true },
        { name: 'Sijil Kelahiran', uploaded: true, required: false }
      ],
      reviewedBy: 'Ustaz Abdullah',
      reviewDate: '2025-06-11',
      reviewNotes: 'Semua dokumen lengkap dan sah. Layak untuk bantuan.'
    },
    {
      id: 'APP003',
      applicationNumber: 'KH2025003',
      membershipId: 'KH015',
      deceasedName: 'Allahyarham Ibrahim bin Yusuf',
      deceasedIC: '690912-08-9876',
      dateOfDeath: '2025-05-28',
      applicantName: 'Zainab binti Ibrahim',
      applicantIC: '870234-56-7890',
      applicantPhone: '013-456-7890',
      applicantEmail: 'zainab@example.com',
      relationship: 'Anak',
      bankDetails: {
        accountName: 'Zainab binti Ibrahim',
        accountNumber: '5555666677',
        bankName: 'Public Bank'
      },
      benefitAmount: 4200,
      applicationDate: '2025-05-30',
      status: 'reviewing',
      documents: [
        { name: 'Sijil Kematian', uploaded: true, required: true },
        { name: 'Surat Pengesahan Hospital', uploaded: false, required: true },
        { name: 'Salinan IC Pemohon', uploaded: true, required: true },
        { name: 'Salinan IC Si Mati', uploaded: true, required: true },
        { name: 'Penyata Bank', uploaded: true, required: true }
      ],
      reviewNotes: 'Menunggu Surat Pengesahan Hospital untuk melengkapkan permohonan.'
    },
    {
      id: 'APP004',
      applicationNumber: 'KH2025004',
      membershipId: 'KH032',
      deceasedName: 'Allahyarham Zainul Abidin bin Rahman',
      deceasedIC: '771025-11-3456',
      dateOfDeath: '2025-05-15',
      applicantName: 'Khadijah binti Ahmad',
      applicantIC: '801234-56-7890',
      applicantPhone: '014-567-8901',
      applicantEmail: 'khadijah@example.com',
      relationship: 'Isteri',
      bankDetails: {
        accountName: 'Khadijah binti Ahmad',
        accountNumber: '7777888899',
        bankName: 'RHB Bank'
      },
      benefitAmount: 5000,
      applicationDate: '2025-05-16',
      status: 'paid',
      documents: [
        { name: 'Sijil Kematian', uploaded: true, required: true },
        { name: 'Surat Pengesahan Hospital', uploaded: true, required: true },
        { name: 'Salinan IC Pemohon', uploaded: true, required: true },
        { name: 'Salinan IC Si Mati', uploaded: true, required: true },
        { name: 'Penyata Bank', uploaded: true, required: true },
        { name: 'Sijil Nikah', uploaded: true, required: false }
      ],
      reviewedBy: 'Ustaz Abdullah',
      reviewDate: '2025-05-18',
      paymentDate: '2025-05-20',
      reviewNotes: 'Permohonan diluluskan dan pembayaran telah dibuat.'
    }
  ];

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.deceasedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.membershipId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    const appMonth = new Date(app.applicationDate).getMonth();
    const currentMonth = new Date().getMonth();
    const matchesMonth = monthFilter === 'all' || 
                        (monthFilter === 'current' && appMonth === currentMonth) ||
                        (monthFilter === 'last' && appMonth === currentMonth - 1);
    
    return matchesSearch && matchesStatus && matchesMonth;
  });

  const stats = {
    totalApplications: applications.length,
    pendingApplications: applications.filter(a => a.status === 'pending').length,
    approvedApplications: applications.filter(a => a.status === 'approved').length,
    totalBenefitsPaid: applications.filter(a => a.status === 'paid').reduce((sum, a) => sum + a.benefitAmount, 0),
    avgProcessingTime: 3 // days
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Menunggu</Badge>;
      case 'reviewing':
        return <Badge className="bg-blue-500"><Eye className="h-3 w-3 mr-1" />Disemak</Badge>;
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Diluluskan</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Ditolak</Badge>;
      case 'paid':
        return <Badge className="bg-purple-500"><DollarSign className="h-3 w-3 mr-1" />Dibayar</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canManageApplications = user.role === 'super_admin' || user.role === 'mosque_admin' || 
                               (user.role === 'ajk' && user.permissions?.includes('manage_khairat'));

  const handleViewDetails = (application: BenefitApplication) => {
    setSelectedApplication(application);
    setShowDetailsDialog(true);
  };

  const handleApproveApplication = (appId: string) => {
    toast.success('Permohonan telah diluluskan');
  };

  const handleRejectApplication = (appId: string) => {
    toast.success('Permohonan telah ditolak');
  };

  const handleMarkAsPaid = (appId: string) => {
    toast.success('Permohonan telah ditandakan sebagai dibayar');
  };

  const NewApplicationDialog = () => (
    <Dialog open={showNewApplicationDialog} onOpenChange={setShowNewApplicationDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Permohonan Bantuan Khairat Baru</DialogTitle>
          <DialogDescription>
            Isi maklumat permohonan bantuan khairat kematian
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Deceased Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Maklumat Si Mati</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID Keahlian</Label>
                <Input placeholder="KH001" />
              </div>
              <div className="space-y-2">
                <Label>Nama Si Mati</Label>
                <Input placeholder="Nama penuh si mati" />
              </div>
              <div className="space-y-2">
                <Label>No. IC Si Mati</Label>
                <Input placeholder="123456-78-9012" />
              </div>
              <div className="space-y-2">
                <Label>Tarikh Kematian</Label>
                <Input type="date" />
              </div>
            </div>
          </div>

          {/* Applicant Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Maklumat Pemohon</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Pemohon</Label>
                <Input placeholder="Nama penuh pemohon" />
              </div>
              <div className="space-y-2">
                <Label>No. IC Pemohon</Label>
                <Input placeholder="123456-78-9012" />
              </div>
              <div className="space-y-2">
                <Label>No. Telefon</Label>
                <Input placeholder="012-345-6789" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Hubungan dengan Si Mati</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih hubungan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="isteri">Isteri</SelectItem>
                    <SelectItem value="suami">Suami</SelectItem>
                    <SelectItem value="anak">Anak</SelectItem>
                    <SelectItem value="ibu_bapa">Ibu/Bapa</SelectItem>
                    <SelectItem value="adik_beradik">Adik Beradik</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-4">
            <h3 className="font-medium">Maklumat Bank</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Pemegang Akaun</Label>
                <Input placeholder="Nama pada akaun bank" />
              </div>
              <div className="space-y-2">
                <Label>No. Akaun Bank</Label>
                <Input placeholder="1234567890" />
              </div>
              <div className="space-y-2">
                <Label>Nama Bank</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maybank">Maybank</SelectItem>
                    <SelectItem value="cimb">CIMB Bank</SelectItem>
                    <SelectItem value="public">Public Bank</SelectItem>
                    <SelectItem value="rhb">RHB Bank</SelectItem>
                    <SelectItem value="hong_leong">Hong Leong Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Benefit Amount */}
          <div className="space-y-4">
            <h3 className="font-medium">Maklumat Bantuan</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jumlah Bantuan Dimohon (RM)</Label>
                <Input type="number" placeholder="5000" />
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div className="space-y-4">
            <h3 className="font-medium">Dokumen Diperlukan</h3>
            <div className="space-y-3">
              {[
                'Sijil Kematian',
                'Surat Pengesahan Hospital',
                'Salinan IC Pemohon',
                'Salinan IC Si Mati',
                'Penyata Bank'
              ].map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {doc} <span className="text-red-500">*</span>
                  </span>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Muat Naik
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewApplicationDialog(false)}>
              Batal
            </Button>
            <Button onClick={() => {
              toast.success('Permohonan bantuan berjaya dihantar');
              setShowNewApplicationDialog(false);
            }}>
              Hantar Permohonan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const DetailsDialog = () => (
    <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Maklumat Lengkap Permohonan</DialogTitle>
        </DialogHeader>
        {selectedApplication && (
          <div className="space-y-6">
            {/* Application Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Maklumat Permohonan</CardTitle>
                  {getStatusBadge(selectedApplication.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">No. Permohonan:</span>
                    <p className="font-medium">{selectedApplication.applicationNumber}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Tarikh Permohonan:</span>
                    <p className="font-medium">{new Date(selectedApplication.applicationDate).toLocaleDateString('ms-MY')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">ID Keahlian:</span>
                    <p className="font-medium">{selectedApplication.membershipId}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Jumlah Bantuan:</span>
                    <p className="font-medium">RM {selectedApplication.benefitAmount.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deceased Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Maklumat Si Mati</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Nama:</span>
                    <p className="font-medium">{selectedApplication.deceasedName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">No. IC:</span>
                    <p className="font-medium">{selectedApplication.deceasedIC}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Tarikh Kematian:</span>
                    <p className="font-medium">{new Date(selectedApplication.dateOfDeath).toLocaleDateString('ms-MY')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Applicant Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Maklumat Pemohon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Nama:</span>
                    <p className="font-medium">{selectedApplication.applicantName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">No. IC:</span>
                    <p className="font-medium">{selectedApplication.applicantIC}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Telefon:</span>
                    <p className="font-medium">{selectedApplication.applicantPhone}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <p className="font-medium">{selectedApplication.applicantEmail}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Hubungan:</span>
                    <p className="font-medium">{selectedApplication.relationship}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Maklumat Bank</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Nama Akaun:</span>
                    <p className="font-medium">{selectedApplication.bankDetails.accountName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">No. Akaun:</span>
                    <p className="font-medium">{selectedApplication.bankDetails.accountNumber}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Bank:</span>
                    <p className="font-medium">{selectedApplication.bankDetails.bankName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dokumen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedApplication.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {doc.name}
                        {doc.required && <span className="text-red-500">*</span>}
                      </span>
                      <div className="flex items-center gap-2">
                        {doc.uploaded ? (
                          <Badge className="bg-green-500">Dimuat Naik</Badge>
                        ) : (
                          <Badge variant="destructive">Belum Dimuat Naik</Badge>
                        )}
                        {doc.uploaded && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Review Notes */}
            {selectedApplication.reviewNotes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Catatan Semakan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>{selectedApplication.reviewNotes}</p>
                    {selectedApplication.reviewedBy && (
                      <div className="text-sm text-muted-foreground">
                        Disemak oleh: {selectedApplication.reviewedBy} • {selectedApplication.reviewDate && new Date(selectedApplication.reviewDate).toLocaleDateString('ms-MY')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            {canManageApplications && selectedApplication.status === 'pending' && (
              <div className="flex justify-end gap-2">
                <Button 
                  variant="destructive"
                  onClick={() => handleRejectApplication(selectedApplication.id)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Tolak
                </Button>
                <Button 
                  className="bg-green-500"
                  onClick={() => handleApproveApplication(selectedApplication.id)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Luluskan
                </Button>
              </div>
            )}

            {canManageApplications && selectedApplication.status === 'approved' && (
              <div className="flex justify-end">
                <Button 
                  className="bg-purple-500"
                  onClick={() => handleMarkAsPaid(selectedApplication.id)}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Tandakan Dibayar
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Permohonan Bantuan Khairat</h1>
          <p className="text-muted-foreground">
            Pengurusan permohonan bantuan khairat kematian
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Eksport
          </Button>
          <Button onClick={() => setShowNewApplicationDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Permohonan Baru
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Jumlah Permohonan</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              Permohonan keseluruhan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Menunggu</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-orange-600">{stats.pendingApplications}</div>
            <p className="text-xs text-muted-foreground">
              Perlu tindakan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Diluluskan</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600">{stats.approvedApplications}</div>
            <p className="text-xs text-muted-foreground">
              Menunggu pembayaran
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Jumlah Dibayar</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">RM {stats.totalBenefitsPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Bantuan dibayar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Masa Pemprosesan</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.avgProcessingTime} hari</div>
            <p className="text-xs text-muted-foreground">
              Purata masa
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
                placeholder="Cari permohonan..."
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
                <SelectItem value="reviewing">Disemak</SelectItem>
                <SelectItem value="approved">Diluluskan</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
                <SelectItem value="paid">Dibayar</SelectItem>
              </SelectContent>
            </Select>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bulan</SelectItem>
                <SelectItem value="current">Bulan Ini</SelectItem>
                <SelectItem value="last">Bulan Lepas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Senarai Permohonan ({filteredApplications.length})</CardTitle>
          <CardDescription>
            Permohonan bantuan khairat kematian yang dihantar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permohonan</TableHead>
                <TableHead>Si Mati</TableHead>
                <TableHead>Pemohon</TableHead>
                <TableHead>Jumlah Bantuan</TableHead>
                <TableHead>Tarikh Mohon</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{application.applicationNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {application.membershipId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{application.deceasedName}</div>
                      <div className="text-sm text-muted-foreground">
                        {application.deceasedIC}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(application.dateOfDeath).toLocaleDateString('ms-MY')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{application.applicantName}</div>
                      <div className="text-sm text-muted-foreground">
                        {application.relationship}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {application.applicantPhone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">RM {application.benefitAmount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      {application.bankDetails.bankName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{new Date(application.applicationDate).toLocaleDateString('ms-MY')}</div>
                  </TableCell>
                  <TableCell>{getStatusBadge(application.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(application)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Lihat Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Muat Turun Dokumen
                        </DropdownMenuItem>
                        {canManageApplications && application.status === 'pending' && (
                          <>
                            <DropdownMenuItem 
                              className="text-green-600"
                              onClick={() => handleApproveApplication(application.id)}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Luluskan
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleRejectApplication(application.id)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Tolak
                            </DropdownMenuItem>
                          </>
                        )}
                        {canManageApplications && application.status === 'approved' && (
                          <DropdownMenuItem 
                            className="text-purple-600"
                            onClick={() => handleMarkAsPaid(application.id)}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Tandakan Dibayar
                          </DropdownMenuItem>
                        )}
                        {canManageApplications && (
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

      <NewApplicationDialog />
      <DetailsDialog />
    </div>
  );
}