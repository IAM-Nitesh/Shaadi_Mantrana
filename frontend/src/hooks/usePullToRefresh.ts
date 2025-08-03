import { useEffect, useRef, useState, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true,
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Pull to refresh error:', error);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [onRefresh, isRefreshing]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing) return;
    
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop > 0) return; // Only allow pull when at top
    
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
    isPulling.current = true;
  }, [enabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !isPulling.current || isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;
    
    if (deltaY > 0) {
      e.preventDefault();
      const distance = Math.min(deltaY / resistance, threshold * 2);
      setPullDistance(distance);
    }
  }, [enabled, isPulling, isRefreshing, resistance, threshold]);

  const handleTouchEnd = useCallback(() => {
    if (!enabled || !isPulling.current || isRefreshing) return;
    
    isPulling.current = false;
    
    if (pullDistance >= threshold) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
  }, [enabled, isPulling, isRefreshing, pullDistance, threshold, handleRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(pullDistance / threshold, 1),
  };
} 