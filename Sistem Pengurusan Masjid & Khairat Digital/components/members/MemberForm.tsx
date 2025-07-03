import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import { User } from '../../App';
import { toast } from 'sonner@2.0.3';

interface MemberFormProps {
  user: User;
}

interface MemberFormData {
  icNumber: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  postcode: string;
  city: string;
  state: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  occupation: string;
  monthlyIncome: string;
  emergencyContact: string;
  emergencyPhone: string;
  membershipType: string;
  joinDate: string;
  notes: string;
}

export function MemberForm({ user }: MemberFormProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MemberFormData>({
    icNumber: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    postcode: '',
    city: '',
    state: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    occupation: '',
    monthlyIncome: '',
    emergencyContact: '',
    emergencyPhone: '',
    membershipType: 'kariah',
    joinDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (isEdit) {
      // Mock loading existing member data
      setLoading(true);
      setTimeout(() => {
        setFormData({
          icNumber: '850123-14-5678',
          name: 'Ahmad Zainuddin bin Abdullah',
          email: 'ahmad.zainuddin@example.com',
          phone: '019-234-5678',
          address: 'No. 123, Jalan Mawar, Taman Seri',
          postcode: '50000',
          city: 'Kuala Lumpur',
          state: 'Kuala Lumpur',
          dateOfBirth: '1985-01-23',
          gender: 'male',
          maritalStatus: 'married',
          occupation: 'Jurutera',
          monthlyIncome: '5000',
          emergencyContact: 'Fatimah binti Ahmad',
          emergencyPhone: '012-345-6789',
          membershipType: 'both',
          joinDate: '2023-01-15',
          notes: 'Ahli aktif, selalu hadir program masjid'
        });
        setLoading(false);
      }, 1000);
    }
  }, [isEdit]);

  const handleInputChange = (field: keyof MemberFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(
        isEdit ? 'Maklumat ahli berjaya dikemas kini' : 'Ahli baru berjaya didaftarkan'
      );
      
      navigate('/ahli');
    } catch (error) {
      toast.error('Ralat berlaku. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const malaysianStates = [
    'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Melaka',
    'Negeri Sembilan', 'Pahang', 'Penang', 'Perak', 'Perlis', 'Putrajaya',
    'Sabah', 'Sarawak', 'Selangor', 'Terengganu'
  ];

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/ahli')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1>{isEdit ? 'Edit Ahli' : 'Daftar Ahli Baru'}</h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Kemas kini maklumat ahli' : 'Masukkan maklumat ahli baru'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Maklumat Peribadi</CardTitle>
            <CardDescription>
              Maklumat asas dan pengenalan ahli
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icNumber">No. Kad Pengenalan *</Label>
                <Input
                  id="icNumber"
                  placeholder="850123-14-5678"
                  value={formData.icNumber}
                  onChange={(e) => handleInputChange('icNumber', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nama Penuh *</Label>
                <Input
                  id="name"
                  placeholder="Ahmad bin Abdullah"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Tarikh Lahir</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Jantina</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jantina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Lelaki</SelectItem>
                    <SelectItem value="female">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maritalStatus">Status Perkahwinan</Label>
                <Select value={formData.maritalStatus} onValueChange={(value) => handleInputChange('maritalStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Bujang</SelectItem>
                    <SelectItem value="married">Berkahwin</SelectItem>
                    <SelectItem value="divorced">Bercerai</SelectItem>
                    <SelectItem value="widowed">Janda/Duda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="occupation">Pekerjaan</Label>
                <Input
                  id="occupation"
                  placeholder="cth: Jurutera"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Maklumat Hubungan</CardTitle>
            <CardDescription>
              Alamat dan butiran untuk dihubungi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ahmad@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">No. Telefon *</Label>
                <Input
                  id="phone"
                  placeholder="019-234-5678"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat Rumah *</Label>
              <Textarea
                id="address"
                placeholder="No. 123, Jalan Mawar, Taman Seri"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postcode">Poskod</Label>
                <Input
                  id="postcode"
                  placeholder="50000"
                  value={formData.postcode}
                  onChange={(e) => handleInputChange('postcode', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Bandar</Label>
                <Input
                  id="city"
                  placeholder="Kuala Lumpur"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Negeri</Label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih negeri" />
                  </SelectTrigger>
                  <SelectContent>
                    {malaysianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Orang Untuk Dihubungi (Kecemasan)</CardTitle>
            <CardDescription>
              Maklumat waris atau orang terdekat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Nama</Label>
                <Input
                  id="emergencyContact"
                  placeholder="Fatimah binti Ahmad"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">No. Telefon</Label>
                <Input
                  id="emergencyPhone"
                  placeholder="012-345-6789"
                  value={formData.emergencyPhone}
                  onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Membership Information */}
        <Card>
          <CardHeader>
            <CardTitle>Maklumat Keahlian</CardTitle>
            <CardDescription>
              Jenis keahlian dan maklumat berkaitan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="membershipType">Jenis Keahlian *</Label>
                <Select value={formData.membershipType} onValueChange={(value) => handleInputChange('membershipType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kariah">Ahli Kariah Sahaja</SelectItem>
                    <SelectItem value="khairat">Ahli Khairat Sahaja</SelectItem>
                    <SelectItem value="both">Ahli Kariah + Khairat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinDate">Tarikh Keahlian</Label>
                <Input
                  id="joinDate"
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => handleInputChange('joinDate', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyIncome">Pendapatan Bulanan (RM)</Label>
              <Input
                id="monthlyIncome"
                type="number"
                placeholder="5000"
                value={formData.monthlyIncome}
                onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Maklumat ini untuk menentukan kadar yuran khairat
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                placeholder="Catatan tambahan tentang ahli..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/ahli')}>
            Batal
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                {isEdit ? 'Menyimpan...' : 'Mendaftar...'}
              </>
            ) : (
              <>
                {isEdit ? (
                  <Save className="h-4 w-4 mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {isEdit ? 'Simpan Perubahan' : 'Daftar Ahli'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}