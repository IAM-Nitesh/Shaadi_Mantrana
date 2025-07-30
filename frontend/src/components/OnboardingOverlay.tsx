'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import Link from 'next/link';
import CustomIcon from './CustomIcon';
import HeartbeatLoader from './HeartbeatLoader';
import confetti from 'canvas-confetti';

interface OnboardingOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
  profileCompletion: number;
}

export default function OnboardingOverlay({ isVisible, onComplete, profileCompletion }: OnboardingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const overlayRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const onboardingSteps = [
    {
      title: "Welcome to Shaadi Mantra! 🎉",
      message: "We're excited to help you find your perfect match. Let's start by setting up your profile.",
      icon: "heart",
      duration: 3000
    },
    {
      title: "Complete Your Profile 📝",
      message: "Your profile is your first impression. Let's make it count by adding your details.",
      icon: "user",
      duration: 3000
    },
    {
      title: "Find Your Match 💕",
      message: "Once your profile is complete, you'll be able to discover and connect with potential matches.",
      icon: "search",
      duration: 3000
    },
    {
      title: "Ready to Begin? 🚀",
      message: "Click the button below to complete your profile and start your journey.",
      icon: "arrow-right",
      duration: 4000
    }
  ];

  useEffect(() => {
    if (!isVisible) return;

    // Reset button state when overlay becomes visible
    setIsButtonEnabled(false);
    setTimeRemaining(15);

    // Start the onboarding sequence
    const startOnboarding = async () => {
      // Initial animation
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: "power2.out" }
      );

      // Trigger confetti animation immediately when overlay becomes visible
      if (typeof window !== 'undefined') {
        // Create a burst of confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ec4899', '#f97316', '#8b5cf6', '#06b6d4', '#10b981'],
          zIndex: 9999
        });

        // Add a second burst after a short delay
        setTimeout(() => {
          confetti({
            particleCount: 50,
            spread: 50,
            origin: { y: 0.7 },
            colors: ['#f43f5e', '#e879f9', '#f59e0b', '#84cc16', '#22d3ee'],
            zIndex: 9999
          });
        }, 500);

        // Add more confetti bursts over 10 seconds
        setTimeout(() => {
          confetti({
            particleCount: 30,
            spread: 60,
            origin: { y: 0.5 },
            colors: ['#ec4899', '#f97316', '#8b5cf6', '#06b6d4', '#10b981'],
            zIndex: 9999
          });
        }, 2000);

        setTimeout(() => {
          confetti({
            particleCount: 40,
            spread: 80,
            origin: { y: 0.8 },
            colors: ['#f43f5e', '#e879f9', '#f59e0b', '#84cc16', '#22d3ee'],
            zIndex: 9999
          });
        }, 3500);

        setTimeout(() => {
          confetti({
            particleCount: 25,
            spread: 40,
            origin: { y: 0.6 },
            colors: ['#ec4899', '#f97316', '#8b5cf6', '#06b6d4', '#10b981'],
            zIndex: 9999
          });
        }, 5000);

        setTimeout(() => {
          confetti({
            particleCount: 35,
            spread: 70,
            origin: { y: 0.7 },
            colors: ['#f43f5e', '#e879f9', '#f59e0b', '#84cc16', '#22d3ee'],
            zIndex: 9999
          });
        }, 6500);

        setTimeout(() => {
          confetti({
            particleCount: 20,
            spread: 50,
            origin: { y: 0.5 },
            colors: ['#ec4899', '#f97316', '#8b5cf6', '#06b6d4', '#10b981'],
            zIndex: 9999
          });
        }, 8000);

        setTimeout(() => {
          confetti({
            particleCount: 30,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#f43f5e', '#e879f9', '#f59e0b', '#84cc16', '#22d3ee'],
            zIndex: 9999
          });
        }, 9500);
      }

      // Step through onboarding messages
      for (let i = 0; i < onboardingSteps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, onboardingSteps[i].duration));
      }

      // Show progress bar
      setShowProgress(true);
      gsap.fromTo(progressRef.current,
        { scaleX: 0 },
        { scaleX: profileCompletion / 100, duration: 1, ease: "power2.out" }
      );

      // Start countdown timer
      const countdownInterval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setIsButtonEnabled(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Enable button after 15 seconds (total onboarding duration)
      setTimeout(() => {
        setIsButtonEnabled(true);
        clearInterval(countdownInterval);
      }, 15000);

      // Auto-complete after showing progress (but only if button is not enabled)
      setTimeout(() => {
        if (!isButtonEnabled) {
          onComplete();
        }
      }, 2000);
    };

    startOnboarding();
  }, [isVisible, profileCompletion, onboardingSteps.length, onComplete]);

  const currentStepData = onboardingSteps[currentStep];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 z-50 flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-pink-50 opacity-50"></div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-32 h-32 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg heartbeat-animation"
              >
                <CustomIcon name={currentStepData.icon} className="w-16 h-16 text-white" />
              </motion.div>

              {/* Title */}
              <motion.h2
                key={currentStep}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-2xl font-bold text-gray-800 mb-4"
              >
                {currentStepData.title}
              </motion.h2>

              {/* Message */}
              <motion.p
                key={`message-${currentStep}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-gray-600 mb-6 leading-relaxed"
              >
                {currentStepData.message}
              </motion.p>

              {/* Progress section */}
              {showProgress && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                    <span className="text-sm font-bold text-rose-600">{profileCompletion}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      ref={progressRef}
                      className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"
                      style={{ transformOrigin: 'left' }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Action button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {isButtonEnabled ? (
                  <Link
                    href="/profile"
                    onClick={onComplete}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    Let's Get Started
                    <CustomIcon name="arrow-right" className="w-5 h-5 ml-2" />
                  </Link>
                ) : (
                  <div className="flex items-center justify-center">
                    <HeartbeatLoader size="sm" showText={false} className="mr-2" />
                    <span className="text-white font-medium">Loading...</span>
                  </div>
                )}
              </motion.div>

              {/* Skip button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                onClick={isButtonEnabled ? onComplete : undefined}
                disabled={!isButtonEnabled}
                className={`mt-4 text-sm transition-colors ${
                  isButtonEnabled 
                    ? 'text-gray-500 hover:text-gray-700' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                {isButtonEnabled ? 'Skip for now' : `Please wait... (${timeRemaining}s)`}
              </motion.button>
            </div>

            {/* Floating elements - Removed red circles */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 