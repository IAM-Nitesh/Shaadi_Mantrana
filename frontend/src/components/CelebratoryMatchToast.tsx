'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomIcon from './CustomIcon';

interface CelebratoryMatchToastProps {
  isVisible: boolean;
  onClose: () => void;
  matchName?: string;
  connectionId?: string;
  onStartChat?: () => void;
  onKeepSwiping?: () => void;
}

export default function CelebratoryMatchToast({ 
  isVisible, 
  onClose, 
  matchName = 'Someone',
  connectionId,
  onStartChat,
  onKeepSwiping 
}: CelebratoryMatchToastProps) {
  const [showFloatingHearts, setShowFloatingHearts] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Instant animations - no delays
      setShowFloatingHearts(true);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      
      // Auto-hide after 6 seconds (optimized timing)
      const timer = setTimeout(() => {
        onClose();
      }, 6000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const handleStartChat = () => {
    if (connectionId) {
      // Navigate to the specific chat
      window.location.href = `/chat/${connectionId}`;
    } else {
      // Fallback to matches page if no connectionId
      onStartChat?.();
    }
    onClose();
  };

  const handleKeepSwiping = () => {
    // Navigate to dashboard to continue swiping
    window.location.href = '/dashboard';
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Simplified Floating Hearts Background */}
        {showFloatingHearts && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: window.innerHeight + 20,
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  y: -50,
                  scale: [0, 1, 0],
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: 2,
                  ease: "easeOut",
                  delay: i * 0.3,
                  repeat: 1,
                }}
              >
                <img 
                  src="/icon.svg" 
                  alt="Shaadi Mantra" 
                  className="w-3 h-3 text-pink-500"
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Main Match Card - Full Screen */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 25,
            duration: 0.3,
          }}
          className="relative w-full h-full flex items-center justify-center p-8 text-center overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Main Content - Full Screen Layout */}
          <div className="relative z-10 max-w-2xl mx-auto">
            {/* Fast Animated Brand Logo */}
                          <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 20,
                  duration: 0.2,
                }}
                className="w-32 h-32 mx-auto mb-8 flex items-center justify-center relative"
              >
              {/* Main Brand Logo with Love-themed Pulse */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 0.9, 1.1, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: 1,
                  ease: "easeInOut",
                }}
                className="relative z-10"
              >
                <img 
                  src="/icon.svg" 
                  alt="Shaadi Mantra" 
                  className="w-24 h-24 text-rose-500"
                />
              </motion.div>
              
              {/* Love-themed Glow Effect */}
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-gradient-to-r from-rose-400/20 to-pink-400/20 rounded-full blur-xl"
              />
            </motion.div>

            {/* Match Text */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                It's a Match! 🎉
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                You and <span className="font-semibold text-rose-600">{matchName}</span> liked each other!
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="flex flex-col space-y-4"
            >
              <button
                onClick={handleStartChat}
                className="w-full py-4 px-6 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-2xl hover:from-rose-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-3 text-lg"
              >
                <CustomIcon name="ri-chat-3-line" className="text-xl" />
                <span>Start Chatting</span>
              </button>
              
              <button
                onClick={handleKeepSwiping}
                className="w-full py-4 px-6 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105 flex items-center justify-center text-lg"
              >
                <span>Keep Swiping</span>
              </button>
            </motion.div>


          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 