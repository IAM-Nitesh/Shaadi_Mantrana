import logger from '../utils/logger';
import { loggerForUser } from '../utils/pino-logger';
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

    
    // Since we're using HTTP-only cookies, we need to make a server request
    // to get the token from the server side
    const response = await fetch('/api/auth/token', {
      method: 'GET',
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

          if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.success && data.token) {
        return data.token;
      }

      return null;
  } catch (error) {
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
    const response = await fetch('/api/auth/status', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

          if (!response.ok) {
        // Cache the failed response to prevent repeated calls
        authStatusCache = {
          data: { authenticated: false, redirectTo: '/', message: 'Auth check failed' },
          timestamp: Date.now()
        };
        return false;
      }

    const data: AuthStatus = await response.json();
    
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
    const response = await fetch('/api/auth/status', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
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

    const data: AuthStatus = await response.json();
    
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
  logger.debug('🔍 AuthUtils: Auth status cache cleared');
}

// Check if user is admin
export function isAdmin(user?: AuthUser): boolean {
  return user?.role === 'admin';
}

// Check if user can access restricted features
export function canAccessRestrictedFeatures(user?: AuthUser): boolean {
  return user?.isApprovedByAdmin === true && user?.profileCompleteness === 100;
}

// Check if user needs profile completion
export function needsProfileCompletion(user?: AuthUser): boolean {
  return !user || user.profileCompleteness < 100;
} 