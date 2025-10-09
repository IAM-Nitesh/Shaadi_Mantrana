'use client';

// IMPORTANT: This module should ONLY be imported on the client side
// It is dynamically imported by ClientMobileLoggerProvider.tsx

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

// Dynamic import of mobile-logger to prevent SSR issues
// This ensures that mobile-logger.ts is ONLY loaded on the client side
let mobileLogger: any = { 
  init: () => Promise.resolve(),
  logScreenView: () => {},
  setUserUuid: () => {},
  logAppEvent: () => {},
  flushAllLogs: () => Promise.resolve()
};

/**
 * MobileLoggerProvider component that automatically tracks navigation and user authentication
 * This should be added to app layout to ensure all mobile interactions are logged
 */
export function MobileLoggerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // First, safely load the mobile logger module
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let mounted = true;
    
    // Dynamic import of the actual logger to prevent SSR issues
    const loadLogger = async () => {
      try {
        const loggerModule = await import('../utils/mobile-logger');
        if (mounted && loggerModule && loggerModule.default) {
          mobileLogger = loggerModule.default;
          console.log('Mobile logger module loaded successfully');
        }
      } catch (e) {
        console.error('Error loading mobile logger module:', e);
        // Keep the stub logger if import fails
      }
    };
    
    loadLogger();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  // Initialize logger on mount after module is loaded
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    // Initialize the logger
    const initLogger = async () => {
      try {
        if (mobileLogger && typeof mobileLogger.init === 'function') {
          await mobileLogger.init();
          console.log('Mobile logger initialized successfully');
        }
      } catch (e) {
        console.error('Error initializing mobile logger:', e);
      }
    };
    
    // Call init with a small delay to ensure the module is loaded
    const timer = setTimeout(initLogger, 200);
    
    // Safe check for Capacitor
    // Check if running in Capacitor (mobile app)
    const isMobileApp = typeof window !== 'undefined' && 
      window?.Capacitor && 
      typeof window.Capacitor?.isNativePlatform === 'function' && 
      window.Capacitor.isNativePlatform();
    
    if (isMobileApp) {
      // Log app startup
      if (mobileLogger && typeof mobileLogger.logAppEvent === 'function') {
        mobileLogger.logAppEvent('initialize', { 
          pathname,
          version: typeof window.Capacitor?.getPlatform === 'function' ? 
            window.Capacitor.getPlatform() : 'unknown'
        });
      }
      
      // Set up app lifecycle event listeners
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          if (mobileLogger && typeof mobileLogger.logAppEvent === 'function') {
            mobileLogger.logAppEvent('background');
          }
          if (mobileLogger && typeof mobileLogger.flushAllLogs === 'function') {
            mobileLogger.flushAllLogs().catch(console.error);
          }
        } else if (document.visibilityState === 'visible') {
          if (mobileLogger && typeof mobileLogger.logAppEvent === 'function') {
            mobileLogger.logAppEvent('foreground');
          }
        }
      };
      
      const handleBeforeUnload = () => {
        if (mobileLogger && typeof mobileLogger.logAppEvent === 'function') {
          mobileLogger.logAppEvent('close');
        }
        if (mobileLogger && typeof mobileLogger.flushAllLogs === 'function') {
          mobileLogger.flushAllLogs().catch(console.error);
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // Clean up listeners
      return () => {
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [pathname]);
  
  // Track route changes
  useEffect(() => {
    // Check if running in browser
    if (typeof window === 'undefined') return;
    
    // Check if running in Capacitor (mobile app) with safer checks
    const isMobileApp = typeof window !== 'undefined' && 
      window.Capacitor && 
      typeof window.Capacitor.isNativePlatform === 'function' && 
      window.Capacitor.isNativePlatform();
    
    if (isMobileApp && pathname && mobileLogger && typeof mobileLogger.logScreenView === 'function') {
      mobileLogger.logScreenView(pathname);
    }
  }, [pathname]);
  
  // Track user authentication
  useEffect(() => {
    // Check if running in browser
    if (typeof window === 'undefined') return;
    
    // Check if running in Capacitor (mobile app) with safer checks
    const isMobileApp = typeof window !== 'undefined' && 
      window.Capacitor && 
      typeof window.Capacitor.isNativePlatform === 'function' && 
      window.Capacitor.isNativePlatform();
    
    if (isMobileApp && user?.userUuid && mobileLogger && typeof mobileLogger.setUserUuid === 'function') {
      mobileLogger.setUserUuid(user.userUuid);
    }
  }, [user]);
  
  // This is a context provider that doesn't render anything itself
  return <>{children}</>;
}

export default MobileLoggerProvider;