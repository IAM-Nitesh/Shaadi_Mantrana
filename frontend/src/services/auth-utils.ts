import logger from '../utils/logger';
import { loggerForUser } from '../utils/pino-logger';
import { getUserCompleteness } from '../utils/user-utils';
import { config as configService } from './configService';
import { apiClient } from '../utils/api-client';

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
    
    const response = await apiClient.get('/api/auth/token', {
      credentials: 'include',
      timeout: 5000
    });

    if (response.ok && response.data.success && response.data.token) {
      logger.info('✅ AuthUtils: Bearer token retrieved successfully');
      return response.data.token;
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
      timeout: 10000
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
      const user = await getCurrentUser();
      const log = loggerForUser(user?.userUuid);
      log.error({ err: error }, '❌ AuthUtils: Error getting current user:');
    } catch (e) {
      logger.error({ err: error }, '❌ AuthUtils: Error getting current user:');
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