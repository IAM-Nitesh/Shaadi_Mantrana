/**
 * Image Compression Utility
 * Optimizes images for upload to B2 Cloud Storage
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp';
  stripMetadata?: boolean;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

export class ImageCompression {
  private static readonly DEFAULT_OPTIONS: CompressionOptions = {
    maxWidth: 1200,    // Increased from 1000 for better quality
    maxHeight: 1200,   // Increased from 1000 for better quality
    quality: 0.95,     // Increased from 0.85 to 0.95 for better quality
    format: 'jpeg',
    stripMetadata: true
  };

  /**
   * Compress image for profile picture upload
   * @param file - Original image file
   * @param options - Compression options
   * @returns Promise with compressed file
   */
  static async compressProfilePicture(
    file: File,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions
          const { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            opts.maxWidth!,
            opts.maxHeight!
          );

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw image with new dimensions
          ctx!.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              // Create new file
              const compressedFile = new File([blob], file.name, {
                type: `image/${opts.format}`,
                lastModified: Date.now()
              });

              const result: CompressionResult = {
                file: compressedFile,
                originalSize: file.size,
                compressedSize: compressedFile.size,
                compressionRatio: (1 - compressedFile.size / file.size) * 100,
                width,
                height
              };

              resolve(result);
            },
            `image/${opts.format}`,
            opts.quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      // Load image from file
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Calculate optimal dimensions while maintaining aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // Calculate scaling factor
    const scaleX = maxWidth / width;
    const scaleY = maxHeight / height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't upscale

    // Apply scaling
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    return { width, height };
  }

  /**
   * Validate image file
   * @param file - File to validate
   * @returns Validation result
   */
  static validateImage(file: File): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
      };
    }

    // Check file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Max: ${Math.round(maxSize / (1024 * 1024))}MB`
      };
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty'
      };
    }

    return { valid: true };
  }

  /**
   * Get file size in human readable format
   * @param bytes - Size in bytes
   * @returns Formatted size string
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Create a preview URL for the image
   * @param file - Image file
   * @returns Promise with preview URL
   */
  static createPreviewUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to create preview'));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get image dimensions
   * @param file - Image file
   * @returns Promise with dimensions
   */
  static getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        reject(new Error('Failed to get image dimensions'));
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Batch compress multiple images
   * @param files - Array of image files
   * @param options - Compression options
   * @returns Promise with array of compressed results
   */
  static async compressMultiple(
    files: File[],
    options: CompressionOptions = {}
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];

    for (const file of files) {
      try {
        const result = await this.compressProfilePicture(file, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to compress ${file.name}:`, error);
        // Add original file as fallback
        results.push({
          file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0,
          width: 0,
          height: 0
        });
      }
    }

    return results;
  }

  /**
   * Get optimal compression options based on device type
   * @param deviceType - Type of device
   * @returns Compression options optimized for the device
   */
  static getOptimalOptions(deviceType: 'mobile' | 'tablet' | 'desktop'): CompressionOptions {
    const deviceOptions = {
      mobile: { 
        maxWidth: 600, 
        maxHeight: 600, 
        quality: 0.75 
      },
      tablet: { 
        maxWidth: 800, 
        maxHeight: 800, 
        quality: 0.80 
      },
      desktop: { 
        maxWidth: 1000, 
        maxHeight: 1000, 
        quality: 0.85 
      }
    };
    
    return { ...this.DEFAULT_OPTIONS, ...deviceOptions[deviceType] };
  }

  /**
   * Detect device type based on screen size
   * @returns Device type for optimization
   */
  static detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop'; // SSR fallback
    
    const width = window.innerWidth;
    
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Compress image with device-optimized settings
   * @param file - Original image file
   * @returns Promise with compressed file optimized for current device
   */
  static async compressForDevice(file: File): Promise<CompressionResult> {
    const deviceType = this.detectDeviceType();
    const options = this.getOptimalOptions(deviceType);
    
    console.log(`📱 Compressing image for ${deviceType} device with options:`, options);
    
    return this.compressProfilePicture(file, options);
  }

  /**
   * Test compression with different quality levels and provide analysis
   * @param file - Original image file
   * @returns Promise with compression analysis for different quality levels
   */
  static async testCompressionLevels(file: File): Promise<{
    original: { size: number; dimensions: { width: number; height: number } };
    results: Array<{
      quality: number;
      result: CompressionResult;
      savings: number;
    }>;
    recommendation: {
      quality: number;
      reason: string;
    };
  }> {
    const qualities = [0.6, 0.75, 0.85, 0.95];
    const results = [];
    
    // Get original dimensions
    const originalDimensions = await this.getImageDimensions(file);
    
    for (const quality of qualities) {
      const result = await this.compressProfilePicture(file, { quality });
      const savings = ((file.size - result.compressedSize) / file.size) * 100;
      
      results.push({
        quality,
        result,
        savings
      });
    }
    
    // Recommend optimal quality based on file size and savings
    const recommendation = this.getOptimalQualityRecommendation(file.size, results);
    
    return {
      original: {
        size: file.size,
        dimensions: originalDimensions
      },
      results,
      recommendation
    };
  }

  /**
   * Get optimal quality recommendation based on file size and compression results
   * @param originalSize - Original file size in bytes
   * @param results - Compression results for different qualities
   * @returns Recommended quality level with reasoning
   */
  private static getOptimalQualityRecommendation(
    originalSize: number, 
    results: Array<{ quality: number; result: CompressionResult; savings: number }>
  ): { quality: number; reason: string } {
    const originalSizeMB = originalSize / (1024 * 1024);
    
    // For very large files (>5MB), prioritize compression
    if (originalSizeMB > 5) {
      return {
        quality: 0.75,
        reason: 'Large file size - prioritizing compression over quality'
      };
    }
    
    // For medium files (2-5MB), balanced approach
    if (originalSizeMB > 2) {
      return {
        quality: 0.85,
        reason: 'Medium file size - balanced quality and compression'
      };
    }
    
    // For small files (<2MB), prioritize quality
    return {
      quality: 0.85,
      reason: 'Small file size - maintaining high quality'
    };
  }

  /**
   * Get detailed compression statistics
   * @param result - Compression result
   * @returns Detailed statistics about the compression
   */
  static getCompressionStats(result: CompressionResult): {
    originalSizeFormatted: string;
    compressedSizeFormatted: string;
    savingsFormatted: string;
    compressionRatioFormatted: string;
    qualityScore: 'Excellent' | 'Good' | 'Acceptable' | 'Poor';
  } {
    const originalSizeFormatted = this.formatFileSize(result.originalSize);
    const compressedSizeFormatted = this.formatFileSize(result.compressedSize);
    const savingsFormatted = this.formatFileSize(result.originalSize - result.compressedSize);
    const compressionRatioFormatted = `${result.compressionRatio.toFixed(1)}%`;
    
    // Determine quality score based on compression ratio
    let qualityScore: 'Excellent' | 'Good' | 'Acceptable' | 'Poor';
    if (result.compressionRatio < 50) qualityScore = 'Excellent';
    else if (result.compressionRatio < 70) qualityScore = 'Good';
    else if (result.compressionRatio < 85) qualityScore = 'Acceptable';
    else qualityScore = 'Poor';
    
    return {
      originalSizeFormatted,
      compressedSizeFormatted,
      savingsFormatted,
      compressionRatioFormatted,
      qualityScore
    };
  }
}

export default ImageCompression; 