// This file replaces the original token-refresh-service.ts with proper subscription handling
// Copy all original content here and modify only the tokenServiceEvents

import logger from '../utils/logger';
import { config as configService } from './configService';
import { apiClient } from '../utils/api-client';
import authStorage from './auth-storage-service';

export interface TokenRefreshOptions {
  refreshInterval?: number; // How often to check for token refresh (default: 2 minutes)
  refreshThreshold?: number; // How many milliseconds before expiry to refresh (default: 5 minutes)
  maxRetries?: number; // Maximum retry attempts for failed refresh
  retryDelay?: number; // Delay between retry attempts in milliseconds
  healthCheckInterval?: number; // How often to check service health (default: 5 minutes)
  gracePeriodBeforeLogout?: number; // Grace period before forcing logout (default: 1 minute)
}

export interface TokenInfo {
  token: string;
  expiresAt: number; // Unix timestamp (ms)
  refreshToken?: string;
  lastRefreshed?: number; // When the token was last refreshed
}

// Service health status
export enum ServiceStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  OFFLINE = 'offline'
}

class TokenRefreshService {
  private refreshInterval: number;
  private refreshThreshold: number;
  private refreshTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private graceTimerId: NodeJS.Timeout | null = null;
  private healthCheckInterval: number;
  private serviceStatus: ServiceStatus = ServiceStatus.OFFLINE;
  private consecutiveFailures = 0;
  private maxRetries: number;
  private retryDelay: number;
  private gracePeriodBeforeLogout: number;
  private lastSuccessfulRefresh: number | null = null;
  private tokenRefreshInProgress = false;
  private refreshPromise: Promise<boolean> | null = null;
  private onTokenRefresh?: (success: boolean) => void;
  private onTokenExpired?: () => void;
  private onServiceStatusChange?: (status: ServiceStatus) => void;

  constructor() {
    // Default settings - can be overridden with options
    this.refreshInterval = configService.TOKEN_REFRESH_INTERVAL ?? 2 * 60 * 1000; // 2 minutes
    this.refreshThreshold = configService.TOKEN_REFRESH_THRESHOLD ?? 5 * 60 * 1000; // 5 minutes
    this.healthCheckInterval = configService.TOKEN_HEALTH_CHECK_INTERVAL ?? 5 * 60 * 1000; // 5 minutes
    this.maxRetries = configService.TOKEN_MAX_RETRIES ?? 3;
    this.retryDelay = configService.TOKEN_RETRY_DELAY ?? 5000; // 5 seconds
    this.gracePeriodBeforeLogout = configService.TOKEN_GRACE_PERIOD ?? 60 * 1000; // 1 minute
  }

  // Start the background refresh service
  start(onTokenRefresh?: (success: boolean) => void, onTokenExpired?: () => void, onServiceStatusChange?: (status: ServiceStatus) => void): void {
    logger.debug('🔄 TokenRefreshService: Starting background token refresh service');

    this.onTokenRefresh = onTokenRefresh;
    this.onTokenExpired = onTokenExpired;
    this.onServiceStatusChange = onServiceStatusChange;
    
    // Reset state
    this.consecutiveFailures = 0;
    
    // Stop any existing timers
    this.stop();
    
    // Start the refresh cycle
    this.startRefreshCycle();
    
    // Start health check
    this.startHealthCheck();
    
    logger.info('✅ TokenRefreshService: Background token refresh service started');
  }
  
  // Stop the background refresh service
  stop(): void {
    logger.debug('🔄 TokenRefreshService: Stopping background token refresh service');
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    if (this.healthCheckTimer) {
      clearTimeout(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    if (this.graceTimerId) {
      clearTimeout(this.graceTimerId);
      this.graceTimerId = null;
    }
    
    // Notify about service status change
    this.onServiceStatusChange?.(ServiceStatus.OFFLINE);
  }
  
  // Start the health check timer
  private startHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearTimeout(this.healthCheckTimer);
    }
    
    this.healthCheckTimer = setTimeout(() => {
      void this.checkServiceHealth();
      this.startHealthCheck(); // Schedule next health check
    }, this.healthCheckInterval);
  }
  
  // Check service health
  private async checkServiceHealth(): Promise<void> {
    try {
      // Check if token info can be retrieved
      const tokenInfo = await this.getCurrentTokenInfo();
      
      if (tokenInfo) {
        // Service is available, reset failure counter
        if (this.consecutiveFailures > 0) {
          this.consecutiveFailures = 0;
          this.updateServiceStatus(ServiceStatus.HEALTHY);
        }
      } else {
        // Couldn't get token info, might be degraded
        this.consecutiveFailures++;
        
        if (this.consecutiveFailures >= 3) {
          this.updateServiceStatus(ServiceStatus.DEGRADED);
        }
        
        if (this.consecutiveFailures >= 5) {
          this.updateServiceStatus(ServiceStatus.UNHEALTHY);
        }
      }
    } catch (error) {
      // Service might be unavailable
      this.consecutiveFailures++;
      
      if (this.consecutiveFailures >= 3) {
        this.updateServiceStatus(ServiceStatus.DEGRADED);
      }
      
      if (this.consecutiveFailures >= 5) {
        this.updateServiceStatus(ServiceStatus.UNHEALTHY);
      }
    }
  }
  
