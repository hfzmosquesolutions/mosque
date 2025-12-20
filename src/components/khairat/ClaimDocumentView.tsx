'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  File,
  Download,
  Eye,
  Loader2,
} from 'lucide-react';
import { getClaimDocuments } from '@/lib/api';
import type { ClaimDocument } from '@/types/database';

interface ClaimDocumentViewProps {
  claimId: string;
}

export function ClaimDocumentView({ claimId }: ClaimDocumentViewProps) {
  const t = useTranslations('claims');
  const [documents, setDocuments] = useState<ClaimDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<ClaimDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [claimId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await getClaimDocuments(claimId);
      if (response.success) {
        setDocuments(response.data || []);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        {t('noSupportingDocumentsAvailable')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((document) => (
        <Card key={document.id} className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {getFileIcon(document.file_type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{document.file_name}</p>
                {document.file_size && (
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(document.file_size)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedDocument(document);
                  setIsPreviewOpen(true);
                }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8"
              >
                <Eye className="h-4 w-4" />
              </button>
              <a
                href={document.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          </div>
        </Card>
      ))}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('documentPreview')}</DialogTitle>
            <DialogDescription>{selectedDocument?.file_name}</DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="mt-4">
              {selectedDocument.file_type?.startsWith('image/') ? (
                <img
                  src={selectedDocument.file_url}
                  alt={selectedDocument.file_name}
                  className="max-w-full h-auto rounded-lg"
                />
              ) : selectedDocument.file_type === 'application/pdf' ? (
                <iframe
                  src={selectedDocument.file_url}
                  className="w-full h-[600px] rounded-lg"
                  title={selectedDocument.file_name}
                />
              ) : (
                <div className="flex items-center justify-center h-64 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <div className="text-center">
                    <File className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      {t('previewNotAvailable')}
                    </p>
                    <a
                      href={selectedDocument.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t('downloadFile')}
                    </a>
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

