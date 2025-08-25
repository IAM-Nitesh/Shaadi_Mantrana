'use client';

import { ReactNode } from 'react';
import { usePerformanceOptimization } from '../hooks/usePerformanceOptimization';

interface PerformanceOptimizerProps {
  children: ReactNode;
}

export default function PerformanceOptimizer({ children }: PerformanceOptimizerProps) {
  // Initialize performance optimizations
  usePerformanceOptimization({
    enableIntersectionObserver: true,
    enableResizeObserver: true,
    enableScrollOptimization: true,
    enableImageLazyLoading: true,
  });

  return <>{children}</>;
} 