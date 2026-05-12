'use client';

import { useEffect, useRef } from 'react';
import { safeGsap } from '../SafeGsap';

interface MandalaBackgroundProps {
  opacity?: number;
  rotationSpeed?: number;
  parallaxShift?: number;
}

export default function MandalaBackground({ 
  opacity = 0.05, 
  rotationSpeed = 60,
  parallaxShift = 0
}: MandalaBackgroundProps) {
  const mandalaRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (mandalaRef.current) {
      safeGsap.to?.(mandalaRef.current, {
        rotation: 360,
        duration: rotationSpeed,
        repeat: -1,
        ease: 'none',
      });
    }
  }, [rotationSpeed]);

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden bg-royal-obsidian">
      <svg
        ref={mandalaRef}
        viewBox="0 0 100 100"
        className="w-[150%] h-[150%] max-w-[1200px] text-royal-gold transition-transform duration-300 ease-out"
        style={{ 
          opacity,
          transform: `translateX(${parallaxShift * 0.1}px) rotate(${parallaxShift * 0.05}deg)`
        }}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.2"
      >
        {/* Simple elegant Mandala pattern */}
        <circle cx="50" cy="50" r="45" />
        <circle cx="50" cy="50" r="35" />
        <circle cx="50" cy="50" r="25" />
        {[...Array(12)].map((_, i) => (
          <g key={i} transform={`rotate(${i * 30} 50 50)`}>
            <path d="M50 5 Q55 25 50 45 Q45 25 50 5" />
            <circle cx="50" cy="15" r="2" />
          </g>
        ))}
        {[...Array(24)].map((_, i) => (
          <path
            key={i}
            d="M50 50 L50 10"
            transform={`rotate(${i * 15} 50 50)`}
            strokeDasharray="1,2"
          />
        ))}
      </svg>
    </div>
  );
}
