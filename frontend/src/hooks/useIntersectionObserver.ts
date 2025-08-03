import { useEffect, useRef, useState, useCallback } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  root?: Element | null;
}

export function useIntersectionObserver<T extends Element = Element>(
  options: UseIntersectionObserverOptions = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<T>(null);
  const hasIntersectedRef = useRef(false);

  const { threshold = 0.1, rootMargin = '50px', root = null } = options;

  const callback = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    const isCurrentlyIntersecting = entry.isIntersecting;
    
    setIsIntersecting(isCurrentlyIntersecting);
    
    if (isCurrentlyIntersecting && !hasIntersectedRef.current) {
      hasIntersectedRef.current = true;
      setHasIntersected(true);
    }
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(callback, {
      threshold,
      rootMargin,
      root,
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [callback, threshold, rootMargin, root]);

  return { elementRef, isIntersecting, hasIntersected };
}

// Specialized hook for image lazy loading
export function useImageLazyLoading<T extends HTMLImageElement = HTMLImageElement>(
  src: string | null,
  placeholder?: string
) {
  const [imageSrc, setImageSrc] = useState<string | null>(placeholder || null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const { elementRef, hasIntersected } = useIntersectionObserver<T>({
    threshold: 0.1,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (!hasIntersected || !src) return;

    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      // Fallback to placeholder if available
      if (placeholder) {
        setImageSrc(placeholder);
      }
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [hasIntersected, src, placeholder]);

  return {
    elementRef,
    imageSrc,
    isLoading,
    hasError,
    hasIntersected,
  };
} 