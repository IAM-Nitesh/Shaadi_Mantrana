'use client';

import React from 'react';
import { useRipple, RippleEffect } from './Ripple';
import HapticsService from '../services/hapticsService';

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  rippleColor?: string;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'selection' | 'none';
}

export const RippleButton = React.forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ children, className = '', onClick, rippleColor, hapticFeedback = 'light', ...props }, ref) => {
    const { ripples, addRipple, removeRipple } = useRipple();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Add visual ripple
      addRipple(e);

      // Trigger haptic feedback
      if (hapticFeedback !== 'none') {
        switch (hapticFeedback) {
          case 'light':
            HapticsService.impactLight();
            break;
          case 'medium':
            HapticsService.impactMedium();
            break;
          case 'heavy':
            HapticsService.impactHeavy();
            break;
          case 'selection':
            HapticsService.selection();
            break;
        }
      }

      // Call original onClick
      if (onClick) {
        onClick(e);
      }
    };

    return (
      <button
        ref={ref}
        className={`relative overflow-hidden ${className}`}
        onClick={handleClick}
        {...props}
      >
        {children}
        <RippleEffect ripples={ripples} removeRipple={removeRipple} color={rippleColor} />
      </button>
    );
  }
);

RippleButton.displayName = 'RippleButton';
