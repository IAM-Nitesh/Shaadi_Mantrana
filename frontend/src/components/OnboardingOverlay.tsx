'use client';

import { useEffect, useState } from 'react';
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
  const [timeLeft, setTimeLeft] = useState(8);
  const [isClosing, setIsClosing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

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
      // Trigger party-js burst confetti animation
      if (showConfetti && typeof window !== 'undefined' && (window as any).party) {
        const party = (window as any).party;
        
        // Initial massive burst from center
        party.confetti(document.body, {
          count: 200,
          spread: 90,
          origin: { y: 0.6 },
          startVelocity: 35,
          colors: ['#FFD1DC', '#FFF0F5', '#FADADD', '#FFE5B4', '#B5EAD7']
        });

        // Multiple burst points for more dynamic effect
        setTimeout(() => {
          // Left burst
          party.confetti(document.body, {
            count: 80,
            spread: 60,
            origin: { x: 0.2, y: 0.7 },
            startVelocity: 30,
            colors: ['#FFD1DC', '#FFF0F5', '#FADADD', '#FFE5B4', '#B5EAD7']
          });
        }, 200);

        setTimeout(() => {
          // Right burst
          party.confetti(document.body, {
            count: 80,
            spread: 60,
            origin: { x: 0.8, y: 0.7 },
            startVelocity: 30,
            colors: ['#FFD1DC', '#FFF0F5', '#FADADD', '#FFE5B4', '#B5EAD7']
          });
        }, 400);

        // Continuous confetti bursts for sustained effect
        const confettiInterval = setInterval(() => {
          // Random burst positions
          const randomX = Math.random() * 0.8 + 0.1; // Between 0.1 and 0.9
          const randomY = Math.random() * 0.3 + 0.5; // Between 0.5 and 0.8
          
          party.confetti(document.body, {
            count: 40,
            spread: 50,
            origin: { x: randomX, y: randomY },
            startVelocity: 25,
            colors: ['#FFD1DC', '#FFF0F5', '#FADADD', '#FFE5B4', '#B5EAD7']
          });
        }, 400); // Every 400ms for continuous effect

        // Stop confetti after 6 seconds (since we started 2 seconds later)
        setTimeout(() => {
          clearInterval(confettiInterval);
          setShowConfetti(false);
        }, 6000);

        return () => clearInterval(confettiInterval);
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
    };
  }, [isVisible, showConfetti]);

  const handleSkip = () => {
    setIsClosing(true);
    setShowConfetti(false);
    setTimeout(() => {
      handleOnboardingComplete();
    }, 50); // Instant response
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {!isClosing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }} // Instant fade
          className="fixed inset-0 backdrop-blur-md bg-black/20 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.98, y: 2 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.98, y: 2 }}
            transition={{ 
              duration: 0.1, // Instant modal animation
              ease: "easeOut"
            }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-rose-100/60 relative overflow-hidden z-20"
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
                className="text-3xl font-bold mb-4 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight"
              >
                Welcome to Shaadi Mantrana! 💕
              </motion.h2>

              {/* Message - Instant Appearance */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }} // Instant appearance
                className="text-gray-700 mb-6 leading-relaxed text-lg font-medium max-w-sm mx-auto"
              >
                We're excited to help you find your perfect match! 
                Let's start by completing your profile to get the best matches.
              </motion.p>

              {/* Features - Instant Appearance */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }} // Instant appearance
                className="space-y-4 mb-6"
              >
                <div className="flex items-center justify-center space-x-4 text-gray-700">
                  <CustomIcon name="ri-check-line" className="text-green-500 text-xl" />
                  <span className="font-medium text-left flex-1">Complete your profile for better matches</span>
                </div>
                <div className="flex items-center justify-center space-x-4 text-gray-700">
                  <CustomIcon name="ri-heart-line" className="text-rose-500 text-xl" />
                  <span className="font-medium text-left flex-1">Access Discover feature to find profiles</span>
                </div>
                <div className="flex items-center justify-center space-x-4 text-gray-700">
                  <CustomIcon name="ri-chat-3-line" className="text-blue-500 text-xl" />
                  <span className="font-medium text-left flex-1">View your matches and start conversations</span>
                </div>
              </motion.div>

              {/* Timer - Instant Appearance */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }} // Instant appearance
                className="mb-6"
              >
                <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 h-3 rounded-full"
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timeLeft / 8) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'linear' }} // Faster timer
                  />
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  {timeLeft} seconds remaining
                </p>
              </motion.div>

              {/* Skip Button - Instant Appearance */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }} // Instant appearance
                onClick={handleSkip}
                className="text-rose-500 hover:text-rose-600 font-semibold transition-all duration-50 hover:scale-105 active:scale-95 px-6 py-3 rounded-xl hover:bg-rose-50 border border-rose-200 hover:border-rose-300"
              >
                Skip (Continue to profile)
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 