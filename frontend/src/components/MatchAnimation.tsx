'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomIcon from './CustomIcon';

interface MatchAnimationProps {
  isVisible: boolean;
  onClose: () => void;
  matchName?: string;
}

export default function MatchAnimation({ isVisible, onClose, matchName }: MatchAnimationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -20,
                  rotate: 0,
                }}
                animate={{
                  y: window.innerHeight + 20,
                  rotate: 360,
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  ease: "easeOut",
                  delay: Math.random() * 0.5,
                }}
              />
            ))}
          </div>
        )}

        {/* Main Match Card */}
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-md mx-4 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pulsing Heart Background */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-gradient-to-br from-rose-100 to-pink-100 rounded-3xl"
          />

          {/* Main Content */}
          <div className="relative z-10">
            {/* Heart Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2,
              }}
              className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg"
            >
              <CustomIcon 
                name="ri-heart-fill" 
                className="text-white text-4xl"
              />
            </motion.div>

            {/* Match Text */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold text-gray-800 mb-2"
            >
              It's a Match! 🎉
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-lg text-gray-600 mb-6"
            >
              {matchName ? `You and ${matchName} liked each other!` : 'You both liked each other!'}
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col space-y-3"
            >
              <button
                onClick={() => {
                  // Direct user to Matches page to start conversations
                  try {
                    window.location.href = '/matches';
                  } catch (e) {
                    // fallback: no-op
                  }
                }}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-rose-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <CustomIcon name="ri-chat-3-line" className="inline mr-2" />
                Start Chatting
              </button>
              
              <button
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
              >
                Keep Swiping
              </button>
            </motion.div>
          </div>

          {/* Floating Hearts */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-rose-400"
                initial={{
                  x: Math.random() * 300 + 50,
                  y: Math.random() * 200 + 50,
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  y: -100,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              >
                <CustomIcon name="ri-heart-line" className="text-2xl" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 