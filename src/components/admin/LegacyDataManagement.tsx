'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import {
  getLegacyKhairatRecords,
  createLegacyKhairatRecords,
  matchLegacyKhairatRecords,
  unmatchLegacyKhairatRecords,
  bulkMatchLegacyKhairatRecords,
  bulkUnmatchLegacyKhairatRecords,
  getLegacyRecordStats,
} from '@/lib/api/legacy-records';
import { getKariahMemberships } from '@/lib/api/kariah-memberships';
import { getMosqueKhairatSettings, createKhairatContribution } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard, StatsCardColors } from '@/components/ui/stats-card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Upload,
  Download,
  Eye,
  Link,
  Unlink,
  Loader2,
  FileText,
  Users,
  DollarSign,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface LegacyRecord {
  id: string;
  mosque_id: string;
  ic_passport_number: string;
  full_name: string;
  address_line1?: string;
  address_line2?: string;
  address_line3?: string;
  invoice_number?: string;
  payment_date: string;
  amount: number;
  payment_method?: string;
  description?: string;
  customer_po?: string;
  item_number?: string;
  sale_status?: string;
  is_matched: boolean;
  matched_user_id?: string;
  matched_user?: {
    full_name: string;
    phone?: string;
  };
  created_at: string;
  updated_at: string;
}

interface LegacyDataStats {
  total_records: number;
  matched_records: number;
  unmatched_records: number;
  total_amount: number;
  matched_amount: number;
}

interface MosqueMember {
  id: string;
  user_id: string;
  user: {
    id: string;
    full_name: string;
    phone?: string;
    ic_passport_number?: string;
  };
  membership_number?: string;
  status: string;
}

interface ContributionProgram {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface LegacyDataManagementProps {
  mosqueId: string;
}

export function LegacyDataManagement({ mosqueId }: LegacyDataManagementProps) {
  const { user } = useAuth();
  const t = useTranslations('legacyDataManagement');
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<LegacyRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<LegacyRecord[]>([]);
  const [stats, setStats] = useState<LegacyDataStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchFilter, setMatchFilter] = useState<
    'all' | 'matched' | 'unmatched'
  >('all');
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const previewItemsPerPage = 10;
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const limit = 10;

