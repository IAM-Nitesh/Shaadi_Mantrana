'use client';

import React from 'react';
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion';
import { useRef, useEffect } from 'react';

// Stagger animation for lists
export function StaggerContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Parallax scroll effect
export function ParallaxContainer({ children, speed = 0.5, className = '' }: { 
  children: React.ReactNode; 
  speed?: number; 
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      if (!ref.current) return;
      
      const scrolled = window.pageYOffset;
      const rate = scrolled * speed;
      
      ref.current.style.transform = `translateY(${rate}px)`;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Floating animation
export function FloatingElement({ children, className = '', delay = 0 }: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

// Pulse animation
export function PulseElement({ children, className = '', intensity = 1 }: { 
  children: React.ReactNode; 
  className?: string;
  intensity?: number;
}) {
  return (
    <motion.div
      className={className}
      animate={{
        scale: [1, 1 + (intensity * 0.05), 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

// Shimmer effect
export function ShimmerEffect({ children, className = '' }: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}

// Magnetic effect
export function MagneticElement({ children, className = '' }: { 
  children: React.ReactNode; 
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || typeof window === 'undefined') return;
    
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    ref.current.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
  };

  const handleMouseLeave = () => {
    if (!ref.current || typeof window === 'undefined') return;
    ref.current.style.transform = 'translate(0px, 0px)';
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.div>
  );
}

// Scroll-triggered animation
export function ScrollTriggeredAnimation({ 
  children, 
  className = '',
  threshold = 0.1,
  animation = 'fadeIn'
}: { 
  children: React.ReactNode; 
  className?: string;
  threshold?: number;
  animation?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'scale';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { amount: threshold });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  const variants = {
    hidden: {
      opacity: animation === 'fadeIn' ? 0 : 1,
      y: animation === 'slideUp' ? 50 : 0,
      x: animation === 'slideLeft' ? 50 : 0,
      scale: animation === 'scale' ? 0.8 : 1,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={controls}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

// Confetti animation
export function ConfettiAnimation({ 
  isActive, 
  colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'] 
}: { 
  isActive: boolean; 
  colors?: string[];
}) {
  const confettiCount = 50;

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: confettiCount }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: colors[i % colors.length],
                left: `${Math.random() * 100}%`,
                top: '-10px',
              }}
              initial={{
                y: -10,
                x: 0,
                rotate: 0,
                opacity: 1,
              }}
                      animate={{
          y: (typeof window !== 'undefined' ? window.innerHeight : 1000) + 10,
                x: Math.random() * 200 - 100,
                rotate: Math.random() * 360,
                opacity: 0,
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                ease: 'easeOut',
                delay: Math.random() * 0.5,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// Loading spinner with custom animation
export function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg'; 
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'border-rose-500',
    secondary: 'border-purple-500',
    white: 'border-white',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${colorClasses[color]} border-2 border-t-transparent rounded-full ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

// Progress bar with animation
export function AnimatedProgressBar({ 
  progress, 
  className = '',
  showPercentage = false 
}: { 
  progress: number; 
  className?: string;
  showPercentage?: boolean;
}) {
  return (
    <div className={`relative bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <motion.div
        className="h-full bg-gradient-to-r from-rose-500 to-pink-500"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      {showPercentage && (
        <motion.span
          className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {Math.round(progress)}%
        </motion.span>
      )}
    </div>
  );
} 