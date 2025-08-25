import logger from './logger';
// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Track page load performance
  trackPageLoad(pageName: string) {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.metrics.set(`${pageName}_load_time`, navigation.loadEventEnd - navigation.loadEventStart);
          this.metrics.set(`${pageName}_dom_content_loaded`, navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
          this.metrics.set(`${pageName}_first_paint`, performance.getEntriesByName('first-paint')[0]?.startTime || 0);
          this.metrics.set(`${pageName}_first_contentful_paint`, performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0);
        }
      });
    }
  }

  // Track component render time
  trackComponentRender(componentName: string, startTime: number) {
    const renderTime = performance.now() - startTime;
    this.metrics.set(`${componentName}_render_time`, renderTime);
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`${componentName} rendered in ${renderTime.toFixed(2)}ms`);
    }
  }

  // Track API call performance
  trackApiCall(endpoint: string, startTime: number) {
    const duration = performance.now() - startTime;
    this.metrics.set(`${endpoint}_api_time`, duration);
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`API call to ${endpoint} took ${duration.toFixed(2)}ms`);
    }
  }

  // Track user interactions
  trackInteraction(interactionName: string, startTime: number) {
    const duration = performance.now() - startTime;
    this.metrics.set(`${interactionName}_interaction_time`, duration);
  }

  // Get performance metrics
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Clear metrics
  clearMetrics() {
    this.metrics.clear();
  }

  // Monitor Core Web Vitals
  monitorCoreWebVitals() {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.set('lcp', lastEntry.startTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.set('lcp', lcpObserver);

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        // processingStart exists on some PerformanceEntry types (e.g., FID), guard access
        const processingStart = (entry as any).processingStart;
        if (typeof processingStart === 'number') {
          this.metrics.set('fid', processingStart - entry.startTime);
        }
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
    this.observers.set('fid', fidObserver);

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.metrics.set('cls', clsValue);
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
    this.observers.set('cls', clsObserver);
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

// Hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();

  const trackRender = (componentName: string) => {
    const startTime = performance.now();
    return () => monitor.trackComponentRender(componentName, startTime);
  };

  const trackApiCall = (endpoint: string) => {
    const startTime = performance.now();
    return () => monitor.trackApiCall(endpoint, startTime);
  };

  const trackInteraction = (interactionName: string) => {
    const startTime = performance.now();
    return () => monitor.trackInteraction(interactionName, startTime);
  };

  return {
    trackRender,
    trackApiCall,
    trackInteraction,
    getMetrics: () => monitor.getMetrics(),
    clearMetrics: () => monitor.clearMetrics(),
  };
}

// Utility for measuring function execution time
export function measureExecutionTime<T>(
  fn: () => T,
  name: string
): T {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`${name} executed in ${(endTime - startTime).toFixed(2)}ms`);
  }
  
  return result;
}

// Utility for measuring async function execution time
export async function measureAsyncExecutionTime<T>(
  fn: () => Promise<T>,
  name: string
): Promise<T> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`${name} executed in ${(endTime - startTime).toFixed(2)}ms`);
  }
  
  return result;
}

// Memory usage monitoring
export function getMemoryUsage() {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }
  return null;
}

// Network performance monitoring
export function getNetworkInfo() {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }
  return null;
}

// Bundle size monitoring
export function getBundleSize() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      return {
        transferSize: navigation.transferSize,
        encodedBodySize: navigation.encodedBodySize,
        decodedBodySize: navigation.decodedBodySize,
      };
    }
  }
  return null;
}

// Performance budget monitoring
export function checkPerformanceBudget(metrics: Record<string, number>) {
  const budgets = {
    lcp: 2500, // 2.5 seconds
    fid: 100,  // 100 milliseconds
    cls: 0.1,  // 0.1
    fcp: 1800, // 1.8 seconds
  };

  const violations: string[] = [];

  Object.entries(budgets).forEach(([metric, budget]) => {
    const value = metrics[metric];
    if (value && value > budget) {
      violations.push(`${metric}: ${value}ms (budget: ${budget}ms)`);
    }
  });

  return violations;
} 