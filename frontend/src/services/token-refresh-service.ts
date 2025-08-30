// Background Token Refresh Service
// Handles automatic token refresh to prevent authentication failures

import logger from '../utils/logger';
import { config as configService } from './configService';
import { apiClient } from '../utils/api-client';

export interface TokenRefreshOptions {
  refreshInterval?: number; // How often to check for token refresh (default: 5 minutes)
  refreshThreshold?: number; // How many milliseconds before expiry to refresh (default: 10 minutes)
  maxRetries?: number; // Maximum retry attempts for failed refresh
  retryDelay?: number; // Delay between retry attempts in milliseconds
}

export interface TokenInfo {
  token: string;
  expiresAt: number; // Unix timestamp (ms)
  refreshToken?: string;
}

class TokenRefreshService {
  private refreshInterval: number;
  private refreshThreshold: number;
  private maxRetries: number;
  private retryDelay: number;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private isRefreshing: boolean = false;
  private retryCount: number = 0;
  private onTokenRefresh?: (success: boolean) => void;
  private onTokenExpired?: () => void;

  constructor(options: TokenRefreshOptions = {}) {
    this.refreshInterval = options.refreshInterval ?? 5 * 60 * 1000; // 5 minutes
    this.refreshThreshold = options.refreshThreshold ?? 10 * 60 * 1000; // 10 minutes
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 1000; // 1 second
  }

  // Start the background refresh service
  start(onTokenRefresh?: (success: boolean) => void, onTokenExpired?: () => void): void {
    logger.debug('🔄 TokenRefreshService: Starting background token refresh service');

    this.onTokenRefresh = onTokenRefresh;
    this.onTokenExpired = onTokenExpired;

    // Start the refresh timer
    this.scheduleNextRefresh();
  }

  // Stop the background refresh service
  stop(): void {
    logger.debug('🔄 TokenRefreshService: Stopping background token refresh service');

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.isRefreshing = false;
    this.retryCount = 0;
  }

  // Manually trigger a token refresh
  async refreshToken(): Promise<boolean> {
    if (this.isRefreshing) {
      logger.debug('🔄 TokenRefreshService: Token refresh already in progress');
      return false;
    }

    logger.debug('🔄 TokenRefreshService: Starting manual token refresh');
    return this.performTokenRefresh();
  }

  // Schedule the next refresh check
  private scheduleNextRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = setTimeout(() => {
      void this.checkAndRefreshToken();
    }, this.refreshInterval);
  }

  // Check if token needs refresh and perform refresh if needed
  private async checkAndRefreshToken(): Promise<void> {
    try {
      logger.debug('🔄 TokenRefreshService: Checking token status...');

      // Get current token info
      const tokenInfo = await this.getCurrentTokenInfo();

      if (!tokenInfo) {
        logger.debug('🔄 TokenRefreshService: No token found, scheduling next check');
        this.scheduleNextRefresh();
        return;
      }

      const now = Date.now();
      const timeUntilExpiry = tokenInfo.expiresAt - now;

      logger.debug('🔄 TokenRefreshService: Token status:', {
        expiresAt: new Date(tokenInfo.expiresAt).toISOString(),
        timeUntilExpiryMs: timeUntilExpiry,
        shouldRefresh: timeUntilExpiry <= this.refreshThreshold,
      });

      // Check if token needs refresh
      if (timeUntilExpiry <= this.refreshThreshold) {
        logger.debug('🔄 TokenRefreshService: Token needs refresh, performing refresh...');
        await this.performTokenRefresh();
      } else {
        logger.debug('🔄 TokenRefreshService: Token is still valid, scheduling next check');
        this.scheduleNextRefresh();
      }
    } catch (error) {
      logger.error('❌ TokenRefreshService: Error checking token status:', error);
      this.scheduleNextRefresh();
    }
  }

  // Perform the actual token refresh
  private async performTokenRefresh(): Promise<boolean> {
    if (this.isRefreshing) {
      return false;
    }

    this.isRefreshing = true;
    this.retryCount = 0;

    try {
      logger.debug('🔄 TokenRefreshService: Performing token refresh...');

      const response = await apiClient.post('/api/auth/refresh', null, {
        credentials: 'include',
        timeout: 10000
      });

      if (response.ok) {
        const result = response.data;

        if (result.success) {
          logger.debug('✅ TokenRefreshService: Token refresh successful');
          this.retryCount = 0;
          this.onTokenRefresh?.(true);
          this.scheduleNextRefresh();
          return true;
        } else {
          throw new Error(result.error || 'Token refresh failed');
        }
      } else {
        const errorData = response.data?.error || response.data?.message || 'Request failed';
        throw new Error(errorData || `HTTP ${response.status}: Request failed`);
      }
    } catch (error) {
      logger.error('❌ TokenRefreshService: Token refresh failed:', error);

      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        logger.debug(`🔄 TokenRefreshService: Retrying token refresh (${this.retryCount}/${this.maxRetries})...`);

        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);

        setTimeout(() => {
          this.isRefreshing = false;
          void this.performTokenRefresh();
        }, delay);

        return false;
      } else {
        logger.error('❌ TokenRefreshService: Max retries reached, token refresh failed');
        this.onTokenRefresh?.(false);
        this.onTokenExpired?.();
        this.scheduleNextRefresh();
        return false;
      }
    } finally {
      this.isRefreshing = false;
    }
  }

  // Get current token information
  private async getCurrentTokenInfo(): Promise<TokenInfo | null> {
    try {
      const response = await apiClient.get('/api/auth/token', {
        credentials: 'include',
        timeout: 5000
      });

      if (!response.ok) {
        return null;
      }

      const data = response.data;

      if (data.success && data.token) {
        // Decode JWT to get expiration time
        const tokenPayload = this.decodeJWT(data.token);

        if (tokenPayload && tokenPayload.exp) {
          return {
            token: data.token,
            expiresAt: tokenPayload.exp * 1000, // Convert to milliseconds
            refreshToken: data.refreshToken,
          };
        }
      }

      return null;
    } catch (error) {
      logger.error('❌ TokenRefreshService: Error getting token info:', error);
      return null;
    }
  }

  // Decode JWT token (without verification)
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      logger.error('❌ TokenRefreshService: Error decoding JWT:', error);
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(tokenInfo: TokenInfo): boolean {
    return Date.now() >= tokenInfo.expiresAt;
  }

  // Get time until token expires
  getTimeUntilExpiry(tokenInfo: TokenInfo): number {
    return Math.max(0, tokenInfo.expiresAt - Date.now());
  }

  // Check if token needs refresh
  needsRefresh(tokenInfo: TokenInfo): boolean {
    return this.getTimeUntilExpiry(tokenInfo) <= this.refreshThreshold;
  }
}

// Create a singleton instance
const tokenRefreshService = new TokenRefreshService();

export default tokenRefreshService;