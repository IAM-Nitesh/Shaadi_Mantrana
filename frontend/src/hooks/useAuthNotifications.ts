// Authentication Notifications Hook
// Connect token refresh service and auth state to user notifications
'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import notificationService from '../services/notification-service';
import { tokenServiceEvents, ServiceStatus } from '../services/token-refresh-service';
import logger from '../utils/logger';

// Timeframes for notifications (ms)
const EXPIRY_WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
const SERVICE_STATE_CHECK_INTERVAL = 30 * 1000; // Check service state every 30s

export const useAuthNotifications = () => {
  const { 
    isAuthenticated, 
    user, 
    authState, 
    isExpired,
    checkAuth,
    forceRefresh 
  } = useAuth();
  
  // Track current notification IDs for management
  const expiryNotificationId = useRef<string | null>(null);
  const serviceNotificationId = useRef<string | null>(null);
  const lastServiceStatus = useRef<ServiceStatus | null>(null);
  
  // Check token expiry for warning notifications
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Clear any existing notifications if user is no longer authenticated
      if (expiryNotificationId.current) {
        notificationService.dismiss(expiryNotificationId.current);
        expiryNotificationId.current = null;
      }
      return;
    }
    
    // Function to check token status and show warnings if needed
    const checkTokenStatus = async () => {
      try {
        // Get token info from the token service API
        const response = await fetch('/api/auth/token', {
          credentials: 'include',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          logger.warn('⚠️ useAuthNotifications: Failed to get token info');
          return;
        }
        
        const data = await response.json();
        
        if (data.success && data.token) {
          // Decode JWT to get expiration time
          const tokenPayload = decodeJWT(data.token);
          
          if (tokenPayload && tokenPayload.exp) {
            const expiryTimeMs = (tokenPayload.exp * 1000) - Date.now();
            
            // If token is expiring soon and we don't have a notification yet
            if (expiryTimeMs <= EXPIRY_WARNING_THRESHOLD && !expiryNotificationId.current) {
              logger.debug(`🔔 useAuthNotifications: Token expires in ${Math.round(expiryTimeMs/1000)}s, showing warning`);
              
              // Show warning notification
              expiryNotificationId.current = notificationService.showSessionExpiringSoon(
                expiryTimeMs,
                // Refresh callback
                () => {
                  logger.debug('🔔 useAuthNotifications: User clicked refresh from notification');
                  forceRefresh().catch(err => {
                    logger.error('❌ useAuthNotifications: Force refresh failed:', err);
                  });
                }
              );
            }
            // If token is not expiring soon but we have a notification, dismiss it
            else if (expiryTimeMs > EXPIRY_WARNING_THRESHOLD && expiryNotificationId.current) {
              notificationService.dismiss(expiryNotificationId.current);
              expiryNotificationId.current = null;
            }
          }
        }
      } catch (error) {
        logger.error('❌ useAuthNotifications: Error checking token status:', error);
      }
    };
    
    // Check immediately
    checkTokenStatus();
    
    // Check periodically
    const intervalId = setInterval(checkTokenStatus, EXPIRY_WARNING_THRESHOLD / 2);
    
    return () => {
      clearInterval(intervalId);
      if (expiryNotificationId.current) {
        notificationService.dismiss(expiryNotificationId.current);
        expiryNotificationId.current = null;
      }
    };
  }, [isAuthenticated, user, forceRefresh]);
  
  // Show notification when session expires
  useEffect(() => {
    if (isExpired) {
      logger.debug('🔔 useAuthNotifications: Session expired, showing notification');
      notificationService.showSessionExpired();
    }
  }, [isExpired]);
  
  // Monitor token service health
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    
    const checkServiceStatus = () => {
      const currentStatus = tokenServiceEvents.getStatus();
      
      // Only show notification if status changed
      if (lastServiceStatus.current !== currentStatus) {
        // Handle degraded or unhealthy status
        if (currentStatus === ServiceStatus.DEGRADED || 
            currentStatus === ServiceStatus.UNHEALTHY) {
          
          if (!serviceNotificationId.current) {
            logger.debug(`🔔 useAuthNotifications: Token service is ${currentStatus}`);
            serviceNotificationId.current = notificationService.showAuthServiceIssue();
          }
        }
        // Handle recovery
        else if ((lastServiceStatus.current === ServiceStatus.DEGRADED || 
                 lastServiceStatus.current === ServiceStatus.UNHEALTHY) &&
                 currentStatus === ServiceStatus.HEALTHY) {
          
          if (serviceNotificationId.current) {
            notificationService.dismiss(serviceNotificationId.current);
            serviceNotificationId.current = null;
          }
          
          notificationService.showAuthRecovered();
        }
        
        lastServiceStatus.current = currentStatus;
      }
    };
    
    // Set up listener for notification dismissals
    const handleNotificationDismiss = (id?: string) => {
      // If this is our service notification and it was dismissed
      if (id && id === serviceNotificationId.current) {
        serviceNotificationId.current = null;
        logger.debug('🔔 useAuthNotifications: Service notification dismissed');
      }
      // If this is our expiry notification and it was dismissed
      else if (id && id === expiryNotificationId.current) {
        expiryNotificationId.current = null;
        logger.debug('🔔 useAuthNotifications: Expiry notification dismissed');
      }
    };
    
    // Check service status periodically
    const intervalId = setInterval(checkServiceStatus, SERVICE_STATE_CHECK_INTERVAL);
    
    // Subscribe to service status changes
    const unsubscribe = tokenServiceEvents.onStatusChange((status) => {
      logger.debug(`🔔 useAuthNotifications: Token service status changed to ${status}`);
      checkServiceStatus();
    });
    
    // Subscribe to notification dismissals
    const unsubscribeNotifications = notificationService.subscribe(
      () => {}, // we don't need to do anything when new notifications are shown
      handleNotificationDismiss // but we do need to handle dismissals
    );
    
    return () => {
      clearInterval(intervalId);
      unsubscribe();
      unsubscribeNotifications();
      
      if (serviceNotificationId.current) {
        notificationService.dismiss(serviceNotificationId.current);
        serviceNotificationId.current = null;
      }
    };
  }, [isAuthenticated]);
  
  // Helper function to decode JWT
  const decodeJWT = (token: string): any => {
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
      logger.error('❌ useAuthNotifications: Error decoding JWT:', error);
      return null;
    }
  };
};

export default useAuthNotifications;