'use client';

import { useEffect, useRef, useCallback } from 'react';

interface PerformanceOptimizationOptions {
  enableIntersectionObserver?: boolean;
  enableResizeObserver?: boolean;
  enableScrollOptimization?: boolean;
  enableImageLazyLoading?: boolean;
}

export function usePerformanceOptimization(options: PerformanceOptimizationOptions = {}) {
  const {
    enableIntersectionObserver = true,
    enableResizeObserver = true,
    enableScrollOptimization = true,
    enableImageLazyLoading = true,
  } = options;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Optimize scroll performance
  const optimizeScroll = useCallback(() => {
    if (!enableScrollOptimization) return;

    // Add passive event listeners for better scroll performance
    const addPassiveScrollListener = (element: Element | Document | Window) => {
      try {
        // Some environments might pass Document or Window; guard accordingly
        // @ts-ignore
        element.addEventListener && element.addEventListener('scroll', () => {}, { passive: true });
        // @ts-ignore
        element.addEventListener && element.addEventListener('touchstart', () => {}, { passive: true });
        // @ts-ignore
        element.addEventListener && element.addEventListener('touchmove', () => {}, { passive: true });
      } catch (_) {
        // ignore if not supported
      }
    };

    // Apply to document and window when available
    if (typeof document !== 'undefined') addPassiveScrollListener(document);
    if (typeof window !== 'undefined') addPassiveScrollListener(window);
  }, [enableScrollOptimization]);

  // Optimize image loading
  const optimizeImageLoading = useCallback(() => {
    if (!enableImageLazyLoading) return;

    // Set loading="lazy" for images that don't have it
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
    });
  }, [enableImageLazyLoading]);

  // Optimize intersection observer for better performance
  const setupIntersectionObserver = useCallback(() => {
    if (!enableIntersectionObserver) return;

    // Cleanup existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer with performance optimizations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Add visible class for animations
            entry.target.classList.add('visible');
            
            // Load images when they come into view
            const images = entry.target.querySelectorAll('img[data-src]');
            images.forEach(img => {
              const dataSrc = img.getAttribute('data-src');
              if (dataSrc) {
                img.setAttribute('src', dataSrc);
                img.removeAttribute('data-src');
              }
            });
          }
        });
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before element comes into view
        threshold: 0.1, // Trigger when 10% of element is visible
      }
    );

    // Observe elements with data-observe attribute
    const elementsToObserve = document.querySelectorAll('[data-observe]');
    elementsToObserve.forEach(element => {
      observerRef.current?.observe(element);
    });
  }, [enableIntersectionObserver]);

  // Optimize resize observer for better performance
  const setupResizeObserver = useCallback(() => {
    if (!enableResizeObserver) return;

    // Cleanup existing observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    // Create new resize observer with debouncing
    let resizeTimeout: NodeJS.Timeout;
    resizeObserverRef.current = new ResizeObserver((entries) => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        entries.forEach(entry => {
          // Handle resize events efficiently
          const element = entry.target as HTMLElement;
          if (element.dataset.resizeHandler) {
            // Trigger custom resize handlers
            const event = new CustomEvent('resize', { detail: entry });
            element.dispatchEvent(event);
          }
        });
      }, 16); // ~60fps debouncing
    });

    // Observe elements with data-resize-observe attribute
    const elementsToResizeObserve = document.querySelectorAll('[data-resize-observe]');
    elementsToResizeObserve.forEach(element => {
      resizeObserverRef.current?.observe(element);
    });
  }, [enableResizeObserver]);

  // Performance optimization: Reduce layout thrashing
  const batchDOMUpdates = useCallback((updates: (() => void)[]) => {
    // Use requestAnimationFrame to batch DOM updates
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  }, []);

  // Performance optimization: Debounce function calls
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }, []);

  // Performance optimization: Throttle function calls
  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }, []);

  // Initialize performance optimizations
  useEffect(() => {
    optimizeScroll();
    optimizeImageLoading();
    setupIntersectionObserver();
    setupResizeObserver();

    // Cleanup on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [optimizeScroll, optimizeImageLoading, setupIntersectionObserver, setupResizeObserver]);

  return {
    batchDOMUpdates,
    debounce,
    throttle,
    optimizeScroll,
    optimizeImageLoading,
  };
} 