'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  Eye,
  Check,
  X,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  User,
  Building,
  FileText,
  Plus,
  Filter,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  getClaims,
  updateClaim,
  getContributionPrograms
} from '@/lib/api';
import type {
  KhairatClaimWithDetails,
  ClaimStatus,
  ClaimPriority,
  ContributionProgram,
  UpdateKhairatClaim
} from '@/types/database';

interface ClaimStats {
  total: number;
  pending: number;
  under_review: number;
  approved: number;
  rejected: number;
  paid: number;
  cancelled: number;
}

interface ClaimsManagementProps {
  mosqueId: string;
}

const getStatusConfig = (t: any) => ({
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: t('status.pending') },
  under_review: { icon: AlertCircle, color: 'bg-blue-100 text-blue-800', label: t('status.under_review') },
  approved: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: t('status.approved') },
  rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', label: t('status.rejected') },
  paid: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800', label: t('status.paid') },
  cancelled: { icon: XCircle, color: 'bg-gray-100 text-gray-800', label: t('status.cancelled') }
});

const getPriorityConfig = (t: any) => ({
  low: { color: 'bg-gray-100 text-gray-800', label: t('priority.low') },
  medium: { color: 'bg-yellow-100 text-yellow-800', label: t('priority.medium') },
  high: { color: 'bg-red-100 text-red-800', label: t('priority.high') },
  urgent: { color: 'bg-purple-100 text-purple-800', label: t('priority.urgent') }
});

