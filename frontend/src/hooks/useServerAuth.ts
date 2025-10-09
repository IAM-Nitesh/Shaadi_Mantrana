'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AuthUser } from '../services/server-auth-service';
import logger from '../utils/logger';
import { apiClient } from '../utils/api-client';
// NOTE: This is a client-side hook — avoid importing server-only services.

export interface UseServerAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  redirectTo: string | null;
  authState: AuthState; // Add state machine status
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  clearCache: () => void;
  forceRefresh: () => Promise<void>;
  isExpired: boolean; // Helper for detecting expired sessions
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
const CACHE_DURATION = 60 * 1000; // 1 minute cache for auth
const MIN_REQUEST_INTERVAL = 10 * 1000; // 10 seconds minimum between requests

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
    const currentTime = Date.now();
    
    // Check if cache is still valid
    if (currentTime - cache.timestamp < CACHE_DURATION) {
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

// Auth state machine types
enum AuthState {
  UNKNOWN = 'unknown',        // Initial state, not determined yet
  CHECKING = 'checking',      // Actively checking authentication
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  REFRESHING = 'refreshing',  // Currently refreshing tokens
  ERROR = 'error',            // Error state
  EXPIRED = 'expired'         // Authentication expired
}

export function useServerAuth(): UseServerAuthReturn {
  // Hook initialized - debug logs removed for production cleanliness
  // Check if we're on the client side
  const [isClient, setIsClient] = useState(false);
  
  // Traditional state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState(0);
  
  // New state machine for auth flow
  const [authState, setAuthState] = useState<AuthState>(AuthState.UNKNOWN);
  const authStateRef = useRef<AuthState>(AuthState.UNKNOWN);
  
  // Update the ref whenever state changes to have accurate values in callbacks
  useEffect(() => {
    authStateRef.current = authState;
  }, [authState]);
  
  // Activity tracking to detect active sessions
  const lastActivityTime = useRef<number>(Date.now());
  
  // Add a ref to track if we've already performed the initial auth check
  const initialAuthCheckRef = useRef(false);
  
  // Add a ref to track if we're currently performing an auth check
  const isAuthCheckInProgress = useRef(false);
  
  // Add abort controller to cancel in-flight requests when needed
  const currentRequestController = useRef<AbortController | null>(null);
  
  // Track ongoing requests to prevent duplicates
  const ongoingRequests = useRef<Set<string>>(new Set());

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

  // Cancel any in-flight requests on cleanup
  const cancelInFlightRequests = useCallback(() => {
    if (currentRequestController.current) {
      currentRequestController.current.abort();
      currentRequestController.current = null;
    }
  }, []);

  // Check authentication status with simplified logic to prevent race conditions
  const checkAuth = useCallback(async (forceRefresh = false, abortSignal?: AbortSignal) => {
    // Start auth check
    logger.debug('🔍 useServerAuth: checkAuth called', { forceRefresh });
    
    // Prevent multiple simultaneous auth checks
    if (isAuthCheckInProgress.current) {
      logger.debug('🔍 useServerAuth: Auth check already in progress, skipping');
      return;
    }
    
    // Update state machine if appropriate
    if (authStateRef.current !== AuthState.CHECKING && 
        authStateRef.current !== AuthState.REFRESHING) {
      setAuthState(AuthState.CHECKING);
      logger.debug('🔍 useServerAuth: State → CHECKING');
    }
    
    // Prevent too frequent requests - use cache if available and not forcing refresh
    const currentTime = Date.now();
    if (!forceRefresh && currentTime - lastCheckTime < MIN_REQUEST_INTERVAL) {
      logger.debug('🔍 useServerAuth: Too soon since last check, using cache');
      const cached = getCachedAuth();
      if (cached && isCacheValid()) {
        setUser(cached.user);
        setIsAuthenticated(true);
        setError(null);
        setRedirectTo(determineRedirectPath(cached.user));
        setAuthState(AuthState.AUTHENTICATED);
        setIsLoading(false);
        return;
      }
    }
    
    // Cancel any existing requests before starting a new one
    cancelInFlightRequests();
    
    // Track when an auth check is in progress
    isAuthCheckInProgress.current = true;
    setIsLoading(true);
    setError('');
    
    try {
      // Call the auth status API directly from the client with cache-busting headers
      // Use provided signal or create a new one
      const controller = new AbortController();
      // If an external signal is provided, listen to it and abort our controller too
      if (abortSignal) {
        if (abortSignal.aborted) {
          controller.abort();
          throw new Error('Request was aborted');
        }
        abortSignal.addEventListener('abort', () => {
          controller.abort();
        });
      }
      
      const timeoutMs = 8000; // Increased timeout for better reliability
      
      // Update auth state for better user feedback
      setAuthState(AuthState.CHECKING);
      logger.debug('🔍 useServerAuth: State → CHECKING (API call)');

      const res = await apiClient.get('/api/auth/status', {
        signal: controller.signal,
        timeout: timeoutMs,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      // Handle 304 Not Modified - this means we need fresh data
      if (res.status === 304) {
        logger.debug('🔄 useServerAuth: Received 304, forcing fresh request');
        const freshRes = await apiClient.get(`/api/auth/status?t=${Date.now()}`, {
          timeout: timeoutMs,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!freshRes.ok) {
          logger.info('ℹ️ useServerAuth: Fresh auth check failed');
          setError('Authentication service unavailable');
          setIsLoading(false);
          return;
        }

        const freshResponse = freshRes.data;
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
        setError('Authentication service unavailable');
        setIsLoading(false);
        return;
      }

      const response = res.data;
      logger.debug('🔍 useServerAuth: Auth status response:', response);

      // Detect token expiry signaled by the server/proxy and attempt client-side refresh
      const tokenExpiredSignal = response && (response.code === 'TOKEN_EXPIRED' || /expired/i.test(response.message || ''));
      if (tokenExpiredSignal) {
        logger.debug('🔄 useServerAuth: Detected token expired signal from server/proxy, attempting client-side refresh');
        try {
          const refreshResp = await apiClient.post('/api/auth/refresh', undefined, { timeout: 15000 });
          logger.debug('🔄 useServerAuth: Client refresh response status:', refreshResp.status);
          if (refreshResp.ok) {
            logger.info('🔄 useServerAuth: Client refresh succeeded, retrying auth status');
            // Retry the status check once
            await checkAuth(true);
            return;
          }
        } catch (e) {
          logger.error('❌ useServerAuth: Client-side refresh attempt failed:', e);
        }
      }

      if (response.authenticated && response.user) {
        logger.info('✅ useServerAuth: User authenticated:', response.user);
        logger.debug('🔍 useServerAuth: Backend redirectTo:', response.redirectTo);
        logger.debug('🔍 useServerAuth: User role from backend:', response.user.role);
        logger.debug('🔍 useServerAuth: User isFirstLogin from backend:', response.user.isFirstLogin);

        setUser(response.user);
        setIsAuthenticated(true);
        setError('');
        
        // Update state machine
        setAuthState(AuthState.AUTHENTICATED);
        logger.debug('🔍 useServerAuth: State → AUTHENTICATED');

        const redirectPath = response.redirectTo || determineRedirectPath(response.user);
        logger.debug('🔍 useServerAuth: Final redirect path:', redirectPath);
        setRedirectTo(redirectPath);

        // Update cache and timestamp
        setCachedAuth(response.user, redirectPath);
        setLastCheckTime(Date.now());
        
        // Reset activity timestamp on successful auth
        lastActivityTime.current = Date.now();
      } else {
        logger.info('ℹ️ useServerAuth: User not authenticated - this is normal for unauthenticated users');
        setUser(null);
        setIsAuthenticated(false);
        clearCachedAuth();
        setRedirectTo('/');
        setError('');
        
        // Update state machine
        setAuthState(AuthState.UNAUTHENTICATED);
        logger.debug('🔍 useServerAuth: State → UNAUTHENTICATED');
      }
    } catch (error) {
      logger.error('❌ useServerAuth: Authentication check failed:', error);
      
      // Handle different error types
      if (error.name === 'AbortError') {
        logger.error('⏰ useServerAuth: Authentication request timed out or aborted');
        setError('Authentication check timed out. Please try again or refresh the page.');
        
        // Update state machine - but don't clear auth state on timeout
        setAuthState(AuthState.ERROR);
        logger.debug('🔍 useServerAuth: State → ERROR (timeout/abort)');
      } else if (error.message?.includes('expired') || error.message?.includes('invalid token')) {
        // Token issues - explicitly handle token expiration
        logger.warn('⚠️ useServerAuth: Token appears expired or invalid');
        setError('Your session has expired. Please log in again.');
        
        // Clear authentication on token errors
        setUser(null);
        setIsAuthenticated(false);
        clearCachedAuth();
        setRedirectTo('/');
        
        // Update state machine
        setAuthState(AuthState.EXPIRED);
        logger.debug('🔍 useServerAuth: State → EXPIRED');
      } else {
        // Generic errors
        setError(error instanceof Error ? error.message : 'Authentication failed');
        
        // Clear authentication on other errors
        setUser(null);
        setIsAuthenticated(false);
        clearCachedAuth();
        setRedirectTo('/');
        
        // Update state machine
        setAuthState(AuthState.ERROR);
        logger.debug('🔍 useServerAuth: State → ERROR');
      }
      
      // For network errors, keep existing state if we have one
      if (error.name === 'NetworkError' && isAuthenticated && user) {
        logger.warn('⚠️ useServerAuth: Network error, but keeping existing authenticated state');
        // Don't clear state on network errors if already authenticated
      }
    } finally {
      setIsLoading(false);
      isAuthCheckInProgress.current = false;
      ongoingRequests.current.delete('auth-status');
      
      // If we're in an error state but still have valid cached auth,
      // transition back to authenticated with a warning
      if (authStateRef.current === AuthState.ERROR && isCacheValid()) {
        logger.warn('⚠️ useServerAuth: In error state but valid cache exists, keeping authenticated');
        setAuthState(AuthState.AUTHENTICATED);
        logger.debug('🔍 useServerAuth: State → AUTHENTICATED (recovery from error)');
      }
    }
  }, [isCacheValid, lastCheckTime]);

  const logout = useCallback(async () => {
    try {
      logger.debug('🔍 useServerAuth: Starting logout...');
      
      // Update state machine first for immediate UI feedback
      setAuthState(AuthState.CHECKING);
      logger.debug('🔍 useServerAuth: State → CHECKING (logout)');
      
      // Cancel any in-flight requests
      if (currentRequestController.current) {
        currentRequestController.current.abort();
        currentRequestController.current = null;
      }
      
      // Create a new controller for logout request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const res = await apiClient.post('/api/auth/logout', undefined, { 
          signal: controller.signal,
          timeout: 10000 
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          const errData: any = res.data || { error: 'Logout failed' };
          setError(errData.error || 'Logout failed');
          
          // Even if server logout fails, still clear local state
          logger.warn('⚠️ useServerAuth: Server logout failed, but clearing local state');
          
          // Update state machine
          setAuthState(AuthState.ERROR);
          logger.debug('🔍 useServerAuth: State → ERROR (logout failed)');
          
          throw new Error(errData.error || 'Logout failed');
        } else {
          logger.debug('✅ useServerAuth: Logout API call successful');
        }
      } catch (apiError) {
        // Log but continue with local logout
        logger.error('❌ useServerAuth: Logout API call failed:', apiError);
      } finally {
        clearTimeout(timeoutId);
      }
      
      // Always clear local state regardless of API result
      setUser(null);
      setIsAuthenticated(false);
      clearCachedAuth();
      setRedirectTo('/');
      setError(null);
      setRetryCount(0);
      initialAuthCheckRef.current = false;
      
      // Update state machine to finalize logout
      setAuthState(AuthState.UNAUTHENTICATED);
      logger.debug('🔍 useServerAuth: State → UNAUTHENTICATED (after logout)');

      // Clear auth utils cache
      if (typeof window !== 'undefined') {
        const { clearAuthStatusCache } = await import('../services/auth-utils');
        clearAuthStatusCache();
      }

      // Stop token refresh service
      try {
        const { default: tokenRefreshService } = await import('../services/token-refresh-service');
        tokenRefreshService.stop();
      } catch (err) {
        logger.error('❌ useServerAuth: Failed to stop token refresh service:', err);
      }

      logger.info('✅ useServerAuth: Logout successful');
    } catch (err) {
      logger.error('❌ useServerAuth: Logout error:', err);
      setError('Failed to logout');
      
      // Update state machine
      setAuthState(AuthState.ERROR);
      logger.debug('🔍 useServerAuth: State → ERROR (logout exception)');
      
      throw err; // Re-throw to allow calling component to handle the error
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

  // Track user activity to maintain session
  useEffect(() => {
    if (!isClient) return;
    
    const updateActivityTimestamp = () => {
      lastActivityTime.current = Date.now();
    };
    
    // Track user activity events
    const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivityTimestamp);
    });
    
    // Initial timestamp
    updateActivityTimestamp();
    
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivityTimestamp);
      });
    };
  }, [isClient]);

  // Check authentication on mount with state machine-based approach
  useEffect(() => {
    if (!isClient) return;
    
    logger.debug('🔍 useServerAuth: Auth state machine initialized');
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;
    let authTimeout: NodeJS.Timeout;
    let maxWaitTimeout: NodeJS.Timeout;
    let idleTimeout: NodeJS.Timeout;
    
  // Debounce authentication requests to prevent multiple concurrent calls
  const debounceAuthRequest = (() => {
    let timeoutId: NodeJS.Timeout;
    return (callback: () => void, delay: number = 100) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, delay);
    };
  })();

    const performAuthCheck = async () => {
      if (!mounted) return;
      
      // Prevent multiple initial auth checks
      if (initialAuthCheckRef.current) {
        logger.debug('🔍 useServerAuth: Initial auth check already performed, skipping');
        return;
      }

      // Prevent concurrent auth checks
      if (isAuthCheckInProgress.current) {
        logger.debug('🔍 useServerAuth: Auth check already in progress, skipping');
        return;
      }
      
      try {
        // Update state machine
        setAuthState(AuthState.CHECKING);
        logger.debug('🔍 useServerAuth: State → CHECKING');
        
        // Initialize first auth check
        initialAuthCheckRef.current = true;
        
        // Check if we have valid cached authentication first
        if (isCacheValid()) {
          logger.info('✅ useServerAuth: Using cached authentication');
          
          // Get cached data and update state
          const cached = getCachedAuth();
          if (cached) {
            setUser(cached.user);
            setIsAuthenticated(true);
            setRedirectTo(cached.redirectTo);
            setAuthState(AuthState.AUTHENTICATED);
            logger.debug('🔍 useServerAuth: State → AUTHENTICATED (from cache)');
          }
          
          setIsLoading(false);
          return;
        }
        
        // If user is already authenticated and we have recent auth data, don't force a new check
        if (isAuthenticated && user && lastCheckTime && (Date.now() - lastCheckTime < 30000)) {
          logger.debug('✅ useServerAuth: Recent auth check found, skipping new check');
          setIsLoading(false);
          setAuthState(AuthState.AUTHENTICATED);
          logger.debug('🔍 useServerAuth: State → AUTHENTICATED (recent check)');
          return;
        }
        
        // Set a timeout for the auth check with improved cancellation
        cancelInFlightRequests();
        currentRequestController.current = new AbortController();
        
        // Set up timeout Promise
        const timeoutPromise = new Promise<void>((_, reject) => {
        authTimeout = setTimeout(() => {
          reject(new Error('Authentication timeout'));
          // Clean up controller on timeout
          if (currentRequestController.current) {
            currentRequestController.current.abort();
            currentRequestController.current = null;
          }
        }, 8000); // Increased to 8 second timeout for better reliability
        });
        
        // Race the auth check against timeout
        await Promise.race([
          checkAuth(false, currentRequestController.current.signal), 
          timeoutPromise
        ]);
        
        clearTimeout(authTimeout);
      } catch (error) {
        logger.error('❌ useServerAuth: Initial auth check failed:', error);
        clearTimeout(authTimeout);
        
        // Update state machine
        setAuthState(AuthState.ERROR);
        logger.debug('🔍 useServerAuth: State → ERROR');
        setError(error instanceof Error ? error.message : 'Authentication check failed');
        
        // Retry logic for initial load with better error handling
        if (mounted && retryCount < 2) {
          logger.debug(`🔄 useServerAuth: Retrying auth check (${retryCount + 1}/2)...`);
          retryTimeout = setTimeout(() => {
            if (mounted) {
              setRetryCount(prev => prev + 1);
              performAuthCheck();
            }
          }, 2000 * Math.pow(2, retryCount)); // Exponential backoff
        } else {
          logger.warn('❌ useServerAuth: Max retries reached, transitioning to unauthenticated');
          setIsLoading(false);
          setAuthState(AuthState.UNAUTHENTICATED);
          logger.debug('🔍 useServerAuth: State → UNAUTHENTICATED (after retries)');
        }
      }
    };
    
    // Set up idle detection - if user is inactive for too long and has an expired token
    // we'll transition to the expired state
    const startIdleDetection = () => {
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }
      
      // Check for extended inactivity
      idleTimeout = setTimeout(() => {
        const inactiveTime = Date.now() - lastActivityTime.current;
        logger.debug(`🔍 useServerAuth: Idle check - inactive for ${Math.round(inactiveTime/1000)}s`);
        
        // If user has been inactive for more than 10 minutes and state is authenticated,
        // verify authentication is still valid
        if (authStateRef.current === AuthState.AUTHENTICATED && inactiveTime > 15 * 60 * 1000) { // Increased from 10 to 15 minutes
          logger.debug('🔍 useServerAuth: User inactive, verifying auth status');
          // Force a fresh check
          checkAuth(true).catch(err => {
            logger.error('❌ useServerAuth: Auth verification after inactivity failed:', err);
          });
        }
        
        // Continue checking
        if (mounted) {
          startIdleDetection();
        }
      }, 60000); // Check every minute
    };
    
    // Set a maximum wait time to prevent infinite loading
    maxWaitTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        logger.warn('⚠️ useServerAuth: Maximum wait time reached, stopping loading');
        setIsLoading(false);
        setError('Authentication check timed out. Please refresh the page.');
        setAuthState(AuthState.ERROR);
        logger.debug('🔍 useServerAuth: State → ERROR (timeout)');
      }
    }, 10000); // Reduced to 10 seconds

    // Start the auth check process
    performAuthCheck();
    
    // Start idle detection
    startIdleDetection();

    return () => {
      mounted = false;
      cancelInFlightRequests();
      
      if (retryTimeout) clearTimeout(retryTimeout);
      if (authTimeout) clearTimeout(authTimeout);
      if (maxWaitTimeout) clearTimeout(maxWaitTimeout);
      if (idleTimeout) clearTimeout(idleTimeout);
    };
  }, [isClient, isCacheValid, checkAuth, isAuthenticated, user, lastCheckTime]);

  // Handle token refresh events - implement actual token refresh polling
  useEffect(() => {
    if (!isClient) return;

    // Start token refresh service if user is authenticated
    if (isAuthenticated && user) {
      const startTokenRefreshService = async () => {
        try {
          const { default: tokenRefreshService } = await import('../services/token-refresh-service');
          
          tokenRefreshService.start(
            (success) => {
              if (success) {
                logger.info('✅ useServerAuth: Token refresh successful');
              } else {
                logger.warn('⚠️ useServerAuth: Token refresh failed, checking auth status');
                // If token refresh fails, check auth status to see if user is still authenticated
                checkAuth(true).catch(err => {
                  logger.error('❌ useServerAuth: Failed to check auth after token refresh failure:', err);
                });
              }
            },
            () => {
              logger.warn('⚠️ useServerAuth: Token expired, forcing logout');
              // Token expired, force logout
              logout().catch(err => {
                logger.error('❌ useServerAuth: Failed to logout after token expiry:', err);
              });
            }
          );
        } catch (error) {
          logger.error('❌ useServerAuth: Failed to start token refresh service:', error);
        }
      };
      
      startTokenRefreshService();
    }
    
    return () => {
      // Stop token refresh service when unmounting or user logs out
      import('../services/token-refresh-service').then(({ default: tokenRefreshService }) => {
        tokenRefreshService.stop();
      }).catch(() => {}); // Ignore errors on cleanup
    };
  }, [isClient, isAuthenticated, user, checkAuth, logout]);

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

  // Add a method to force refresh authentication with improved error handling
  const forceRefresh = useCallback(async () => {
    logger.debug('🔍 useServerAuth: Force refreshing authentication');
    
    // Update state machine
    setAuthState(AuthState.REFRESHING);
    logger.debug('🔍 useServerAuth: State → REFRESHING');
    
    // Clear all caches
    clearCachedAuth();
    initialAuthCheckRef.current = false;
    
    // Cancel any in-flight requests
    if (currentRequestController.current) {
      currentRequestController.current.abort();
      currentRequestController.current = null;
    }
    
    // Clear auth cache in auth-utils as well
    try {
      if (typeof window !== 'undefined') {
        const { clearAuthStatusCache } = await import('../services/auth-utils');
        clearAuthStatusCache();
      }
      
      // Create a new controller for this request
      const controller = new AbortController();
      currentRequestController.current = controller;
      
      // Set timeout for the request
      const timeoutId = setTimeout(() => {
        if (controller && !controller.signal.aborted) {
          controller.abort();
        }
      }, 15000);
      
      try {
        // Force a full refresh with the controller signal
        await checkAuth(true, controller.signal);
      } finally {
        clearTimeout(timeoutId);
        if (currentRequestController.current === controller) {
          currentRequestController.current = null;
        }
      }
    } catch (error) {
      logger.error('❌ useServerAuth: Force refresh failed:', error);
      
      // Update state machine on error
      setAuthState(AuthState.ERROR);
      logger.debug('🔍 useServerAuth: State → ERROR (force refresh failed)');
      
      // Set error message
      setError(error instanceof Error ? error.message : 'Failed to refresh authentication');
      
      // Rethrow for caller handling
      throw error;
    }
  }, [checkAuth]);

  // Calculate if the session is expired based on auth state
  const isExpired = authState === AuthState.EXPIRED;

  // Return default values during server-side rendering
  if (!isClient) {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      redirectTo: null,
      authState: AuthState.UNKNOWN,
      isExpired: false,
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
    authState,
    isExpired,
    checkAuth,
    logout,
    clearCache,
    forceRefresh
  };
} 