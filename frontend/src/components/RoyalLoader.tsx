'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { safeGsap } from './SafeGsap';
import Image from 'next/image';

interface RoyalLoaderProps {
  variant?: 'grand' | 'skeleton' | 'spark' | 'logo';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  showText?: boolean;
  fullScreen?: boolean;
  opacity?: number;
}

const MandalaSVG = ({ size }: { size: string }) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      className={`${size} drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Layer - Sacred Geometry */}
      <g className="layer-outer origin-center">
        <circle cx="100" cy="100" r="90" stroke="#D4AF37" strokeWidth="0.5" strokeDasharray="4 4" />
        {[...Array(12)].map((_, i) => (
          <path 
            key={i}
            d="M100 10 L110 30 L90 30 Z" 
            fill="#D4AF37" 
            fillOpacity="0.2"
            transform={`rotate(${i * 30} 100 100)`} 
          />
        ))}
      </g>
      
      {/* Middle Layer - Floral Petals */}
      <g className="layer-middle origin-center">
        {[...Array(8)].map((_, i) => (
          <path 
            key={i}
            d="M100 40 C120 40 130 60 100 90 C70 60 80 40 100 40" 
            stroke="#D4AF37" 
            strokeWidth="1"
            transform={`rotate(${i * 45} 100 100)`} 
          />
        ))}
      </g>
      
      {/* Inner Layer - The Infinite Knot core */}
      <g className="layer-inner origin-center">
        <path 
          d="M100 70 L115 100 L100 130 L85 100 Z" 
          fill="#D4AF37" 
          className="animate-pulse" 
        />
        <circle cx="100" cy="100" r="10" fill="#D4AF37" fillOpacity="0.5" />
      </g>
    </svg>
  );
};

export default function RoyalLoader({
  variant = 'grand',
  size = 'lg',
  text = 'Curating your majestic matches...',
  showText = true,
  fullScreen = false,
  opacity = 0.95
}: RoyalLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const mandalaRef = useRef<HTMLDivElement>(null);

  const sizeMap = {
    sm: { logo: 'w-16 h-16', font: 'text-xs' },
    md: { logo: 'w-24 h-24', font: 'text-sm' },
    lg: { logo: 'w-32 h-32', font: 'text-base' },
    xl: { logo: 'w-48 h-48', font: 'text-xl' }
  };

  const currentSize = sizeMap[size];

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (variant === 'grand' && mandalaRef.current) {
        const outer = mandalaRef.current.querySelector('.layer-outer');
        const middle = mandalaRef.current.querySelector('.layer-middle');
        const inner = mandalaRef.current.querySelector('.layer-inner');

        // Parallax rotation
        safeGsap.to?.(outer, { rotation: 360, duration: 25, repeat: -1, ease: 'none' });
        safeGsap.to?.(middle, { rotation: -360, duration: 20, repeat: -1, ease: 'none' });
        
        // Heartbeat pulse
        safeGsap.to?.(inner, { 
          scale: 1.15, 
          opacity: 0.8, 
          duration: 2, 
          repeat: -1, 
          yoyo: true, 
          ease: 'power1.inOut' 
        });
      }

      if (showText && textRef.current) {
        safeGsap.to?.(textRef.current, {
          opacity: 0.5,
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      }

      if (containerRef.current && fullScreen) {
        safeGsap.fromTo?.(containerRef.current, 
          { opacity: 0 },
          { opacity: 1, duration: 0.6, ease: 'power2.out' }
        );
      }
    });

    return () => ctx.revert();
  }, [variant, showText, fullScreen]);

  if (variant === 'skeleton') {
    return (
      <div className={`${currentSize.logo} royal-skeleton ${fullScreen ? 'fixed inset-0 z-50' : ''}`} />
    );
  }

  const loaderContent = (
    <div className="flex flex-col items-center justify-center space-y-8">
      <div ref={mandalaRef} className="relative">
        {variant === 'logo' ? (
          <div className={`${currentSize.logo} relative`}>
            <Image src="/icon.png" alt="Shaadi Mantrana Logo" fill className="object-contain" priority />
          </div>
        ) : (
          <MandalaSVG size={currentSize.logo} />
        )}
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
                style={{ animation: `pulse 1.5s infinite ${i * 0.2}s` }}
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
