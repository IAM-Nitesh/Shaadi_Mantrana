'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from './SkeletonLoader';

interface LazyImageProps {
  src: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  fallback?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  width = 400,
  height = 400,
  className = '',
  placeholder,
  fallback = '/demo-profiles/default-profile.svg',
  priority = false,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(priority ? src : null);
  const [isLoading, setIsLoading] = useState(!priority);
  const [hasError, setHasError] = useState(false);
  const elementRef = useRef<HTMLImageElement>(null);

  // Simple intersection observer
  useEffect(() => {
    if (priority || !elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [priority]);

  // Load image when intersecting or priority
  useEffect(() => {
    if (!isIntersecting && !priority) return;
    if (!src) return;

    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      onLoad?.();
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      if (placeholder) {
        setImageSrc(placeholder);
      }
      onError?.();
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isIntersecting, priority, src, placeholder, onLoad, onError]);

  const finalSrc = hasError ? fallback : imageSrc;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-10"
          >
            <Skeleton 
              width="100%" 
              height="100%" 
              rounded="lg"
              animate={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image */}
      <motion.img
        ref={elementRef}
        src={finalSrc || undefined}
        alt={alt}
        width={width}
        height={height}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => {
          onLoad?.();
        }}
        onError={() => {
          onError?.();
        }}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />

      {/* Error State */}
      <AnimatePresence>
        {hasError && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-gray-100"
          >
            <div className="text-center text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm">Image unavailable</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Profile Image Component
export function ProfileImage({
  src,
  alt,
  size = 'md',
  className = '',
  priority = false,
}: {
  src: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;
}) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
      <LazyImage
        src={src}
        alt={alt}
        width={parseInt(sizeClasses[size].split('w-')[1])}
        height={parseInt(sizeClasses[size].split('h-')[1])}
        className="w-full h-full"
        priority={priority}
        fallback="/demo-profiles/default-profile.svg"
      />
    </div>
  );
}

// Swipe Card Image Component
export function SwipeCardImage({
  src,
  alt,
  className = '',
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`relative w-full h-96 rounded-2xl overflow-hidden ${className}`}>
      <LazyImage
        src={src}
        alt={alt}
        width={400}
        height={400}
        className="w-full h-full"
        fallback="/demo-profiles/default-profile.svg"
      />
    </div>
  );
} 