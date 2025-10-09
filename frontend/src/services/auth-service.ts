import { apiClient } from '../utils/api-client';
import logger from '../utils/logger';

export interface AuthUser {
  email: string;
  role: string;
  isFirstLogin: boolean;
  isApprovedByAdmin: boolean;
  profileCompleteness: number;
  hasSeenOnboardingMessage: boolean;
  profileCompleted: boolean;
}

export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
  message?: string;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  user?: AuthUser;
  userRole?: string;
  userEmail?: string;
  redirectTo?: string;
}

class AuthService {
  /**
   * Send OTP to user's email
   */
  async sendOTP(email: string): Promise<{ success: boolean; message?: string }> {
    try {
      logger.debug('🔍 AuthService: Sending OTP to:', email);
      
      const response = await apiClient.post('/api/auth/send-otp', { email }, {
        timeout: 10000
      });

      if (response.ok) {
        logger.info('✅ AuthService: OTP sent successfully');
        return { success: true };
      } else {
        logger.warn('⚠️ AuthService: OTP send failed with status:', response.status);
        return { 
          success: false, 
          message: response.data?.message || 'Failed to send OTP' 
        };
      }
    } catch (error) {
      logger.error('❌ AuthService: OTP send error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  /**
   * Verify OTP and login user
   */
  async verifyOTP(email: string, otp: string): Promise<LoginResponse> {
    try {
      logger.debug('🔍 AuthService: Verifying OTP for:', email);
      
      const response = await apiClient.post('/api/auth/verify-otp', { email, otp }, {
        timeout: 10000
      });

      if (response.ok && response.data) {
        const { success, user, message } = response.data;
        
        if (success && user) {
          logger.info('✅ AuthService: OTP verification successful:', user);
          return { success: true, user };
        } else {
          logger.warn('⚠️ AuthService: OTP verification failed:', message);
          return { success: false, message: message || 'Invalid OTP' };
        }
      } else {
        logger.warn('⚠️ AuthService: OTP verification failed with status:', response.status);
        return { 
          success: false, 
          message: response.data?.message || 'Verification failed' 
        };
      }
    } catch (error) {
      logger.error('❌ AuthService: OTP verification error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  /**
   * Check authentication status
   */
  async checkAuthStatus(): Promise<AuthStatusResponse> {
    try {
      logger.debug('🔍 AuthService: Checking authentication status');
      
      const response = await apiClient.get('/api/auth/status', {
        timeout: 5000,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok && response.data) {
        const { authenticated, user, userRole, userEmail, redirectTo } = response.data;
        
        logger.debug('🔍 AuthService: Auth status response:', {
          authenticated,
          userRole,
          userEmail,
          hasUser: !!user
        });

        return {
          authenticated,
          user,
          userRole,
          userEmail,
          redirectTo
        };
      } else {
        logger.warn('⚠️ AuthService: Auth status check failed with status:', response.status);
        return { authenticated: false };
      }
    } catch (error) {
      logger.error('❌ AuthService: Auth status check error:', error);
      return { authenticated: false };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<{ success: boolean; message?: string }> {
    try {
      logger.debug('🔍 AuthService: Logging out user');
      
      const response = await apiClient.post('/api/auth/logout', undefined, {
        timeout: 5000
      });

      if (response.ok) {
        logger.info('✅ AuthService: Logout successful');
        return { success: true };
      } else {
        logger.warn('⚠️ AuthService: Logout failed with status:', response.status);
        return { 
          success: false, 
          message: response.data?.message || 'Logout failed' 
        };
      }
    } catch (error) {
      logger.error('❌ AuthService: Logout error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<{ success: boolean; message?: string }> {
    try {
      logger.debug('🔍 AuthService: Refreshing token');
      
      const response = await apiClient.post('/api/auth/refresh', undefined, {
        timeout: 5000
      });

      if (response.ok) {
        logger.info('✅ AuthService: Token refresh successful');
        return { success: true };
      } else {
        logger.warn('⚠️ AuthService: Token refresh failed with status:', response.status);
        return { 
          success: false, 
          message: response.data?.message || 'Token refresh failed' 
        };
      }
    } catch (error) {
      logger.error('❌ AuthService: Token refresh error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
    try {
      logger.debug('🔍 AuthService: Getting user profile');
      
      const response = await apiClient.get('/api/profiles/me', {
        timeout: 5000
      });

      if (response.ok && response.data) {
        const { success, user } = response.data;
        
        if (success && user) {
          logger.info('✅ AuthService: User profile retrieved:', user);
          return { success: true, user };
        } else {
          logger.warn('⚠️ AuthService: User profile retrieval failed');
          return { success: false, message: 'Failed to retrieve user profile' };
        }
      } else {
        logger.warn('⚠️ AuthService: User profile retrieval failed with status:', response.status);
        return { 
          success: false, 
          message: response.data?.message || 'Profile retrieval failed' 
        };
      }
    } catch (error) {
      logger.error('❌ AuthService: User profile retrieval error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;


