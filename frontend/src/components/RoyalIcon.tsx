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
      {/* Outer Golden Ring */}
      <div className="absolute inset-0 rounded-full border border-royal-gold/30 shadow-[0_0_15px_rgba(212,175,55,0.15)] animate-[spin_20s_linear_infinite]" />
      
      {/* Inner Ring */}
      <div className="absolute inset-1 rounded-full border border-royal-gold/10 border-t-royal-gold/60 animate-[spin_15s_linear_infinite_reverse]" />

      {/* Monogram Text */}
      <span 
        className="font-playfair font-bold tracking-tighter leading-none select-none text-transparent bg-clip-text bg-gradient-to-br from-royal-gold-light via-royal-gold to-royal-gold-dark z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
        style={{ textShadow: '0 0 10px rgba(212,175,55,0.4)' }}
      >
        SM
      </span>
      
      {/* Subtle Glow */}
      <div className="absolute inset-0 rounded-full bg-royal-gold/5 blur-md pointer-events-none" />
    </div>
  );
}