export function ClaimsManagement({ mosqueId }: ClaimsManagementProps) {
  const { user } = useAuth();
  const t = useTranslations('claims');
  const tc = useTranslations('common');
  
  const [claims, setClaims] = useState<KhairatClaimWithDetails[]>([]);
  const [programs, setPrograms] = useState<ContributionProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<KhairatClaimWithDetails | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: '' as ClaimStatus,
    notes: '',
    approved_amount: 0
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<ClaimPriority | 'all'>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');

  const statusConfig = getStatusConfig(t);
  const priorityConfig = getPriorityConfig(t);

  useEffect(() => {
    fetchData();
  }, [mosqueId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [claimsResponse, programsResponse] = await Promise.all([
        getClaims({ mosque_id: mosqueId }),
        getContributionPrograms(mosqueId)
      ]);
      
      setClaims(claimsResponse.data || []);
      setPrograms(programsResponse.data?.filter(p => p.program_type === 'khairat') || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClaim = (claim: KhairatClaimWithDetails) => {
    setSelectedClaim(claim);
    setReviewData({
      status: claim.status,
      notes: claim.admin_notes || '',
      approved_amount: claim.approved_amount || claim.requested_amount
    });
    setShowReviewDialog(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedClaim) return;

    try {
      setSubmitting(true);
      const updateData: UpdateKhairatClaim = {
        status: reviewData.status,
        admin_notes: reviewData.notes,
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString()
      };

      if (reviewData.status === 'approved') {
        updateData.approved_amount = reviewData.approved_amount;
        updateData.approved_by = user!.id;
        updateData.approved_at = new Date().toISOString();
      }

      if (reviewData.status === 'rejected') {
        updateData.rejection_reason = reviewData.notes;
      }

      await updateClaim(selectedClaim.id, updateData);
      
      toast.success(t('messages.reviewSubmitted'));
      setShowReviewDialog(false);
      setSelectedClaim(null);
      fetchData();
    } catch (error) {
      console.error('Error updating claim:', error);
      toast.error(t('messages.reviewError'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStats = (): ClaimStats => {
    return claims.reduce(
      (acc, claim) => {
        acc.total++;
        acc[claim.status]++;
        return acc;
      },
      {
        total: 0,
        pending: 0,
        under_review: 0,
        approved: 0,
        rejected: 0,
        paid: 0,
        cancelled: 0
      }
    );
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.claimant?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || claim.priority === priorityFilter;
    const matchesProgram = programFilter === 'all' || claim.program_id === programFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesProgram;
  });

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.totalClaims')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.pendingClaims')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending + stats.under_review}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.approvedClaims')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved + stats.paid}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.rejectedClaims')}</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {tc('filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{tc('search')}</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{tc('status')}</label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ClaimStatus | 'all')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tc('all')}</SelectItem>
                  <SelectItem value="pending">{t('status.pending')}</SelectItem>
                  <SelectItem value="under_review">{t('status.under_review')}</SelectItem>
                  <SelectItem value="approved">{t('status.approved')}</SelectItem>
                  <SelectItem value="rejected">{t('status.rejected')}</SelectItem>
                  <SelectItem value="paid">{t('status.paid')}</SelectItem>
                  <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{tc('priority')}</label>
              <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as ClaimPriority | 'all')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tc('all')}</SelectItem>
                  <SelectItem value="low">{t('priority.low')}</SelectItem>
                  <SelectItem value="medium">{t('priority.medium')}</SelectItem>
                  <SelectItem value="high">{t('priority.high')}</SelectItem>
                  <SelectItem value="urgent">{t('priority.urgent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('program')}</label>
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tc('all')}</SelectItem>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('title')} ({filteredClaims.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClaims.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('noClaimsFound')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('claimant')}</TableHead>
                    <TableHead>{t('program')}</TableHead>
                    <TableHead>{t('amount')}</TableHead>
                    <TableHead>{tc('priority')}</TableHead>
                    <TableHead>{tc('status')}</TableHead>
                    <TableHead>{t('submitted')}</TableHead>
                    <TableHead className="text-right">{tc('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.map((claim) => {
                    const StatusIcon = statusConfig[claim.status].icon;
                    return (
                      <TableRow key={claim.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{claim.claimant?.full_name}</p>
                              <p className="text-sm text-muted-foreground">{claim.claimant?.phone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span>{claim.program?.name || t('unknownProgram')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formatCurrency(claim.requested_amount)}</p>
                            {claim.approved_amount && claim.approved_amount !== claim.requested_amount && (
                              <p className="text-sm text-green-600">
                                {t('approvedAmount')}: {formatCurrency(claim.approved_amount)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityConfig[claim.priority].color}>
                            {priorityConfig[claim.priority].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[claim.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[claim.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm">{formatDate(claim.created_at)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(claim.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReviewClaim(claim)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {tc('review')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('reviewClaim')}</DialogTitle>
            <DialogDescription>
              {t('reviewClaimDescription')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedClaim && (
            <div className="space-y-6">
              {/* Claim Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">{t('claimant')}</p>
                  <p className="text-sm text-muted-foreground">{selectedClaim.claimant?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{t('program')}</p>
                  <p className="text-sm text-muted-foreground">{selectedClaim.program?.name || t('unknownProgram')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{t('claimAmount')}</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(selectedClaim.requested_amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{tc('priority')}</p>
                  <Badge className={priorityConfig[selectedClaim.priority].color}>
                    {priorityConfig[selectedClaim.priority].label}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium">{t('reason')}</p>
                  <p className="text-sm text-muted-foreground">{selectedClaim.title}</p>
                </div>
                {selectedClaim.description && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium">{t('description')}</p>
                    <p className="text-sm text-muted-foreground">{selectedClaim.description}</p>
                  </div>
                )}
              </div>

              {/* Review Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{tc('status')}</label>
                  <Select
                    value={reviewData.status}
                    onValueChange={(value) => setReviewData(prev => ({ ...prev, status: value as ClaimStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t('status.pending')}</SelectItem>
                      <SelectItem value="under_review">{t('status.under_review')}</SelectItem>
                      <SelectItem value="approved">{t('status.approved')}</SelectItem>
                      <SelectItem value="rejected">{t('status.rejected')}</SelectItem>
                      <SelectItem value="paid">{t('status.paid')}</SelectItem>
                      <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reviewData.status === 'approved' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('approvedAmount')}</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={selectedClaim.requested_amount}
                      value={reviewData.approved_amount}
                      onChange={(e) => setReviewData(prev => ({ ...prev, approved_amount: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('adminNotes')}</label>
                  <Textarea
                    placeholder={t('adminNotesPlaceholder')}
                    value={reviewData.notes}
                    onChange={(e) => setReviewData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowReviewDialog(false)}
                  disabled={submitting}
                >
                  {tc('cancel')}
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {tc('save')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}