  // Update service status and notify listeners
  private updateServiceStatus(newStatus: ServiceStatus): void {
    if (this.serviceStatus !== newStatus) {
      this.serviceStatus = newStatus;
      this.onServiceStatusChange?.(newStatus);
      logger.debug(`🔄 TokenRefreshService: Status changed to ${newStatus}`);
    }
  }

  // Manually trigger a token refresh
  async refreshToken(force = false): Promise<boolean> {
    // Return existing promise if refresh is already in progress
    if (this.refreshPromise) {
      logger.debug('⏳ TokenRefreshService: Token refresh already in progress, returning existing promise');
      return this.refreshPromise;
    }
    
    // Create new refresh promise
    this.refreshPromise = this.performRefresh(force);
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  // Internal method to perform the actual refresh
  private async performRefresh(force = false): Promise<boolean> {
    try {
      this.tokenRefreshInProgress = true;
      logger.debug('🔄 TokenRefreshService: Manually refreshing token');
      
      const currentTokenInfo = await this.getCurrentTokenInfo();
      
      // Check if refresh is needed
      if (!force && currentTokenInfo && currentTokenInfo.expiresAt) {
        const timeRemaining = currentTokenInfo.expiresAt - Date.now();
        
        if (timeRemaining > this.refreshThreshold) {
          logger.debug(`✅ TokenRefreshService: Token still valid for ${Math.round(timeRemaining / 1000)}s, skipping refresh`);
          this.tokenRefreshInProgress = false;
          return true;
        }
      }
      
      // Perform token refresh with retry logic
      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            logger.debug(`🔄 TokenRefreshService: Retry attempt ${attempt}/${this.maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          }
          
          const response = await apiClient.get('/api/auth/token', {
            credentials: 'include',
            timeout: 10000
          });
          
          if (response.ok && response.data.success) {
            logger.info('✅ TokenRefreshService: Token refresh successful');
            
            // Update last successful refresh time
            this.lastSuccessfulRefresh = Date.now();
            
            // Trigger callback if registered
            this.onTokenRefresh?.(true);
            
            // Reset failure counter on success
            if (this.consecutiveFailures > 0) {
              this.consecutiveFailures = 0;
              this.updateServiceStatus(ServiceStatus.HEALTHY);
            }
            
            this.tokenRefreshInProgress = false;
            return true;
          }
          
          logger.error('❌ TokenRefreshService: Token refresh failed', response.status, response.data?.message || 'Unknown error');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('❌ TokenRefreshService: Token refresh error:', errorMessage);
          
          // Last attempt failed, increment failure counter
          if (attempt === this.maxRetries) {
            this.consecutiveFailures++;
            this.updateServiceStatus(ServiceStatus.DEGRADED);
          }
        }
      }
      
      // All attempts failed
      this.onTokenRefresh?.(false);
      this.tokenRefreshInProgress = false;
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ TokenRefreshService: Unexpected error during token refresh:', errorMessage);
      this.tokenRefreshInProgress = false;
      return false;
    } finally {
      this.tokenRefreshInProgress = false;
    }
  }
  
  // Start the refresh cycle
  private startRefreshCycle(): void {
    // Cancel any existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    // Schedule next refresh
    void this.scheduleNextRefresh();
  }
  
  // Schedule the next token refresh
  private async scheduleNextRefresh(): Promise<void> {
    try {
      // Get current token info
      const tokenInfo = await this.getCurrentTokenInfo();
      
      if (!tokenInfo || !tokenInfo.expiresAt) {
        logger.debug('⚠️ TokenRefreshService: No valid token found, attempting to refresh now');
        const refreshed = await this.refreshToken(true);
        
        if (!refreshed) {
          logger.error('❌ TokenRefreshService: Failed to get initial token');
          
          // Try again after retry delay
          this.refreshTimer = setTimeout(() => {
            void this.scheduleNextRefresh();
          }, this.retryDelay);
          
          return;
        }
        
        // Successfully refreshed, reschedule
        this.refreshTimer = setTimeout(() => {
          void this.scheduleNextRefresh();
        }, this.refreshInterval);
        
        return;
      }
      
      // Calculate when to refresh
      const now = Date.now();
      const timeToExpiry = tokenInfo.expiresAt - now;
      
      // Token is expired or close to expiry
      if (timeToExpiry <= this.refreshThreshold) {
        logger.debug(`🔄 TokenRefreshService: Token expires in ${Math.round(timeToExpiry / 1000)}s, refreshing now`);
        
        const refreshed = await this.refreshToken(true);
        
        if (!refreshed && timeToExpiry <= 0) {
          // Token is expired and refresh failed
          logger.error('❌ TokenRefreshService: Token expired and refresh failed');
          
          // Give a short grace period before triggering expiry
          // Clear any existing grace timer
          if (this.graceTimerId) {
            clearTimeout(this.graceTimerId);
          }
          this.graceTimerId = setTimeout(() => {
            // Final check - maybe another tab refreshed the token
            void this.getCurrentTokenInfo().then(latestToken => {
              if (!latestToken || !latestToken.expiresAt || latestToken.expiresAt <= Date.now()) {
                // Still expired, trigger expiry callback
                logger.error('❌ TokenRefreshService: Token expired, triggering logout');
                this.onTokenExpired?.();
              } else {
                // Token was refreshed elsewhere, continue cycle
                void this.scheduleNextRefresh();
              }
            }).finally(() => {
              // Clear the grace timer ID after completion
              this.graceTimerId = null;
            });
          }, this.gracePeriodBeforeLogout);
          
          return;
        }
        
        // Schedule next refresh
        this.refreshTimer = setTimeout(() => {
          void this.scheduleNextRefresh();
        }, this.refreshInterval);
        
        return;
      }
      
      // Token is still valid, schedule refresh before it expires
      const nextRefreshIn = Math.max(timeToExpiry - this.refreshThreshold, 0);
      logger.debug(`🔄 TokenRefreshService: Next token refresh in ${Math.round(nextRefreshIn / 1000)}s`);
      
      this.refreshTimer = setTimeout(() => {
        void this.scheduleNextRefresh();
      }, Math.min(nextRefreshIn, this.refreshInterval));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ TokenRefreshService: Error scheduling next refresh:', errorMessage);
      
      // Schedule retry
      this.refreshTimer = setTimeout(() => {
        void this.scheduleNextRefresh();
      }, this.retryDelay);
    }
  }
  
  // Get current token info from storage with faster timeout
  private async getCurrentTokenInfo(): Promise<TokenInfo | null> {
    try {
      const tokenInfo = authStorage.get('tokenInfo');
      
      if (tokenInfo && typeof tokenInfo === 'object' && tokenInfo.token) {
        return tokenInfo as TokenInfo;
      }
      
      // Try backup
      const backupTokenInfo = authStorage.get('tokenBackup');
      if (backupTokenInfo && typeof backupTokenInfo === 'object' && backupTokenInfo.token) {
        return backupTokenInfo as TokenInfo;
      }
      
      return null;
    } catch (error) {
      logger.error('❌ TokenRefreshService: Error getting token info:', error);
      return null;
    }
  }
  
  // Get service status
  getServiceStatus(): ServiceStatus {
    return this.serviceStatus;
  }
  
  // Get last successful refresh time
  getLastSuccessfulRefresh(): number | null {
    return this.lastSuccessfulRefresh;
  }
}

// Create a singleton instance
const tokenRefreshService = new TokenRefreshService();

// Status listeners registry - separate from the service's internal callback
const statusListeners: Set<(status: ServiceStatus) => void> = new Set();

// Create an event emitter for service status updates
export const tokenServiceEvents = {
  onStatusChange: (callback: (status: ServiceStatus) => void) => {
    // Add callback to listeners
    statusListeners.add(callback);
    
    // Immediately notify with current status
    const currentStatus = tokenRefreshService.getServiceStatus();
    if (currentStatus) {
      setTimeout(() => callback(currentStatus), 0);
    }
    
    // Return unsubscribe function that removes only this listener
    return () => {
      statusListeners.delete(callback);
    };
  },
  getStatus: () => tokenRefreshService.getServiceStatus(),
};

// Override the start method to handle our subscription mechanism properly
const originalStart = tokenRefreshService.start.bind(tokenRefreshService);
tokenRefreshService.start = function(
  onTokenRefresh?: (success: boolean) => void,
  onTokenExpired?: () => void,
  onServiceStatusChange?: (status: ServiceStatus) => void
): void {
  // Create a wrapper that notifies all of our listeners too
  const statusChangeWrapper = (status: ServiceStatus) => {
    // Call the original callback if provided
    if (onServiceStatusChange) {
      try {
        onServiceStatusChange(status);
      } catch (error) {
        console.error('Error in original status change handler:', error);
      }
    }
    
    // Notify all our listeners
    statusListeners.forEach(listener => {
      try {
        if (listener !== onServiceStatusChange) { // avoid calling twice
          listener(status);
        }
      } catch (error) {
        console.error('Error in status listener:', error);
      }
    });
  };
      
  // Call original start with our wrapper
  originalStart(onTokenRefresh, onTokenExpired, statusChangeWrapper);
};

export default tokenRefreshService;