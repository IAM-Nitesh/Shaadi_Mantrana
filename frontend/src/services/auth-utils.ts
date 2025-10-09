import logger from '../utils/logger';
import { loggerForUser } from '../utils/pino-logger';
import { getUserCompleteness } from '../utils/user-utils';
import { config as configService } from './configService';
import { apiClient } from '../utils/api-client';
import authStorage from './auth-storage-service';

// Authentication Utilities for Service Files
// This file contains only utility functions that can be safely imported by service files
// without breaking Fast Refresh in React components

// Local type definitions to avoid importing from server-auth-service
interface AuthUser {
  role: string;
  email: string;
  isFirstLogin: boolean;
  isApprovedByAdmin: boolean;
  profileCompleteness: number;
  hasSeenOnboardingMessage: boolean;
  userUuid: string;
}

interface AuthStatus {
  authenticated: boolean;
  user?: AuthUser;
  redirectTo: string;
  message?: string;
}

// Cache for auth status to reduce API calls
let authStatusCache: { data: AuthStatus | null; timestamp: number } | null = null;
const AUTH_CACHE_DURATION = 30 * 1000; // 30 seconds cache

// Helper function to check if cache is valid
function isAuthCacheValid(): boolean {
  if (!authStatusCache) return false;
  return Date.now() - authStatusCache.timestamp < AUTH_CACHE_DURATION;
}

// Helper function to clear auth cache
function clearAuthCache(): void {
  authStatusCache = null;
}

// Get Bearer token for backend API calls
export async function getBearerToken(): Promise<string | null> {
  try {
    logger.debug('🔍 AuthUtils: Getting Bearer token...');
    
    // Default refresh interval in milliseconds (5 minutes)
    const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
    
    // Try to get from authStorage first
    const cachedTokenInfo = authStorage.get('tokenInfo');
    if (cachedTokenInfo && typeof cachedTokenInfo === 'object' && cachedTokenInfo.token) {
      // If token has no expiresAt, consider it valid (no expiry metadata)
      // Or check if token is not expired
      if (!cachedTokenInfo.expiresAt || cachedTokenInfo.expiresAt > Date.now()) {
        logger.info('✅ AuthUtils: Bearer token retrieved from storage');
        return cachedTokenInfo.token;
      } else {
        logger.debug('🔍 AuthUtils: Cached token expired, fetching new one');
      }
    }
    
    // Try backup storage if primary fails
    const backupTokenInfo = authStorage.get('tokenBackup');
    if (backupTokenInfo && typeof backupTokenInfo === 'object' && backupTokenInfo.token) {
      // If token has no expiresAt, consider it valid
      // Or check if token is not expired
      if (!backupTokenInfo.expiresAt || backupTokenInfo.expiresAt > Date.now()) {
        logger.info('✅ AuthUtils: Bearer token retrieved from backup storage');
        // Restore to primary storage - no need to require expiresAt for restore
        authStorage.set('tokenInfo', backupTokenInfo, {
          expires: backupTokenInfo.expiresAt ? (backupTokenInfo.expiresAt - Date.now()) : REFRESH_INTERVAL_MS,
          priority: ['localStorage', 'sessionStorage', 'memory']
        });
        return backupTokenInfo.token;
      }
    }
    
    // Fetch from API if no valid cached token - token is returned as HttpOnly cookie
    const response = await apiClient.get('/api/auth/token', {
      credentials: 'include',
      timeout: 3000 // Reduced from 5000 for faster token retrieval
    });

    if (response.ok && response.data.success) {
      logger.info('✅ AuthUtils: Bearer token refreshed via API successfully');
      
      // Token is now returned as HttpOnly cookie and not in the response body
      // We'll use the expiresAt value from the response for token metadata
      const expiresAt = response.data.expiresAt;
      
      if (!expiresAt) {
        logger.warn('⚠️ AuthUtils: No expiresAt in token response');
        return null;
      }
      
      // Create a placeholder token info - the actual token is in the HTTP-only cookie
      // and will be sent automatically by the browser for API requests
      const tokenInfo = {
        token: 'http-only-cookie',  // This is a placeholder as we can't access the actual token
        expiresAt: expiresAt,
        lastRefreshed: Date.now()
      };
      
      // Store token metadata
      authStorage.set('tokenInfo', tokenInfo, {
        expires: expiresAt - Date.now(),
        priority: ['localStorage', 'sessionStorage', 'memory']
      });
      
      // Also store in backup storage
      authStorage.set('tokenBackup', tokenInfo, {
        expires: Math.min(expiresAt - Date.now(), 24 * 60 * 60 * 1000), // Max 24h
        priority: ['sessionStorage', 'cookie', 'memory']
      });
      
      // Return the placeholder to indicate successful token refresh
      return 'http-only-cookie';
    }

    logger.warn('❌ AuthUtils: No token in response');
    return null;
  } catch (error) {
    logger.error('❌ AuthUtils: Error getting Bearer token:', error);
    return null;
  }
}

