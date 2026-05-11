'use client';

import { useEffect, useState } from 'react';

/**
 * Safe wrapper for MobileLoggerProvider that prevents SSR issues
 * This component simply passes children through during SSR and initial render
 * Only after client-side hydration is complete does it attempt to load the real provider
 */
export function SafeMobileLoggerProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [MobileLoggerComponent, setMobileLoggerComponent] = useState<any>(null);

  // First effect: Only set mounted state once client-side hydration is complete
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Second effect: Only try to load the component after mounting
  useEffect(() => {
    if (isMounted) {
      const loadComponent = async () => {
        try {
          // Dynamically import component only on client
          const mobileLoggerModule = await import('../components/MobileLoggerProvider');
          setMobileLoggerComponent(() => mobileLoggerModule.default);
        } catch (err) {
          console.error('Failed to load MobileLoggerProvider:', err);
        }
      };
      
      loadComponent();
    }
  }, [isMounted]);

  // Always render children, but wrap them in provider only when fully loaded on client
  if (!isMounted || !MobileLoggerComponent) {
    return <>{children}</>;
  }

  // Render with the actual component only on client side after successful loading
  return <MobileLoggerComponent>{children}</MobileLoggerComponent>;
}

export default SafeMobileLoggerProvider;
