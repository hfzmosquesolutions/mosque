import imageCompression from 'browser-image-compression';

/**
 * Compress an image file to reduce file size while maintaining quality
 * @param file - The image file to compress
 * @param maxSizeMB - Maximum file size in MB (default: 2MB)
 * @param maxWidthOrHeight - Maximum width or height in pixels (default: 1920)
 * @returns Compressed file or original file if compression fails or not an image
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 2,
  maxWidthOrHeight: number = 1920
): Promise<File> {
  // Only compress image files
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Skip compression if file is already very small (less than 500KB)
  // Small files are likely already optimized
  if (file.size < 500 * 1024) {
    return file;
  }

  try {
    const options = {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      fileType: file.type,
      initialQuality: 0.85, // Good balance between quality and file size
    };

    const compressedFile = await imageCompression(file, options);
    
    // If compression didn't reduce size significantly (less than 5% reduction), return original
    // (sometimes compression can actually increase size for already optimized images)
    if (compressedFile.size >= file.size * 0.95) {
      return file;
    }

    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original file if compression fails
    return file;
  }
}

/**
 * Compress multiple image files
 * @param files - Array of files to compress
 * @param maxSizeMB - Maximum file size in MB (default: 2MB)
 * @param maxWidthOrHeight - Maximum width or height in pixels (default: 1920)
 * @returns Array of compressed files (non-images are returned as-is)
 */
export async function compressImages(
  files: File[],
  maxSizeMB: number = 2,
  maxWidthOrHeight: number = 1920
): Promise<File[]> {
  return Promise.all(
    files.map(file => compressImage(file, maxSizeMB, maxWidthOrHeight))
  );
}

