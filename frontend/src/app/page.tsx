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
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-royal-obsidian overflow-hidden"
          >
            {/* Celestial Aura Background */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
                rotate: [0, 180, 360]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-royal-gold/10 rounded-full blur-[80px]"
            />
            <motion.div
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.5, 0.2],
                rotate: [360, 180, 0]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-royal-crimson/5 rounded-full blur-[100px]"
            />

            {/* Main Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="relative z-10 drop-shadow-[0_0_40px_rgba(212,175,55,0.4)] mb-8"
            >
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-64 h-64 md:w-80 md:h-80"
              >
                <img
                  src="/logo_splash.png"
                  alt="Shaadi Mantrana Logo"
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </motion.div>
            </motion.div>

            {/* Typography */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="text-center z-10 space-y-4 px-4"
            >
              <h1 className="text-4xl md:text-5xl font-playfair font-bold text-transparent bg-clip-text bg-gradient-to-r from-royal-gold via-white to-royal-gold-light tracking-wider drop-shadow-lg">
                Shaadi Mantrana
              </h1>
              <div className="flex flex-col items-center space-y-3 mt-4">
                <motion.p 
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="text-sm md:text-base font-inter text-royal-gold-light/80 tracking-[0.3em] uppercase font-medium"
                >
                  Curating Majestic Matches
                </motion.p>
                <div className="flex justify-center space-x-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div 
                      key={i}
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 1, 0.3]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity, 
                        delay: i * 0.2,
                        ease: "easeInOut" 
                      }}
                      className="w-1.5 h-1.5 rounded-full bg-royal-gold/80"
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Floating Star Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              {[...Array(20)].map((_, i) => {
                // Deterministic pseudo-random values based on index to prevent hydration mismatch
                const pseudoRandom = (seed: number) => {
                  const x = Math.sin(seed + 1) * 10000;
                  return x - Math.floor(x);
                };
                
                const left = `${pseudoRandom(i) * 100}vw`;
                const top = `${pseudoRandom(i + 20) * 100}vh`;
                const size = pseudoRandom(i + 40) * 3 + 1;
                const duration = pseudoRandom(i + 60) * 3 + 2;
                const delay = pseudoRandom(i + 80) * 2;

                return (
                  <motion.div
                    key={`particle-${i}`}
                    className="absolute bg-royal-gold rounded-full"
                    style={{ left, top, width: size, height: size }}
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ 
                      opacity: [0, 0.8, 0],
                      y: [0, -100]
                    }}
                    transition={{
                      duration,
                      repeat: Infinity,
                      delay,
                      ease: "linear"
                    }}
                  />
                );
              })}
            </div>
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