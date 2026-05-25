'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import logger from '../utils/logger';
import { motion, AnimatePresence } from 'framer-motion';
import RoyalIcon from './RoyalIcon';
import { ProfileService } from '../services/profile-service';

interface OnboardingOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
}

export default function OnboardingOverlay({ isVisible, onComplete }: OnboardingOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const confettiRootRef = useRef<HTMLDivElement | null>(null);

  const handleOnboardingComplete = async () => {
    try {
      // Mark onboarding message as seen in backend
      await ProfileService.updateOnboardingMessage(true);
    } catch (error) {
      logger.error('❌ Error updating onboarding message:', error);
    }
    onComplete();
  };

  useEffect(() => {
    if (!isVisible) return;

    // Delay gold confetti animation
    const confettiDelay = setTimeout(() => {
      if (showConfetti && typeof window !== 'undefined' && (window as any).party) {
        const party = (window as any).party;
        const target = confettiRootRef.current || document.body;

        // Royal Gold Confetti
        party.confetti(target, {
          count: 150,
          spread: 80,
          origin: { y: 0.6 },
          startVelocity: 35,
          colors: ['#D4AF37', '#F5E6BE', '#C5A028', '#8B7355'] // Gold palette
        });

        const leftTimeout = setTimeout(() => {
          party.confetti(target, {
            count: 60,
            spread: 50,
            origin: { x: 0.2, y: 0.7 },
            colors: ['#D4AF37', '#F5E6BE']
          });
        }, 300);

        const rightTimeout = setTimeout(() => {
          party.confetti(target, {
            count: 60,
            spread: 50,
            origin: { x: 0.8, y: 0.7 },
            colors: ['#D4AF37', '#F5E6BE']
          });
        }, 500);

        const stopTimeout = setTimeout(() => {
          setShowConfetti(false);
        }, 6000);

        (window as any).__onboarding_confetti_handles = { leftTimeout, rightTimeout, stopTimeout };
      }
    }, 1500);

    return () => {
      clearTimeout(confettiDelay);
      const handles = (window as any).__onboarding_confetti_handles;
      if (handles) {
        Object.values(handles).forEach((h: any) => clearTimeout(h));
        delete (window as any).__onboarding_confetti_handles;
      }
    };
  }, [isVisible, showConfetti]);

  useEffect(() => {
    if (!isVisible) return;
    const prevOverflow = document.body.style.overflow;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow || '';
    };
  }, [isVisible]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleStart = () => {
    setIsClosing(true);
    setShowConfetti(false);
    setTimeout(() => {
      handleOnboardingComplete();
    }, 400);
  };

  if (!isVisible || !mounted) return null;

  const overlayJSX = (
    <AnimatePresence>
      {!isClosing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-royal-obsidian/95 backdrop-blur-xl"
        >
          <div ref={confettiRootRef} className="absolute inset-0 z-0 pointer-events-none" />

          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 1.05, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative z-10 w-full max-w-lg bg-royal-obsidian border border-royal-gold/20 rounded-[2rem] p-8 text-center shadow-[0_0_50px_rgba(212,175,55,0.1)] overflow-hidden"
          >
            {/* Background Mandala Accent */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-royal-gold/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-royal-gold/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Royal Emblem */}
              <div className="mb-8 relative">
                <motion.div
                  animate={{ 
                    boxShadow: ["0 0 0 0px rgba(212,175,55,0.2)", "0 0 0 20px rgba(212,175,55,0)"],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-24 h-24 mx-auto bg-gradient-to-br from-royal-gold/20 to-transparent rounded-full flex items-center justify-center border border-royal-gold/30 p-5"
                >
                  <RoyalIcon size="3xl" />
                </motion.div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-royal-gold/10 rounded-full animate-spin-slow" />
              </div>

              {/* Typography */}
              <h2 className="text-3xl font-playfair font-bold text-royal-gold mb-4 leading-tight">
                Welcome to the Royal Court
              </h2>

              <div className="space-y-4 text-royal-gold-light/80 text-sm leading-relaxed mb-10 px-4">
                <p>We are honored to accompany you on this sacred journey of union.</p>
                <p>
                  To find your destined match within our elite community, we invite you to begin your <span className="text-royal-gold font-medium">Sacred Profiling</span>.
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-royal-gold/40">
                  Refined • Secure • Authentic
                </p>
              </div>

              {/* Action */}
              <button
                onClick={handleStart}
                className="w-full group relative overflow-hidden bg-royal-gold text-royal-obsidian py-4 px-8 rounded-xl font-bold transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] active:scale-95"
              >
                <span className="relative z-10">Begin Sacred Profiling</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(overlayJSX, document.body);
}