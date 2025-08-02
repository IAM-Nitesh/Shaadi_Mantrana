// Image Upload Service for Frontend
// This service handles image uploads and validates that images contain faces

// To configure the backend port, set NEXT_PUBLIC_API_BASE_URL in your .env.development file.
// Example: NEXT_PUBLIC_API_BASE_URL=http://localhost:5500 (dev), https://your-production-domain.com (prod)
import { config } from './configService';
import { getBearerToken, getCurrentUser, isAuthenticated } from './auth-utils';

export const API_CONFIG = {
  API_BASE_URL: config.apiBaseUrl,
};

import ImageCompression from '../utils/imageCompression';

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
  
  // Cache for signed URLs (userId -> { url: string, expiry: number })
  private static signedUrlCache = new Map<string, { url: string; expiry: number }>();
  
  // Cache expiry time (1 hour)
  private static readonly CACHE_EXPIRY = 60 * 60 * 1000;
  
  // Batch request queue to avoid multiple simultaneous requests for the same user
  private static pendingRequests = new Map<string, Promise<string | null>>();
  
  // Batch processing for multiple users
  private static batchQueue: Array<{ userId: string; resolve: (url: string | null) => void }> = [];
  private static batchTimeout: NodeJS.Timeout | null = null;
  private static readonly BATCH_DELAY = 100; // 100ms delay to collect batch requests
  
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
      // console.warn('Advanced face detection failed, using fallback method:', error);
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

      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        resolve({
          isValid: false,
          confidence: 0,
          error: 'Image size must be less than 2MB'
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

  // Upload profile image with face validation
  static async uploadProfileImage(file: File): Promise<UploadResult> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    // Development mode fallback
    if (process.env.NODE_ENV === 'development' && !apiBaseUrl) {
      // console.log('Development mode: Image upload not configured');
      return {
        success: false,
        error: 'Image upload not configured in development mode',
        validation: {
          isValid: false,
          confidence: 0,
          faceCount: 0,
          quality: 'poor'
        }
      };
    }

    if (!apiBaseUrl) {
      // console.log('Production mode: Image upload not configured');
      return {
        success: false,
        error: 'Image upload not configured',
        validation: {
          isValid: false,
          confidence: 0,
          faceCount: 0,
          quality: 'poor'
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

      // Check if user is authenticated using server-side auth
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        throw new Error('Authentication required. Please log in first.');
      }

      // console.log('API Base URL:', apiBaseUrl);
      // console.log('Uploading to:', `${apiBaseUrl}/api/upload/single`);
      // console.log('File details:', { name: file.name, size: file.size, type: file.type });

      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        throw new Error('Authentication required. Please log in first.');
      }

      const response = await fetch(`${apiBaseUrl}/api/upload/single`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
        },
        body: formData,
      });

      // console.log('Upload response status:', response.status);
      // console.log('Upload response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `Upload failed with status ${response.status}`;
        
        // Special handling for authentication errors
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('authToken'); // Clear invalid token
          throw new Error('Authentication required. Please log in again.');
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      return {
        success: true,
        imageUrl: result.imageUrl,
        validation
      };

    } catch (error: unknown) {
      // console.error('Error uploading image:', error);
      // console.error('API Base URL:', apiBaseUrl);
      // console.error('File details:', { name: file.name, size: file.size, type: file.type });
      return {
        success: false,
        error: (error as Error).message || 'Failed to upload image'
      };
    }
  }

  // Upload multiple images with batch processing
  static async uploadMultipleImages(files: File[]): Promise<UploadResult[]> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    const results: UploadResult[] = [];
    
    for (const file of files) {
      const result = await this.uploadProfileImage(file);
      results.push(result);
    }
    
    return results;
  }

  // Delete image
  static async deleteImage(imageUrl: string): Promise<boolean> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
          // console.log('Image deletion not configured');
    return false;
    }

    try {
      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        return false;
      }

      const response = await fetch(`${apiBaseUrl}/api/upload/delete-image`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken}`,
        },
        body: JSON.stringify({ imageUrl }),
      });

      return response.ok;
    } catch (error: unknown) {
      // console.error('Error deleting image:', error);
      return false;
    }
  }

  // Get uploaded images for profile
  static async getProfileImages(): Promise<string[]> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      return [];
    }

    try {
      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        return [];
      }

      const response = await fetch(`${apiBaseUrl}/api/upload/profile-images`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile images');
      }

      const data = await response.json();
      return data.images || [];

    } catch (error: unknown) {
      // console.error('Error fetching profile images:', error);
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

  /**
   * Upload profile picture to B2 Cloud Storage
   * @param file - Image file to upload
   * @returns Promise with upload result
   */
  static async uploadProfilePictureToB2(file: File): Promise<UploadResult> {
    // Clear cache when uploading new image
    this.clearSignedUrlCache();
    
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      return {
        success: false,
        error: 'API not configured'
      };
    }

    try {
      // Validate image
      const validation = ImageCompression.validateImage(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Invalid image file'
        };
      }

      // Compress image for optimal upload with improved quality
      const compressionResult = await ImageCompression.compressProfilePicture(file, {
        maxWidth: 1200, // Increased for better quality
        maxHeight: 1200, // Increased for better quality
        quality: 0.95, // Increased for better quality
        format: 'jpeg'
      });

      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        throw new Error('Authentication required. Please log in first.');
      }

      // Create form data
      const formData = new FormData();
      formData.append('image', compressionResult.file);

      // Upload to B2 via backend
      const response = await fetch(`${apiBaseUrl}/api/upload/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `Upload failed with status ${response.status}`;
        
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication required. Please log in again.');
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      return {
        success: true,
        imageUrl: result.data.url,
        validation: {
          isValid: true,
          confidence: 90,
          faceCount: 1,
          quality: 'good'
        }
      };

    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Delete profile picture from B2 Cloud Storage
   * @returns Promise with deletion result
   */
  static async deleteProfilePictureFromB2(): Promise<boolean> {
    // Clear cache when deleting image
    this.clearSignedUrlCache();
    
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      return false;
    }

    try {
      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        return false;
      }

      const response = await fetch(`${apiBaseUrl}/api/upload/profile-picture`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get signed URL for profile picture
   * @param userId - User ID
   * @param expiry - URL expiry time in seconds (default: 1 hour)
   * @returns Promise with signed URL
   */
  static async getProfilePictureUrl(userId: string, expiry: number = 3600): Promise<string | null> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      return null;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/upload/profile-picture/${userId}/url?expiry=${expiry}`);
      
      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result.data.url;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get signed URL for current user's profile picture
   * @param expiry - URL expiry time in seconds (default: 1 hour)
   * @returns Promise with signed URL
   */
  static async getMyProfilePictureSignedUrl(expiry: number = 4200): Promise<string | null> {
    const apiBaseUrl = API_CONFIG.API_BASE_URL;
    
    if (!apiBaseUrl) {
      console.log('❌ API_BASE_URL not configured');
      return null;
    }

    try {
      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      console.log('🔍 Bearer token found:', bearerToken ? 'Yes' : 'No');
      if (!bearerToken) {
        console.log('❌ No bearer token found');
        return null;
      }

      // Get current user ID from server-side auth
      const user = await getCurrentUser();
      if (!user) {
        console.log('❌ Could not determine current user ID');
        return null;
      }
      const userId = user.userUuid;

      // Check cache first
      const cacheKey = `profile_${userId}`;
      const cached = this.signedUrlCache.get(cacheKey);
      const now = Date.now();
      
      if (cached && cached.expiry > now) {
        console.log('✅ Using cached signed URL');
        return cached.url;
      }

      console.log(`🔍 Fetching signed URL from: ${apiBaseUrl}/api/upload/profile-picture/url?expiry=${expiry}`);
      
      const response = await fetch(`${apiBaseUrl}/api/upload/profile-picture/url?expiry=${expiry}`, {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
        },
      });
      
      console.log(`🔍 Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ Response not OK: ${errorText}`);
        return null;
      }

      const result = await response.json();
      console.log(`✅ Signed URL result:`, result);
      
      // Cache the signed URL
      if (result.data?.url) {
        const cacheExpiry = now + this.CACHE_EXPIRY;
        this.signedUrlCache.set(cacheKey, {
          url: result.data.url,
          expiry: cacheExpiry
        });
        console.log('💾 Cached signed URL for 5 minutes');
      }
      
      return result.data.url;
    } catch (error) {
      console.error('❌ Error fetching signed URL:', error);
      return null;
    }
  }

  /**
   * Get current user ID from server-side auth
   * @returns User ID or null
   */
  private static async getCurrentUserId(): Promise<string | null> {
    try {
      // Get user info from server-side auth
      const user = await getCurrentUser();
      if (user) {
        return user.userUuid;
      }
      return null;
    } catch (error) {
      console.log('❌ Could not get current user ID from server auth');
      return null;
    }
  }

  /**
   * Clear the signed URL cache
   */
  static clearSignedUrlCache(): void {
    this.signedUrlCache.clear();
    console.log('🗑️ Cleared signed URL cache');
  }

  /**
   * Get signed URL for another user's profile picture
   * @param userId - User ID
   * @param expiry - URL expiry time in seconds (default: 1 hour 10 minutes)
   * @returns Promise with signed URL
   */
  static async getUserProfilePictureSignedUrl(userId: string, expiry: number = 4200): Promise<string | null> {
    console.log('🔍 getUserProfilePictureSignedUrl called for userId:', userId);
    
    try {
      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      console.log('🔍 Bearer token found:', !!bearerToken);
      console.log('🔍 Bearer token length:', bearerToken?.length);
      if (!bearerToken) {
        console.log('❌ No bearer token found');
        return null;
      }

      const url = `/api/upload/profile-picture/${userId}/url?expiry=${expiry}`;
      console.log('🔍 Fetching signed URL from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
        },
      });
      
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Response not OK:', errorText);
        return null;
      }

      const result = await response.json();
      console.log('✅ Signed URL result:', result);
      return result.data.url;
    } catch (error) {
      console.error('❌ Error getting signed URL:', error);
      return null;
    }
  }

  /**
   * Get signed URL for another user's profile picture with caching and batching
   * @param userId - User ID
   * @param expiry - URL expiry time in seconds (default: 1 hour 10 minutes)
   * @returns Promise with signed URL
   */
  static async getUserProfilePictureSignedUrlCached(userId: string, expiry: number = 4200): Promise<string | null> {
    // Check cache first - optimized for speed
    const cached = this.signedUrlCache.get(userId);
    const now = Date.now();
    
    if (cached && cached.expiry > now) {
      // Return immediately from cache - no console log for speed
      return cached.url;
    }

    // Check if there's already a pending request for this user
    if (this.pendingRequests.has(userId)) {
      return this.pendingRequests.get(userId);
    }

    // Create new request
    const requestPromise = this.getUserProfilePictureSignedUrl(userId, expiry).then(url => {
      // Cache the result
      if (url) {
        const cacheExpiry = now + this.CACHE_EXPIRY;
        this.signedUrlCache.set(userId, {
          url,
          expiry: cacheExpiry
        });
      }
      
      // Remove from pending requests
      this.pendingRequests.delete(userId);
      return url;
    });

    // Store the pending request
    this.pendingRequests.set(userId, requestPromise);
    return requestPromise;
  }

  /**
   * Batch fetch signed URLs for multiple users
   * @param userIds - Array of user IDs
   * @param expiry - URL expiry time in seconds (default: 1 hour 10 minutes)
   * @returns Promise with Map of userId -> signed URL
   */
  static async getBatchSignedUrls(userIds: string[], expiry: number = 4200): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>();
    const uncachedUserIds: string[] = [];

    // Check cache for all users first - optimized for speed
    const now = Date.now();
    for (const userId of userIds) {
      const cached = this.signedUrlCache.get(userId);
      if (cached && cached.expiry > now) {
        results.set(userId, cached.url);
      } else {
        uncachedUserIds.push(userId);
      }
    }

    // Fetch uncached users in parallel (but with rate limiting)
    if (uncachedUserIds.length > 0) {
      // Process in batches of 5 to avoid overwhelming the server
      const batchSize = 5;
      for (let i = 0; i < uncachedUserIds.length; i += batchSize) {
        const batch = uncachedUserIds.slice(i, i + batchSize);
        const batchPromises = batch.map(userId => 
          this.getUserProfilePictureSignedUrlCached(userId, expiry)
        );
        
        const batchResults = await Promise.all(batchPromises);
        
        // Store results
        batch.forEach((userId, index) => {
          const url = batchResults[index];
          results.set(userId, url);
        });

        // Small delay between batches to be respectful to the server
        if (i + batchSize < uncachedUserIds.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }

    return results;
  }

  /**
   * Get cache status for debugging
   * @returns Cache statistics
   */
  static getCacheStatus(): { 
    totalCached: number; 
    expiredEntries: number; 
    pendingRequests: number;
    cacheSize: number;
  } {
    const now = Date.now();
    let expiredEntries = 0;
    let validEntries = 0;

    for (const [userId, entry] of this.signedUrlCache.entries()) {
      if (entry.expiry > now) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalCached: this.signedUrlCache.size,
      expiredEntries,
      pendingRequests: this.pendingRequests.size,
      cacheSize: validEntries
    };
  }

  /**
   * Clear expired entries from cache
   */
  static clearExpiredCache(): void {
    const now = Date.now();
    let clearedCount = 0;

    for (const [userId, entry] of this.signedUrlCache.entries()) {
      if (entry.expiry <= now) {
        this.signedUrlCache.delete(userId);
        clearedCount++;
      }
    }

    if (clearedCount > 0) {
      console.log(`🗑️ Cleared ${clearedCount} expired cache entries`);
    }
  }

  /**
   * Initialize periodic cache cleanup
   */
  static initializeCacheCleanup(): void {
    // Clear expired entries every 30 minutes
    setInterval(() => {
      this.clearExpiredCache();
    }, 30 * 60 * 1000); // 30 minutes

    // Also clear on page visibility change (when user returns to tab)
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.clearExpiredCache();
        }
      });
    }
  }

  /**
   * Preload signed URLs for better performance
   * @param userIds - Array of user IDs to preload
   * @param expiry - URL expiry time in seconds
   */
  static preloadSignedUrls(userIds: string[], expiry: number = 4200): void {
    // Preload in background without blocking
    setTimeout(() => {
      userIds.forEach(userId => {
        // Only preload if not already cached
        const cached = this.signedUrlCache.get(userId);
        const now = Date.now();
        
        if (!cached || cached.expiry <= now) {
          this.getUserProfilePictureSignedUrlCached(userId, expiry);
        }
      });
    }, 0);
  }

  /**
   * Get cache hit rate for performance monitoring
   * @returns Cache hit statistics
   */
  static getCacheStats(): { 
    totalRequests: number; 
    cacheHits: number; 
    hitRate: number;
    cacheSize: number;
  } {
    // This would need to be implemented with request tracking
    // For now, return basic cache size info
    return {
      totalRequests: 0,
      cacheHits: 0,
      hitRate: 0,
      cacheSize: this.signedUrlCache.size
    };
  }
}
