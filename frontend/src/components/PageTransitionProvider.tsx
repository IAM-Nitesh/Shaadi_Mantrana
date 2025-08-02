'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionContextType {
  isTransitioning: boolean;
  setTransitioning: (transitioning: boolean) => void;
  previousPath: string;
  currentPath: string;
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined);

export const usePageTransition = () => {
  const context = useContext(PageTransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within a PageTransitionProvider');
  }
  return context;
};

interface PageTransitionProviderProps {
  children: ReactNode;
}

export default function PageTransitionProvider({ children }: PageTransitionProviderProps) {
  const pathname = usePathname();
  const [isTransitioning, setTransitioning] = useState(false);
  const [previousPath, setPreviousPath] = useState('');
  const [currentPath, setCurrentPath] = useState(pathname);

  useEffect(() => {
    if (pathname !== currentPath) {
      setPreviousPath(currentPath);
      setCurrentPath(pathname);
      setTransitioning(true);
      
      // Reset transition state after animation completes
      const timer = setTimeout(() => {
        setTransitioning(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [pathname, currentPath]);

  const value = {
    isTransitioning,
    setTransitioning,
    previousPath,
    currentPath,
  };

  return (
    <PageTransitionContext.Provider value={value}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0.0, 0.2, 1], // Custom easing for ultra-smooth feel
            opacity: { duration: 0.2 },
            scale: { duration: 0.25 },
          }}
          className="min-h-screen"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </PageTransitionContext.Provider>
  );
} 