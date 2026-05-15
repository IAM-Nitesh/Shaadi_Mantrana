'use client';

import React, { useEffect, useRef } from 'react';
import { safeGsap } from './SafeGsap';
import Image from 'next/image';

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
  const logoRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const sizeMap = {
    sm: { logo: 'w-16 h-16', font: 'text-xs' },
    md: { logo: 'w-24 h-24', font: 'text-sm' },
    lg: { logo: 'w-32 h-32', font: 'text-base' },
    xl: { logo: 'w-48 h-48', font: 'text-xl' }
  };

  const currentSize = sizeMap[size];

  useEffect(() => {
    if (logoRef.current) {
      // Elegant "weaving" or "pulsing" animation for the Infinite Knot
      safeGsap.to?.(logoRef.current, {
        scale: 1.05,
        filter: 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.4))',
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
      });
    }

    if (textRef.current) {
      safeGsap.to?.(textRef.current, {
        opacity: 0.5,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: 'none'
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
    <div className="flex flex-col items-center justify-center space-y-8">
      <div 
        ref={logoRef}
        className={`${currentSize.logo} relative`}
      >
        <Image
          src="/icon.png"
          alt="Shaadi Mantrana Logo"
          fill
          className="object-contain"
          priority
        />
      </div>

      {showText && (
        <div ref={textRef} className="text-center space-y-3">
          <p className={`${currentSize.font} font-playfair font-bold text-royal-gold tracking-[0.3em] uppercase`}>
            {text}
          </p>
          <div className="flex justify-center space-x-2">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-royal-gold/60"
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
