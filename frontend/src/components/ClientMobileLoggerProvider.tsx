'use client';

import React, { useEffect, useState } from 'react';

/**
 * ClientMobileLoggerProvider - Safe client-side logger provider with error handling
 * This prevents SSR issues and gracefully handles dynamic import failures
 */
export default function ClientMobileLoggerProvider({ children }: { children: React.ReactNode }) {
  const [LoggerProvider, setLoggerProvider] = useState<React.ComponentType<{children: React.ReactNode}> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Ensure we're definitely on the client side before doing anything
    if (typeof window === 'undefined') return;
    
    let mounted = true;
    
    // Load the logger provider
    const loadLoggerProvider = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        // Wait for next tick to ensure DOM is fully loaded
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Dynamically import the MobileLoggerProvider only on client side
        const module = await import('./MobileLoggerProvider');
        
        // Check if the module loaded properly
        if (!module || !module.default) {
          throw new Error('MobileLoggerProvider module failed to load properly');
        }
        
        if (mounted) {
          // Set the component so we can render it
          setLoggerProvider(() => module.default);
          console.log('Mobile logger provider loaded successfully on client');
        }
      } catch (error) {
        console.error('Failed to load mobile logger:', error);
        if (mounted) {
          setHasError(true);
          // In case of error, we'll just render children without logging
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadLoggerProvider();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  // Show loading state briefly
  if (isLoading) {
    return <>{children}</>;
  }
  
  // If there was an error loading the logger, just render children
  if (hasError) {
    console.warn('Mobile logger failed to load, continuing without logging');
    return <>{children}</>;
  }
  
  // Render the MobileLoggerProvider if it's loaded, otherwise just render children
  if (LoggerProvider) {
    return <LoggerProvider>{children}</LoggerProvider>;
  }
  
  // Fallback: Return children directly
  return <>{children}</>;
}