'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { compressImage } from '@/utils/image-compression';
import { useTranslations } from 'next-intl';

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
  maxFiles = 1,
  disabled = false
}: PaymentReceiptUploadProps) {
  const { user } = useAuth();
  const tKhairat = useTranslations('khairat');
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Validate file count
    const totalFiles =
      uploadedFiles.length + existingReceipts.length + files.length;
    if (totalFiles > maxFiles) {
      toast.error(
        tKhairat('payPage.tooManyFiles', {
          count: maxFiles,
        })
      );
      return;
    }

    // Validate and compress files
    const validFiles: UploadedFile[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
    ];

    // Prepare image files for optional compression (no user-facing toast)
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    for (const file of files) {
      if (file.size > maxSize) {
        toast.error(
          tKhairat('payPage.fileTooLarge', {
            fileName: file.name,
          })
        );
        continue;
      }

      if (!allowedTypes.includes(file.type)) {
        toast.error(
          tKhairat('payPage.unsupportedFileType', {
            fileName: file.name,
          })
        );
        continue;
      }

      // Compress image files to reduce size
      let processedFile = file;
      if (file.type.startsWith('image/')) {
        try {
          processedFile = await compressImage(file, 2, 1920); // Max 2MB, max dimension 1920px
          if (processedFile.size < file.size) {
            const reduction = ((file.size - processedFile.size) / file.size * 100).toFixed(1);
            console.log(`Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(processedFile.size / 1024 / 1024).toFixed(2)}MB (${reduction}% reduction)`);
          }
        } catch (error) {
          console.error('Error compressing image:', error);
          // Continue with original file if compression fails
        }
      }

      validFiles.push({
        id: Math.random().toString(36).substring(2),
        file: processedFile,
        status: 'pending'
      });
    }

    if (validFiles.length === 0) {
      // Clear the input if no valid files
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const updatedFiles = [...uploadedFiles, ...validFiles];
    setUploadedFiles(updatedFiles);
    
    // Notify parent component about pending files (outside of setState to avoid React warning)
    if (!contributionId && onReceiptsChange) {
      // Use requestAnimationFrame for better timing with React state updates
      requestAnimationFrame(() => {
        onReceiptsChange(updatedFiles.map(f => f.file));
      });
    }
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (uploadedFile: UploadedFile) => {
    if (!contributionId || !user?.id) {
      toast.error(tKhairat('payPage.uploadMissingIds'));
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
        toast.success(
          tKhairat('payPage.uploadSuccess', {
            fileName: uploadedFile.file.name,
          })
        );
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
      toast.error(
        tKhairat('payPage.uploadFailed', {
          fileName: uploadedFile.file.name,
        })
      );
    }
  };

  const handleDelete = async (receiptId: string) => {
    if (!contributionId || !user?.id) {
      return;
    }

    try {
      const response = await deletePaymentReceipt(
        contributionId,
        receiptId,
        user.id
      );
      if (response.success) {
        toast.success(tKhairat('payPage.deleteSuccess'));
        loadExistingReceipts();
      } else {
        toast.error(
          response.error || tKhairat('payPage.deleteFailedGeneric')
        );
      }
    } catch (error: any) {
      toast.error(tKhairat('payPage.deleteFailed'));
    }
  };

  const removePendingFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter(f => f.id !== fileId);
    setUploadedFiles(updatedFiles);
    
    // Notify parent component immediately
    if (!contributionId && onReceiptsChange) {
      // Use requestAnimationFrame for better timing with React state updates
      requestAnimationFrame(() => {
        onReceiptsChange(updatedFiles.map(f => f.file));
      });
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
    // Standardized file icon (no emoji/thumbnail)
    return <File className="h-4 w-4" />;
  };

  const totalFiles = uploadedFiles.length + existingReceipts.length;
  const canUpload =
    !disabled && uploadedFiles.length + existingReceipts.length < maxFiles;

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,application/pdf"
        multiple={maxFiles > 1}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Area */}
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6">
        <div className="text-center">
          <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {existingReceipts.length === 0 && uploadedFiles.length === 0 
                ? tKhairat('payPage.noReceiptUploaded')
                : tKhairat('payPage.uploadPaymentReceiptTitle')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {tKhairat('payPage.uploadPaymentReceiptDescription')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {tKhairat('payPage.uploadPaymentReceiptLimit', {
                count: maxFiles,
              })}
            </p>
          </div>
          
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canUpload}
          >
            <Upload className="h-4 w-4 mr-2" />
            {tKhairat('payPage.uploadReceiptButton')}
          </Button>
        </div>
      </div>

      {/* File Count */}
      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
        <span>
          {tKhairat('payPage.filesCount', {
            current: totalFiles,
            max: maxFiles,
          })}
        </span>
        {contributionId && (
          <span>
            {tKhairat('payPage.uploadedCount', {
              count: existingReceipts.length,
            })}
          </span>
        )}
      </div>

      {/* Pending Uploads */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {tKhairat('payPage.filesToUploadTitle')}
          </h4>
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
                    <p className="text-sm font-medium truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                    {uploadedFile.error && (
                      <p className="text-xs text-red-600">
                        {uploadedFile.error}
                      </p>
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

      {/* Existing Receipts */}
      {existingReceipts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {tKhairat('payPage.uploadedReceiptsTitle')}
          </h4>
          {existingReceipts.map((receipt) => (
            <Card key={receipt.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {getFileIcon(receipt.file_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {receipt.file_name}
                    </p>
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

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{tKhairat('payPage.receiptPreviewTitle')}</DialogTitle>
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