  // Match dialog state
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [selectedRecordForMatch, setSelectedRecordForMatch] =
    useState<LegacyRecord | null>(null);
  const [mosqueMembers, setMosqueMembers] = useState<MosqueMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [matching, setMatching] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);

  // Program selection state
  const [programs, setPrograms] = useState<ContributionProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  // Unmatch confirmation dialog state
  const [unmatchDialogOpen, setUnmatchDialogOpen] = useState(false);
  const [selectedRecordForUnmatch, setSelectedRecordForUnmatch] =
    useState<LegacyRecord | null>(null);

  // Bulk selection state
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(
    new Set()
  );
  const [bulkMatchDialogOpen, setBulkMatchDialogOpen] = useState(false);
  const [bulkMatching, setBulkMatching] = useState(false);
  const [bulkSelectedUserId, setBulkSelectedUserId] = useState<string>('');
  const [bulkSelectedProgramId, setBulkSelectedProgramId] =
    useState<string>('');

  // Bulk unmatch dialog state
  const [bulkUnmatchDialogOpen, setBulkUnmatchDialogOpen] = useState(false);
  const [bulkUnmatching, setBulkUnmatching] = useState(false);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await getLegacyKhairatRecords({
        mosque_id: mosqueId,
        page,
        limit,
        search: searchTerm,
        match_filter: matchFilter,
      });

      setRecords(data.records);
      setPagination(data.pagination);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error loading records:', error);
      toast.error(t('messages.failedToLoadRecords'));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getLegacyRecordStats(mosqueId);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error(t('messages.failedToLoadStats'));
    }
  };

  useEffect(() => {
    if (mosqueId) {
      loadRecords();
      loadStats();
    }
  }, [mosqueId, page, searchTerm, matchFilter]);

  const parseCsvToJson = (csvContent: string) => {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let current = '';
      let inQuotes = false;

      // Parse CSV line handling quoted values
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim()); // Add the last value

      if (values.length !== headers.length) {
        throw new Error(
          `Row ${i + 1} has ${values.length} columns but expected ${
            headers.length
          }`
        );
      }

      // Convert CSV row to the required JSON format
      const record: any = {
        ic_passport_number: values[headers.indexOf('ic_passport_number')] || '',
        full_name: values[headers.indexOf('full_name')] || '',
        address_line1: values[headers.indexOf('address_line1')] || '',
        address_line2: values[headers.indexOf('address_line2')] || '',
        address_line3: values[headers.indexOf('address_line3')] || '',
        invoice_number: values[headers.indexOf('invoice_number')] || '',
        payment_date:
          values[headers.indexOf('payment_date')] ||
          new Date().toISOString().split('T')[0],
        amount: parseFloat(values[headers.indexOf('amount')] || '0'),
        payment_method: values[headers.indexOf('payment_method')] || '',
        description: values[headers.indexOf('description')] || '',
        customer_po: values[headers.indexOf('customer_po')] || '',
        item_number: values[headers.indexOf('item_number')] || '',
        sale_status: values[headers.indexOf('sale_status')] || '',
      };

      records.push(record);
    }

    return records;
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        await parseCSVForPreview(file);
      } else {
        toast.error(t('messages.pleaseSelectCsvFile'));
        event.target.value = '';
      }
    }
  };

  const parseCSVForPreview = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text
        .trim()
        .split('\n')
        .filter((line) => line.trim());

      if (lines.length < 2) {
        toast.error(t('messages.csvMustHaveHeaderAndData'));
        return;
      }

      const headers = lines[0]
        .split(',')
        .map((h) => h.trim().replace(/"/g, ''));
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        // Parse CSV line handling quoted values
        for (let j = 0; j < lines[i].length; j++) {
          const char = lines[i][j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim().replace(/^"|"$/g, '')); // Add the last value

        const record: any = {};

        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });

        data.push(record);
      }

      setPreviewData(data);
      setShowPreview(true);
      setPreviewPage(1);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast.error(t('messages.errorParsingCsv'));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !previewData.length) {
      toast.error(t('messages.pleaseSelectFileAndReview'));
      return;
    }

    setUploading(true);
    try {
      // Validate and clean the preview data
      const validRecords = previewData
        .filter((record) => {
          return record.ic_passport_number && record.full_name;
        })
        .map((record) => ({
          ...record,
          // Ensure payment_date is not empty or null
          payment_date:
            record.payment_date && record.payment_date.trim()
              ? record.payment_date.trim()
              : new Date().toISOString().split('T')[0],
          // Ensure amount is a valid number
          amount:
            record.amount && !isNaN(parseFloat(record.amount))
              ? parseFloat(record.amount)
              : 0,
        }));

      if (validRecords.length === 0) {
        toast.error(t('messages.noValidRecordsFound'));
        return;
      }

      await createLegacyKhairatRecords({
        mosque_id: mosqueId,
        records: validRecords,
      });

      toast.success(
        t('messages.successfullyUploaded', { count: validRecords.length })
      );
      setSelectedFile(null);
      setPreviewData([]);
      setShowPreview(false);
      setUploadDialogOpen(false);
      loadRecords();
      loadStats();
    } catch (error) {
      console.error('Error uploading legacy records:', error);
      toast.error(t('messages.invalidCsvFormat'));
    } finally {
      setUploading(false);
    }
  };

  // Note: handleMatch function removed - now using integrated matchLegacyKhairatRecords
  // that handles both matching and contribution creation in handleConfirmMatch

  const handleUnmatch = (record: LegacyRecord) => {
    setSelectedRecordForUnmatch(record);
    setUnmatchDialogOpen(true);
  };

  const handleConfirmUnmatch = async () => {
    if (!selectedRecordForUnmatch) return;

    try {
      await unmatchLegacyKhairatRecords({
        legacy_record_id: selectedRecordForUnmatch.id,
      });

      toast.success(t('messages.recordUnmatchedSuccessfully'));
      setUnmatchDialogOpen(false);
      setSelectedRecordForUnmatch(null);
      loadRecords();
      loadStats();
    } catch (error) {
      console.error('Error unmatching legacy record:', error);
      toast.error(t('messages.failedToUnmatchRecord'));
    }
  };

  const handleCancelUnmatch = () => {
    setUnmatchDialogOpen(false);
    setSelectedRecordForUnmatch(null);
  };

  // Bulk selection helper functions
  const handleSelectRecord = (recordId: string, checked: boolean) => {
    const newSelected = new Set(selectedRecords);
    if (checked) {
      newSelected.add(recordId);
    } else {
      newSelected.delete(recordId);
    }
    setSelectedRecords(newSelected);
  };

  const handleSelectAll = () => {
    const allRecordIds = new Set(records.map((record) => record.id));
    setSelectedRecords(allRecordIds);
  };

  const handleClearSelection = () => {
    setSelectedRecords(new Set());
  };

  const handleOpenBulkMatchDialog = () => {
    if (selectedRecords.size === 0) {
      toast.error(t('messages.pleaseSelectAtLeastOneRecord'));
      return;
    }

    // Filter out already matched records
    const unmatchedRecords = Array.from(selectedRecords).filter((recordId) => {
      const record = records.find((r) => r.id === recordId);
      return record && !record.is_matched;
    });

    if (unmatchedRecords.length === 0) {
      toast.error(t('messages.pleaseSelectUnmatchedRecord'));
      return;
    }

    // Update selectedRecords to only include unmatched records
    setSelectedRecords(new Set(unmatchedRecords));

    setBulkSelectedUserId('');
    setBulkSelectedProgramId('');
    setBulkMatchDialogOpen(true);
    loadMosqueMembers();
    loadContributionPrograms();
  };

  const handleCloseBulkMatchDialog = () => {
    setBulkMatchDialogOpen(false);
    setBulkSelectedUserId('');
    setBulkSelectedProgramId('');
  };

  const handleOpenBulkUnmatchDialog = () => {
    const matchedRecords = Array.from(selectedRecords).filter((recordId) => {
      const record = records.find((r) => r.id === recordId);
      return record?.is_matched;
    });

    if (matchedRecords.length === 0) {
      toast.error(t('messages.pleaseSelectMatchedRecord'));
      return;
    }

    // Update selectedRecords to only include matched records
    setSelectedRecords(new Set(matchedRecords));

    setBulkUnmatchDialogOpen(true);
  };

  const handleCloseBulkUnmatchDialog = () => {
    setBulkUnmatchDialogOpen(false);
  };

  const loadMosqueMembers = async () => {
    setLoadingMembers(true);
    try {
      const data = await getKariahMemberships({
        mosque_id: mosqueId,
        status: 'active',
        limit: 1000, // Get all active members
      });
      setMosqueMembers(data.memberships);
    } catch (error) {
      console.error('Error loading mosque members:', error);
      toast.error(t('messages.failedToLoadMembers'));
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadContributionPrograms = async () => {
    setLoadingPrograms(true);
    try {
      // Programs removed; use placeholder program list with mosque name
      setPrograms([]);
    } catch (error) {
      console.error('Error loading contribution programs:', error);
      toast.error(t('messages.failedToLoadPrograms'));
    } finally {
      setLoadingPrograms(false);
    }
  };

  const handleOpenMatchDialog = (record: LegacyRecord) => {
    setSelectedRecordForMatch(record);
    setSelectedUserId('');
    setSelectedProgramId('');
    setShowAllMembers(false);
    setMatchDialogOpen(true);
    loadMosqueMembers();
    loadContributionPrograms();
  };

  const handleConfirmMatch = async () => {
    if (!selectedRecordForMatch || !selectedUserId) {
      toast.error(t('messages.pleaseSelectUser'));
      return;
    }

    // Programs removed; skip program selection validation

    setMatching(true);
    try {
      // Match the legacy record and create contribution in one operation
      const result = await matchLegacyKhairatRecords({
        legacy_record_id: selectedRecordForMatch.id,
        user_id: selectedUserId,
        program_id: selectedProgramId || 'default',
      });

      toast.success(t('messages.recordMatchedSuccessfully'));

      setMatchDialogOpen(false);
      setSelectedRecordForMatch(null);
      setSelectedUserId('');
      setSelectedProgramId('');
      loadRecords();
      loadStats();
    } catch (error) {
      console.error('Error in match confirmation:', error);
      toast.error(t('messages.failedToCompleteMatching'));
    } finally {
      setMatching(false);
    }
  };

  const handleCloseMatchDialog = () => {
    setMatchDialogOpen(false);
    setSelectedRecordForMatch(null);
    setSelectedUserId('');
    setSelectedProgramId('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  // Column definitions for DataTable
  const columns: ColumnDef<any>[] = [
    {
      id: 'select',
      header: ({ table }) => {
        const allRecordsSelected =
          records.length > 0 &&
          records.every((record) => selectedRecords.has(record.id));

        return (
          <Checkbox
            checked={allRecordsSelected}
            onCheckedChange={(checked) => {
              if (checked) {
                handleSelectAll();
              } else {
                handleClearSelection();
              }
            }}
            aria-label="Select all records"
            disabled={records.length === 0}
          />
        );
      },
      cell: ({ row }) => {
        const record = row.original;
        const isSelected = selectedRecords.has(record.id);

        return (
          <Checkbox
            checked={selectedRecords.has(record.id)}
            onCheckedChange={(checked) =>
              handleSelectRecord(record.id, !!checked)
            }
            aria-label={`Select record ${record.full_name}`}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'ic_passport_number',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.icPassport')} />
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.getValue('ic_passport_number')}
        </div>
      ),
    },
    {
      accessorKey: 'full_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.fullName')} />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('full_name')}</div>
      ),
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.totalAmount')} />
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          {formatCurrency(row.getValue('amount'))}
        </div>
      ),
    },
    {
      accessorKey: 'is_matched',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.status')} />
      ),
      cell: ({ row }) => {
        const isMatched = row.getValue('is_matched') as boolean;
        return (
          <Badge
            className={`${
              isMatched
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {isMatched ? t('status.matched') : t('status.unmatched')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'matched_user',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.matchedUser')} />
      ),
      cell: ({ row }) => {
        const matchedUser = row.original.matched_user;
        return matchedUser ? (
          <div>
            <div className="font-medium">{matchedUser.full_name}</div>
            {matchedUser.phone && (
              <div className="text-sm text-muted-foreground">
                {matchedUser.phone}
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      id: 'actions',
      header: t('table.actions'),
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="flex items-center gap-2">
            {record.is_matched ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnmatch(record)}
              >
                <Unlink className="h-4 w-4 mr-1" />
                {t('buttons.unmatch')}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenMatchDialog(record)}
              >
                <Link className="h-4 w-4 mr-1" />
                {t('buttons.match')}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // Mobile card component for responsive design
  const MobileLegacyRecordCard = ({ record }: { record: any }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium">{record.full_name}</h3>
              <p className="text-sm text-muted-foreground font-mono">
                {record.ic_passport_number}
              </p>
            </div>
            <Badge
              className={`${
                record.is_matched
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {record.is_matched ? t('status.matched') : t('status.unmatched')}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">
                {t('unmatch.totalAmount')}:
              </span>
              <p className="font-medium">{formatCurrency(record.amount)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">
                {t('unmatch.matchedUser')}:
              </span>
              <p>
                {record.matched_user ? (
                  <>
                    <div className="font-medium">
                      {record.matched_user.full_name}
                    </div>
                    {record.matched_user.phone && (
                      <div className="text-xs text-muted-foreground">
                        {record.matched_user.phone}
                      </div>
                    )}
                  </>
                ) : (
                  '-'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            {record.is_matched ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnmatch(record)}
                className="flex-1"
              >
                <Unlink className="h-4 w-4 mr-1" />
                {t('buttons.unmatch')}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenMatchDialog(record)}
                className="flex-1"
              >
                <Link className="h-4 w-4 mr-1" />
                {t('buttons.match')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title={t('stats.totalRecords')}
            value={stats.total_records}
            subtitle={`${stats.matched_records} matched, ${stats.unmatched_records} unmatched`}
            icon={FileText}
            {...StatsCardColors.slate}
          />

          <StatsCard
            title={t('stats.totalAmount')}
            value={formatCurrency(stats.total_amount)}
            subtitle={`${formatCurrency(stats.matched_amount)} matched`}
            icon={DollarSign}
            {...StatsCardColors.emerald}
          />

          <StatsCard
            title={t('stats.matchRate')}
            value={`${stats.total_records > 0
              ? Math.round(
                  (stats.matched_records / stats.total_records) * 100
                )
              : 0}%`}
            subtitle={`${stats.matched_records} of ${stats.total_records} records`}
            icon={Users}
            {...StatsCardColors.blue}
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={matchFilter}
            onValueChange={(value) =>
              setMatchFilter(value as 'all' | 'matched' | 'unmatched')
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('search.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('search.allRecords')}</SelectItem>
              <SelectItem value="matched">{t('search.matchedOnly')}</SelectItem>
              <SelectItem value="unmatched">
                {t('search.unmatchedOnly')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          {/* Bulk Action Controls */}
          {selectedRecords.size > 0 && (
            <div className="flex gap-2 mr-2">
              <Button variant="outline" onClick={handleClearSelection}>
                {t('buttons.clear')}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2">
                    {t('buttons.bulkActions')} ({selectedRecords.size})
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleOpenBulkMatchDialog}
                    disabled={selectedRecords.size === 0}
                    className="cursor-pointer"
                  >
                    <Link className="h-4 w-4 mr-2" />
                    {t('buttons.bulkMatch')} ({selectedRecords.size})
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleOpenBulkUnmatchDialog}
                    disabled={selectedRecords.size === 0}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    {t('buttons.bulkUnmatch')} ({selectedRecords.size})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                {t('buttons.uploadLegacyData')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('upload.dialogTitle')}</DialogTitle>
                <DialogDescription>
                  {t('upload.dialogDescription')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Download Template Button */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = '/legacy-khairat-records-template.csv';
                      link.download = 'legacy-khairat-records-template.csv';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('buttons.downloadTemplate')}
                  </Button>
                </div>

                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-gray-400" />
                      <div className="text-sm font-medium">
                        {selectedFile
                          ? selectedFile.name
                          : t('upload.selectFile')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedFile
                          ? t('upload.fileSelected')
                          : t('upload.dragDrop')}
                      </div>
                    </div>
                  </label>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('upload.uploading')}</span>
                  </div>
                )}

                {/* Data Preview */}
                {showPreview && previewData.length > 0 && (
                  <div className="space-y-4">
                    <div className="border rounded-lg">
                      <div className="p-4 border-b bg-gray-50">
                        <h4 className="font-medium">
                          {t('upload.dataPreview', { count: previewData.length })}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {t('upload.reviewData')}
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left">
                                {t('table.icPassport')}
                              </th>
                              <th className="px-3 py-2 text-left">
                                {t('table.fullName')}
                              </th>
                              <th className="px-3 py-2 text-left">
                                {t('table.paymentDate')}
                              </th>
                              <th className="px-3 py-2 text-left">
                                {t('table.amount')}
                              </th>
                              <th className="px-3 py-2 text-left">
                                {t('table.method')}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewData
                              .slice(
                                (previewPage - 1) * previewItemsPerPage,
                                previewPage * previewItemsPerPage
                              )
                              .map((record, index) => (
                                <tr key={index} className="border-t">
                                  <td className="px-3 py-2 font-mono text-xs">
                                    {record.ic_passport_number || '-'}
                                  </td>
                                  <td className="px-3 py-2">
                                    {record.full_name || '-'}
                                  </td>
                                  <td className="px-3 py-2">
                                    {record.payment_date || '-'}
                                  </td>
                                  <td className="px-3 py-2">
                                    {record.amount || '-'}
                                  </td>
                                  <td className="px-3 py-2">
                                    {record.payment_method || '-'}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      {previewData.length > previewItemsPerPage && (
                        <div className="p-4 border-t flex justify-between items-center">
                          <div className="text-sm text-gray-600">
                            {t('pagination.showing')}{' '}
                            {(previewPage - 1) * previewItemsPerPage + 1}{' '}
                            {t('pagination.to')}{' '}
                            {Math.min(
                              previewPage * previewItemsPerPage,
                              previewData.length
                            )}{' '}
                            {t('pagination.of')} {previewData.length}{' '}
                            {t('pagination.records')}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setPreviewPage((p) => Math.max(1, p - 1))
                              }
                              disabled={previewPage === 1}
                            >
                              {t('buttons.previous')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setPreviewPage((p) =>
                                  Math.min(
                                    Math.ceil(
                                      previewData.length / previewItemsPerPage
                                    ),
                                    p + 1
                                  )
                                )
                              }
                              disabled={
                                previewPage >=
                                Math.ceil(
                                  previewData.length / previewItemsPerPage
                                )
                              }
                            >
                              {t('buttons.next')}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploadDialogOpen(false);
                      setSelectedFile(null);
                      setPreviewData([]);
                      setShowPreview(false);
                    }}
                    disabled={uploading}
                  >
                    {t('buttons.cancel')}
                  </Button>
                  {showPreview && (
                    <Button
                      onClick={handleUpload}
                      disabled={uploading || !selectedFile}
                    >
                      {uploading && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      {t('buttons.uploadRecords', { count: previewData.length })}
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Records Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('messages.noRecordsFound')}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={records}
              disablePagination={true}
            />
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {records.map((record) => (
              <MobileLegacyRecordCard key={record.id} record={record} />
            ))}
          </div>
        </>
      )}

      {/* Match Dialog */}
      <Dialog open={matchDialogOpen} onOpenChange={handleCloseMatchDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('match.dialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('match.dialogDescription')}
            </DialogDescription>
          </DialogHeader>

          {selectedRecordForMatch && (
            <div className="space-y-6">
              {/* Record Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">{t('match.recordDetails')}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      {t('unmatch.name')}:
                    </span>
                    <p className="font-medium">
                      {selectedRecordForMatch.full_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      {t('unmatch.icPassport')}:
                    </span>
                    <p className="font-mono">
                      {selectedRecordForMatch.ic_passport_number}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      {t('unmatch.amount')}:
                    </span>
                    <p className="font-medium">
                      {formatCurrency(selectedRecordForMatch.amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      {t('unmatch.paymentDate')}:
                    </span>
                    <p>
                      {new Date(
                        selectedRecordForMatch.payment_date
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* User Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{t('match.selectMember')}</h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-all-members"
                      checked={showAllMembers}
                      onCheckedChange={(checked) =>
                        setShowAllMembers(checked === true)
                      }
                    />
                    <Label htmlFor="show-all-members" className="text-sm">
                      {t('match.showAllMembers')}
                    </Label>
                  </div>
                </div>
                {!showAllMembers && (
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">
                        {t('match.filteredView')}:
                      </span>{' '}
                      {t('match.showingMatchingIC')}
                    </p>
                  </div>
                )}
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">{t('match.loadingMembers')}</span>
                  </div>
                ) : mosqueMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('match.noActiveMembers')}
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    <RadioGroup
                      value={selectedUserId}
                      onValueChange={setSelectedUserId}
                    >
                      {(() => {
                        // Filter members based on IC match and toggle state
                        const filteredMembers = showAllMembers
                          ? mosqueMembers
                          : mosqueMembers.filter(
                              (member) =>
                                member.user.ic_passport_number ===
                                selectedRecordForMatch.ic_passport_number
                            );

                        // Sort members with IC matches first
                        const sortedMembers = [...filteredMembers].sort(
                          (a, b) => {
                            const aIsMatch =
                              a.user.ic_passport_number ===
                              selectedRecordForMatch.ic_passport_number;
                            const bIsMatch =
                              b.user.ic_passport_number ===
                              selectedRecordForMatch.ic_passport_number;

                            if (aIsMatch && !bIsMatch) return -1;
                            if (!aIsMatch && bIsMatch) return 1;
                            return a.user.full_name.localeCompare(
                              b.user.full_name
                            );
                          }
                        );

                        if (sortedMembers.length === 0 && !showAllMembers) {
                          return (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>{t('match.noMatchingMembers')}</p>
                              <p className="text-sm mt-1">
                                {t('match.enableShowAll')}
                              </p>
                            </div>
                          );
                        }

                        return sortedMembers.map((member) => {
                          const isIcMatch =
                            member.user.ic_passport_number ===
                            selectedRecordForMatch.ic_passport_number;
                          return (
                            <div
                              key={member.id}
                              className={`flex items-start space-x-3 p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                                isIcMatch ? 'bg-green-50 border-green-200' : ''
                              }`}
                            >
                              <RadioGroupItem
                                value={member.user_id}
                                id={member.id}
                                className="mt-1"
                              />
                              <Label
                                htmlFor={member.id}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="space-y-2">
                                  {/* Name and IC Match Badge */}
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900">
                                      {member.user.full_name}
                                    </h4>
                                    {isIcMatch && (
                                      <Badge className="bg-green-100 text-green-800 text-xs font-medium">
                                        ✓ {t('status.icMatch')}
                                      </Badge>
                                    )}
                                  </div>

                                  {/* IC/Passport Number */}
                                  {member.user.ic_passport_number && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        {t('table.icPassport')}:
                                      </span>
                                      <span
                                        className={`font-mono text-sm font-semibold ${
                                          isIcMatch
                                            ? 'text-green-700'
                                            : 'text-gray-700'
                                        }`}
                                      >
                                        {member.user.ic_passport_number}
                                      </span>
                                    </div>
                                  )}

                                  {/* Phone and Membership Info */}
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    {member.user.phone && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs font-medium text-gray-500">
                                          {t('match.phone')}:
                                        </span>
                                        <span>{member.user.phone}</span>
                                      </div>
                                    )}
                                    {member.membership_number && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs font-medium text-gray-500">
                                          {t('match.memberNumber')}:
                                        </span>
                                        <span className="font-medium">
                                          {member.membership_number}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Label>
                            </div>
                          );
                        });
                      })()}
                    </RadioGroup>
                  </div>
                )}
              </div>

              {/* Program Selection */}
              <div>
                <h4 className="font-medium mb-3">{t('match.selectProgram')}</h4>
                {loadingPrograms ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">{t('match.loadingPrograms')}</span>
                  </div>
                ) : programs.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('match.noActivePrograms')}
                  </div>
                ) : (
                  <Select
                    value={selectedProgramId}
                    onValueChange={setSelectedProgramId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t('match.chooseProgramPlaceholder')}
                      >
                        {selectedProgramId && (
                          <span>
                            {
                              programs.find((p) => p.id === selectedProgramId)
                                ?.name
                            }
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{program.name}</span>
                            {program.description && (
                              <span className="text-sm text-muted-foreground">
                                {program.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleCloseMatchDialog}
                  disabled={matching}
                >
                  {t('buttons.cancel')}
                </Button>
                <Button
                  onClick={handleConfirmMatch}
                  disabled={
                    !selectedUserId ||
                    !selectedProgramId ||
                    matching ||
                    loadingMembers ||
                    loadingPrograms
                  }
                >
                  {matching && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {t('buttons.matchRecord')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Unmatch Confirmation Dialog */}
      <AlertDialog open={unmatchDialogOpen} onOpenChange={setUnmatchDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              {t('unmatch.dialogTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{t('unmatch.confirmMessage')}</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{t('unmatch.deleteContribution')}</li>
                <li>{t('unmatch.resetStatus')}</li>
                <li>{t('unmatch.cannotUndo')}</li>
              </ul>
              {selectedRecordForUnmatch && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {t('unmatch.recordDetails')}:
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">{t('unmatch.name')}:</span>{' '}
                      {selectedRecordForUnmatch.full_name}
                    </p>
                    <p>
                      <span className="font-medium">
                        {t('unmatch.icPassport')}:
                      </span>{' '}
                      {selectedRecordForUnmatch.ic_passport_number}
                    </p>
                    <p>
                      <span className="font-medium">
                        {t('unmatch.amount')}:
                      </span>{' '}
                      {formatCurrency(selectedRecordForUnmatch.amount)}
                    </p>
                    <p>
                      <span className="font-medium">
                        {t('unmatch.paymentDate')}:
                      </span>{' '}
                      {formatDate(selectedRecordForUnmatch.payment_date)}
                    </p>
                    {selectedRecordForUnmatch.matched_user && (
                      <p>
                        <span className="font-medium">
                          {t('unmatch.matchedUser')}:
                        </span>{' '}
                        {selectedRecordForUnmatch.matched_user.full_name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelUnmatch}>
              {t('buttons.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUnmatch}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {t('unmatch.confirmButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Match Dialog */}
      <Dialog open={bulkMatchDialogOpen} onOpenChange={setBulkMatchDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('bulkMatch.dialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('bulkMatch.dialogDescription', { count: selectedRecords.size })}
            </DialogDescription>
          </DialogHeader>

          {bulkMatchDialogOpen && (
            <div className="space-y-6">
              {/* Selected Records Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  {t('bulkMatch.selectedRecords', { count: selectedRecords.size })}
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {records
                    .filter((record) => selectedRecords.has(record.id))
                    .map((record) => (
                      <div key={record.id} className="text-sm text-blue-800">
                        {record.full_name} - {record.ic_passport_number} -{' '}
                        {formatCurrency(record.amount)}
                      </div>
                    ))}
                </div>
              </div>

              {/* User Selection */}
              <div>
                <h4 className="font-medium mb-3">
                  {t('bulkMatch.selectUser')}
                </h4>
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">{t('match.loadingMembers')}</span>
                  </div>
                ) : mosqueMembers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('match.noActiveMembers')}
                  </div>
                ) : (
                  <Select
                    value={bulkSelectedUserId}
                    onValueChange={setBulkSelectedUserId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t('bulkMatch.chooseUserPlaceholder')}
                      >
                        {bulkSelectedUserId && (
                          <span>
                            {
                              mosqueMembers.find(
                                (m) => m.user_id === bulkSelectedUserId
                              )?.user.full_name
                            }
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {mosqueMembers.map((member) => (
                        <SelectItem key={member.id} value={member.user_id}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {member.user.full_name}
                            </span>
                            {member.user.ic_passport_number && (
                              <span className="text-sm text-muted-foreground font-mono">
                                {member.user.ic_passport_number}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Program Selection */}
              <div>
                <h4 className="font-medium mb-3">{t('match.selectProgram')}</h4>
                {loadingPrograms ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">{t('match.loadingPrograms')}</span>
                  </div>
                ) : programs.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('match.noActivePrograms')}
                  </div>
                ) : (
                  <Select
                    value={bulkSelectedProgramId}
                    onValueChange={setBulkSelectedProgramId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t('match.chooseProgramPlaceholder')}
                      >
                        {bulkSelectedProgramId && (
                          <span>
                            {
                              programs.find(
                                (p) => p.id === bulkSelectedProgramId
                              )?.name
                            }
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{program.name}</span>
                            {program.description && (
                              <span className="text-sm text-muted-foreground">
                                {program.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleCloseBulkMatchDialog}
                  disabled={bulkMatching}
                >
                  {t('buttons.cancel')}
                </Button>
                <Button
                  onClick={async () => {
                    if (!bulkSelectedUserId || !bulkSelectedProgramId) return;

                    setBulkMatching(true);
                    try {
                      await bulkMatchLegacyKhairatRecords({
                        legacy_record_ids: Array.from(selectedRecords),
                        user_id: bulkSelectedUserId,
                        program_id: bulkSelectedProgramId,
                      });

                      toast.success(
                        t('messages.bulkMatchSuccess', {
                          count: selectedRecords.size,
                        })
                      );
                      handleCloseBulkMatchDialog();
                      handleClearSelection();
                      loadRecords();
                      loadStats();
                    } catch (error) {
                      console.error('Bulk match error:', error);
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : t('messages.failedToBulkMatch')
                      );
                    } finally {
                      setBulkMatching(false);
                    }
                  }}
                  disabled={
                    !bulkSelectedUserId ||
                    !bulkSelectedProgramId ||
                    bulkMatching ||
                    loadingMembers ||
                    loadingPrograms
                  }
                >
                  {bulkMatching && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {t('bulkMatch.matchRecordsButton', {
                    count: selectedRecords.size,
                  })}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Unmatch Confirmation Dialog */}
      <AlertDialog
        open={bulkUnmatchDialogOpen}
        onOpenChange={setBulkUnmatchDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('bulkUnmatch.dialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('bulkUnmatch.confirmMessage', { count: selectedRecords.size })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('bulkUnmatch.actionWill')}:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>{t('unmatch.deleteContribution')}</li>
              <li>{t('unmatch.resetStatus')}</li>
              <li>{t('unmatch.cannotUndo')}</li>
            </ul>

            {/* Selected Records Summary */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">
                {t('bulkUnmatch.recordsToUnmatch', { count: selectedRecords.size })}
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {records
                  .filter(
                    (record) =>
                      selectedRecords.has(record.id) && record.is_matched
                  )
                  .map((record) => (
                    <div key={record.id} className="text-sm text-red-800">
                      {record.full_name} - {record.ic_passport_number} -{' '}
                      {formatCurrency(record.amount)}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCloseBulkUnmatchDialog}
              disabled={bulkUnmatching}
            >
              {t('buttons.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setBulkUnmatching(true);
                try {
                  const matchedRecordIds = Array.from(selectedRecords).filter(
                    (recordId) => {
                      const record = records.find((r) => r.id === recordId);
                      return record?.is_matched;
                    }
                  );

                  await bulkUnmatchLegacyKhairatRecords({
                    legacy_record_ids: matchedRecordIds,
                  });

                  toast.success(
                    t('messages.bulkUnmatchSuccess', {
                      count: matchedRecordIds.length,
                    })
                  );
                  handleCloseBulkUnmatchDialog();
                  handleClearSelection();
                  loadRecords();
                  loadStats();
                } catch (error) {
                  console.error('Bulk unmatch error:', error);
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : t('messages.failedToBulkUnmatch')
                  );
                } finally {
                  setBulkUnmatching(false);
                }
              }}
              disabled={bulkUnmatching}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {bulkUnmatching && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('bulkUnmatch.confirmButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t('pagination.pageOf', { page: page, totalPages: totalPages })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              {t('buttons.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              {t('buttons.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