// Check if user is authenticated with caching
export async function isAuthenticated(): Promise<boolean> {
  try {
    // Check cache first
    if (isAuthCacheValid() && authStatusCache?.data) {
      return authStatusCache.data.authenticated;
    }

    logger.debug('🔍 AuthUtils: Checking authentication status...');
    
    const response = await apiClient.get('/api/auth/status', {
      credentials: 'include',
      timeout: 5000 // Reduced from 10000 for faster feedback
    });

    if (!response.ok) {
      // Cache the failed response to prevent repeated calls
      authStatusCache = {
        data: { authenticated: false, redirectTo: '/', message: 'Auth check failed' },
        timestamp: Date.now()
      };
      return false;
    }

    const data: AuthStatus = response.data;
    
    // Cache the response
    authStatusCache = {
      data,
      timestamp: Date.now()
    };

    logger.debug('✅ AuthUtils: Auth status cached:', data.authenticated);
    return data.authenticated === true;
  } catch (error) {
    try {
      const user = await getCurrentUser();
      const log = loggerForUser(user?.userUuid);
      log.error({ err: error }, '❌ AuthUtils: Error checking authentication:');
    } catch (e) {
      logger.error({ err: error }, '❌ AuthUtils: Error checking authentication:');
    }
    // Cache the error response to prevent repeated calls
    authStatusCache = {
      data: { authenticated: false, redirectTo: '/', message: 'Auth check error' },
      timestamp: Date.now()
    };
    return false;
  }
}

// Get current user info with caching
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Check cache first
    if (isAuthCacheValid() && authStatusCache?.data) {
      logger.debug('✅ AuthUtils: Using cached user data');
      return authStatusCache.data.user || null;
    }

    logger.debug('🔍 AuthUtils: Getting current user...');
    
    const response = await apiClient.get('/api/auth/status', {
      credentials: 'include',
      timeout: 10000
    });

    if (!response.ok) {
      logger.debug('❌ AuthUtils: Failed to get user data, status:', response.status);
      // Cache the failed response
      authStatusCache = {
        data: { authenticated: false, redirectTo: '/', message: 'User data fetch failed' },
        timestamp: Date.now()
      };
      return null;
    }

    const data: AuthStatus = response.data;
    
    // Cache the response
    authStatusCache = {
      data,
      timestamp: Date.now()
    };

    logger.debug('✅ AuthUtils: User data cached');
    return data.user || null;
  } catch (error) {
    try {
      const log = logger; // Using default logger instead of user-specific one to avoid recursion
      log.error('❌ AuthUtils: Error getting current user:', error);
    } catch (e) {
      logger.error('❌ AuthUtils: Error getting current user:', error);
    }
    // Cache the error response
    authStatusCache = {
      data: { authenticated: false, redirectTo: '/', message: 'User data error' },
      timestamp: Date.now()
    };
    return null;
  }
}

// Function to clear auth cache (useful for logout or when forcing refresh)
export function clearAuthStatusCache(): void {
  clearAuthCache();
  
  // Also clear redundant auth storage
  try {
    authStorage.remove('tokenInfo');
    authStorage.remove('tokenBackup');
    logger.debug('✅ AuthUtils: Cleared auth storage');
  } catch (error) {
    logger.error('❌ AuthUtils: Error clearing auth storage:', error);
  }
}

// Get user completeness percentage
export async function getUserCompletenessPercentage(): Promise<number> {
  try {
    const user = await getCurrentUser();
    if (!user) return 0;
    
    return getUserCompleteness(user);
  } catch (error) {
    logger.error('❌ AuthUtils: Error getting user completeness:', error);
    return 0;
  }
}

// Check if user is admin
export function isAdmin(user?: AuthUser): boolean {
  return user?.role === 'admin';
}

// Check if user is approved by admin
export function isApprovedByAdmin(user?: AuthUser): boolean {
  return user?.isApprovedByAdmin === true;
}

// Check if user has completed onboarding
export function hasCompletedOnboarding(user?: AuthUser): boolean {
  return user?.hasSeenOnboardingMessage === true;
}

// Check if user is first login
export function isFirstLogin(user?: AuthUser): boolean {
  return user?.isFirstLogin === true;
}