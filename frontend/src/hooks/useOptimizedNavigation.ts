'use client';

import { useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePageTransition } from '../components/PageTransitionProvider';

// Performance optimization: Cache for preloaded routes
const preloadedRoutes = new Set<string>();

export function useOptimizedNavigation() {
  const router = useRouter();
  const { setTransitioning } = usePageTransition();
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function to clear any pending navigation timeouts
  const cleanupNavigation = useCallback(() => {
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
      preloadTimeoutRef.current = null;
    }
  }, []);

  // Optimized navigation function with reduced transition time
  const navigateTo = useCallback((href: string, options?: { 
    immediate?: boolean;
    delay?: number;
    preload?: boolean;
  }) => {
    const { immediate = false, delay = 0, preload = true } = options || {};
    
    // Clean up any existing navigation
    cleanupNavigation();
    
    // Preload route if not already preloaded
    if (preload && !preloadedRoutes.has(href)) {
      router.prefetch(href);
      preloadedRoutes.add(href);
    }
    
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

  // Enhanced preload function with debouncing
  const preloadRoute = useCallback((href: string) => {
    if (preloadedRoutes.has(href)) return;
    
    // Debounce preload requests
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
    }
    
    preloadTimeoutRef.current = setTimeout(() => {
      router.prefetch(href);
      preloadedRoutes.add(href);
    }, 100); // Small delay to batch preload requests
  }, [router]);

  // Batch preload multiple routes
  const preloadRoutes = useCallback((routes: string[]) => {
    routes.forEach(route => {
      if (!preloadedRoutes.has(route)) {
        preloadRoute(route);
      }
    });
  }, [preloadRoute]);

  // Performance optimization: Memoized navigation options
  const navigationOptions = useMemo(() => ({
    immediate: { immediate: true, preload: true },
    fast: { delay: 50, preload: true },
    smooth: { delay: 100, preload: true },
  }), []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanupNavigation;
  }, [cleanupNavigation]);

  return {
    navigateTo,
    preloadRoute,
    preloadRoutes,
    cleanupNavigation,
    navigationOptions,
  };
} 