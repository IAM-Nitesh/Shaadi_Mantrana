'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePageTransition } from './PageTransitionProvider';
import { usePageDataLoading } from './PageDataLoadingProvider';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export default function PageLoadingIndicator() {
  const { isTransitioning } = usePageTransition();
  const { isPageDataLoaded } = usePageDataLoading();
  const pathname = usePathname();
  const show = isTransitioning || !isPageDataLoaded;

  // Performance optimization: Memoized should hide logic
  const shouldHide = useMemo(() => {
    // Don't show on authentication loading pages (ServerAuthGuard)
    if (pathname === '/' || pathname === '/login') {
      return true;
    }
    
    // Don't show on onboarding pages
    if (pathname === '/profile' && !isPageDataLoaded) {
      return true;
    }
    
    // Don't show on initial app loading
    if (pathname === '/' && !isPageDataLoaded) {
      return true;
    }
    
    return false;
  }, [pathname, isPageDataLoaded]);

  // Don't render if we should hide the indicator
  if (shouldHide) {
    return null;
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed left-0 right-0 z-[60] pointer-events-none flex flex-col items-center loading-fast hardware-accelerated"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
          initial={{ opacity: 0, y: 10 }} // Minimal movement
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }} // Minimal movement
          transition={{ duration: 0.12, ease: [0.25, 0.46, 0.45, 0.94] }} // Fast, smooth transition
        >
          {/* Simplified progress bar */}
          <div className="h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 shadow-lg mx-4 rounded-full overflow-hidden w-full max-w-md">
            <motion.div
              className="h-full bg-gradient-to-r from-white/20 to-white/40"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{
                duration: 0.6, // Faster progress animation
                ease: 'easeInOut',
                repeat: Infinity,
                repeatType: 'reverse'
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 