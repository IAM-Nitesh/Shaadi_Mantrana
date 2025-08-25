import dynamic from 'next/dynamic';
import React from 'react';
import logger from './logger';

// Dynamic imports for code splitting
export const DynamicDashboard = dynamic(() => import('../app/dashboard/page'), {
  loading: () => React.createElement('div', null, 'Loading Dashboard...'),
  ssr: false,
});

export const DynamicMatches = dynamic(() => import('../app/matches/page'), {
  loading: () => React.createElement('div', null, 'Loading Matches...'),
  ssr: false,
});

export const DynamicProfile = dynamic(() => import('../app/profile/page'), {
  loading: () => React.createElement('div', null, 'Loading Profile...'),
  ssr: false,
});

export const DynamicChat = dynamic(() => import('../app/chat/[id]/ChatComponent'), {
  loading: () => React.createElement('div', null, 'Loading Chat...'),
  ssr: false,
});

export const DynamicFilterModal = dynamic(() => import('../app/dashboard/FilterModal'), {
  loading: () => React.createElement('div', null, 'Loading Filters...'),
  ssr: false,
});

export const DynamicCelebratoryToast = dynamic(() => import('../components/CelebratoryMatchToast'), {
  loading: () => React.createElement('div', null, 'Loading...'),
  ssr: false,
});

// Lazy load heavy components
export const DynamicImageUpload = dynamic(() => import('../components/B2UploadTest'), {
  loading: () => React.createElement('div', null, 'Loading Image Upload...'),
  ssr: false,
});

export const DynamicAdminDashboard = dynamic(() => import('../app/admin/dashboard/page'), {
  loading: () => React.createElement('div', null, 'Loading Admin Dashboard...'),
  ssr: false,
});

// Utility for conditional loading
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  return dynamic(importFunc, {
    loading: fallback ? () => React.createElement(fallback) : () => React.createElement('div', null, 'Loading...'),
    ssr: false,
  });
}

// Preload critical components
export function preloadCriticalComponents() {
  // Preload components that are likely to be needed
  const preloadPromises = [
    import('../app/dashboard/page'),
    import('../app/matches/page'),
    import('../app/profile/page'),
  ];

  return Promise.all(preloadPromises);
}

// Route-based code splitting
export const routeComponents = {
  dashboard: () => import('../app/dashboard/page'),
  matches: () => import('../app/matches/page'),
  profile: () => import('../app/profile/page'),
  chat: () => import('../app/chat/[id]/ChatComponent'),
  admin: () => import('../app/admin/dashboard/page'),
};

// Utility for loading components on demand
export function loadComponentOnDemand<T>(
  componentPath: string,
  options: {
    loading?: () => React.ReactElement;
    ssr?: boolean;
  } = {}
) {
  const { loading, ssr = false } = options;
  
  return dynamic(() => import(componentPath), {
    loading: loading || (() => React.createElement('div', null, 'Loading...')),
    ssr,
  });
}

// Prefetch utility for better performance
export function prefetchComponent(componentPath: string) {
  if (typeof window !== 'undefined') {
    // Only prefetch on client side
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = componentPath;
    document.head.appendChild(link);
  }
}

// Performance monitoring for dynamic imports
export function measureImportTime<T>(
  importFunc: () => Promise<T>,
  componentName: string
): Promise<T> {
  const startTime = performance.now();
  
  return importFunc().then((result) => {
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`${componentName} loaded in ${loadTime.toFixed(2)}ms`);
    }
    
    return result;
  });
} 