'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation, useDragControls } from 'framer-motion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  fullHeight?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  fullHeight = false,
}) => {
  const controls = useAnimation();
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      controls.start('visible');
    } else {
      document.body.style.overflow = '';
      controls.start('hidden');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, controls]);

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100;
    if (info.offset.y > threshold || info.velocity.y > 500) {
      onClose();
    } else {
      controls.start('visible');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            initial="hidden"
            animate={controls}
            exit="hidden"
            variants={{
              visible: { y: 0, transition: { type: 'spring', damping: 25, stiffness: 200 } },
              hidden: { y: '100%', transition: { type: 'spring', damping: 25, stiffness: 200 } },
            }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className={`fixed bottom-0 left-0 right-0 z-[101] bg-royal-obsidian border-t border-royal-glass-border rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col ${
              fullHeight ? 'h-[90vh]' : 'max-h-[90vh]'
            }`}
          >
            {/* Drag Handle Area */}
            <div
              className="w-full pt-3 pb-4 flex justify-center cursor-grab touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-12 h-1.5 bg-royal-gold/30 rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="px-6 pb-4 flex justify-between items-center border-b border-royal-glass-border/50">
                <h3 className="text-xl font-playfair font-bold text-royal-gold">{title}</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-royal-glass/20 flex items-center justify-center text-royal-gold-light hover:bg-royal-glass/40 transition-colors"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-8 pt-4 custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
