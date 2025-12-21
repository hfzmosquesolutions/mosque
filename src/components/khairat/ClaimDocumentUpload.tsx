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
import { uploadClaimDocument, deleteClaimDocument, getClaimDocuments } from '@/lib/api';
import type { ClaimDocument } from '@/types/database';
import { compressImage } from '@/utils/image-compression';
import { useTranslations } from 'next-intl';

interface ClaimDocumentUploadProps {
  claimId?: string; // If provided, will load existing documents
  onDocumentsChange?: (documents: ClaimDocument[] | File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function ClaimDocumentUpload({
  claimId,
  onDocumentsChange,
  maxFiles = 5,
  disabled = false
}: ClaimDocumentUploadProps) {
  const { user } = useAuth();
  const tKhairat = useTranslations('khairat');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<ClaimDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ClaimDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Load existing documents if claimId is provided
  React.useEffect(() => {
    if (claimId) {
      loadExistingDocuments();
    }
  }, [claimId]);

  const loadExistingDocuments = async () => {
    if (!claimId) return;
    
    try {
      setLoading(true);
      const response = await getClaimDocuments(claimId);
      if (response.success) {
        setExistingDocuments(response.data || []);
        onDocumentsChange?.(response.data || []);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Validate file count
    const totalFiles = uploadedFiles.length + existingDocuments.length + files.length;
    if (totalFiles > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
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
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    // Show compression toast for images
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      toast.info('Compressing images to optimize file size...');
    }

    for (const file of files) {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} has an unsupported file type.`);
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

    setUploadedFiles(prev => {
      const newFiles = [...prev, ...validFiles];
      
      // If no claimId, notify parent component about pending files
      if (!claimId && onDocumentsChange) {
        onDocumentsChange(newFiles.map(f => f.file));
      }
      
      return newFiles;
    });
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (uploadedFile: UploadedFile) => {
    if (!claimId || !user) return;

    setUploadedFiles(prev => 
      prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'uploading' }
          : f
      )
    );

    try {
      const response = await uploadClaimDocument(claimId, uploadedFile.file, user.id);
      
      if (response.success) {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === uploadedFile.id 
              ? { ...f, status: 'success' }
              : f
          )
        );
        
        // Reload existing documents
        await loadExistingDocuments();
        toast.success(`${uploadedFile.file.name} uploaded successfully`);
      } else {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === uploadedFile.id 
              ? { ...f, status: 'error', error: response.error }
              : f
          )
        );
        toast.error(response.error || 'Failed to upload file');
      }
    } catch (error) {
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, status: 'error', error: 'Upload failed' }
            : f
        )
      );
      toast.error('Failed to upload file');
    }
  };

  const handleDeleteUploaded = (fileId: string) => {
    setUploadedFiles(prev => {
      const newFiles = prev.filter(f => f.id !== fileId);
      
      // If no claimId, notify parent component about remaining files
      if (!claimId && onDocumentsChange) {
        onDocumentsChange(newFiles.map(f => f.file));
      }
      
      return newFiles;
    });
  };

  const handleDeleteExisting = async (documentId: string) => {
    if (!claimId || !user) return;

    try {
      const response = await deleteClaimDocument(claimId, documentId, user.id);
      
      if (response.success) {
        setExistingDocuments(prev => prev.filter(d => d.id !== documentId));
        onDocumentsChange?.(existingDocuments.filter(d => d.id !== documentId));
        toast.success('Document deleted successfully');
      } else {
        toast.error(response.error || 'Failed to delete document');
      }
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    // Standardized file icon (no emoji/thumbnail)
    return <File className="h-4 w-4" />;
  };

  const canUpload = !disabled && uploadedFiles.length + existingDocuments.length < maxFiles;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6">
        <div className="text-center">
          <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {tKhairat('uploadSupportingDocuments')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {tKhairat('uploadSupportingDocumentsHelp')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {tKhairat('maxFilesInfo', { maxFiles })}
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
            {tKhairat('chooseFiles')}
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* File Count */}
      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
        <span>
          {uploadedFiles.length + existingDocuments.length} / {maxFiles} files
        </span>
        {claimId && (
          <span>
            {existingDocuments.length} uploaded
          </span>
        )}
      </div>

      {/* Uploaded Files (Pending Upload) */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Files to Upload
          </h4>
          {uploadedFiles.map((uploadedFile) => (
            <Card key={uploadedFile.id} className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {getFileIcon(uploadedFile.file.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(uploadedFile.file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {uploadedFile.status === 'pending' && claimId && (
                      <Button
                        size="sm"
                        onClick={() => handleUpload(uploadedFile)}
                      >
                        Upload
                      </Button>
                    )}
                    
                    {uploadedFile.status === 'uploading' && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs">Uploading...</span>
                      </div>
                    )}
                    
                    {uploadedFile.status === 'success' && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-green-600">Uploaded</span>
                      </div>
                    )}
                    
                    {uploadedFile.status === 'error' && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-xs text-red-600">Failed</span>
                      </div>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteUploaded(uploadedFile.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {uploadedFile.error && (
                  <p className="text-xs text-red-600 mt-2">
                    {uploadedFile.error}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Existing Documents */}
      {existingDocuments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Uploaded Documents
          </h4>
          {existingDocuments.map((document) => (
            <Card key={document.id} className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {getFileIcon(document.file_type || '')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {document.file_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{formatFileSize(document.file_size || 0)}</span>
                        <span>•</span>
                        <span>
                          {new Date(document.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedDocument(document);
                        setIsPreviewOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(document.file_url, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteExisting(document.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Document Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.file_name}</DialogTitle>
            <DialogDescription>
              Document uploaded on {selectedDocument && new Date(selectedDocument.created_at).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDocument && (
            <div className="flex-1 overflow-hidden">
              {selectedDocument.file_type?.startsWith('image/') ? (
                <img
                  src={selectedDocument.file_url}
                  alt={selectedDocument.file_name}
                  className="max-w-full max-h-full object-contain mx-auto"
                />
              ) : (
                <div className="flex items-center justify-center h-64 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <div className="text-center">
                    <File className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Preview not available for this file type
                    </p>
                    <Button
                      onClick={() => window.open(selectedDocument.file_url, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
