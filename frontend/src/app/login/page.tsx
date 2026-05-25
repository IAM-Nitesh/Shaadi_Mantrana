'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from '../../components/LoginForm';
import { safeGsap } from '../../components/SafeGsap';
import CustomIcon from '../../components/CustomIcon';

import logger from '../../utils/logger';

export default function LoginPage() {
  const { isAuthenticated, isLoading, user, redirectTo } = useAuth();
  const router = useRouter();
  
  const [isRouterReady, setIsRouterReady] = useState(false);

  // GSAP refs for animations
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const headlineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const featureCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const securityBadgeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const featuresRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  // Initialize router
  useEffect(() => {
    setIsRouterReady(true);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isRouterReady && isAuthenticated && redirectTo) {
      const target = redirectTo ?? '/';
      logger.debug('LoginPage: already authenticated, redirecting', { target });
      router.push(target);
    }
  }, [isRouterReady, isAuthenticated, redirectTo, router]);

  // GSAP animations
  useEffect(() => {
    if (!isRouterReady) return;

    const timer = setTimeout(() => {
      try {
        if (!logoRef.current || !cardRef.current) return;

        // Set initial states
        safeGsap.set?.(logoRef.current, { opacity: 0, y: 30 });
        headlineRefs.current.forEach((ref) => {
          if (ref) safeGsap.set?.(ref, { opacity: 0, y: 10 });
        });
        safeGsap.set?.(cardRef.current, { opacity: 0, scale: 0.95 });
        if (featuresRef.current) safeGsap.set?.(featuresRef.current, { opacity: 0, y: 20 });

        const tl = safeGsap.timeline?.();
        if (!tl) {
          // Fallback: make everything visible if GSAP fails
          logger.warn('LoginPage: GSAP timeline failed, using fallback visibility');
          safeGsap.set?.([logoRef.current, cardRef.current, featuresRef.current], { opacity: 1, y: 0, scale: 1 });
          headlineRefs.current.forEach(ref => ref && safeGsap.set?.(ref, { opacity: 1, y: 0 }));
          return;
        }

        tl.to?.(logoRef.current, { opacity: 1, y: 0, duration: 1, ease: "power3.out" })
          .to?.(headlineRefs.current, { opacity: 1, y: 0, stagger: 0.1, duration: 0.5 }, "-=0.5")
          .to?.(cardRef.current, { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.2)" }, "-=0.3")
          .to?.(featuresRef.current, { opacity: 1, y: 0, duration: 0.6 }, "-=0.4");

      } catch (error) {
        logger.error('LoginPage: animation error', error);
        // Emergency fallback on catch
        if (logoRef.current) logoRef.current.style.opacity = '1';
        if (cardRef.current) cardRef.current.style.opacity = '1';
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isRouterReady]);

  // Show login form (isLoading is handled internally by components or as an overlay if needed)

  // Show login form
  return (
    <div className="min-h-screen bg-royal-obsidian relative selection:bg-royal-gold/30 flex flex-col overflow-hidden">
      {/* Background with Dark Royal Gradient */}
      <div ref={backgroundRef} className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-royal-gold/10 rounded-full mix-blend-screen filter blur-[80px] animate-blob"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-royal-crimson/10 rounded-full mix-blend-screen filter blur-[80px] animate-blob animation-delay-2000"></div>
      </div>

      {/* Main Content Area - Optimized for Mobile Flow */}
      <div className="relative z-10 flex-1 flex flex-col px-6 pt-[var(--safe-area-inset-top)] pb-[var(--safe-area-inset-bottom)]">
        
        {/* Top Section: Logo & Brand */}
        <div ref={logoRef} className="pt-12 pb-8 text-center space-y-3">
          <h1 className="text-4xl font-playfair font-bold tracking-tight">
            <span className="text-white">Shaadi</span>
            <span className="text-royal-gold">Mantrana</span>
          </h1>
          <p className="text-royal-gold/60 font-medium tracking-[0.3em] uppercase text-[10px]">
            The Sacred Counsel
          </p>
          <div className="flex items-center justify-center space-x-3 pt-1">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-royal-gold/40"></div>
            <p className="text-gray-400 text-[11px] font-light italic whitespace-nowrap">
              {["Your", "journey", "to", "forever"].map((word, i) => (
                <span 
                  key={i} 
                  className="inline-block mr-1" 
                  ref={el => { headlineRefs.current[i] = el; }}
                >
                  {word}
                </span>
              ))}
            </p>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-royal-gold/40"></div>
          </div>
        </div>

        {/* Middle Section: Login Card - Mobile Focused */}
        <div ref={cardRef} className="flex-1 flex items-center justify-center w-full max-w-md mx-auto">
          <div className="w-full">
            <LoginForm />
          </div>
        </div>

        {/* Bottom Section: Trust Bar & Legal */}
        <div className="mt-auto pb-8 space-y-6">
          {/* Premium Trust Bar */}
          <div 
            ref={featuresRef}
            className="flex items-center justify-around py-4 px-2 bg-royal-glass backdrop-blur-xl rounded-2xl border border-royal-glass-border shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-royal-gold/5 to-transparent pointer-events-none"></div>
            
            <div className="flex flex-col items-center space-y-2 z-10">
              <CustomIcon name="ri-heart-line" className="text-3xl text-royal-gold" color="#D4AF37" />
              <span className="text-[9px] text-royal-gold-light uppercase tracking-widest font-medium">Sacred</span>
            </div>
            
            <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-royal-gold/20 to-transparent"></div>
            
            <div className="flex flex-col items-center space-y-2 z-10">
              <CustomIcon name="ri-shield-check-line" className="text-3xl text-royal-gold" color="#D4AF37" />
              <span className="text-[9px] text-royal-gold-light uppercase tracking-widest font-medium">Verified</span>
            </div>
            
            <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-royal-gold/20 to-transparent"></div>
            
            <div className="flex flex-col items-center space-y-2 z-10">
              <CustomIcon name="ri-lock-line" className="text-3xl text-royal-gold" color="#D4AF37" />
              <span className="text-[9px] text-royal-gold-light uppercase tracking-widest font-medium">Secure</span>
            </div>
          </div>

          {/* Legal Links */}
          <div className="text-center">
            <p className="text-gray-500 text-[10px] leading-relaxed">
              By continuing, you agree to our{' '}
              <a href="/terms" className="text-royal-gold/80 transition-colors underline underline-offset-2 decoration-royal-gold/20">
                Terms
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-royal-gold/80 transition-colors underline underline-offset-2 decoration-royal-gold/20">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
