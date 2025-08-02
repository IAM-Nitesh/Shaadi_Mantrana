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

  // Simplified transition settings for seamless experience
  const transitionSettings = useMemo(() => ({
    duration: 0.15, // Very fast for seamless feel
    ease: [0.25, 0.46, 0.45, 0.94], // Smooth, natural easing
    opacity: { duration: 0.12 }, // Fast opacity for instant feel
  }), []);

  useEffect(() => {
    if (pathname !== currentPath) {
      setPreviousPath(currentPath);
      setCurrentPath(pathname);
      setTransitioning(true);
      
      // Very short transition time for seamless experience
      const timer = setTimeout(() => {
        setTransitioning(false);
      }, 150); // Reduced to 150ms for instant feel
      
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
          initial={{ opacity: 0 }} // Simple fade in
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }} // Simple fade out
          transition={transitionSettings}
          className="min-h-screen"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </PageTransitionContext.Provider>
  );
} 