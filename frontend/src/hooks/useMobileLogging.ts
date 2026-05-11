'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import mobileLogger from '../utils/mobile-logger';

/**
 * Hook to track user interactions in the mobile app and log them to Grafana Loki
 * This hook will automatically track screen views, auth status changes, and app lifecycle events
 * It also provides methods to log custom interactions
 */
export const useMobileLogging = (screenName?: string) => {
  const { user, isAuthenticated } = useAuth();
  const prevAuth = useRef(false);
  const prevScreen = useRef<string | undefined>(undefined);
  const userUuidRef = useRef<string | undefined>(undefined);
  
  // Update logger with user info when authentication status changes
  useEffect(() => {
    if (user?.userUuid && userUuidRef.current !== user.userUuid) {
      userUuidRef.current = user.userUuid;
      mobileLogger.setUserUuid(user.userUuid);
    }
    
    // Log auth status changes
    if (prevAuth.current !== isAuthenticated) {
      if (isAuthenticated) {
        mobileLogger.info('User authenticated', { 
          event: 'mobile_user_authenticated',
          user_uuid: user?.userUuid
        });
      } else if (prevAuth.current) {
        mobileLogger.info('User logged out', { 
          event: 'mobile_user_logged_out'
        });
      }
      prevAuth.current = isAuthenticated;
    }
  }, [isAuthenticated, user]);
  
  // Log screen views
  useEffect(() => {
    if (screenName && prevScreen.current !== screenName) {
      mobileLogger.logScreenView(screenName);
      prevScreen.current = screenName;
    }
  }, [screenName]);
  
  // Set up app lifecycle event listeners
  useEffect(() => {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        mobileLogger.logAppEvent('background');
        mobileLogger.flushAllLogs();
      } else if (document.visibilityState === 'visible') {
        mobileLogger.logAppEvent('foreground');
      }
    };
    
    const handleAppClose = () => {
      mobileLogger.logAppEvent('close');
      mobileLogger.flushAllLogs();
    };
    
    // Listen for visibility changes (app going to background)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for beforeunload event (app closing)
    window.addEventListener('beforeunload', handleAppClose);
    
    // Log app start event
    mobileLogger.logAppEvent('start');
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleAppClose);
    };
  }, []);
  
  // Return logging functions for components to use
  return {
    // Log a user interaction (button click, form submit, etc.)
    logInteraction: (action: string, data: Record<string, any> = {}) => {
      mobileLogger.logUserInteraction(action, data);
    },
    
    // Log an error that occurred
    logError: (message: string, error: Error | any, context: Record<string, any> = {}) => {
      mobileLogger.error(message, { error, ...context });
    },
    
    // Force flush all pending logs to server immediately
    flushLogs: () => mobileLogger.flushAllLogs()
  };
};

export default useMobileLogging;