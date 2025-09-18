'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { Transition, Easing } from 'framer-motion';

interface PageTransitionContextType {
  isTransitioning: boolean;
  setTransitioning: (transitioning: boolean) => void;
  previousPath: string;
  currentPath: string | null;
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
  const [currentPath, setCurrentPath] = useState<string | null>(pathname);
  // hardwareAccelerated is false during SSR to keep server HTML stable.
  // It will be enabled on the client after mount if allowed for the current path.
  const [hardwareAccelerated, setHardwareAccelerated] = useState(false);

  // Ultra-fast transition settings for instant feel (typed)
  const transitionSettings = useMemo(() => {
    const easing: Easing = [0.4, 0, 0.2, 1]; // cubic-bezier
    const t: Transition = {
      duration: 0.08,
      ease: easing,
      opacity: { duration: 0.06 },
    };
    return t;
  }, []);

  useEffect(() => {
    if (pathname !== currentPath) {
      setPreviousPath(currentPath || '');
      setCurrentPath(pathname);
      setTransitioning(true);
      
      // Ultra-fast transition time for instant experience
      const timer = setTimeout(() => {
        setTransitioning(false);
      }, 80); // Reduced to 80ms for instant feel
      
      return () => clearTimeout(timer);
    }
  }, [pathname, currentPath]);

  // Only enable the hardware-accelerated class on the client after mount
  // and only when not on admin routes. This avoids hydration mismatch
  // caused by rendering different classNames on server vs client.
  useEffect(() => {
    // run on client only
    setHardwareAccelerated(!(pathname && pathname.startsWith('/admin')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          // Avoid setting transform on admin pages because transforms create a containing block
          // which prevents position:fixed elements from being fixed to viewport in some browsers.
          // We only add the hardware-accelerated class on the client to avoid hydration mismatch.
          className={`min-h-screen ${hardwareAccelerated ? 'hardware-accelerated' : ''}`}
          style={{ willChange: 'opacity' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </PageTransitionContext.Provider>
  );
} 