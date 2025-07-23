'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface AnimatedMessageProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  isVisible: boolean;
  onClose?: () => void;
  autoHide?: boolean;
  duration?: number;
}

export const AnimatedMessage: React.FC<AnimatedMessageProps> = ({
  type,
  message,
  isVisible,
  onClose,
  autoHide = true,
  duration = 4000
}) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const getMessageConfig = () => {
    switch (type) {
      case 'success':
        return {
          bgGradient: 'from-emerald-50 to-green-50',
          borderColor: 'border-emerald-200',
          iconBg: 'bg-emerald-500',
          textColor: 'text-emerald-700',
          icon: (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ),
          emoji: '✅'
        };
      case 'error':
        return {
          bgGradient: 'from-red-50 to-rose-50',
          borderColor: 'border-red-200',
          iconBg: 'bg-red-500',
          textColor: 'text-red-700',
          icon: (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ),
          emoji: '❌'
        };
      case 'warning':
        return {
          bgGradient: 'from-amber-50 to-yellow-50',
          borderColor: 'border-amber-200',
          iconBg: 'bg-amber-500',
          textColor: 'text-amber-700',
          icon: (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
          emoji: '⚠️'
        };
      case 'info':
      default:
        return {
          bgGradient: 'from-blue-50 to-indigo-50',
          borderColor: 'border-blue-200',
          iconBg: 'bg-blue-500',
          textColor: 'text-blue-700',
          icon: (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          ),
          emoji: 'ℹ️'
        };
    }
  };

  const config = getMessageConfig();

  useEffect(() => {
    if (!messageRef.current) return;

    if (isVisible) {
      // Entrance animation
      gsap.fromTo(messageRef.current, 
        { 
          opacity: 0, 
          y: -20, 
          scale: 0.95,
          rotateX: -15
        },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          rotateX: 0,
          duration: 0.5, 
          ease: "back.out(1.7)"
        }
      );

      // Icon animation
      if (iconRef.current) {
        gsap.fromTo(iconRef.current,
          { scale: 0, rotation: -180 },
          { 
            scale: 1, 
            rotation: 0, 
            duration: 0.6, 
            ease: "elastic.out(1, 0.8)",
            delay: 0.2
          }
        );
      }

      // Content slide in
      if (contentRef.current) {
        gsap.fromTo(contentRef.current,
          { x: 20, opacity: 0 },
          { 
            x: 0, 
            opacity: 1, 
            duration: 0.4, 
            ease: "power2.out",
            delay: 0.3
          }
        );
      }

      // Auto hide
      if (autoHide && onClose) {
        const timer = setTimeout(() => {
          // Exit animation
          gsap.to(messageRef.current, {
            opacity: 0,
            y: -20,
            scale: 0.95,
            duration: 0.3,
            ease: "power2.in",
            onComplete: onClose
          });
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, autoHide, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div 
      ref={messageRef}
      className={`bg-gradient-to-r ${config.bgGradient} border-2 ${config.borderColor} rounded-xl p-4 shadow-lg backdrop-blur-sm`}
      style={{ 
        background: `linear-gradient(135deg, ${config.bgGradient.includes('emerald') ? '#ecfdf5, #d1fae5' : config.bgGradient.includes('red') ? '#fef2f2, #fecaca' : config.bgGradient.includes('amber') ? '#fffbeb, #fef3c7' : '#eff6ff, #dbeafe'})`,
      }}
    >
      <div className="flex items-center">
        <div 
          ref={iconRef}
          className={`w-8 h-8 ${config.iconBg} rounded-full flex items-center justify-center mr-3 flex-shrink-0 shadow-md`}
        >
          {config.icon}
        </div>
        <div ref={contentRef} className="flex-1">
          <p className={`${config.textColor} text-sm font-semibold flex items-center`}>
            <span className="mr-2 text-lg">{config.emoji}</span>
            {message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={() => {
              gsap.to(messageRef.current, {
                opacity: 0,
                scale: 0.95,
                duration: 0.2,
                ease: "power2.in",
                onComplete: onClose
              });
            }}
            className={`ml-3 ${config.textColor} hover:opacity-70 transition-opacity p-1`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default AnimatedMessage;
