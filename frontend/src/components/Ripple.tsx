'use client';

import React, { useState, useLayoutEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface RippleType {
  x: number;
  y: number;
  id: number;
}

export const useRipple = () => {
  const [ripples, setRipples] = useState<RippleType[]>([]);

  const addRipple = (event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    const trigger = event.currentTarget;
    const rect = trigger.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = (event as React.MouseEvent).clientX;
      clientY = (event as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setRipples((prev) => [...prev, { x, y, id: Date.now() }]);
  };

  const removeRipple = (id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  };

  return { ripples, addRipple, removeRipple };
};

export const RippleEffect = ({ ripples, removeRipple, color = 'rgba(255, 255, 255, 0.3)' }: { ripples: RippleType[], removeRipple: (id: number) => void, color?: string }) => {
  return (
    <AnimatePresence>
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          initial={{ top: ripple.y, left: ripple.x, scale: 0, opacity: 0.5 }}
          animate={{ scale: 3, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          onAnimationComplete={() => removeRipple(ripple.id)}
          className="absolute rounded-full pointer-events-none"
          style={{
            backgroundColor: color,
            width: 100,
            height: 100,
            marginTop: -50,
            marginLeft: -50,
            zIndex: 0,
          }}
        />
      ))}
    </AnimatePresence>
  );
};
