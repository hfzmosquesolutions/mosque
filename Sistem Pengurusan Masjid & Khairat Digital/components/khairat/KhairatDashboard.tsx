import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Users, 
  Heart, 
  DollarSign, 
  FileText, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus
} from 'lucide-react';
import { User } from '../../App';

interface KhairatDashboardProps {
  user: User;
}

export function KhairatDashboard({ user }: KhairatDashboardProps) {
  // Mock data - in real app, this would come from API
  const stats = {
    totalMembers: 623,
    activeMembers: 598,
    totalFunds: 156780,
    monthlyCollection: 12450,
    pendingApplications: 3,
    approvedThisMonth: 2,
    totalDisbursed: 45600,
    deathRecords: 18
  };

  const recentApplications = [
    {
      id: 'APP001',
      deceased: 'Allahyarham Ahmad bin Hassan',
      applicant: 'Fatimah binti Ahmad',
      amount: 'RM 5,000',
      status: 'pending',
      dateSubmitted: '2025-06-10',
      relationship: 'Isteri'
    },
    {
      id: 'APP002',
      deceased: 'Allahyarhamah Siti Khadijah',
      applicant: 'Muhammad Rizqi bin Omar',
      amount: 'RM 3,500',
      status: 'approved',
      dateSubmitted: '2025-06-08',
      relationship: 'Anak'
    },
    {
      id: 'APP003',
      deceased: 'Allahyarham Ibrahim bin Yusuf',
      applicant: 'Zainab binti Ibrahim',
      amount: 'RM 4,200',
      status: 'processing',
      dateSubmitted: '2025-06-12',
      relationship: 'Anak'
    }
  ];

  const recentDeaths = [
    {
      id: 'D001',
      name: 'Allahyarham Ahmad bin Hassan',
      age: 68,
      dateOfDeath: '2025-06-09',
      burialLocation: 'Kubur Islam Cheras',
      benefitsPaid: true
    },
    {
      id: 'D002',
      name: 'Allahyarhamah Siti Khadijah',
      age: 74,
      dateOfDeath: '2025-06-07',
      burialLocation: 'Kubur Islam Ampang',
      benefitsPaid: true
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Menunggu</Badge>;
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Diluluskan</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500"><FileText className="h-3 w-3 mr-1" />Diproses</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const fundHealthPercentage = (stats.totalFunds / 200000) * 100; // Target: RM 200,000

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Dashboard Khairat Kematian</h1>
          <p className="text-muted-foreground">
            Pengurusan dana dan bantuan khairat kematian
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/khairat/laporan">
              <FileText className="h-4 w-4 mr-2" />
              Laporan
            </Link>
          </Button>
          <Button asChild>
            <Link to="/khairat/permohonan/baru">
              <Plus className="h-4 w-4 mr-2" />
              Permohonan Baru
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Ahli Khairat</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.activeMembers}</div>
            <p className="text-xs text-muted-foreground">
              daripada {stats.totalMembers} ahli
            </p>
            <Progress value={(stats.activeMembers / stats.totalMembers) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Dana Terkumpul</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">RM {stats.totalFunds.toLocaleString()}</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +RM {stats.monthlyCollection.toLocaleString()} bulan ini
            </p>
            <Progress value={fundHealthPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Permohonan Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.pendingApplications}</div>
            <p className="text-xs text-muted-foreground">
              Perlu tindakan segera
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Bantuan Bulan Ini</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">RM {stats.totalDisbursed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.approvedThisMonth} permohonan diluluskan
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Permohonan Terkini</CardTitle>
            <CardDescription>
              Permohonan bantuan khairat yang memerlukan tindakan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplications.map((application) => (
                <div key={application.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{application.deceased}</p>
                      <p className="text-sm text-muted-foreground">
                        Pemohon: {application.applicant} ({application.relationship})
                      </p>
                    </div>
                    {getStatusBadge(application.status)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{application.amount}</span>
                    <span className="text-muted-foreground">
                      {new Date(application.dateSubmitted).toLocaleDateString('ms-MY')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link to="/khairat/permohonan">
                Lihat Semua Permohonan
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Deaths */}
        <Card>
          <CardHeader>
            <CardTitle>Rekod Kematian Terkini</CardTitle>
            <CardDescription>
              Senarai ahli yang telah meninggal dunia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDeaths.map((death) => (
                <div key={death.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{death.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Umur: {death.age} tahun
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {death.burialLocation}
                      </p>
                    </div>
                    <Badge className={death.benefitsPaid ? "bg-green-500" : "bg-orange-500"}>
                      {death.benefitsPaid ? "Bantuan Dibayar" : "Pending"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tarikh: {new Date(death.dateOfDeath).toLocaleDateString('ms-MY')}
                  </p>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link to="/khairat/kematian">
                Lihat Semua Rekod
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Tindakan Pantas</CardTitle>
          <CardDescription>
            Akses fungsi utama pengurusan khairat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col" asChild>
              <Link to="/khairat/ahli">
                <Users className="h-6 w-6 mb-2" />
                Uruskan Ahli
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col" asChild>
              <Link to="/khairat/permohonan">
                <FileText className="h-6 w-6 mb-2" />
                Permohonan
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col" asChild>
              <Link to="/khairat/kematian">
                <Heart className="h-6 w-6 mb-2" />
                Rekod Kematian
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col" asChild>
              <Link to="/khairat/laporan">
                <DollarSign className="h-6 w-6 mb-2" />
                Laporan Kewangan
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fund Health Alert */}
      {fundHealthPercentage < 50 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertCircle className="h-5 w-5 mr-2" />
              Amaran Dana Khairat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              Dana khairat berada pada tahap {fundHealthPercentage.toFixed(1)}% daripada sasaran. 
              Pertimbangkan untuk meningkatkan kempen kutipan atau menaikkan kadar yuran bulanan.
            </p>
            <Button className="mt-3" variant="outline">
              Lihat Cadangan Tindakan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}