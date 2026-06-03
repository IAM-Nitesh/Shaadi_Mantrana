'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SwipeTutorialOverlay() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already seen the tutorial
    const hasSeen = localStorage.getItem('hasSeenSwipeTutorial');
    if (!hasSeen) {
      // Small delay so it appears after the initial load/render
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('hasSeenSwipeTutorial', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-royal-obsidian/80 backdrop-blur-sm touch-none cursor-pointer"
          onClick={handleDismiss}
        >
          <div className="flex flex-col items-center justify-center space-y-12 w-full max-w-sm px-6">
            
            <div className="text-center">
              <h2 className="text-2xl font-playfair font-bold text-royal-gold mb-2">Majestic Journey</h2>
              <p className="text-royal-gold-light/80 font-inter">Let destiny guide your path.</p>
            </div>

            <div className="relative w-full h-64 border border-royal-gold/20 rounded-2xl bg-royal-glass/30 flex items-center justify-center overflow-hidden">
              {/* Animated hand demonstrating swipe */}
              <motion.div
                className="absolute text-5xl"
                animate={{
                  x: [0, 80, 0, -80, 0],
                  scale: [1, 0.9, 1, 0.9, 1],
                  rotate: [0, 15, 0, -15, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                👆
              </motion.div>
              
              {/* Labels */}
              <motion.div 
                className="absolute right-4 text-emerald-400 font-bold tracking-widest text-sm uppercase opacity-50"
                animate={{ opacity: [0.3, 1, 0.3, 0.3, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", times: [0, 0.25, 0.5, 0.75, 1] }}
              >
                Like
              </motion.div>

              <motion.div 
                className="absolute left-4 text-rose-400 font-bold tracking-widest text-sm uppercase opacity-50"
                animate={{ opacity: [0.3, 0.3, 0.3, 1, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", times: [0, 0.25, 0.5, 0.75, 1] }}
              >
                Pass
              </motion.div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-white font-medium">Swipe <span className="text-emerald-400">Right</span> to Like</p>
              <p className="text-white font-medium">Swipe <span className="text-rose-400">Left</span> to Pass</p>
            </div>

            <button
              onClick={handleDismiss}
              className="mt-8 px-8 py-3 bg-royal-gold/20 border border-royal-gold/50 rounded-full text-royal-gold font-bold hover:bg-royal-gold hover:text-royal-obsidian transition-colors shadow-lg"
            >
              Start Exploring
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
