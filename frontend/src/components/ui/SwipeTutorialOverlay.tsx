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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-royal-obsidian/90 backdrop-blur-md touch-none cursor-pointer"
          onClick={handleDismiss}
        >
          <div className="flex flex-col items-center justify-center space-y-12 w-full max-w-sm px-6">
            
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-playfair font-bold text-transparent bg-clip-text bg-gradient-to-r from-royal-gold-light via-royal-gold to-royal-gold-light tracking-wide">
                Majestic Connections
              </h2>
              <p className="text-royal-gold-light/60 font-inter text-sm uppercase tracking-[0.2em]">
                Master Your Destiny
              </p>
            </div>

            <div className="relative w-full h-80 flex items-center justify-center overflow-hidden">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.15)_0%,transparent_70%)]" />

              {/* Animated Card */}
              <motion.div
                className="relative w-48 h-64 rounded-2xl bg-royal-obsidian border border-royal-gold/30 shadow-[0_0_30px_rgba(212,175,55,0.15)] flex flex-col items-center justify-center overflow-hidden"
                animate={{
                  x: [0, 100, 0, -100, 0],
                  rotate: [0, 15, 0, -15, 0],
                  scale: [1, 0.95, 1, 0.95, 1]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Inner Card Details Mockup */}
                <div className="w-full h-3/4 bg-royal-gold/5 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border border-royal-gold/20 flex items-center justify-center">
                    <i className="ri-user-star-line text-3xl text-royal-gold/50" />
                  </div>
                </div>
                <div className="w-full h-1/4 bg-royal-obsidian border-t border-royal-gold/20 flex items-center justify-center">
                  <div className="w-24 h-2 rounded-full bg-royal-gold/20" />
                </div>
                
                {/* Dynamic Glow Overlay based on direction */}
                <motion.div 
                  className="absolute inset-0 bg-emerald-500 mix-blend-overlay"
                  animate={{ opacity: [0, 0.4, 0, 0, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div 
                  className="absolute inset-0 bg-rose-500 mix-blend-overlay"
                  animate={{ opacity: [0, 0, 0, 0.4, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
              
              {/* Labels & Arrows */}
              <motion.div 
                className="absolute right-0 flex flex-col items-center space-y-2"
                animate={{ opacity: [0, 1, 0, 0, 0], x: [0, 10, 0, 0, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center backdrop-blur-md">
                  <i className="ri-heart-3-fill text-xl text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                </div>
                <span className="text-emerald-400 font-bold tracking-widest text-[10px] uppercase">Like</span>
              </motion.div>

              <motion.div 
                className="absolute left-0 flex flex-col items-center space-y-2"
                animate={{ opacity: [0, 0, 0, 1, 0], x: [0, 0, 0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center backdrop-blur-md">
                  <i className="ri-close-line text-2xl text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.8)]" />
                </div>
                <span className="text-rose-400 font-bold tracking-widest text-[10px] uppercase">Pass</span>
              </motion.div>
            </div>

            <button
              onClick={handleDismiss}
              className="mt-8 px-10 py-4 bg-royal-gold text-royal-obsidian rounded-full font-bold uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            >
              Start Exploring
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
