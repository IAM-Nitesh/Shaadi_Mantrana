'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionContextType {
  isTransitioning: boolean;
  setTransitioning: (transitioning: boolean) => void;
  previousPath: string;
  currentPath: string;
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined);

export function usePageTransition() {
  const ctx = useContext(PageTransitionContext);
  if (!ctx) throw new Error('usePageTransition must be used within PageTransitionProvider');
  return ctx;
}

interface PageTransitionProviderProps {
  children: ReactNode;
}

export default function PageTransitionProvider({ children }: PageTransitionProviderProps) {
  const pathname = usePathname();
  const [isTransitioning, setTransitioning] = useState(false);
  const [previousPath, setPreviousPath] = useState('');
  const [currentPath, setCurrentPath] = useState(pathname);

  // Ultra-fast transition settings for instant feel
  const transitionSettings = useMemo(() => ({
    duration: 0.08, // Ultra-fast for instant feel
    ease: [0.4, 0, 0.2, 1], // Optimized easing curve
    opacity: { duration: 0.06 }, // Instant opacity
  }), []);

  useEffect(() => {
    if (pathname !== currentPath) {
      setPreviousPath(currentPath);
      setCurrentPath(pathname);
      setTransitioning(true);
      
      // Ultra-fast transition time for instant experience
      const timer = setTimeout(() => {
        setTransitioning(false);
      }, 80); // Reduced to 80ms for instant feel
      
      return () => clearTimeout(timer);
    }
  }, [pathname, currentPath]);

  const value = useMemo(() => ({
    isTransitioning,
    setTransitioning,
    previousPath,
    currentPath,
  }), [isTransitioning, previousPath, currentPath]);

  return (
    <PageTransitionContext.Provider value={value}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transitionSettings}
          className="min-h-screen hardware-accelerated"
          style={{ willChange: 'opacity' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </PageTransitionContext.Provider>
  );
} 