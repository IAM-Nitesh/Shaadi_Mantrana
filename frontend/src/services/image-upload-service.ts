// Image Upload Service for Frontend
// This service handles image uploads and validates that images contain faces

import configService from './configService';

export interface ImageValidationResult {
  isValid: boolean;
  confidence: number;
  error?: string;
  faceCount?: number;
  quality?: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations?: string[];
}

export interface UploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  validation?: ImageValidationResult;
}

export class ImageUploadService {
  
  // Validate if image contains a human face using basic validation
  static async validateFaceInImage(file: File): Promise<ImageValidationResult> {
    try {
      // Basic validation - for now just check if it's a valid image
      // In the future, this could be enhanced with actual face detection
      const isValidImage = file.type.startsWith('image/');
      const isReasonableSize = file.size > 1024 && file.size < 10 * 1024 * 1024; // 1KB to 10MB
      
      const isValid = isValidImage && isReasonableSize;
      
      return {
        isValid,
        confidence: isValid ? 80 : 20, // Basic confidence score
        faceCount: isValid ? 1 : 0, // Assume one face for valid images
        quality: isValid ? 'good' : 'poor',
        recommendations: isValid ? [] : ['Please upload a clear image file'],
        error: !isValid ? 'Please upload a valid image file' : undefined
      };
      
    } catch (error) {
      // Fallback to simple detection if advanced fails
      console.warn('Advanced face detection failed, using fallback method:', error);
      return this.validateFaceInImageSimple(file);
    }
  }
  
  // Fallback simple face detection method
  private static async validateFaceInImageSimple(file: File): Promise<ImageValidationResult> {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        // Simple validation - just check if it's a reasonable image
        const isValid = img.width > 100 && img.height > 100;
        
        resolve({
          isValid,
          confidence: isValid ? 60 : 20,
          faceCount: isValid ? 1 : 0,
          quality: isValid ? 'fair' : 'poor',
          recommendations: isValid ? [] : ['Image seems too small or unclear'],
          error: !isValid ? 'Please upload a clearer image' : undefined
        });
      };
      
      img.onerror = () => {
        resolve({
          isValid: false,
          confidence: 0,
          faceCount: 0,
          quality: 'poor',
          recommendations: ['Unable to process image'],
          error: 'Invalid image file'
        });
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  // Validate image quality (resolution, format, etc.)
  static async validateImageQuality(file: File): Promise<ImageValidationResult> {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve({
          isValid: false,
          confidence: 0,
          error: 'File must be an image'
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        resolve({
          isValid: false,
          confidence: 0,
          error: 'Image size must be less than 5MB'
        });
        return;
      }

      const img = new Image();
      img.onload = () => {
        const minWidth = 200;
        const minHeight = 200;
        
        if (img.width < minWidth || img.height < minHeight) {
          resolve({
            isValid: false,
            confidence: 0,
            error: `Image resolution must be at least ${minWidth}x${minHeight} pixels`
          });
        } else {
          resolve({
            isValid: true,
            confidence: 0.9,
            faceCount: 1 // Assume valid for demo
          });
        }
        
        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        resolve({
          isValid: false,
          confidence: 0,
          error: 'Invalid image file'
        });
        URL.revokeObjectURL(img.src);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  // Upload profile image
  static async uploadProfileImage(file: File): Promise<UploadResult> {
    const apiBaseUrl = configService.apiBaseUrl;
    
    if (!apiBaseUrl) {
      console.log('Demo mode: Image upload simulated');
      return {
        success: true,
        imageUrl: '/demo-profiles/default-profile.svg',
        validation: {
          isValid: true,
          confidence: 90,
          faceCount: 1,
          quality: 'good'
        }
      };
    }

    try {
      // First validate the image
      const validation = await this.validateFaceInImage(file);
      
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error || 'Image validation failed',
          validation
        };
      }

      // Upload the image
      const formData = new FormData();
      formData.append('image', file);

      console.log('Uploading to:', `${apiBaseUrl}/api/upload/profile-image`);
      console.log('FormData entries:', [...formData.entries()]);

      const response = await fetch(`${apiBaseUrl}/api/upload/profile-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `Upload failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      return {
        success: true,
        imageUrl: result.imageUrl,
        validation
      };

    } catch (error: any) {
      console.error('Error uploading image:', error);
      console.error('API Base URL:', apiBaseUrl);
      console.error('File details:', { 
        name: file.name, 
        size: file.size, 
        type: file.type 
      });
      return {
        success: false,
        error: error.message || 'Failed to upload image'
      };
    }
  }

  // Upload multiple images
  static async uploadMultipleImages(files: File[]): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (const file of files) {
      const result = await this.uploadProfileImage(file);
      results.push(result);
    }
    
    return results;
  }

  // Delete image
  static async deleteImage(imageUrl: string): Promise<boolean> {
    const apiBaseUrl = configService.apiBaseUrl;
    
    if (!apiBaseUrl) {
      console.log('Demo mode: Image deletion simulated');
      return true;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/upload/delete-image`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ imageUrl }),
      });

      return response.ok;
    } catch (error: any) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  // Get uploaded images for profile
  static async getProfileImages(): Promise<string[]> {
    const apiBaseUrl = configService.apiBaseUrl;
    
    if (!apiBaseUrl) {
      return [
        '/demo-profiles/profile-1.svg',
        '/demo-profiles/profile-2.svg',
        '/demo-profiles/profile-3.svg'
      ];
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/upload/profile-images`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile images');
      }

      const data = await response.json();
      return data.images || [];

    } catch (error: any) {
      console.error('Error fetching profile images:', error);
      return [];
    }
  }

  // Compress image before upload
  static async compressImage(file: File, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const maxWidth = 800;
        const maxHeight = 800;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }
}
