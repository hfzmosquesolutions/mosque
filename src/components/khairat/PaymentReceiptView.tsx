'use client';

import React, { useState, useEffect } from 'react';
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
import { getPaymentReceipts } from '@/lib/api';
import type { PaymentReceipt } from '@/types/database';

interface PaymentReceiptViewProps {
  contributionId: string;
}

export function PaymentReceiptView({ contributionId }: PaymentReceiptViewProps) {
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    loadReceipts();
  }, [contributionId]);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const response = await getPaymentReceipts(contributionId);
      if (response.success) {
        setReceipts(response.data || []);
      }
    } catch (error) {
      console.error('Error loading receipts:', error);
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

  if (receipts.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        No payment receipts available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {receipts.map((receipt) => (
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
              <button
                type="button"
                onClick={() => {
                  setSelectedReceipt(receipt);
                  setIsPreviewOpen(true);
                }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8"
              >
                <Eye className="h-4 w-4" />
              </button>
              <a
                href={receipt.file_url}
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

