'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Upload,
  File,
  X,
  Download,
  Eye,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { uploadPaymentReceipt, deletePaymentReceipt, getPaymentReceipts } from '@/lib/api';
import type { PaymentReceipt } from '@/types/database';

interface PaymentReceiptUploadProps {
  contributionId?: string; // If provided, will load existing receipts
  onReceiptsChange?: (receipts: PaymentReceipt[] | File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function PaymentReceiptUpload({
  contributionId,
  onReceiptsChange,
  maxFiles = 3,
  disabled = false
}: PaymentReceiptUploadProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [existingReceipts, setExistingReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Load existing receipts if contributionId is provided
  React.useEffect(() => {
    if (contributionId) {
      loadExistingReceipts();
    }
  }, [contributionId]);

  const loadExistingReceipts = async () => {
    if (!contributionId) return;
    
    try {
      setLoading(true);
      const response = await getPaymentReceipts(contributionId);
      if (response.success) {
        setExistingReceipts(response.data || []);
        onReceiptsChange?.(response.data || []);
      }
    } catch (error) {
      console.error('Error loading receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Validate file count
    const totalFiles = uploadedFiles.length + existingReceipts.length + files.length;
    if (totalFiles > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate files
    const validFiles: UploadedFile[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
    ];

    files.forEach((file) => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} has an unsupported file type. Only JPEG, PNG, GIF, and PDF are allowed.`);
        return;
      }

      validFiles.push({
        id: Math.random().toString(36).substring(2),
        file,
        status: 'pending'
      });
    });

    const updatedFiles = [...uploadedFiles, ...validFiles];
    setUploadedFiles(updatedFiles);
    
    // Notify parent component about pending files (outside of setState to avoid React warning)
    if (!contributionId && onReceiptsChange) {
      // Use setTimeout to defer the callback to avoid updating during render
      setTimeout(() => {
        onReceiptsChange(updatedFiles.map(f => f.file));
      }, 0);
    }
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (uploadedFile: UploadedFile) => {
    if (!contributionId || !user?.id) {
      toast.error('Contribution ID and user ID are required');
      return;
    }

    setUploadedFiles(prev =>
      prev.map(f =>
        f.id === uploadedFile.id ? { ...f, status: 'uploading' } : f
      )
    );

    try {
      const response = await uploadPaymentReceipt(
        contributionId,
        uploadedFile.file,
        user.id
      );

      if (response.success && response.data) {
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === uploadedFile.id
              ? { ...f, status: 'success' }
              : f
          )
        );
        toast.success(`${uploadedFile.file.name} uploaded successfully`);
        loadExistingReceipts();
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error: any) {
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === uploadedFile.id
            ? { ...f, status: 'error', error: error.message }
            : f
        )
      );
      toast.error(`Failed to upload ${uploadedFile.file.name}: ${error.message}`);
    }
  };

  const handleDelete = async (receiptId: string) => {
    if (!contributionId || !user?.id) {
      return;
    }

    try {
      const response = await deletePaymentReceipt(contributionId, receiptId, user.id);
      if (response.success) {
        toast.success('Receipt deleted successfully');
        loadExistingReceipts();
      } else {
        toast.error(response.error || 'Failed to delete receipt');
      }
    } catch (error: any) {
      toast.error(`Failed to delete receipt: ${error.message}`);
    }
  };

  const removePendingFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter(f => f.id !== fileId);
    setUploadedFiles(updatedFiles);
    
    // Notify parent component (outside of setState)
    if (!contributionId && onReceiptsChange) {
      setTimeout(() => {
        onReceiptsChange(updatedFiles.map(f => f.file));
      }, 0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="h-4 w-4" />;
    if (fileType.startsWith('image/')) return <Eye className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Payment Receipt</Label>
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadedFiles.length + existingReceipts.length >= maxFiles}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Receipt
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,application/pdf"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Existing Receipts */}
      {existingReceipts.length > 0 && (
        <div className="space-y-2">
          {existingReceipts.map((receipt) => (
            <Card key={receipt.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {getFileIcon(receipt.file_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{receipt.file_name}</p>
                    {receipt.file_size && (
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(receipt.file_size)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedReceipt(receipt);
                      setIsPreviewOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <a
                    href={receipt.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button type="button" variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(receipt.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pending Uploads */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((uploadedFile) => (
            <Card key={uploadedFile.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {uploadedFile.status === 'uploading' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : uploadedFile.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : uploadedFile.status === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <File className="h-4 w-4" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                    {uploadedFile.error && (
                      <p className="text-xs text-red-600">{uploadedFile.error}</p>
                    )}
                  </div>
                </div>
                {uploadedFile.status === 'pending' && !contributionId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePendingFile(uploadedFile.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {uploadedFile.status === 'pending' && contributionId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpload(uploadedFile)}
                  >
                    Upload
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {existingReceipts.length === 0 && uploadedFiles.length === 0 && (
        <Card className="p-6 border-dashed">
          <div className="text-center text-muted-foreground">
            <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No receipt uploaded yet</p>
            <p className="text-xs mt-1">Upload a payment receipt (JPEG, PNG, GIF, or PDF)</p>
          </div>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Receipt Preview</DialogTitle>
            <DialogDescription>{selectedReceipt?.file_name}</DialogDescription>
          </DialogHeader>
          {selectedReceipt && (
            <div className="mt-4">
              {selectedReceipt.file_type?.startsWith('image/') ? (
                <img
                  src={selectedReceipt.file_url}
                  alt={selectedReceipt.file_name}
                  className="max-w-full h-auto rounded-lg"
                />
              ) : (
                <iframe
                  src={selectedReceipt.file_url}
                  className="w-full h-[600px] rounded-lg"
                  title={selectedReceipt.file_name}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

