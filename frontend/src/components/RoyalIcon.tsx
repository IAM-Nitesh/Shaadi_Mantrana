import React from 'react';

type Size = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';

interface RoyalIconProps {
  size?: Size;
  className?: string;
  onClick?: () => void;
}

const sizeClasses: Record<Size, string> = {
  'sm': 'w-6 h-6 text-xs',
  'md': 'w-8 h-8 text-sm',
  'lg': 'w-10 h-10 text-base',
  'xl': 'w-12 h-12 text-lg',
  '2xl': 'w-16 h-16 text-2xl',
  '3xl': 'w-24 h-24 text-4xl',
  '4xl': 'w-32 h-32 text-5xl',
  '5xl': 'w-48 h-48 text-7xl',
  '6xl': 'w-64 h-64 text-8xl',
};

export default function RoyalIcon({ size = 'md', className = '', onClick }: RoyalIconProps) {
  const containerSize = sizeClasses[size] || sizeClasses['md'];

  return (
    <div 
      className={`relative inline-flex items-center justify-center flex-shrink-0 ${containerSize} ${className}`}
      onClick={onClick}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full drop-shadow-[0_2px_8px_rgba(212,175,55,0.4)]"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="goldGradientLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F9E076" />
            <stop offset="40%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8A6623" />
          </linearGradient>
          <linearGradient id="goldGradientRight" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#F9E076" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8A6623" />
          </linearGradient>
          {/* Subtle drop shadow filter for the intertwining effect */}
          <filter id="intertwineShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Left Ring - Base */}
        <circle 
          cx="38" cy="50" r="26" 
          stroke="url(#goldGradientLeft)" 
          strokeWidth="6" 
        />
        
        {/* Right Ring - Base (Overlaps Left Ring completely at first) */}
        <circle 
          cx="62" cy="50" r="26" 
          stroke="url(#goldGradientRight)" 
          strokeWidth="6" 
        />

        {/* The Magic Intertwine: We re-draw the top-right quadrant of the LEFT ring 
            so it goes *over* the right ring, creating the 3D interlocking illusion. */}
        <path 
          d="M 38 24 A 26 26 0 0 1 60.5 37" 
          stroke="url(#goldGradientLeft)" 
          strokeWidth="6.5" 
          strokeLinecap="round"
          fill="none"
          filter="url(#intertwineShadow)"
        />
      </svg>
    </div>
  );
}
