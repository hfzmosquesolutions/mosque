'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { getContributionPrograms, createContribution } from '@/lib/api';
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
      toast.error('Failed to load legacy records');
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
        toast.error('Please select a CSV file');
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
        toast.error(
          'CSV file must have at least a header row and one data row'
        );
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
      toast.error('Error parsing CSV file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !previewData.length) {
      toast.error('Please select a file and review the preview first');
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
        toast.error(
          'No valid records found. Please ensure IC/Passport and Full Name are provided.'
        );
        return;
      }

      await createLegacyKhairatRecords({
        mosque_id: mosqueId,
        records: validRecords,
      });

      toast.success(
        `Successfully uploaded ${validRecords.length} legacy records`
      );
      setSelectedFile(null);
      setPreviewData([]);
      setShowPreview(false);
      setUploadDialogOpen(false);
      loadRecords();
      loadStats();
    } catch (error) {
      console.error('Error uploading legacy records:', error);
      toast.error(
        'Invalid CSV format or upload failed. Please check your data format.'
      );
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

      toast.success('Legacy record unmatched successfully');
      setUnmatchDialogOpen(false);
      setSelectedRecordForUnmatch(null);
      loadRecords();
      loadStats();
    } catch (error) {
      console.error('Error unmatching legacy record:', error);
      toast.error('Failed to unmatch legacy record');
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
      toast.error('Please select at least one record to match');
      return;
    }

    // Filter out already matched records
    const unmatchedRecords = Array.from(selectedRecords).filter((recordId) => {
      const record = records.find((r) => r.id === recordId);
      return record && !record.is_matched;
    });

    if (unmatchedRecords.length === 0) {
      toast.error('Please select at least one unmatched record to match');
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
      toast.error('Please select at least one matched record to unmatch');
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
      toast.error('Failed to load mosque members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadContributionPrograms = async () => {
    setLoadingPrograms(true);
    try {
      const data = await getContributionPrograms(mosqueId);
      setPrograms(data.data || []);
    } catch (error) {
      console.error('Error loading contribution programs:', error);
      toast.error('Failed to load contribution programs');
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
      toast.error('Please select a user to match');
      return;
    }

    if (!selectedProgramId) {
      toast.error('Please select a contribution program');
      return;
    }

    setMatching(true);
    try {
      // Match the legacy record and create contribution in one operation
      const result = await matchLegacyKhairatRecords({
        legacy_record_id: selectedRecordForMatch.id,
        user_id: selectedUserId,
        program_id: selectedProgramId,
      });

      toast.success(
        'Legacy record matched and contribution created successfully'
      );

      setMatchDialogOpen(false);
      setSelectedRecordForMatch(null);
      setSelectedUserId('');
      setSelectedProgramId('');
      loadRecords();
      loadStats();
    } catch (error) {
      console.error('Error in match confirmation:', error);
      toast.error('Failed to complete the matching process');
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
        <DataTableColumnHeader column={column} title="IC/Passport" />
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
        <DataTableColumnHeader column={column} title="Full Name" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('full_name')}</div>
      ),
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Amount" />
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
        <DataTableColumnHeader column={column} title="Status" />
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
            {isMatched ? 'Matched' : 'Unmatched'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'matched_user',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Matched User" />
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
      header: 'Actions',
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
                Unmatch
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenMatchDialog(record)}
              >
                <Link className="h-4 w-4 mr-1" />
                Match
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
              {record.is_matched ? 'Matched' : 'Unmatched'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Amount:</span>
              <p className="font-medium">{formatCurrency(record.amount)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Matched User:</span>
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
                Unmatch
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenMatchDialog(record)}
                className="flex-1"
              >
                <Link className="h-4 w-4 mr-1" />
                Match
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Records
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_records}</div>
              <p className="text-xs text-muted-foreground">
                {stats.matched_records} matched, {stats.unmatched_records}{' '}
                unmatched
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Amount
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.total_amount)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.matched_amount)} matched
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Match Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_records > 0
                  ? Math.round(
                      (stats.matched_records / stats.total_records) * 100
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.matched_records} of {stats.total_records} records
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or IC/Passport..."
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
              <SelectValue placeholder="Filter by match status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Records</SelectItem>
              <SelectItem value="matched">Matched Only</SelectItem>
              <SelectItem value="unmatched">Unmatched Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          {/* Bulk Action Controls */}
          {selectedRecords.size > 0 && (
            <div className="flex gap-2 mr-2">
              <Button variant="outline" onClick={handleClearSelection}>
                Clear
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2">
                    Bulk Actions ({selectedRecords.size})
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
                    Bulk Match ({selectedRecords.size})
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleOpenBulkUnmatchDialog}
                    disabled={selectedRecords.size === 0}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Bulk Unmatch ({selectedRecords.size})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Legacy Data
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Legacy Khairat Records</DialogTitle>
                <DialogDescription>
                  Upload your legacy khairat records using a CSV file. Download
                  the template below to see the required format.
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
                    Download CSV Template
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
                          : 'Click to select CSV file'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedFile
                          ? 'File selected'
                          : 'or drag and drop your CSV file here'}
                      </div>
                    </div>
                  </label>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading records...</span>
                  </div>
                )}

                {/* Data Preview */}
                {showPreview && previewData.length > 0 && (
                  <div className="space-y-4">
                    <div className="border rounded-lg">
                      <div className="p-4 border-b bg-gray-50">
                        <h4 className="font-medium">
                          Data Preview ({previewData.length} records)
                        </h4>
                        <p className="text-sm text-gray-600">
                          Review your data before uploading
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left">
                                IC/Passport
                              </th>
                              <th className="px-3 py-2 text-left">Full Name</th>
                              <th className="px-3 py-2 text-left">
                                Payment Date
                              </th>
                              <th className="px-3 py-2 text-left">Amount</th>
                              <th className="px-3 py-2 text-left">Method</th>
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
                            Showing{' '}
                            {(previewPage - 1) * previewItemsPerPage + 1} to{' '}
                            {Math.min(
                              previewPage * previewItemsPerPage,
                              previewData.length
                            )}{' '}
                            of {previewData.length} records
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
                              Previous
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
                              Next
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
                    Cancel
                  </Button>
                  {showPreview && (
                    <Button
                      onClick={handleUpload}
                      disabled={uploading || !selectedFile}
                    >
                      {uploading && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Upload {previewData.length} Records
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
          No legacy records found
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
          <DataTable columns={columns} data={records} disablePagination={true} />
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
            <DialogTitle>Match Legacy Record to User</DialogTitle>
            <DialogDescription>
              Select a mosque member to match with this legacy record. Users
              with matching IC/Passport numbers are highlighted.
            </DialogDescription>
          </DialogHeader>

          {selectedRecordForMatch && (
            <div className="space-y-6">
              {/* Record Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Legacy Record Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">
                      {selectedRecordForMatch.full_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">IC/Passport:</span>
                    <p className="font-mono">
                      {selectedRecordForMatch.ic_passport_number}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <p className="font-medium">
                      {formatCurrency(selectedRecordForMatch.amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment Date:</span>
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
                  <h4 className="font-medium">Select Mosque Member</h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-all-members"
                      checked={showAllMembers}
                      onCheckedChange={(checked) =>
                        setShowAllMembers(checked === true)
                      }
                    />
                    <Label htmlFor="show-all-members" className="text-sm">
                      Show all members
                    </Label>
                  </div>
                </div>
                {!showAllMembers && (
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Filtered view:</span>{' '}
                      Showing only members with matching IC/Passport numbers
                    </p>
                  </div>
                )}
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading members...</span>
                  </div>
                ) : mosqueMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active mosque members found
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
                              <p>
                                No members found with matching IC/Passport
                                number.
                              </p>
                              <p className="text-sm mt-1">
                                Enable "Show all members" to see other options.
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
                                        ✓ IC Match
                                      </Badge>
                                    )}
                                  </div>

                                  {/* IC/Passport Number */}
                                  {member.user.ic_passport_number && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        IC/Passport:
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
                                          Phone:
                                        </span>
                                        <span>{member.user.phone}</span>
                                      </div>
                                    )}
                                    {member.membership_number && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs font-medium text-gray-500">
                                          Member #:
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
                <h4 className="font-medium mb-3">
                  Select Contribution Program
                </h4>
                {loadingPrograms ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading programs...</span>
                  </div>
                ) : programs.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No active contribution programs found
                  </div>
                ) : (
                  <Select
                    value={selectedProgramId}
                    onValueChange={setSelectedProgramId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a contribution program...">
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
                  Cancel
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
                  Match Record
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
              Confirm Unmatch Record
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to unmatch this legacy record? This action
                will:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Permanently delete the associated contribution record</li>
                <li>Reset the legacy record to unmatched status</li>
                <li>This action cannot be undone</li>
              </ul>
              {selectedRecordForUnmatch && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Record Details:
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Name:</span>{' '}
                      {selectedRecordForUnmatch.full_name}
                    </p>
                    <p>
                      <span className="font-medium">IC/Passport:</span>{' '}
                      {selectedRecordForUnmatch.ic_passport_number}
                    </p>
                    <p>
                      <span className="font-medium">Amount:</span>{' '}
                      {formatCurrency(selectedRecordForUnmatch.amount)}
                    </p>
                    <p>
                      <span className="font-medium">Payment Date:</span>{' '}
                      {formatDate(selectedRecordForUnmatch.payment_date)}
                    </p>
                    {selectedRecordForUnmatch.matched_user && (
                      <p>
                        <span className="font-medium">Matched User:</span>{' '}
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
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUnmatch}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Yes, Unmatch Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Match Dialog */}
      <Dialog open={bulkMatchDialogOpen} onOpenChange={setBulkMatchDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Match Records</DialogTitle>
            <DialogDescription>
              Match {selectedRecords.size} selected records to a user and
              contribution program.
            </DialogDescription>
          </DialogHeader>

          {bulkMatchDialogOpen && (
            <div className="space-y-6">
              {/* Selected Records Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Selected Records ({selectedRecords.size})
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
                <h4 className="font-medium mb-3">Select User</h4>
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading members...</span>
                  </div>
                ) : mosqueMembers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No mosque members found
                  </div>
                ) : (
                  <Select
                    value={bulkSelectedUserId}
                    onValueChange={setBulkSelectedUserId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a user...">
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
                <h4 className="font-medium mb-3">
                  Select Contribution Program
                </h4>
                {loadingPrograms ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading programs...</span>
                  </div>
                ) : programs.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No active contribution programs found
                  </div>
                ) : (
                  <Select
                    value={bulkSelectedProgramId}
                    onValueChange={setBulkSelectedProgramId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a contribution program...">
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
                  Cancel
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
                        `Successfully matched ${selectedRecords.size} records`
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
                          : 'Failed to bulk match records'
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
                  Match {selectedRecords.size} Records
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
            <AlertDialogTitle>Confirm Bulk Unmatch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unmatch {selectedRecords.size} selected
              records?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">This action will:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Permanently delete the associated contribution records</li>
              <li>Reset the legacy records to unmatched status</li>
              <li>This action cannot be undone</li>
            </ul>

            {/* Selected Records Summary */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">
                Records to Unmatch ({selectedRecords.size})
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
              Cancel
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
                    `Successfully unmatched ${matchedRecordIds.length} records`
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
                      : 'Failed to bulk unmatch records'
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
              Yes, Unmatch Records
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
