'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AuthUser } from '../services/server-auth-service';
import logger from '../utils/logger';
// NOTE: This is a client-side hook — avoid importing server-only services.

export interface UseServerAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  redirectTo: string | null;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  clearCache: () => void;
  forceRefresh: () => Promise<void>;
}

function determineRedirectPath(user: AuthUser): string | null {
  logger.debug('🔍 determineRedirectPath: Input user:', user);
  logger.debug('🔍 determineRedirectPath: User role:', user.role);
  logger.debug('🔍 determineRedirectPath: User isApprovedByAdmin:', user.isApprovedByAdmin);

  // If user is not approved, they shouldn't be authenticated
  if (!user.isApprovedByAdmin) {
    logger.debug('🔄 determineRedirectPath: User not approved by admin, redirecting to /');
    return '/';
  }

  // Admin users go to admin dashboard
  if (user.role === 'admin') {
    logger.debug('🔄 determineRedirectPath: Admin user detected, redirecting to /admin/dashboard');
    return '/admin/dashboard';
  }

  // Get user flags (support multiple user shapes)
  const isFirstLogin = (user as any).isFirstLogin;
  const profileCompleteness = (user as any).profileCompleteness ?? (user as any).profile?.profileCompleteness ?? ((user as any).profileCompleted ? 100 : 0);
  const hasSeenOnboardingMessage = (user as any).hasSeenOnboardingMessage;

  logger.debug('🔍 useServerAuth - User flags:', {
    isFirstLogin,
    profileCompleteness,
    hasSeenOnboardingMessage,
    isApprovedByAdmin: user.isApprovedByAdmin,
    userRole: user.role
  });

  // Access Control Logic:
  // Users should only access /dashboard and /matches if profileCompleteness is 100%
  
  // Case 1: First-time user (isFirstLogin = true)
  if (isFirstLogin === true) {
    // Always redirect to profile for first-time users
    logger.debug('🔄 First-time user - redirecting to profile');
    return '/profile';
  }

  // Case 2: Returning user with incomplete profile (profileCompleteness < 100%)
  if (profileCompleteness < 100) {
    logger.debug('🔄 Profile incomplete - redirecting to profile', { profileCompleteness });
    return '/profile';
  }

  // Case 3: User with complete profile (profileCompleteness = 100%)
  // Allow access to all pages - NO REDIRECT NEEDED
  if (profileCompleteness >= 100) {
    logger.debug('✅ Profile complete - allowing access to all pages', { profileCompleteness });
    return null; // No redirect needed - user can access any page
  }

  // Default case: redirect to profile (safety fallback)
  logger.debug('🔄 Default case - redirecting to profile');
  return '/profile';
}

// Cache management utilities
const CACHE_KEY = 'auth_cache';
const CACHE_DURATION = 5 * 60 * 1000; // Increased to 5 minutes for better user experience
const MIN_REQUEST_INTERVAL = 5 * 1000; // 5 seconds minimum between requests for better responsiveness

interface AuthCache {
  user: AuthUser;
  timestamp: number;
  redirectTo: string | null;
}

function getCachedAuth(): AuthCache | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const cache: AuthCache = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - cache.timestamp < CACHE_DURATION) {
      return cache;
    }
    
    // Cache expired, remove it
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    logger.error('Error reading auth cache:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function setCachedAuth(user: AuthUser, redirectTo: string | null): void {
  try {
    const cache: AuthCache = {
      user,
      timestamp: Date.now(),
      redirectTo
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    logger.error('Error setting auth cache:', error);
  }
}

function clearCachedAuth(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    logger.error('Error clearing auth cache:', error);
  }
}

