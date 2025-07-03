import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  Send, 
  MessageSquare, 
  Mail, 
  Phone,
  Users, 
  Plus,
  Eye,
  Edit,
  Trash,
  Filter,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { User } from '../../App';
import { toast } from 'sonner@2.0.3';

interface Message {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'reminder' | 'emergency' | 'invitation';
  recipients: 'all' | 'kariah' | 'khairat' | 'ajk' | 'specific';
  recipientCount: number;
  sentDate: string;
  status: 'draft' | 'scheduled' | 'sent';
  sentBy: string;
  readCount: number;
  scheduledDate?: string;
}

interface CommunicationCenterProps {
  user: User;
}

export function CommunicationCenter({ user }: CommunicationCenterProps) {
  const [selectedTab, setSelectedTab] = useState('messages');
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [messageForm, setMessageForm] = useState({
    title: '',
    content: '',
    type: 'announcement',
    recipients: 'all',
    specificMembers: [],
    scheduleDate: '',
    scheduleTime: ''
  });

  // Mock data
  const messages: Message[] = [
    {
      id: 'MSG001',
      title: 'Perubahan Waktu Solat Jumaat',
      content: 'Assalamualaikum. Diberitahu bahawa waktu solat Jumaat akan berubah bermula minggu depan kepada 1:00 PM. Harap maklum.',
      type: 'announcement',
      recipients: 'all',
      recipientCount: 847,
      sentDate: '2025-06-13T10:30:00',
      status: 'sent',
      sentBy: 'Ustaz Abdullah',
      readCount: 623
    },
    {
      id: 'MSG002',
      title: 'Peringatan Bayaran Yuran Khairat',
      content: 'Peringatan kepada ahli khairat yang yuran bulan Jun belum dijelaskan. Sila jelaskan sebelum 20 Jun 2025.',
      type: 'reminder',
      recipients: 'khairat',
      recipientCount: 623,
      sentDate: '2025-06-12T15:45:00',
      status: 'sent',
      sentBy: 'En. Ahmad (Bendahari)',
      readCount: 445
    },
    {
      id: 'MSG003',
      title: 'Jemputan Gotong-royong Masjid',
      content: 'Jemputan khas kepada semua ahli kariah untuk menyertai gotong-royong membersih masjid pada 17 Jun 2025, bermula jam 8:00 pagi.',
      type: 'invitation',
      recipients: 'kariah',
      recipientCount: 847,
      sentDate: '2025-06-10T09:00:00',
      status: 'sent',
      sentBy: 'Ustaz Hassan',
      readCount: 612
    },
    {
      id: 'MSG004',
      title: 'Ceramah Khas Malam Jumaat',
      content: 'Jemputan menghadiri ceramah khas malam Jumaat dengan topik "Adab Bermuamalah dalam Islam" oleh Ustaz Dr. Mahmud.',
      type: 'invitation',
      recipients: 'all',
      recipientCount: 847,
      sentDate: '',
      status: 'scheduled',
      sentBy: 'Ustaz Abdullah',
      readCount: 0,
      scheduledDate: '2025-06-14T08:00:00'
    },
    {
      id: 'MSG005',
      title: 'Kemas Kini Maklumat Ahli',
      content: 'Draf mesej untuk mengingatkan ahli mengemas kini maklumat peribadi mereka dalam sistem.',
      type: 'reminder',
      recipients: 'all',
      recipientCount: 847,
      sentDate: '',
      status: 'draft',
      sentBy: 'Ustaz Abdullah',
      readCount: 0
    }
  ];

  const communicationStats = [
    { label: 'Mesej Dihantar', value: messages.filter(m => m.status === 'sent').length, icon: Send },
    { label: 'Mesej Terjadual', value: messages.filter(m => m.status === 'scheduled').length, icon: Clock },
    { label: 'Draf Mesej', value: messages.filter(m => m.status === 'draft').length, icon: Edit },
    { label: 'Kadar Bacaan', value: '73%', icon: Eye }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500">Dihantar</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500">Terjadual</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draf</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      'announcement': { label: 'Pengumuman', color: 'bg-blue-500' },
      'reminder': { label: 'Peringatan', color: 'bg-orange-500' },
      'emergency': { label: 'Kecemasan', color: 'bg-red-500' },
      'invitation': { label: 'Jemputan', color: 'bg-purple-500' }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || { label: type, color: 'bg-gray-500' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getRecipientsBadge = (recipients: string, count: number) => {
    const recipientLabels = {
      'all': 'Semua Ahli',
      'kariah': 'Ahli Kariah',
      'khairat': 'Ahli Khairat',
      'ajk': 'AJK',
      'specific': 'Terpilih'
    };
    
    return (
      <div className="flex items-center gap-2">
        <Users className="h-3 w-3" />
        <span>{recipientLabels[recipients as keyof typeof recipientLabels]} ({count})</span>
      </div>
    );
  };

  const handleSendMessage = async () => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Mesej berjaya dihantar kepada ahli');
      setShowComposeDialog(false);
      setMessageForm({
        title: '',
        content: '',
        type: 'announcement',
        recipients: 'all',
        specificMembers: [],
        scheduleDate: '',
        scheduleTime: ''
      });
    } catch (error) {
      toast.error('Ralat berlaku. Sila cuba lagi.');
    }
  };

  const canManageCommunication = user.role === 'super_admin' || user.role === 'mosque_admin' || 
                                (user.role === 'ajk' && user.permissions?.includes('manage_communication'));

  const ComposeMessageDialog = () => (
    <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Hantar Mesej Baru</DialogTitle>
          <DialogDescription>
            Cipta dan hantar mesej kepada ahli masjid
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="messageType">Jenis Mesej</Label>
              <Select value={messageForm.type} onValueChange={(value) => setMessageForm(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">Pengumuman</SelectItem>
                  <SelectItem value="reminder">Peringatan</SelectItem>
                  <SelectItem value="invitation">Jemputan</SelectItem>
                  <SelectItem value="emergency">Kecemasan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipients">Penerima</Label>
              <Select value={messageForm.recipients} onValueChange={(value) => setMessageForm(prev => ({ ...prev, recipients: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Ahli</SelectItem>
                  <SelectItem value="kariah">Ahli Kariah</SelectItem>
                  <SelectItem value="khairat">Ahli Khairat</SelectItem>
                  <SelectItem value="ajk">AJK</SelectItem>
                  <SelectItem value="specific">Pilih Ahli</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Tajuk Mesej</Label>
            <Input
              id="title"
              placeholder="Masukkan tajuk mesej..."
              value={messageForm.title}
              onChange={(e) => setMessageForm(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Kandungan Mesej</Label>
            <Textarea
              id="content"
              placeholder="Tulis mesej anda di sini..."
              rows={6}
              value={messageForm.content}
              onChange={(e) => setMessageForm(prev => ({ ...prev, content: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduleDate">Jadual Tarikh (Opsional)</Label>
              <Input
                id="scheduleDate"
                type="date"
                value={messageForm.scheduleDate}
                onChange={(e) => setMessageForm(prev => ({ ...prev, scheduleDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduleTime">Jadual Masa (Opsional)</Label>
              <Input
                id="scheduleTime"
                type="time"
                value={messageForm.scheduleTime}
                onChange={(e) => setMessageForm(prev => ({ ...prev, scheduleTime: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowComposeDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSendMessage}>
              <Send className="h-4 w-4 mr-2" />
              {messageForm.scheduleDate ? 'Jadualkan' : 'Hantar'} Mesej
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Pusat Komunikasi</h1>
          <p className="text-muted-foreground">
            Uruskan komunikasi dengan ahli masjid melalui SMS, email dan notifikasi
          </p>
        </div>
        {canManageCommunication && (
          <Button onClick={() => setShowComposeDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Mesej Baru
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {communicationStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="messages">Mesej Dihantar</TabsTrigger>
          <TabsTrigger value="templates">Template Mesej</TabsTrigger>
          <TabsTrigger value="settings">Tetapan</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sejarah Mesej</CardTitle>
                  <CardDescription>
                    Senarai mesej yang telah dihantar, terjadual dan draf
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="sent">Dihantar</SelectItem>
                      <SelectItem value="scheduled">Terjadual</SelectItem>
                      <SelectItem value="draft">Draf</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mesej</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Penerima</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tarikh</TableHead>
                    <TableHead>Kadar Bacaan</TableHead>
                    <TableHead className="text-right">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{message.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {message.content}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(message.type)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {getRecipientsBadge(message.recipients, message.recipientCount)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(message.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {message.status === 'scheduled' && message.scheduledDate ? (
                            <>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(message.scheduledDate).toLocaleDateString('ms-MY')}
                              </div>
                              <div className="text-muted-foreground">
                                {new Date(message.scheduledDate).toLocaleTimeString('ms-MY', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </>
                          ) : message.sentDate ? (
                            <>
                              <div>{new Date(message.sentDate).toLocaleDateString('ms-MY')}</div>
                              <div className="text-muted-foreground">
                                {new Date(message.sentDate).toLocaleTimeString('ms-MY', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {message.status === 'sent' ? (
                          <div className="text-sm">
                            <div>{message.readCount} / {message.recipientCount}</div>
                            <div className="text-muted-foreground">
                              {Math.round((message.readCount / message.recipientCount) * 100)}%
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(message.status === 'draft' || message.status === 'scheduled') && canManageCommunication && (
                            <>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Mesej</CardTitle>
              <CardDescription>
                Template mesej yang boleh digunakan semula
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4>Peringatan Bayaran Yuran</h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    Template untuk mengingatkan ahli tentang bayaran yuran yang tertunggak
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Guna Template
                  </Button>
                </Card>
                <Card className="p-4">
                  <h4>Jemputan Program</h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    Template untuk menjemput ahli ke program atau aktiviti masjid
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Guna Template
                  </Button>
                </Card>
                <Card className="p-4">
                  <h4>Pengumuman Perubahan Waktu</h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    Template untuk mengumumkan perubahan waktu solat atau program
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Guna Template
                  </Button>
                </Card>
                <Card className="p-4">
                  <h4>Ucapan Selamat Hari Raya</h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    Template ucapan selamat untuk hari raya dan perayaan Islam
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Guna Template
                  </Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tetapan Komunikasi</CardTitle>
              <CardDescription>
                Konfigurasi kaedah dan kekerapan komunikasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4>Kaedah Komunikasi</h4>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="sms" defaultChecked />
                      <label htmlFor="sms" className="text-sm">SMS</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="email" defaultChecked />
                      <label htmlFor="email" className="text-sm">Email</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="whatsapp" />
                      <label htmlFor="whatsapp" className="text-sm">WhatsApp (Coming Soon)</label>
                    </div>
                  </div>
                </div>

                <div>
                  <h4>Automatik Peringatan</h4>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="payment-reminder" defaultChecked />
                      <label htmlFor="payment-reminder" className="text-sm">Peringatan bayaran yuran (3 hari sebelum tamat tempoh)</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="program-reminder" defaultChecked />
                      <label htmlFor="program-reminder" className="text-sm">Peringatan program (1 hari sebelum program)</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="birthday-wishes" />
                      <label htmlFor="birthday-wishes" className="text-sm">Ucapan hari lahir ahli</label>
                    </div>
                  </div>
                </div>

                <div>
                  <h4>Masa Hantar Mesej</h4>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="start-time">Masa Mula</Label>
                      <Input id="start-time" type="time" defaultValue="08:00" />
                    </div>
                    <div>
                      <Label htmlFor="end-time">Masa Tamat</Label>
                      <Input id="end-time" type="time" defaultValue="22:00" />
                    </div>
                  </div>
                </div>
              </div>

              <Button>
                Simpan Tetapan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ComposeMessageDialog />
    </div>
  );
}