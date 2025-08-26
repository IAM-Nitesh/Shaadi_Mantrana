'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import logger from '../utils/logger';
import { motion, AnimatePresence } from 'framer-motion';
import CustomIcon from './CustomIcon';
import Image from 'next/image';
import { ProfileService } from '../services/profile-service';

interface OnboardingOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
}

export default function OnboardingOverlay({ isVisible, onComplete }: OnboardingOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(8);
  const [isClosing, setIsClosing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const confettiRootRef = useRef<HTMLDivElement | null>(null);

  const handleOnboardingComplete = async () => {
    try {
      // Mark onboarding message as seen in backend
      const success = await ProfileService.updateOnboardingMessage(true);
      if (success) {
    logger.debug('✅ Onboarding message marked as seen in backend');
      } else {
    logger.warn('⚠️ Failed to update onboarding message in backend, but continuing');
      }
    } catch (error) {
    logger.error('❌ Error updating onboarding message:', error);
    }

    // Call the original onComplete function
    onComplete();
  };

  useEffect(() => {
    if (!isVisible) return;

    // Delay confetti animation by 2 seconds to let user read content first
    const confettiDelay = setTimeout(() => {
      // Trigger party-js burst confetti animation into an internal container so it stays behind the modal
      if (showConfetti && typeof window !== 'undefined' && (window as any).party) {
        const party = (window as any).party;
        const target = confettiRootRef.current || document.body;

        // Initial massive burst from center
        party.confetti(target, {
          count: 200,
          spread: 90,
          origin: { y: 0.6 },
          startVelocity: 35,
          colors: ['#FFD1DC', '#FFF0F5', '#FADADD', '#FFE5B4', '#B5EAD7']
        });

        // Multiple burst points for more dynamic effect
        const leftTimeout = setTimeout(() => {
          party.confetti(target, {
            count: 80,
            spread: 60,
            origin: { x: 0.2, y: 0.7 },
            startVelocity: 30,
            colors: ['#FFD1DC', '#FFF0F5', '#FADADD', '#FFE5B4', '#B5EAD7']
          });
        }, 200);

        const rightTimeout = setTimeout(() => {
          party.confetti(target, {
            count: 80,
            spread: 60,
            origin: { x: 0.8, y: 0.7 },
            startVelocity: 30,
            colors: ['#FFD1DC', '#FFF0F5', '#FADADD', '#FFE5B4', '#B5EAD7']
          });
        }, 400);

        // Continuous confetti bursts for sustained effect
        let confettiInterval: any = null;
        confettiInterval = setInterval(() => {
          const randomX = Math.random() * 0.8 + 0.1;
          const randomY = Math.random() * 0.3 + 0.5;
          party.confetti(target, {
            count: 40,
            spread: 50,
            origin: { x: randomX, y: randomY },
            startVelocity: 25,
            colors: ['#FFD1DC', '#FFF0F5', '#FADADD', '#FFE5B4', '#B5EAD7']
          });
        }, 400);

        // Stop confetti after 6 seconds (since we started 2 seconds later)
        const stopTimeout = setTimeout(() => {
          if (confettiInterval) clearInterval(confettiInterval);
          setShowConfetti(false);
        }, 6000);

        // Store cleanup handles on the window so the outer cleanup can clear them if needed
        (window as any).__onboarding_confetti_handles = { confettiInterval, leftTimeout, rightTimeout, stopTimeout };
      }
    }, 2000); // 2 second delay

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsClosing(true);
          setTimeout(() => {
            handleOnboardingComplete();
          }, 100); // Ultra fast exit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearTimeout(confettiDelay);
      // Clear any confetti handles if present
      const handles = (window as any).__onboarding_confetti_handles;
      if (handles) {
        try {
          if (handles.confettiInterval) clearInterval(handles.confettiInterval);
          if (handles.leftTimeout) clearTimeout(handles.leftTimeout);
          if (handles.rightTimeout) clearTimeout(handles.rightTimeout);
          if (handles.stopTimeout) clearTimeout(handles.stopTimeout);
        } catch (e) {
          // ignore
        }
        delete (window as any).__onboarding_confetti_handles;
      }
    };
  }, [isVisible, showConfetti]);

  // Ensure overlay is visible at the top of the viewport: scroll to top and disable background scroll
  useEffect(() => {
    if (!isVisible) return;
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;

    // Scroll to top to ensure fixed overlay is visible even if ancestors create containing blocks
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch (e) {
      // ignore
    }

    // Lock background scroll while overlay is visible
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      // Restore previous styles
      document.body.style.overflow = prevOverflow || '';
      document.body.style.overscrollBehavior = prevOverscroll || '';
    };
  }, [isVisible]);

  // Ensure we only portal on the client after mount
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSkip = () => {
    setIsClosing(true);
    setShowConfetti(false);
    setTimeout(() => {
      handleOnboardingComplete();
    }, 50); // Instant response
  };

  if (!isVisible) return null;

  const overlayJSX = (
    <AnimatePresence>
      {!isClosing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }} // Instant fade
          className="fixed inset-0 backdrop-blur-md bg-black/20 z-20 flex items-center justify-center p-4 pointer-events-auto"
        >
          {/* Confetti render root - confetti will be rendered here so it stays behind modal */}
          <div ref={confettiRootRef} className="absolute inset-0 z-40 pointer-events-none" />

          {/* Modal container wrapper (non-animated) to center the animated modal reliably */}
          <div style={{ position: 'fixed', left: 0, right: 0, top: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)', display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 99999 }}>
            <motion.div
              // Animated modal (no fixed/translate styles here so framer motion won't remove centering)
              initial={{ scale: 0.98, y: 2 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 2 }}
              transition={{ 
                duration: 0.1, // Instant modal animation
                ease: "easeOut"
              }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full text-center shadow-2xl border border-rose-100/60 overflow-hidden z-[99999] box-border"
              style={{ pointerEvents: 'auto', position: 'relative', margin: '0 auto', width: '100%', maxWidth: 'min(28rem, calc(100% - 2rem))', boxSizing: 'border-box' }}
            >
            <div className="relative z-10">
              {/* Brand Logo with Instant Heartbeat Animation */}
              <div className="mb-6">
                <motion.div
                  className="w-32 h-32 mx-auto bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center shadow-2xl border-4 border-white"
                  animate={{
                    scale: [1, 1.01, 1], // Minimal scale for instant feel
                    boxShadow: [
                      "0 0 0 0 rgba(236, 72, 153, 0.4)",
                      "0 0 0 8px rgba(236, 72, 153, 0)", // Minimal shadow
                      "0 0 0 0 rgba(236, 72, 153, 0)"
                    ]
                  }}
                  transition={{
                    duration: 0.8, // Faster heartbeat
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Image
                    src="/icon.svg"
                    alt="Shaadi Mantrana"
                    width={80}
                    height={80}
                    className="heartbeat-animation"
                  />
                </motion.div>
              </div>

              {/* Title - Instant Appearance */}
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }} // Instant appearance
                className="text-3xl font-bold mb-4 text-gray-900 leading-tight"
              >
                Welcome to Shaadi Mantrana!
              </motion.h2>

              {/* New onboarding message content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
                className="text-gray-700 mb-6 leading-relaxed text-base max-w-lg mx-auto text-left space-y-4"
              >
                <p>We're thrilled to have you here!</p>

                <p>
                  To help you find the perfect match within our community, please take a few moments to complete your profile. The more accurate and detailed your information, the better your chances of finding meaningful connections.
                </p>

                <p>
                  Start now to unlock profiles and begin your matchmaking journey!
                </p>

                <p className="font-medium">Let's make your search simple, secure, and successful.</p>
              </motion.div>

              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors"
                >
                  Start now
                </button>

                {/* Skip button removed - onboarding requires action */}
              </div>
            </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(overlayJSX, document.body);
} 