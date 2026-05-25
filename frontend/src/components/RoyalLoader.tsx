'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { safeGsap } from './SafeGsap';
import RoyalIcon from './RoyalIcon';

interface RoyalLoaderProps {
  variant?: 'grand' | 'skeleton' | 'spark' | 'logo';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  showText?: boolean;
  fullScreen?: boolean;
  opacity?: number;
  className?: string;
}


const MandalaSVG = ({ variant, size }: { variant: 'grand' | 'spark'; size: string }) => {
  const isSpark = variant === 'spark';

  return (
    <svg 
      viewBox="0 0 200 200" 
      className={`${size} ${isSpark ? 'drop-shadow-[0_0_10px_rgba(212,175,55,0.6)]' : 'drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]'}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="royalGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={isSpark ? "2" : "3"} result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <radialGradient id="auraGradient" cx="100" cy="100" r="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity={isSpark ? "0.3" : "0.15"} />
          <stop offset="60%" stopColor="#D4AF37" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8A6623" />
          <stop offset="45%" stopColor="#F9E076" />
          <stop offset="55%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
      </defs>

      {/* Celestial Aura (Breathing Background) */}
      <circle 
        className="celestial-aura" 
        cx="100" cy="100" r={isSpark ? 80 : 90} 
        fill="url(#auraGradient)" 
      />

      {!isSpark ? (
        <>
          {/* Ring 4: Outer Diamonds (Grand Only) */}
          <g className="ring-1">
            {[...Array(24)].map((_, i) => (
              <path 
                key={i}
                className="diamond-point"
                d="M100 12 L105 22 L100 32 L95 22 Z" 
                fill="url(#goldGradient)" 
                fillOpacity="0.4"
                transform={`rotate(${i * 15} 100 100)`} 
              />
            ))}
          </g>

          {/* Ring 3: Mid-Outer Diamonds (Grand Only) */}
          <g className="ring-2">
            {[...Array(16)].map((_, i) => (
              <path 
                key={i}
                className="diamond-point"
                d="M100 38 L104 46 L100 54 L96 46 Z" 
                fill="#D4AF37" 
                fillOpacity="0.6"
                transform={`rotate(${i * 22.5} 100 100)`} 
              />
            ))}
          </g>
          
          {/* Ring 2: Mid-Inner Diamonds (Grand Only) */}
          <g className="ring-3">
            {[...Array(12)].map((_, i) => (
              <path 
                key={i}
                className="diamond-point"
                d="M100 60 L103 66 L100 72 L97 66 Z" 
                fill="url(#goldGradient)" 
                transform={`rotate(${i * 30} 100 100)`} 
              />
            ))}
          </g>
        </>
      ) : null}

      {/* Ring 1: Inner Diamonds (Mandatory Spark Ring) */}
      <g className={isSpark ? "ring-spark" : "ring-4"}>
        {[...Array(8)].map((_, i) => (
          <path 
            key={i}
            className="diamond-point"
            d={isSpark ? "M100 40 L106 60 L100 80 L94 60 Z" : "M100 76 L102 81 L100 86 L98 81 Z"} 
            fill={isSpark ? "url(#goldGradient)" : "#F9E076"} 
            transform={`rotate(${i * 45} 100 100)`} 
          />
        ))}
      </g>
      
      {/* Static Infinite Core */}
      <g className="layer-inner" filter="url(#royalGlow)">
        <path 
          d={isSpark ? "M100 85 L106 100 L100 115 L94 100 Z" : "M100 88 L110 100 L100 112 L90 100 Z"} 
          fill="url(#goldGradient)" 
        />
        <circle cx="100" cy="100" r={isSpark ? 4 : 4} fill="#FFFFFF" fillOpacity="0.8" />
        {!isSpark && (
          <circle cx="100" cy="100" r="12" stroke="#F9E076" strokeWidth="0.5" strokeOpacity="0.2" />
        )}
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
  opacity = 0.95,
  className = ''
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
      if (mandalaRef.current && (variant === 'grand' || variant === 'spark')) {
        const inner = mandalaRef.current.querySelector('.layer-inner');
        const aura = mandalaRef.current.querySelector('.celestial-aura');
        const diamonds = mandalaRef.current.querySelectorAll('.diamond-point');

        if (variant === 'grand') {
          const r1 = mandalaRef.current.querySelector('.ring-1');
          const r2 = mandalaRef.current.querySelector('.ring-2');
          const r3 = mandalaRef.current.querySelector('.ring-3');
          const r4 = mandalaRef.current.querySelector('.ring-4');

          safeGsap.to?.(r1, { rotation: 360, duration: 45, repeat: -1, ease: 'none', svgOrigin: '100 100' });
          safeGsap.to?.(r2, { rotation: -360, duration: 35, repeat: -1, ease: 'none', svgOrigin: '100 100' });
          safeGsap.to?.(r3, { rotation: 360, duration: 30, repeat: -1, ease: 'none', svgOrigin: '100 100' });
          safeGsap.to?.(r4, { rotation: -360, duration: 25, repeat: -1, ease: 'none', svgOrigin: '100 100' });
        } else if (variant === 'spark') {
          const sparkRing = mandalaRef.current.querySelector('.ring-spark');
          safeGsap.to?.(sparkRing, { rotation: 360, duration: 8, repeat: -1, ease: 'none', svgOrigin: '100 100' });
        }
        
        // Celestial Aura: Breathing Background
        safeGsap.to?.(aura, { 
          opacity: variant === 'spark' ? 0.6 : 0.3, 
          scale: variant === 'spark' ? 1.1 : 1.15,
          duration: variant === 'spark' ? 1.5 : 3, 
          repeat: -1, 
          yoyo: true, 
          ease: 'sine.inOut',
          svgOrigin: '100 100'
        });

        // Diamond Glimmer Engine: Randomized light catches
        diamonds.forEach((d) => {
          safeGsap.to?.(d, {
            filter: 'brightness(2) contrast(1.2)',
            opacity: 1,
            duration: 0.1 + Math.random() * 0.4,
            repeat: -1,
            repeatDelay: variant === 'spark' ? 1 + Math.random() * 3 : 2 + Math.random() * 8,
            yoyo: true,
            ease: 'power2.inOut'
          });
        });
        
        // Heartbeat pulse - Static at center
        safeGsap.to?.(inner, { 
          scale: 1.1, 
          filter: `brightness(1.3) drop-shadow(0 0 ${variant === 'spark' ? '10px' : '15px'} rgba(249, 224, 118, 0.5))`,
          duration: variant === 'spark' ? 1.5 : 3, 
          repeat: -1, 
          yoyo: true, 
          ease: 'sine.inOut',
          svgOrigin: '100 100'
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
      <div className={`${className || currentSize.logo} royal-skeleton ${fullScreen ? 'fixed inset-0 z-50' : ''}`} />
    );
  }

  const loaderContent = (
    <div className="flex flex-col items-center justify-center space-y-8">
      <div ref={mandalaRef} className="relative">
        {variant === 'logo' ? (
          <div className={`${currentSize.logo} relative flex items-center justify-center`}>
            <RoyalIcon size={size === 'sm' ? '2xl' : size === 'md' ? '3xl' : size === 'lg' ? '4xl' : '5xl'} />
          </div>
        ) : (
          <MandalaSVG variant={variant === 'spark' ? 'spark' : 'grand'} size={currentSize.logo} />
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
