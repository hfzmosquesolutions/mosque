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
import { ArrowLeft, Save, Calendar, Users, MapPin, Clock } from 'lucide-react';
import { User } from '../../App';
import { toast } from 'sonner@2.0.3';

interface ProgramFormProps {
  user: User;
}

interface ProgramFormData {
  title: string;
  type: string;
  description: string;
  date: string;
  time: string;
  endTime: string;
  location: string;
  speaker: string;
  maxParticipants: string;
  cost: string;
  registrationRequired: boolean;
  organizer: string;
  speakerFee: string;
  notes: string;
}

export function ProgramForm({ user }: ProgramFormProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProgramFormData>({
    title: '',
    type: 'ceramah',
    description: '',
    date: '',
    time: '',
    endTime: '',
    location: '',
    speaker: '',
    maxParticipants: '',
    cost: '0',
    registrationRequired: false,
    organizer: user.name,
    speakerFee: '0',
    notes: ''
  });

  useEffect(() => {
    if (isEdit) {
      // Mock loading existing program data
      setLoading(true);
      setTimeout(() => {
        setFormData({
          title: 'Ceramah Maghrib - Tema: Akhlak Islamiah',
          type: 'ceramah',
          description: 'Ceramah mingguan selepas solat Maghrib tentang akhlak dalam Islam',
          date: '2025-06-15',
          time: '19:30',
          endTime: '20:30',
          location: 'Dewan Utama Masjid',
          speaker: 'Ustaz Abdullah Rahman',
          maxParticipants: '100',
          cost: '0',
          registrationRequired: false,
          organizer: 'Ustaz Hassan',
          speakerFee: '200',
          notes: 'Ceramah rutin mingguan'
        });
        setLoading(false);
      }, 1000);
    }
  }, [isEdit]);

  const handleInputChange = (field: keyof ProgramFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(
        isEdit ? 'Program berjaya dikemas kini' : 'Program baru berjaya dijadualkan'
      );
      
      navigate('/program');
    } catch (error) {
      toast.error('Ralat berlaku. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const programTypes = [
    { value: 'ceramah', label: 'Ceramah' },
    { value: 'kelas', label: 'Kelas Mengaji' },
    { value: 'kenduri', label: 'Kenduri' },
    { value: 'gotong-royong', label: 'Gotong-royong' },
    { value: 'program-kanak', label: 'Program Kanak-kanak' },
    { value: 'program-wanita', label: 'Program Wanita' },
    { value: 'program-pemuda', label: 'Program Pemuda' },
    { value: 'lain', label: 'Lain-lain' }
  ];

  const locations = [
    'Dewan Utama Masjid',
    'Dewan Serbaguna',
    'Bilik Kelas 1',
    'Bilik Kelas 2',
    'Kawasan Masjid',
    'Halaman Depan',
    'Dapur Masjid',
    'Luar Kawasan Masjid'
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
        <Button variant="outline" size="sm" onClick={() => navigate('/program')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1>{isEdit ? 'Edit Program' : 'Tambah Program Baru'}</h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Kemas kini maklumat program' : 'Cipta program atau aktiviti baru'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Maklumat Asas</CardTitle>
            <CardDescription>
              Butiran utama program atau aktiviti
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tajuk Program *</Label>
              <Input
                id="title"
                placeholder="cth: Ceramah Maghrib - Tema: Akhlak Islamiah"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Jenis Program *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {programTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizer">Penganjur *</Label>
                <Input
                  id="organizer"
                  placeholder="Nama penganjur"
                  value={formData.organizer}
                  onChange={(e) => handleInputChange('organizer', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Penerangan Program *</Label>
              <Textarea
                id="description"
                placeholder="Penerangan ringkas tentang program..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Location */}
        <Card>
          <CardHeader>
            <CardTitle>Jadual & Lokasi</CardTitle>
            <CardDescription>
              Tarikh, masa dan tempat program berlangsung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Tarikh *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Masa Mula *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Masa Tamat</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Lokasi *</Label>
              <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih lokasi" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Speaker & Participants */}
        <Card>
          <CardHeader>
            <CardTitle>Penceramah & Peserta</CardTitle>
            <CardDescription>
              Maklumat penceramah dan had peserta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="speaker">Penceramah/Fasilitator</Label>
                <Input
                  id="speaker"
                  placeholder="Nama penceramah"
                  value={formData.speaker}
                  onChange={(e) => handleInputChange('speaker', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="speakerFee">Elaun Penceramah (RM)</Label>
                <Input
                  id="speakerFee"
                  type="number"
                  placeholder="0"
                  value={formData.speakerFee}
                  onChange={(e) => handleInputChange('speakerFee', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Had Peserta</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  placeholder="Tiada had jika kosong"
                  value={formData.maxParticipants}
                  onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Yuran/Kos (RM)</Label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="0"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="registrationRequired"
                checked={formData.registrationRequired}
                onCheckedChange={(checked) => handleInputChange('registrationRequired', checked)}
              />
              <Label htmlFor="registrationRequired">
                Memerlukan pendaftaran terlebih dahulu
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Catatan Tambahan</CardTitle>
            <CardDescription>
              Maklumat tambahan atau nota khas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                placeholder="Nota tambahan, persiapan khas, dll..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/program')}>
            Batal
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                {isEdit ? 'Menyimpan...' : 'Menjadualkan...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEdit ? 'Simpan Perubahan' : 'Jadualkan Program'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}