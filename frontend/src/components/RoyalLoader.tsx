'use client';

import React, { useEffect, useRef } from 'react';
import { safeGsap } from './SafeGsap';

interface RoyalLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  showText?: boolean;
  fullScreen?: boolean;
  opacity?: number;
}

export default function RoyalLoader({
  size = 'lg',
  text = 'Curating your majestic matches...',
  showText = true,
  fullScreen = false,
  opacity = 0.95
}: RoyalLoaderProps) {
  const mandalaRef = useRef<SVGSVGElement>(null);
  const heartRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeMap = {
    sm: { mandala: 'w-16 h-16', heart: 'text-xl', font: 'text-xs' },
    md: { mandala: 'w-24 h-24', heart: 'text-2xl', font: 'text-sm' },
    lg: { mandala: 'w-32 h-32', heart: 'text-3xl', font: 'text-base' },
    xl: { mandala: 'w-48 h-48', heart: 'text-5xl', font: 'text-xl' }
  };

  const currentSize = sizeMap[size];

  useEffect(() => {
    if (mandalaRef.current) {
      safeGsap.to?.(mandalaRef.current, {
        rotation: 360,
        duration: 8,
        repeat: -1,
        ease: 'none'
      });
    }

    if (heartRef.current) {
      safeGsap.to?.(heartRef.current, {
        scale: 1.2,
        opacity: 0.8,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
      });
    }

    if (containerRef.current && fullScreen) {
      safeGsap.fromTo?.(containerRef.current, 
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [fullScreen]);

  const loaderContent = (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="relative flex items-center justify-center">
        {/* Rotating Mandala */}
        <svg
          ref={mandalaRef}
          viewBox="0 0 100 100"
          className={`${currentSize.mandala} text-royal-gold transition-opacity duration-500`}
          style={{ opacity: 0.6 }}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
        >
          <circle cx="50" cy="50" r="45" strokeDasharray="2,2" />
          <circle cx="50" cy="50" r="35" strokeWidth="0.3" />
          {[...Array(8)].map((_, i) => (
            <g key={i} transform={`rotate(${i * 45} 50 50)`}>
              <path d="M50 10 Q55 30 50 50 Q45 30 50 10" />
              <circle cx="50" cy="15" r="1.5" fill="currentColor" />
            </g>
          ))}
          {[...Array(16)].map((_, i) => (
            <path
              key={i}
              d="M50 50 L50 20"
              transform={`rotate(${i * 22.5} 50 50)`}
              strokeDasharray="1,3"
              strokeWidth="0.2"
            />
          ))}
        </svg>

        {/* Pulsating Heart Icon */}
        <div 
          ref={heartRef}
          className={`absolute flex items-center justify-center text-royal-gold ${currentSize.heart}`}
        >
          <i className="ri-heart-pulse-fill"></i>
        </div>
      </div>

      {showText && (
        <div className="text-center space-y-2">
          <p className={`${currentSize.font} font-playfair font-bold text-royal-gold tracking-widest uppercase animate-pulse`}>
            {text}
          </p>
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="w-1 h-1 rounded-full bg-royal-gold"
                style={{ 
                  animation: `pulse 1.5s infinite ${i * 0.2}s`
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div 
        ref={containerRef}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-royal-obsidian"
        style={{ backgroundColor: `rgba(18, 18, 18, ${opacity})` }}
      >
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
}
