'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface FilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType: string;
  onDownload?: () => void;
}

export function FilePreview({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType,
  onDownload,
}: FilePreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  const isPDF = fileType === 'application/pdf';
  const isImage = fileType.startsWith('image/');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {fileName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {isImage && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                    {zoom}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRotate}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </>
              )}
              {onDownload && (
                <Button variant="outline" size="sm" onClick={onDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4">
          <div className="flex justify-center items-center min-h-[400px]">
            {isImage ? (
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                }}
                onDoubleClick={handleReset}
              />
            ) : isPDF ? (
              <iframe
                src={fileUrl}
                className="w-full h-[600px] border-0"
                title={fileName}
              />
            ) : (
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">Preview not available</p>
                <p className="text-sm">File type: {fileType}</p>
                {onDownload && (
                  <Button
                    variant="outline"
                    onClick={onDownload}
                    className="mt-4"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download to view
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {isImage && (
          <div className="p-4 border-t bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              Double-click image to reset zoom and rotation
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
