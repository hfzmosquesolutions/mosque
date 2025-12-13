'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface ImageUploadProps {
  label: string;
  description?: string;
  currentImageUrl?: string | null;
  onImageUpload?: (url: string) => void;
  onImageRemove?: () => void;
  onImageChange?: (url: string | null) => Promise<void>; // Optional callback for immediate database updates
  aspectRatio?: 'square' | 'banner'; // square for logo, banner for banner image
  filePrefix?: string; // Custom prefix for filename (e.g., 'person', 'logo', 'banner')
  maxSizeInMB?: number;
}

export function ImageUpload({
  label,
  description,
  currentImageUrl,
  onImageUpload,
  onImageRemove,
  onImageChange,
  aspectRatio = 'square',
  filePrefix,
  maxSizeInMB = 5,
}: ImageUploadProps) {
  const { user } = useAuth();
  const t = useTranslations('imageUpload');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return t('pleaseSelectImageFile');
    }

    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return t('fileSizeMustBeLessThan', { maxSize: maxSizeInMB });
    }

    // Check image dimensions (optional)
    return null;
  };

  const uploadImage = async (file: File) => {
    if (!user) {
      toast.error(t('mustBeLoggedIn'));
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsUploading(true);

    try {
      // If there's an existing image, delete it first
      if (currentImageUrl) {
        try {
          const url = new URL(currentImageUrl);
          const pathParts = url.pathname.split('/');
          
          // Find the index of 'mosque-images' and get everything after it
          const mosqueImagesIndex = pathParts.findIndex(part => part === 'mosque-images');
          if (mosqueImagesIndex !== -1 && mosqueImagesIndex < pathParts.length - 1) {
            const filePath = pathParts.slice(mosqueImagesIndex + 1).join('/');
            
            // Delete the old image from storage
            await supabase.storage.from('mosque-images').remove([filePath]);
            console.log('Old image deleted from storage');
          }
        } catch (error) {
          console.error('Error deleting old image:', error);
          // Continue with upload even if old image deletion fails
        }
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const prefix = filePrefix || aspectRatio;
      const fileName = `${user.id}/${prefix}-${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('mosque-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('mosque-images')
        .getPublicUrl(data.path);

      onImageUpload?.(urlData.publicUrl);
      
      // Call the immediate change callback if provided
      if (onImageChange) {
        try {
          await onImageChange(urlData.publicUrl);
        } catch (error) {
          console.error('Error updating database:', error);
          toast.error(t('uploadedButFailedToSave'));
          return;
        }
      }
      
      toast.success(t('uploadedSuccessfully'));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('failedToUpload'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      uploadImage(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeImage = async () => {
    if (currentImageUrl) {
      try {
        // Extract the file path from the URL
        const url = new URL(currentImageUrl);
        const pathParts = url.pathname.split('/');
        
        // Find the index of 'mosque-images' and get everything after it
        const mosqueImagesIndex = pathParts.findIndex(part => part === 'mosque-images');
        if (mosqueImagesIndex !== -1 && mosqueImagesIndex < pathParts.length - 1) {
          const filePath = pathParts.slice(mosqueImagesIndex + 1).join('/');

          // Delete from Supabase storage
          await supabase.storage.from('mosque-images').remove([filePath]);
        }
        
        onImageRemove?.();
        
        // Call the immediate change callback if provided
        if (onImageChange) {
          try {
            await onImageChange(null);
          } catch (error) {
            console.error('Error updating database:', error);
            toast.error(t('removedButFailedToUpdate'));
            return;
          }
        }
        
        toast.success(t('removedSuccessfully'));
      } catch (error) {
        console.error('Error removing image:', error);
        toast.error(t('failedToRemove'));
      }
    }
  };

  const aspectRatioClass = aspectRatio === 'banner' ? 'aspect-[3/1]' : 'aspect-square';
  const recommendedSize = aspectRatio === 'banner' ? '1200x400px' : '400x400px';

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {description} {t('recommendedSize')}: {recommendedSize}
        </p>
      )}
      
      <div className="relative">
        {currentImageUrl ? (
          <div className="relative group">
            <img
              src={currentImageUrl}
              alt="Current image"
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t('replace')}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={removeImage}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4 mr-2" />
                  {t('remove')}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors ${
              dragActive ? "border-blue-500 bg-blue-50" : ""
            }`}
            onDrop={handleDrop}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              {t('dropImageHere')}{" "}
              <span className="text-blue-600 hover:text-blue-700 font-medium">
                {t('browse')}
              </span>
            </p>
            <p className="text-xs text-gray-500">
              {description || t('defaultFileTypes', { maxSize: maxSizeInMB })}
            </p>
          </div>
        )}


      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
    </div>
  );
}