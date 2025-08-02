'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePageTransition } from '../components/PageTransitionProvider';

export function useOptimizedNavigation() {
  const router = useRouter();
  const { setTransitioning } = usePageTransition();
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function to clear any pending navigation timeouts
  const cleanupNavigation = useCallback(() => {
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
  }, []);

  // Optimized navigation function
  const navigateTo = useCallback((href: string, options?: { 
    immediate?: boolean;
    delay?: number;
  }) => {
    const { immediate = false, delay = 0 } = options || {};
    
    // Clean up any existing navigation
    cleanupNavigation();
    
    // Start transition immediately or after delay
    if (immediate) {
      setTransitioning(true);
      router.push(href);
    } else {
      navigationTimeoutRef.current = setTimeout(() => {
        setTransitioning(true);
        router.push(href);
      }, delay);
    }
  }, [router, setTransitioning, cleanupNavigation]);

  // Preload function for better performance
  const preloadRoute = useCallback((href: string) => {
    // Prefetch the route for faster navigation
    router.prefetch(href);
  }, [router]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanupNavigation;
  }, [cleanupNavigation]);

  return {
    navigateTo,
    preloadRoute,
    cleanupNavigation,
  };
} 