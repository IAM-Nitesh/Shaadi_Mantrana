'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ServerAuthService, type AuthUser } from '../services/server-auth-service';

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
  // If user is not approved, they shouldn't be authenticated
  if (!user.isApprovedByAdmin) {
    return '/';
  }

  // Admin users go to admin dashboard
  if (user.role === 'admin') {
    return '/admin/dashboard';
  }

  // For regular users, check profile completion
  if (user.profileCompleteness < 100) {
    return '/profile';
  }

  // Fully authenticated user with complete profile
  return null; // No redirect needed
}

// Cache management utilities
const CACHE_KEY = 'auth_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
    console.error('Error reading auth cache:', error);
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
    console.error('Error setting auth cache:', error);
  }
}

function clearCachedAuth(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing auth cache:', error);
  }
}

export function useServerAuth(): UseServerAuthReturn {
  console.log('🔍 useServerAuth: Hook initialized');
  
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
    console.log('🔍 useServerAuth: Cache validation:', {
      hasCachedAuth: cached !== null,
      cachedUser: cached?.user?.email,
      isValid
    });
    return isValid;
  }, []);

  // Check authentication status with persistent caching
  const checkAuth = useCallback(async (forceRefresh = false) => {
    console.log('🔍 useServerAuth: Starting authentication check...');
    
    // Prevent multiple simultaneous auth checks
    if (isAuthCheckInProgress.current) {
      console.log('🔍 useServerAuth: Auth check already in progress, skipping');
      return;
    }
    
    // Use cached authentication if valid and not forcing refresh
    if (!forceRefresh && isCacheValid()) {
      const cached = getCachedAuth();
      if (cached) {
        console.log('✅ useServerAuth: Using cached authentication');
        setUser(cached.user);
        setIsAuthenticated(true);
        setRedirectTo(cached.redirectTo);
        setError('');
        setIsLoading(false);
        return;
      }
    }
    
    // Prevent too frequent requests
    const now = Date.now();
    if (!forceRefresh && now - lastCheckTime < 30000) { // 30 seconds minimum between requests
      console.log('🔍 useServerAuth: Too soon since last check, using cache');
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
      const response = await ServerAuthService.checkAuthStatus();
      console.log('🔍 useServerAuth: Auth status response:', response);
      
      if (response.authenticated && response.user) {
        console.log('✅ useServerAuth: User authenticated:', response.user);
        setUser(response.user);
        setIsAuthenticated(true);
        setError('');
        
        // Determine redirect path
        const redirectPath = response.redirectTo || determineRedirectPath(response.user);
        console.log('🔍 useServerAuth: Redirect path:', redirectPath);
        setRedirectTo(redirectPath);
        
        // Cache authentication persistently
        setCachedAuth(response.user, redirectPath);
        setLastCheckTime(Date.now());
      } else {
        console.log('❌ useServerAuth: User not authenticated');
        setUser(null);
        setIsAuthenticated(false);
        clearCachedAuth();
        setRedirectTo('/');
      }
    } catch (error) {
      console.error('❌ useServerAuth: Authentication check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      clearCachedAuth();
      setError(error instanceof Error ? error.message : 'Authentication failed');
      setRedirectTo('/');
    } finally {
      setIsLoading(false);
      isAuthCheckInProgress.current = false;
    }
  }, [isCacheValid, lastCheckTime]);

  const logout = useCallback(async () => {
    try {
      console.log('🔍 useServerAuth: Starting logout...');
      setIsLoading(true);
      
      const result = await ServerAuthService.logout();
      
      if (result.success) {
        console.log('✅ useServerAuth: Logout successful');
        setUser(null);
        setIsAuthenticated(false);
        clearCachedAuth();
        setRedirectTo('/');
        setError(null);
        setRetryCount(0);
      } else {
        console.log('❌ useServerAuth: Logout failed:', result.message);
        setError(result.message);
      }
    } catch (err) {
      console.error('❌ useServerAuth: Logout error:', err);
      setError('Failed to logout');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set client-side flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize from cache on mount (only on client)
  useEffect(() => {
    if (!isClient) return;
    
    console.log('🔍 useServerAuth: Initializing from cache...');
    const cached = getCachedAuth();
    if (cached) {
      console.log('✅ useServerAuth: Found valid cached authentication');
      setUser(cached.user);
      setIsAuthenticated(true);
      setRedirectTo(cached.redirectTo);
      setIsLoading(false);
    }
  }, [isClient]);

  // Check authentication on mount with caching and optimized retry logic
  useEffect(() => {
    if (!isClient) return;
    
    console.log('🔍 useServerAuth: useEffect triggered');
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;
    let authTimeout: NodeJS.Timeout;
    let maxWaitTimeout: NodeJS.Timeout;

    const performAuthCheck = async () => {
      if (!mounted) return;
      
      // Prevent multiple initial auth checks
      if (initialAuthCheckRef.current) {
        console.log('🔍 useServerAuth: Initial auth check already performed, skipping');
        return;
      }
      
      try {
        console.log('🔍 useServerAuth: Performing initial auth check...');
        initialAuthCheckRef.current = true;
        
        // Check if we have valid cached authentication first
        if (isCacheValid()) {
          console.log('✅ useServerAuth: Using cached authentication, skipping server call');
          setIsLoading(false);
          return;
        }
        
        // Set a timeout for the auth check
        const authPromise = checkAuth(false); // Don't force refresh on initial load
        const timeoutPromise = new Promise((_, reject) => {
          authTimeout = setTimeout(() => reject(new Error('Authentication timeout')), 5000); // 5 second timeout
        });
        
        await Promise.race([authPromise, timeoutPromise]);
        clearTimeout(authTimeout);
      } catch (error) {
        console.error('❌ useServerAuth: Initial auth check failed:', error);
        clearTimeout(authTimeout);
        
        // Retry logic for initial load with shorter delays
        if (mounted && retryCount < 1) { // Reduced retries
          console.log(`🔄 useServerAuth: Retrying auth check (${retryCount + 1}/2)...`);
          retryTimeout = setTimeout(() => {
            if (mounted) {
              setRetryCount(prev => prev + 1);
              performAuthCheck();
            }
          }, 1000); // Shorter delay
        } else {
          console.log('❌ useServerAuth: Max retries reached, giving up');
          setIsLoading(false);
        }
      }
    };

    // Set a maximum wait time to prevent infinite loading
    maxWaitTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.log('⚠️ useServerAuth: Maximum wait time reached, stopping loading');
        setIsLoading(false);
        setError('Authentication check timed out. Please refresh the page.');
      }
    }, 10000); // 10 second maximum wait

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

  // Add a method to clear cache for debugging/testing
  const clearCache = useCallback(() => {
    console.log('🔍 useServerAuth: Clearing authentication cache');
    clearCachedAuth();
    setUser(null);
    setIsAuthenticated(false);
    setRedirectTo(null);
    setError(null);
    initialAuthCheckRef.current = false;
  }, []);

  // Add a method to force refresh authentication
  const forceRefresh = useCallback(async () => {
    console.log('🔍 useServerAuth: Force refreshing authentication');
    clearCachedAuth();
    initialAuthCheckRef.current = false;
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