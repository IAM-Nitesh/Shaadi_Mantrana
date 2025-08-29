// Server-side Authentication Service
// Uses HTTP-only cookies for security instead of localStorage

import tokenRefreshService from './token-refresh-service';
import logger from '../utils/logger';
import { loggerForUser } from '../utils/pino-logger';
import { getCurrentUser } from './auth-utils';
import { getUserCompleteness } from '../utils/user-utils';
import { config as configService } from './configService';

export interface AuthUser {
  role: string;
  email: string;
  isFirstLogin: boolean;
  isApprovedByAdmin: boolean;
  profileCompleteness: number;
  hasSeenOnboardingMessage: boolean;
  userUuid: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user?: AuthUser;
  redirectTo: string;
  message?: string;
}

export class ServerAuthService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second
  private static isTokenRefreshServiceStarted = false;

  // Initialize token refresh service
  static initializeTokenRefresh(): void {
    if (!this.isTokenRefreshServiceStarted) {
  logger.debug('🔄 ServerAuthService: Initializing token refresh service');
      tokenRefreshService.start(
        (success) => {
            if (success) {
            logger.info('✅ ServerAuthService: Token refresh successful');
          } else {
            logger.warn('❌ ServerAuthService: Token refresh failed');
          }
        },
        () => {
      logger.warn('⚠️ ServerAuthService: Token expired, user needs to re-authenticate');
        }
      );
      this.isTokenRefreshServiceStarted = true;
    }
  }

  // Stop token refresh service
  static stopTokenRefresh(): void {
  logger.debug('🔄 ServerAuthService: Stopping token refresh service');
    tokenRefreshService.stop();
    this.isTokenRefreshServiceStarted = false;
  }

  // Helper method to add retry logic with token refresh
  private static async withRetryAndTokenRefresh<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
  logger.warn(`ServerAuthService: Attempt ${attempt} failed:`, error);
        
        // Check if it's an authentication error that might be fixed by token refresh
        if (error instanceof Error) {
          if (error.message.includes('401') || error.message.includes('Authentication failed')) {
            logger.debug('🔄 ServerAuthService: Authentication error detected, attempting token refresh...');
            
            try {
              const refreshSuccess = await tokenRefreshService.refreshToken();
              if (refreshSuccess) {
                logger.info('✅ ServerAuthService: Token refresh successful, retrying operation...');
                // Retry the operation with the new token
                return await operation();
              }
            } catch (refreshError) {
              logger.error('❌ ServerAuthService: Token refresh failed:', refreshError);
            }
          }
          
          // Don't retry on rate limiting
          if (error.message.includes('429') || error.message.includes('Rate limit exceeded')) {
            logger.warn('ServerAuthService: Rate limit hit, not retrying');
            throw lastError;
          }
        }
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Wait before retrying with exponential backoff
        const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
  logger.debug(`ServerAuthService: Waiting ${delay}ms before retry ${attempt + 1}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  // Verify OTP and get authentication status
  static async verifyOTP(email: string, otp: string): Promise<{ success: boolean; redirectTo: string; user?: AuthUser; error?: string }> {
    try {
      logger.debug('🔍 ServerAuthService: Starting OTP verification for:', email);
      
      const result = await this.withRetryAndTokenRefresh(async () => {
        const response = await fetch(`${configService.apiBaseUrl}/api/auth/verify`, {
           method: 'POST',
           credentials: 'include',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ email, otp })
         });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      });

  logger.info('✅ ServerAuthService: OTP verification successful (raw):', result);

      // Initialize token refresh service after successful authentication
      this.initializeTokenRefresh();

      // Return the raw backend result to the caller so the client receives
      // exactly what the Next.js API returned. This avoids losing fields
      // like `session` which can be needed by the caller for logic.
      return result as any;

      } catch (error) {
  try {
    const user = await getCurrentUser();
    const log = loggerForUser(user?.userUuid);
    log.error({ err: error }, '❌ ServerAuthService: OTP verification error:');
  } catch (e) {
    logger.error({ err: error }, '❌ ServerAuthService: OTP verification error:');
  }
      
      let errorMessage = 'Network error. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('403')) {
          errorMessage = 'Your account has been paused. Please contact the admin for re-approval.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Too many attempts. Please try again later.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Invalid OTP. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        redirectTo: '/',
        error: errorMessage
      };
    }
  }

  // Check current authentication status
  static async checkAuthStatus(): Promise<AuthStatus> {
    try {
  logger.debug('🔍 ServerAuthService: Checking authentication status...');
      
      const result = await this.withRetryAndTokenRefresh(async () => {
  logger.debug('🔍 ServerAuthService: Making request to /api/auth/status...');
        
        const response = await fetch(`${configService.apiBaseUrl}/api/auth/status`, {
          method: 'GET',
          credentials: 'include', // Include cookies
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

  logger.debug('🔍 ServerAuthService: Response status:', response.status);
  logger.debug('🔍 ServerAuthService: Response ok:', response.ok);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          logger.error('❌ ServerAuthService: Response not ok, error:', errorData);
          
          // Handle rate limiting specifically
          if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
            logger.debug(`ServerAuthService: Rate limited, waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            throw new Error('Rate limit exceeded. Please wait before trying again.');
          }
          
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
  logger.debug('🔍 ServerAuthService: Response data:', result);
        return result;
      });

  logger.info('✅ ServerAuthService: Auth status check successful:', result);
      
      // Initialize token refresh service if user is authenticated
      if (result.authenticated) {
        this.initializeTokenRefresh();
      }
      
      return {
        authenticated: true,
        user: result.user,
        redirectTo: result.redirectTo
      };

    } catch (error) {
  try {
    const user = await getCurrentUser();
    const log = loggerForUser(user?.userUuid);
    log.error({ err: error }, '❌ ServerAuthService: Auth status check error:');
  } catch (e) {
    logger.error({ err: error }, '❌ ServerAuthService: Auth status check error:');
  }
      
      let message = 'Network error. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          message = 'Request timeout. Please try again.';
        } else if (error.message.includes('401')) {
          message = 'Authentication failed. Please log in again.';
        } else {
          message = error.message;
        }
      }
      
      return {
        authenticated: false,
        redirectTo: '/',
        message
      };
    }
  }

  // Logout user
  static async logout(): Promise<{ success: boolean; message: string }> {
    try {
  logger.debug('🔍 ServerAuthService: Starting logout...');
      
      // Stop token refresh service
      this.stopTokenRefresh();
      
      const result = await this.withRetryAndTokenRefresh(async () => {
        const response = await fetch(`${configService.apiBaseUrl}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      });

  logger.info('✅ ServerAuthService: Logout successful');
      
      return {
        success: true,
        message: result.message || 'Successfully logged out'
      };

    } catch (error) {
  try {
    const user = await getCurrentUser();
    const log = loggerForUser(user?.userUuid);
    log.error({ err: error }, '❌ ServerAuthService: Logout error:');
  } catch (e) {
    logger.error({ err: error }, '❌ ServerAuthService: Logout error:');
  }
      
      let message = 'Network error during logout';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          message = 'Logout timeout. Please try again.';
        } else {
          message = error.message;
        }
      }
      
      return {
        success: false,
        message
      };
    }
  }

  // Get auth headers for API calls (from cookies, handled by server)
  static async getAuthHeaders(): Promise<HeadersInit> {
    // The server will automatically include cookies in requests
    // This is just a placeholder for any additional headers
    return {
      'Content-Type': 'application/json',
    };
  }

  // Get Bearer token for backend API calls
  // This method extracts the authToken from cookies and returns it as a Bearer token
  static async getBearerToken(): Promise<string | null> {
    try {
  logger.debug('🔍 ServerAuthService: Getting Bearer token...');
      
      // Since we're using HTTP-only cookies, we need to make a server request
      // to get the token from the server side
      const response = await fetch(`${configService.apiBaseUrl}/api/auth/token`, {
        method: 'GET',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
  logger.warn('❌ ServerAuthService: Failed to get Bearer token, status:', response.status);
        return null;
      }

      const data = await response.json();
      if (data.success && data.token) {
  logger.info('✅ ServerAuthService: Bearer token retrieved successfully');
        return data.token;
      }

  logger.warn('❌ ServerAuthService: No token in response');
      return null;
    } catch (error) {
  logger.error('❌ ServerAuthService: Error getting Bearer token:', error);
      return null;
    }
  }

  // Check if user is admin
  static isAdmin(user?: AuthUser): boolean {
    return user?.role === 'admin';
  }

  // Check if user can access restricted features
  static canAccessRestrictedFeatures(user?: AuthUser): boolean {
    if (!user) return false;
    
    // Admin users can access all features
    if (user.role === 'admin') return true;
    
    // Regular users need to be approved and have complete profile
  const completeness = getUserCompleteness(user);
  return user.isApprovedByAdmin && 
       completeness >= 100 && 
       !user.isFirstLogin;
  }

  // Check if user needs to complete profile
  static needsProfileCompletion(user?: AuthUser): boolean {
    if (!user) return true;
    
    // Admin users don't need profile completion
    if (user.role === 'admin') return false;
    
    // Regular users need profile completion if first login or incomplete profile
  const completeness = getUserCompleteness(user);
  return user.isFirstLogin || completeness < 100;
  }

  // Check if user should see onboarding message
  static shouldShowOnboarding(user?: AuthUser): boolean {
    if (!user) return false;
    
    // Only show onboarding for regular users who haven't seen it and are on first login
  return user.role === 'user' && 
       !user.hasSeenOnboardingMessage && 
       user.isFirstLogin;
  }

  // Get auth token for API calls (for backward compatibility)
  // This method is deprecated - use getAuthHeaders() instead
  static async getAuthToken(): Promise<string | null> {
    try {
      const authStatus = await this.checkAuthStatus();
      if (authStatus.authenticated) {
        // For server-side auth, we don't return the token
        // The server handles authentication via cookies
        return 'server-auth'; // Placeholder for compatibility
      }
      return null;
    } catch (error) {
  logger.error('Error getting auth token:', error);
      return null;
    }
  }

  // Check if user is authenticated (for backward compatibility)
  static async isAuthenticated(): Promise<boolean> {
    try {
      const authStatus = await this.checkAuthStatus();
      return authStatus.authenticated;
    } catch (error) {
  logger.error('Error checking authentication:', error);
      return false;
    }
  }
}