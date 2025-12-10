'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Share2,
  QrCode,
  Copy,
  Facebook,
  Twitter,
  MessageCircle,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

import { Mosque } from '@/types/database';

interface ShareProfileButtonProps {
  mosque: Mosque;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  iconOnly?: boolean;
}

export function ShareProfileButton({
  mosque,
  variant = 'outline',
  size = 'default',
  className = '',
  iconOnly = false,
}: ShareProfileButtonProps) {
  const t = useTranslations('mosqueProfile');
  const [copied, setCopied] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate the mosque profile URL
  const mosqueUrl = `${window.location.origin}/mosques/${mosque.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(mosqueUrl);
      setCopied(true);
      toast.success(t('linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error(t('failedToCopyLink'));
    }
  };

  const handleSocialShare = (platform: 'whatsapp' | 'facebook' | 'twitter') => {
    const shareText = `${t('checkOutMosque')} ${mosque.name}`;
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(mosqueUrl);

    let shareUrl = '';

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const downloadQRCode = () => {
    const qrContainer =
      document.getElementById('mosque-qr-code')?.parentElement;
    if (!qrContainer) return;

    // Create a canvas with responsive sizing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const qrSize = isMobile ? 180 : 240;
    const canvasWidth = qrSize + 60;
    const canvasHeight = qrSize + 110;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Fill white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const svg = document.getElementById('mosque-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const qrImg = new window.Image();

    qrImg.onload = () => {
      // Draw QR code (centered)
      const qrX = (canvasWidth - qrSize) / 2;
      const qrY = 30;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Add branding text
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('www.khairatkita.com', canvasWidth / 2, qrY + qrSize + 30);

      ctx.fillStyle = '#6B7280';
      ctx.font = '12px Arial';
      ctx.fillText('Powered by khairatkita', canvasWidth / 2, qrY + qrSize + 50);

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${mosque.name
        .replace(/\s+/g, '-')
        .toLowerCase()}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    qrImg.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className={className}>
            <Share2 className={`h-4 w-4 ${iconOnly ? '' : 'mr-2'}`} />
            {!iconOnly && t('shareProfile')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 sm:w-56">
          <DropdownMenuItem onClick={() => setQrDialogOpen(true)}>
            <QrCode className="h-4 w-4 mr-2" />
            {t('showQRCode')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink}>
            {copied ? (
              <Check className="h-4 w-4 mr-2 text-green-600" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? t('linkCopied') : t('copyLink')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSocialShare('whatsapp')}>
            <MessageCircle className="h-4 w-4 mr-2" />
            {t('shareOnWhatsApp')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSocialShare('facebook')}>
            <Facebook className="h-4 w-4 mr-2" />
            {t('shareOnFacebook')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSocialShare('twitter')}>
            <Twitter className="h-4 w-4 mr-2" />
            {t('shareOnTwitter')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              {t('qrCodeTitle')}
            </DialogTitle>
            <DialogDescription>{t('qrCodeDescription')}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-3 sm:space-y-4 px-2 sm:px-0">
            {/* Mosque Info */}
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">{mosque.name}</h3>
              {mosque.address && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {mosque.address}
                </p>
              )}
            </div>

            {/* QR Code with Branding */}
            <div className="bg-white p-4 sm:p-6 rounded-lg border">
              <div className="relative inline-block">
                <QRCodeSVG
                  id="mosque-qr-code"
                  value={mosqueUrl}
                  size={isMobile ? 180 : 240}
                  level="M"
                  includeMargin
                />
              </div>
              {/* Branding Text */}
              <div className="mt-3 sm:mt-4 text-center">
                <p className="text-xs sm:text-sm font-medium text-gray-700">
                  www.khairatkita.com
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Powered by khairatkita
                </p>
              </div>
            </div>

            {/* URL Display */}
            <div className="w-full">
              <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                <code className="flex-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                  {mosqueUrl}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyLink}
                  className="h-6 w-6 p-0"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQRCode}
                className="flex-1 text-xs sm:text-sm"
              >
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {t('downloadQR')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex-1 text-xs sm:text-sm"
              >
                {copied ? (
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                )}
                {copied ? t('copied') : t('copyLink')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
