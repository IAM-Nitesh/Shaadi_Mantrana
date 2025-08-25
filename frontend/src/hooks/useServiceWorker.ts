import { useEffect, useState, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalled: boolean;
  isUpdated: boolean;
  registration: ServiceWorkerRegistration | null;
}

interface UseServiceWorkerOptions {
  onUpdate?: () => void;
  onInstall?: () => void;
  onError?: (error: Error) => void;
}

export function useServiceWorker(options: UseServiceWorkerOptions = {}) {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isInstalled: false,
    isUpdated: false,
    registration: null,
  });

  const { onUpdate, onInstall, onError } = options;

  const registerServiceWorker = useCallback(async () => {
    if (!state.isSupported || typeof window === 'undefined') {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      setState(prev => ({
        ...prev,
        isRegistered: true,
        registration,
      }));

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New service worker is available
              setState(prev => ({ ...prev, isUpdated: true }));
              onUpdate?.();
            } else {
              // First time installation
              setState(prev => ({ ...prev, isInstalled: true }));
              onInstall?.();
            }
          }
        });
      });

      // Handle service worker controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setState(prev => ({ ...prev, isUpdated: false }));
      });

    } catch (error) {
      onError?.(error as Error);
    }
  }, [state.isSupported, onUpdate, onInstall, onError]);

  const updateServiceWorker = useCallback(async () => {
    if (state.registration) {
      await state.registration.update();
    }
  }, [state.registration]);

  const skipWaiting = useCallback(async () => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [state.registration]);

  // Check for service worker support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setState(prev => ({
        ...prev,
        isSupported: 'serviceWorker' in navigator,
      }));
    }
  }, []);

  useEffect(() => {
    registerServiceWorker();
  }, [registerServiceWorker]);

  return {
    ...state,
    registerServiceWorker,
    updateServiceWorker,
    skipWaiting,
  };
}

// Hook for offline/online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Hook for push notifications
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setIsSupported('Notification' in window);
    setPermission(Notification.permission);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported');
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === 'granted' && isSupported) {
      return new Notification(title, options);
    }
    return null;
  }, [permission, isSupported]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
  };
}

// Hook for background sync
export function useBackgroundSync() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
  setIsSupported('serviceWorker' in navigator && !!(window.ServiceWorkerRegistration && (window.ServiceWorkerRegistration as any).prototype && 'sync' in (window.ServiceWorkerRegistration as any).prototype));
  }, []);

  const registerSync = useCallback(async (tag: string) => {
    if (!isSupported || typeof window === 'undefined') {
      throw new Error('Background sync is not supported');
    }

    const registration = await navigator.serviceWorker.ready;
    if ((registration as any).sync && (registration as any).sync.register) {
      return (registration as any).sync.register(tag);
    }
    throw new Error('Background sync not available on this registration');
  }, [isSupported]);

  return {
    isSupported,
    registerSync,
  };
} 