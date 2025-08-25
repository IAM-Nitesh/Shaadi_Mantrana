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
    
    // Don't show on chat pages
    if (pathname.startsWith('/chat/')) {
      return true;
    }
    
    // Don't show on help, terms, and privacy pages
    if (pathname === '/help' || pathname === '/terms' || pathname === '/privacy') {
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
    
    // Don't show when logout overlay is present
    if (typeof document !== 'undefined') {
      const logoutOverlay = document.querySelector('.logout-overlay');
      if (logoutOverlay && logoutOverlay.classList.contains('flex')) {
        return true;
      }
      
      // Don't show when filter modal is open - improved detection
      const filterModal = document.querySelector('[class*="z-[70]"]');
      const filterModalBackdrop = document.querySelector('[class*="backdrop-blur"]');
      if ((filterModal && filterModal.classList.contains('fixed')) || 
          (filterModalBackdrop && filterModalBackdrop.classList.contains('fixed'))) {
        return true;
      }
      
      // Specific check for filter modal with backdrop-blur-[2.5px]
      const specificFilterModal = document.querySelector('[class*="backdrop-blur-[2.5px]"]');
      if (specificFilterModal && specificFilterModal.classList.contains('fixed')) {
        return true;
      }
      
      // Check for filter modal content with specific classes
      const filterModalContent = document.querySelector('[class*="rounded-t-3xl"][class*="max-h-[80vh]"]');
      if (filterModalContent && filterModalContent.closest('[class*="z-[70]"]')) {
        return true;
      }
      
      // Additional check for any modal-like elements with high z-index
      const highZIndexElements = document.querySelectorAll('[class*="z-[6"], [class*="z-[7"], [class*="z-[8"], [class*="z-[9"]');
      for (const element of highZIndexElements) {
        if (element.classList.contains('fixed') && element.classList.contains('inset-0')) {
          return true;
        }
      }
      
      // Don't show when celebratory toast is visible
      const celebratoryToast = document.querySelector('[class*="z-50"][class*="backdrop-blur-md"]');
      if (celebratoryToast && celebratoryToast.classList.contains('fixed') && celebratoryToast.classList.contains('inset-0')) {
        return true;
      }
      
      // Additional check for celebratory toast with specific backdrop classes
      const toastBackdrop = document.querySelector('[class*="bg-black/60"][class*="backdrop-blur-md"]');
      if (toastBackdrop && toastBackdrop.classList.contains('fixed') && toastBackdrop.classList.contains('inset-0')) {
        return true;
      }
      
      // Check for new full-screen celebratory toast with gradient background
      const fullScreenToast = document.querySelector('[class*="z-50"][class*="bg-gradient-to-br"][class*="backdrop-blur-sm"]');
      if (fullScreenToast && fullScreenToast.classList.contains('fixed') && fullScreenToast.classList.contains('inset-0')) {
        return true;
      }
      
      // Check for any element with z-50 that covers the full screen (celebratory toast)
      const z50Elements = document.querySelectorAll('[class*="z-50"]');
      for (const element of z50Elements) {
        if (element.classList.contains('fixed') && element.classList.contains('inset-0')) {
          return true;
        }
      }
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
                      style={{ bottom: 'calc(var(--safe-area-inset-bottom) + 80px)' }}
          initial={{ opacity: 0, y: 5 }} // Minimal movement
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }} // Minimal movement
          transition={{ duration: 0.08, ease: [0.4, 0, 0.2, 1] }} // Ultra-fast transition
        >
          {/* Simplified progress bar */}
          <div className="h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 shadow-lg mx-4 rounded-full overflow-hidden w-full max-w-md">
            <motion.div
              className="h-full bg-gradient-to-r from-white/20 to-white/40"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{
                duration: 0.4, // Ultra-fast progress animation
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