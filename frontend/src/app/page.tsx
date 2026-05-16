'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import PageDataLoadingProvider, { usePageDataLoading } from '../components/PageDataLoadingProvider';
import RoyalLoader from '../components/RoyalLoader';
import { motion, AnimatePresence } from 'framer-motion';

function HomeContent() {
  const router = useRouter();
  const { user, authState, isLoading } = useAuth();
  const { setPageDataLoaded: setPageLoading } = usePageDataLoading();
  const [showSplash, setShowSplash] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  // 1. Initial 5-second Grand Hold (Production refined)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 5000); 

    return () => clearTimeout(timer);
  }, []);

  // 2. Track Auth Readiness
  useEffect(() => {
    if (!isLoading && authState !== 'checking' && authState !== 'unknown') {
      setAuthReady(true);
      setPageLoading(false);
    } else {
      setPageLoading(true);
    }
  }, [isLoading, authState, setPageLoading]);

  // 3. Navigation after Splash + Auth
  useEffect(() => {
    if (!showSplash && authReady) {
      if (authState === 'authenticated' && user) {
        if (user.isFirstLogin || (user.profileCompleteness || 0) < 50) {
          router.replace('/profile');
        } else if (user.role === 'admin') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/dashboard');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [showSplash, authReady, user, authState, router]);

  return (
    <div className="min-h-screen bg-royal-obsidian flex items-center justify-center relative overflow-hidden">
      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              scale: 1.1,
              filter: 'blur(20px)',
              transition: { duration: 1, ease: [0.43, 0.13, 0.23, 0.96] } 
            }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-royal-obsidian"
          >
            <RoyalLoader 
              variant="grand" 
              size="xl" 
              text="Invoking the Sacred Counsel..."
              opacity={1}
            />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            {/* Minimal secondary transition state if auth is still pending */}
            {!authReady && (
              <RoyalLoader variant="spark" text="Finalizing Sanctuary..." />
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-royal-gold/5 rounded-full mix-blend-screen filter blur-[120px]"></div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <PageDataLoadingProvider>
      <HomeContent />
    </PageDataLoadingProvider>
  );
}