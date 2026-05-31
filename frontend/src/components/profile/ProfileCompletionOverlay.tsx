'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MandalaBackground from '../ui/MandalaBackground';

interface ProfileCompletionOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
}

export default function ProfileCompletionOverlay({ isVisible, onComplete }: ProfileCompletionOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isVisible) {
      // Auto-dismiss after 3.5 seconds
      const timer = setTimeout(() => {
        onComplete();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[200000] bg-royal-obsidian/95 backdrop-blur-md flex flex-col items-center justify-center p-6 overflow-hidden"
          style={{ position: 'fixed' }}
        >
          {/* Background Mandala */}
          <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen blur-sm">
            <MandalaBackground rotationSpeed={180} />
          </div>
          
          <motion.div
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.2 }}
            className="relative z-10 text-center max-w-md w-full"
          >
            <div className="w-24 h-24 mx-auto mb-8 rounded-full border-2 border-royal-gold/30 bg-royal-gold/10 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.4)]">
              <motion.svg 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="w-12 h-12 text-royal-gold" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2}
              >
                <motion.path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M5 13l4 4L19 7" 
                />
              </motion.svg>
            </div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-3xl font-playfair font-bold text-royal-gold mb-4 drop-shadow-md"
            >
              Profile Complete
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-white/80 text-lg leading-relaxed font-light"
            >
              Thanks for completing your profile! You now have full access to view profiles and chat with them.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-10 flex justify-center"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-royal-gold animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-royal-gold animate-bounce mx-2" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-royal-gold animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
