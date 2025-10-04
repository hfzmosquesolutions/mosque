'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  getClaims,
  getUserClaims, 
  createClaim, 
  getAllMosques
} from '@/lib/api';
import type {
  KhairatClaimWithDetails,
  CreateKhairatClaim,
  Mosque,
  ClaimStatus,
  ClaimPriority,
  ClaimFormData
} from '@/types/database';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const getStatusConfig = (t: any): Record<ClaimStatus, { icon: any, color: string, label: string }> => ({
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: t('status.pending') },
  under_review: { icon: AlertCircle, color: 'bg-blue-100 text-blue-800', label: t('status.under_review') },
  approved: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: t('status.approved') },
  rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', label: t('status.rejected') },
  paid: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800', label: t('status.paid') },
  cancelled: { icon: XCircle, color: 'bg-gray-100 text-gray-800', label: t('status.cancelled') }
});

const getPriorityConfig = (t: any): Record<ClaimPriority, { color: string, label: string }> => ({
  low: { color: 'bg-gray-100 text-gray-800', label: t('priority.low') },
  medium: { color: 'bg-yellow-100 text-yellow-800', label: t('priority.medium') },
  high: { color: 'bg-red-100 text-red-800', label: t('priority.high') },
  urgent: { color: 'bg-purple-100 text-purple-800', label: t('priority.urgent') }
});

export default function ClaimsPage() {
  const { user } = useAuth();
  const t = useTranslations('claims');
  const tc = useTranslations('common');
  
  const [claims, setClaims] = useState<KhairatClaimWithDetails[]>([]);
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<ClaimFormData>({
    mosque_id: '',
    requested_amount: 0,
    title: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [claimsResponse, mosquesResponse] = await Promise.all([
        getUserClaims(user!.id),
        getAllMosques()
      ]);
      
      setClaims(claimsResponse.data);
      setMosques(mosquesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!formData.mosque_id || !formData.requested_amount || !formData.title || !formData.description) {
      toast.error(t('messages.fillRequired'));
      return;
    }

    try {
      setSubmitting(true);
      const claimData: CreateKhairatClaim = {
        claimant_id: user!.id,
        mosque_id: formData.mosque_id,
        title: formData.title,
        description: formData.description || '',
        requested_amount: formData.requested_amount,
        priority: formData.priority
      };

      await createClaim(claimData);
      toast.success(t('messages.submitSuccess'));
      setShowCreateDialog(false);
      setFormData({
        mosque_id: '',
        requested_amount: 0,
        title: '',
        description: '',
        priority: 'medium'
      });
      fetchData();
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast.error(t('messages.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: ClaimStatus) => {
    const statusConfig = getStatusConfig(t);
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: ClaimPriority) => {
    const priorityConfig = getPriorityConfig(t);
    const config = priorityConfig[priority];
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const stats = {
    totalClaims: claims.length,
    pendingClaims: claims.filter(c => c.status === 'pending' || c.status === 'under_review').length,
    approvedClaims: claims.filter(c => c.status === 'approved').length,
    totalClaimAmount: claims.reduce((sum, c) => sum + c.requested_amount, 0)
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('newClaim')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{t('submitClaim')}</DialogTitle>
                <DialogDescription>
                  {t('claimDetails')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mosque">{t('mosque')} *</Label>
                  <Select
                    value={formData.mosque_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, mosque_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectMosque')} />
                    </SelectTrigger>
                    <SelectContent>
                      {mosques.map((mosque) => (
                        <SelectItem key={mosque.id} value={mosque.id}>
                          {mosque.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">{t('title')} *</Label>
                  <Input
                    id="title"
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      title: e.target.value 
                    }))}
                    placeholder={t('titlePlaceholder')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">{t('claimAmount')} *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.requested_amount || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      requested_amount: parseFloat(e.target.value) || 0 
                    }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">{tc('priority')}</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: ClaimPriority) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('priority.low')}</SelectItem>
                      <SelectItem value="medium">{t('priority.medium')}</SelectItem>
                      <SelectItem value="high">{t('priority.high')}</SelectItem>
                      <SelectItem value="urgent">{t('priority.urgent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('description')} *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('descriptionPlaceholder')}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    disabled={submitting}
                  >
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleSubmitClaim} disabled={submitting}>
                    {submitting ? t('submitting') : t('submitClaimButton')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.totalClaims')}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClaims}</div>
              <p className="text-xs text-muted-foreground">
                {t('stats.allTimeSubmissions')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.pendingClaims')}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingClaims}</div>
              <p className="text-xs text-muted-foreground">
                {t('stats.awaitingReview')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.approvedClaims')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedClaims}</div>
              <p className="text-xs text-muted-foreground">
                {t('stats.readyForPayment')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.totalAmount')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalClaimAmount)}</div>
              <p className="text-xs text-muted-foreground">
                {t('stats.claimedAmount')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Claims List */}
        <Card>
          <CardHeader>
            <CardTitle>{t('yourClaims')}</CardTitle>
            <CardDescription>
              {t('viewManageClaims')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {claims.length > 0 ? (
              <div className="space-y-4">
                {claims.map((claim) => (
                  <Card key={claim.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {claim.mosque?.name || t('unknownMosque')}
                          </h3>
                          {getStatusBadge(claim.status)}
                          {getPriorityBadge(claim.priority)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span>{t('amount')}: {formatCurrency(claim.requested_amount)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{t('submitted')}: {formatDate(claim.created_at)}</span>
                          </div>
                        </div>
                        
                        {claim.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {claim.description}
                          </p>
                        )}
                        
                        {claim.admin_notes && (
                          <div className="mt-2 p-2 bg-muted rounded-md">
                            <p className="text-sm font-medium">{t('adminNotes')}:</p>
                            <p className="text-sm text-muted-foreground">{claim.admin_notes}</p>
                          </div>
                        )}
                      </div>
                      
                      {claim.approved_amount && claim.approved_amount !== claim.requested_amount && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{t('approvedAmount')}</p>
                          <p className="font-semibold text-green-600">
                            {formatCurrency(claim.approved_amount)}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('noClaimsYet')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('noClaimsDescription')}
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('submitFirstClaim')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}