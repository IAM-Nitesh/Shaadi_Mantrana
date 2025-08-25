import { useEffect, useCallback, useRef } from 'react';
import logger from '../utils/logger';
import { useRouter } from 'next/navigation';

interface UseAndroidBackButtonOptions {
  enabled?: boolean;
  onBack?: () => boolean | void; // Return true to prevent default behavior
  preventDefault?: boolean;
}

export function useAndroidBackButton(options: UseAndroidBackButtonOptions = {}) {
  const { enabled = true, onBack, preventDefault = false } = options;
  const router = useRouter();
  const historyStack = useRef<string[]>([]);
  const isHandlingBack = useRef(false);

  // Track navigation history
  useEffect(() => {
    if (!enabled) return;

    const currentPath = window.location.pathname;
    historyStack.current.push(currentPath);

    // Keep only last 10 entries
    if (historyStack.current.length > 10) {
      historyStack.current = historyStack.current.slice(-10);
    }
  }, [enabled]);

  const handleBackButton = useCallback((event: PopStateEvent) => {
    if (!enabled || isHandlingBack.current) return;

    isHandlingBack.current = true;

    try {
      // Call custom handler if provided
      if (onBack) {
        const shouldPreventDefault = onBack();
        if (shouldPreventDefault === true) {
          event.preventDefault();
          // Push current state back to prevent navigation
          window.history.pushState(null, '', window.location.pathname);
          isHandlingBack.current = false;
          return;
        }
      }

      // Default behavior: go back in history
      if (historyStack.current.length > 1) {
        historyStack.current.pop(); // Remove current
        const previousPath = historyStack.current[historyStack.current.length - 1];
        
        if (previousPath && previousPath !== window.location.pathname) {
          router.push(previousPath);
        } else {
          // Fallback to home if no previous path
          router.push('/');
        }
      } else {
        // No history, go to home
        router.push('/');
      }
    } catch (error) {
      logger.error('Android back button handler error:', error);
      // Fallback to home
      router.push('/');
    } finally {
      isHandlingBack.current = false;
    }
  }, [enabled, onBack, router]);

  // Handle hardware back button (Android)
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handlePopState = (event: PopStateEvent) => {
      handleBackButton(event);
    };

    // Listen for popstate events (back button)
    window.addEventListener('popstate', handlePopState);

    // Add initial state
    window.history.pushState(null, '', window.location.pathname);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enabled, handleBackButton]);

  // Programmatic back navigation
  const goBack = useCallback(() => {
    if (historyStack.current.length > 1) {
      historyStack.current.pop();
      const previousPath = historyStack.current[historyStack.current.length - 1];
      if (previousPath) {
        router.push(previousPath);
      }
    } else {
      router.push('/');
    }
  }, [router]);

  // Clear history stack
  const clearHistory = useCallback(() => {
    historyStack.current = [window.location.pathname];
  }, []);

  return {
    goBack,
    clearHistory,
    historyStack: historyStack.current,
  };
} 