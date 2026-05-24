'use client';

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

export interface LiquidGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const LiquidGlassBackground = forwardRef<HTMLDivElement, LiquidGlassProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div ref={ref} className={`relative overflow-hidden rounded-3xl ${className}`} {...props}>
        {/* Animated Mesh Gradients behind the glass */}
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-30 z-0 pointer-events-none"
          animate={{
            background: [
              'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.4) 0%, transparent 50%)',
              'radial-gradient(circle at 60% 40%, rgba(212,175,55,0.2) 0%, transparent 60%)',
              'radial-gradient(circle at 40% 60%, rgba(220,20,60,0.3) 0%, transparent 40%)',
              'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.4) 0%, transparent 50%)',
            ],
            rotate: [0, 90, 180, 270, 360],
            scale: [1, 1.2, 1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            ease: "linear",
            repeat: Infinity,
          }}
        />
        
        {/* The Glass layer */}
        <div className="relative z-10 w-full h-full bg-royal-obsidian/40 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          {children}
        </div>
      </div>
    );
  }
);

LiquidGlassBackground.displayName = 'LiquidGlassBackground';
