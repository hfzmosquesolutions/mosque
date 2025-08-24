'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getLegacyKhairatRecords,
  createLegacyKhairatRecords,
  matchLegacyKhairatRecords,
  unmatchLegacyKhairatRecords,
  getLegacyRecordStats,
} from '@/lib/api/legacy-records';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const limit = 20;

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await getLegacyKhairatRecords({
        mosque_id: mosqueId,
        page,
        limit: 10,
        search: searchTerm,
        match_filter: matchFilter,
      });

      setRecords(data.records);
      setPagination(data.pagination);
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
        payment_date: values[headers.indexOf('payment_date')] || new Date().toISOString().split('T')[0],
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

  const handleMatch = async (recordId: string, userId: string) => {
    try {
      await matchLegacyKhairatRecords({
        legacy_record_ids: [recordId],
        user_id: userId,
      });

      toast.success('Legacy record matched successfully');
      loadRecords();
      loadStats();
    } catch (error) {
      console.error('Error matching legacy record:', error);
      toast.error('Failed to match legacy record');
    }
  };

  const handleUnmatch = async (recordId: string) => {
    try {
      await unmatchLegacyKhairatRecords({
        legacy_record_ids: [recordId],
      });

      toast.success('Legacy record unmatched successfully');
      loadRecords();
      loadStats();
    } catch (error) {
      console.error('Error unmatching legacy record:', error);
      toast.error('Failed to unmatch legacy record');
    }
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
                onClick={() => handleUnmatch(record.id)}
              >
                <Unlink className="h-4 w-4 mr-1" />
                Unmatch
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast.info('User selection dialog would open here');
                }}
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
                    <div className="font-medium">{record.matched_user.full_name}</div>
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
                onClick={() => handleUnmatch(record.id)}
                className="flex-1"
              >
                <Unlink className="h-4 w-4 mr-1" />
                Unmatch
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast.info('User selection dialog would open here');
                }}
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
            <DataTable columns={columns} data={records} />
          </div>
          
          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {records.map((record) => (
              <MobileLegacyRecordCard
                key={record.id}
                record={record}
              />
            ))}
          </div>
        </>
      )}

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
