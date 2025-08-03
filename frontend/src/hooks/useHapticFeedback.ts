import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

interface UseHapticFeedbackOptions {
  enabled?: boolean;
}

export function useHapticFeedback(options: UseHapticFeedbackOptions = {}) {
  const { enabled = true } = options;

  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    if (!enabled || typeof window === 'undefined') return;

    // Check if device supports haptic feedback
    const supportsHaptics = 'vibrate' in navigator || 'haptic' in navigator;

    if (!supportsHaptics) return;

    try {
      switch (type) {
        case 'light':
          // Light impact (10ms)
          if ('vibrate' in navigator) {
            navigator.vibrate(10);
          }
          break;
        
        case 'medium':
          // Medium impact (20ms)
          if ('vibrate' in navigator) {
            navigator.vibrate(20);
          }
          break;
        
        case 'heavy':
          // Heavy impact (30ms)
          if ('vibrate' in navigator) {
            navigator.vibrate(30);
          }
          break;
        
        case 'success':
          // Success pattern: short-long-short
          if ('vibrate' in navigator) {
            navigator.vibrate([10, 50, 10]);
          }
          break;
        
        case 'warning':
          // Warning pattern: medium-medium
          if ('vibrate' in navigator) {
            navigator.vibrate([20, 100, 20]);
          }
          break;
        
        case 'error':
          // Error pattern: long-short-long
          if ('vibrate' in navigator) {
            navigator.vibrate([30, 50, 30]);
          }
          break;
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }, [enabled]);

  // Predefined haptic patterns for common actions
  const haptics = {
    // Navigation
    navigate: () => triggerHaptic('light'),
    
    // Swipe actions
    swipeLeft: () => triggerHaptic('medium'),
    swipeRight: () => triggerHaptic('medium'),
    
    // Button interactions
    buttonPress: () => triggerHaptic('light'),
    buttonLongPress: () => triggerHaptic('medium'),
    
    // Success states
    match: () => triggerHaptic('success'),
    like: () => triggerHaptic('success'),
    messageSent: () => triggerHaptic('light'),
    
    // Error states
    error: () => triggerHaptic('error'),
    warning: () => triggerHaptic('warning'),
    
    // General feedback
    light: () => triggerHaptic('light'),
    medium: () => triggerHaptic('medium'),
    heavy: () => triggerHaptic('heavy'),
    
    // Custom pattern
    custom: (pattern: number | number[]) => {
      if (!enabled || typeof window === 'undefined') return;
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    },
  };

  return {
    triggerHaptic,
    haptics,
  };
} 