export function useServerAuth(): UseServerAuthReturn {
  // Hook initialized - debug logs removed for production cleanliness
  // Check if we're on the client side
  const [isClient, setIsClient] = useState(false);
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState(0);

  // Add a ref to track if we've already performed the initial auth check
  const initialAuthCheckRef = useRef(false);
  
  // Add a ref to track if we're currently performing an auth check
  const isAuthCheckInProgress = useRef(false);

  // Check if cached authentication is still valid
  const isCacheValid = useCallback(() => {
    const cached = getCachedAuth();
    const isValid = cached !== null;
    logger.debug('🔍 useServerAuth: Cache validation:', {
      hasCachedAuth: cached !== null,
      cachedUser: cached?.user?.email,
      isValid
    });
    return isValid;
  }, []);

  // Check authentication status with persistent caching
  const checkAuth = useCallback(async (forceRefresh = false) => {
  logger.debug('🔍 useServerAuth: Starting authentication check...');
    
    // Prevent multiple simultaneous auth checks
    if (isAuthCheckInProgress.current) {
  logger.debug('🔍 useServerAuth: Auth check already in progress, skipping');
      return;
    }
    
    // Use cached authentication if valid and not forcing refresh
    if (!forceRefresh && isCacheValid()) {
      const cached = getCachedAuth();
      if (cached) {
  logger.info('✅ useServerAuth: Using cached authentication');
        setUser(cached.user);
        setIsAuthenticated(true);
        setRedirectTo(cached.redirectTo);
        setError('');
        setIsLoading(false);
        return;
      }
    }
    
    // Prevent too frequent requests - increased interval
    const now = Date.now();
    if (!forceRefresh && now - lastCheckTime < MIN_REQUEST_INTERVAL) { // 60 seconds minimum between requests
  logger.debug('🔍 useServerAuth: Too soon since last check, using cache');
      const cached = getCachedAuth();
      if (cached) {
        setUser(cached.user);
        setIsAuthenticated(true);
        setRedirectTo(cached.redirectTo);
        setError('');
        setIsLoading(false);
        return;
      }
    }
    
    isAuthCheckInProgress.current = true;
    setIsLoading(true);
    setError('');
    
    try {
      // Call the auth status API directly from the client with cache-busting headers
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000); // Increased to 40 second timeout

      const res = await fetch('/api/auth/status', {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      // Handle 304 Not Modified - this means we need fresh data
      if (res.status === 304) {
        logger.debug('🔄 useServerAuth: Received 304, forcing fresh request');
        const freshRes = await fetch(`/api/auth/status?t=${Date.now()}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!freshRes.ok) {
          logger.info('ℹ️ useServerAuth: Fresh auth check failed');
          setUser(null);
          setIsAuthenticated(false);
          clearCachedAuth();
          setRedirectTo('/');
          setError('');
          return;
        }

        const freshResponse = await freshRes.json();
        logger.debug('🔍 useServerAuth: Fresh auth status response:', freshResponse);

        if (freshResponse.authenticated && freshResponse.user) {
          logger.info('✅ useServerAuth: User authenticated (fresh):', freshResponse.user);
          setUser(freshResponse.user);
          setIsAuthenticated(true);
          setError('');

          const redirectPath = freshResponse.redirectTo || determineRedirectPath(freshResponse.user);
          logger.debug('🔍 useServerAuth: Redirect path:', redirectPath);
          setRedirectTo(redirectPath);

          setCachedAuth(freshResponse.user, redirectPath);
          setLastCheckTime(Date.now());
        } else {
          logger.info('ℹ️ useServerAuth: User not authenticated (fresh)');
          setUser(null);
          setIsAuthenticated(false);
          clearCachedAuth();
          setRedirectTo('/');
          setError('');
        }
        return;
      }

      if (!res.ok) {
        logger.info('ℹ️ useServerAuth: User not authenticated or status check failed');
        setUser(null);
        setIsAuthenticated(false);
        clearCachedAuth();
        setRedirectTo('/');
        setError('');
        return;
      }

      const response = await res.json();
      logger.debug('🔍 useServerAuth: Auth status response:', response);

      if (response.authenticated && response.user) {
        logger.info('✅ useServerAuth: User authenticated:', response.user);
        logger.debug('🔍 useServerAuth: Backend redirectTo:', response.redirectTo);
        logger.debug('🔍 useServerAuth: User role from backend:', response.user.role);
        logger.debug('🔍 useServerAuth: User isFirstLogin from backend:', response.user.isFirstLogin);

        setUser(response.user);
        setIsAuthenticated(true);
        setError('');

        const redirectPath = response.redirectTo || determineRedirectPath(response.user);
        logger.debug('🔍 useServerAuth: Final redirect path:', redirectPath);
        setRedirectTo(redirectPath);

        setCachedAuth(response.user, redirectPath);
        setLastCheckTime(Date.now());
      } else {
        logger.info('ℹ️ useServerAuth: User not authenticated - this is normal for unauthenticated users');
        setUser(null);
        setIsAuthenticated(false);
        clearCachedAuth();
        setRedirectTo('/');
        setError('');
      }
    } catch (error) {
      logger.error('❌ useServerAuth: Authentication check failed:', error);
      
      // Handle timeout specifically
      if (error.name === 'AbortError') {
        logger.error('⏰ useServerAuth: Authentication request timed out');
        setError('Authentication check timed out. Please try again or refresh the page.');
      } else {
        setError(error instanceof Error ? error.message : 'Authentication failed');
      }
      
      // Don't clear authentication state on timeout - user might still be logged in
      if (error.name !== 'AbortError') {
        setUser(null);
        setIsAuthenticated(false);
        clearCachedAuth();
        setRedirectTo('/');
      }
    } finally {
      setIsLoading(false);
      isAuthCheckInProgress.current = false;
    }
  }, [isCacheValid, lastCheckTime]);

  const logout = useCallback(async () => {
    try {
      logger.debug('🔍 useServerAuth: Starting logout...');
      // Don't set loading state during logout to avoid interfering with UI animations
      // setIsLoading(true);

      const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        setError(err.error || 'Logout failed');
        throw new Error(err.error || 'Logout failed');
      } else {
        // Clear authentication state
        setUser(null);
        setIsAuthenticated(false);
        clearCachedAuth();
        setRedirectTo('/');
        setError(null);
        setRetryCount(0);

        // Clear auth utils cache
        if (typeof window !== 'undefined') {
          const { clearAuthStatusCache } = await import('../services/auth-utils');
          clearAuthStatusCache();
        }

        logger.debug('✅ useServerAuth: Logout successful');
      }
    } catch (err) {
      logger.error('❌ useServerAuth: Logout error:', err);
      setError('Failed to logout');
      throw err; // Re-throw to allow calling component to handle the error
    } finally {
      // Don't set loading to false to avoid interfering with animations
      // setIsLoading(false);
    }
  }, []);

  // Set client-side flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize from cache on mount (only on client)
  useEffect(() => {
    if (!isClient) return;
    
  logger.debug('🔍 useServerAuth: Initializing from cache...');
    const cached = getCachedAuth();
    if (cached) {
  logger.info('✅ useServerAuth: Found valid cached authentication');
      setUser(cached.user);
      setIsAuthenticated(true);
      setRedirectTo(cached.redirectTo);
      setIsLoading(false);
    }
  }, [isClient]);

  // Check authentication on mount with caching and optimized retry logic
  useEffect(() => {
    if (!isClient) return;
    
  logger.debug('🔍 useServerAuth: useEffect triggered');
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;
    let authTimeout: NodeJS.Timeout;
    let maxWaitTimeout: NodeJS.Timeout;

    const performAuthCheck = async () => {
      if (!mounted) return;
      
      // Prevent multiple initial auth checks
      if (initialAuthCheckRef.current) {
  logger.debug('🔍 useServerAuth: Initial auth check already performed, skipping');
        return;
      }
      
      try {
  logger.debug('🔍 useServerAuth: Performing initial auth check...');
        initialAuthCheckRef.current = true;
        
        // Check if we have valid cached authentication first
        if (isCacheValid()) {
          logger.info('✅ useServerAuth: Using cached authentication, skipping server call');
          setIsLoading(false);
          return;
        }
        
        // If user is already authenticated and we have recent auth data, don't force a new check
        if (isAuthenticated && user && lastCheckTime && (Date.now() - lastCheckTime < 30000)) {
          logger.debug('✅ useServerAuth: Recent auth check found, skipping new check');
          setIsLoading(false);
          return;
        }
        
        // Set a timeout for the auth check
        const authPromise = checkAuth(false); // Don't force refresh on initial load
        const timeoutPromise = new Promise((_, reject) => {
          authTimeout = setTimeout(() => reject(new Error('Authentication timeout')), 15000); // 15 second timeout
        });
        
        await Promise.race([authPromise, timeoutPromise]);
        clearTimeout(authTimeout);
      } catch (error) {
  logger.error('❌ useServerAuth: Initial auth check failed:', error);
        clearTimeout(authTimeout);
        
        // Retry logic for initial load with shorter delays
        if (mounted && retryCount < 1) { // Reduced retries
          logger.debug(`🔄 useServerAuth: Retrying auth check (${retryCount + 1}/2)...`);
          retryTimeout = setTimeout(() => {
            if (mounted) {
              setRetryCount(prev => prev + 1);
              performAuthCheck();
            }
          }, 1000); // Shorter delay
        } else {
          logger.warn('❌ useServerAuth: Max retries reached, giving up');
          setIsLoading(false);
        }
      }
    };

    // Set a maximum wait time to prevent infinite loading
    maxWaitTimeout = setTimeout(() => {
      if (mounted && isLoading) {
  logger.warn('⚠️ useServerAuth: Maximum wait time reached, stopping loading');
        setIsLoading(false);
        setError('Authentication check timed out. Please refresh the page.');
      }
    }, 30000); // 30 second maximum wait

    performAuthCheck();

    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (authTimeout) {
        clearTimeout(authTimeout);
      }
      if (maxWaitTimeout) {
        clearTimeout(maxWaitTimeout);
      }
    };
  }, [isClient]); // Add isClient to dependencies

  // Handle token refresh events
  useEffect(() => {
    if (!isClient) return;

    // Start token refresh service if user is authenticated
  // The token refresh service is server-side and not available in client bundles.
  // We will rely on the server to issue refreshes via cookies. If a client-side
  // token refresh mechanism is needed, implement a small client-only poll here.
  return () => {};
  }, [isClient, isAuthenticated, user, checkAuth]);

  // Add a method to clear cache for debugging/testing
  const clearCache = useCallback(() => {
  logger.debug('🔍 useServerAuth: Clearing authentication cache');
    clearCachedAuth();
    setUser(null);
    setIsAuthenticated(false);
    setRedirectTo(null);
    setError(null);
    initialAuthCheckRef.current = false;
    
    // Clear auth cache in auth-utils as well
    if (typeof window !== 'undefined') {
      import('../services/auth-utils').then(({ clearAuthStatusCache }) => {
        clearAuthStatusCache();
      });
    }
  }, []);

  // Add a method to force refresh authentication
  const forceRefresh = useCallback(async () => {
  logger.debug('🔍 useServerAuth: Force refreshing authentication');
    clearCachedAuth();
    initialAuthCheckRef.current = false;
    
    // Clear auth cache in auth-utils as well
    if (typeof window !== 'undefined') {
      const { clearAuthStatusCache } = await import('../services/auth-utils');
      clearAuthStatusCache();
    }
    
    await checkAuth(true);
  }, [checkAuth]);

  // Return default values during server-side rendering
  if (!isClient) {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      redirectTo: null,
      checkAuth: async () => {},
      logout: async () => {},
      clearCache: () => {},
      forceRefresh: async () => {}
    };
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    redirectTo,
    checkAuth,
    logout,
    clearCache,
    forceRefresh
  };
} 