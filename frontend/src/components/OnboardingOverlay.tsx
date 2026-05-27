'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import logger from '../utils/logger';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileService } from '../services/profile-service';

interface OnboardingOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
}

// ─── Sacred Flame SVG ───────────────────────────────────────────────────────
function SacredFlame() {
  return (
    <svg
      viewBox="0 0 80 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <radialGradient id="flameGlow" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#FFF7AA" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="flameCore" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="45%" stopColor="#F5D76E" />
          <stop offset="100%" stopColor="#FFFDE7" />
        </linearGradient>
        <linearGradient id="flameOuter" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#B8860B" />
          <stop offset="60%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#FFF176" />
        </linearGradient>
        <filter id="flameSoftGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glow base */}
      <ellipse cx="40" cy="88" rx="28" ry="8" fill="url(#flameGlow)" />

      {/* Outer flame */}
      <path
        d="M40 8 C28 28 14 40 18 62 C20 74 30 88 40 88 C50 88 60 74 62 62 C66 40 52 28 40 8Z"
        fill="url(#flameOuter)"
        filter="url(#flameSoftGlow)"
        opacity="0.85"
      />

      {/* Inner flame (brighter core) */}
      <path
        d="M40 28 C34 40 26 52 30 65 C32 74 36 84 40 84 C44 84 48 74 50 65 C54 52 46 40 40 28Z"
        fill="url(#flameCore)"
        opacity="0.95"
      />

      {/* Bright tip */}
      <ellipse cx="40" cy="32" rx="4" ry="6" fill="#FFFDE7" opacity="0.9" />
    </svg>
  );
}

// ─── Letter-by-letter text reveal ───────────────────────────────────────────
function AnimatedText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const chars = text.split('');
  return (
    <span className={className} aria-label={text}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: delay + i * 0.045,
            duration: 0.35,
            ease: 'easeOut',
          }}
          style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function OnboardingOverlay({ isVisible, onComplete }: OnboardingOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const confettiRootRef = useRef<HTMLDivElement | null>(null);

  const handleOnboardingComplete = async () => {
    try {
      await ProfileService.updateOnboardingMessage(true);
    } catch (error) {
      logger.error('❌ Error updating onboarding message:', error);
    }
    onComplete();
  };

  useEffect(() => {
    if (!isVisible) return;
    const confettiDelay = setTimeout(() => {
      if (showConfetti && typeof window !== 'undefined' && (window as any).party) {
        const party = (window as any).party;
        const target = confettiRootRef.current || document.body;
        party.confetti(target, {
          count: 80,
          spread: 60,
          origin: { y: 0.5 },
          startVelocity: 20,
          colors: ['#D4AF37', '#F5E6BE', '#C5A028', '#FFF7AA'],
        });
        const stopTimeout = setTimeout(() => setShowConfetti(false), 4000);
        (window as any).__onboarding_confetti_handles = { stopTimeout };
      }
    }, 1800);
    return () => {
      clearTimeout(confettiDelay);
      const handles = (window as any).__onboarding_confetti_handles;
      if (handles) {
        Object.values(handles).forEach((h: any) => clearTimeout(h));
        delete (window as any).__onboarding_confetti_handles;
      }
    };
  }, [isVisible, showConfetti]);

  useEffect(() => {
    if (!isVisible) return;
    const prevOverflow = document.body.style.overflow;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow || ''; };
  }, [isVisible]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleStart = () => {
    setIsClosing(true);
    setShowConfetti(false);
    setTimeout(() => handleOnboardingComplete(), 400);
  };

  if (!isVisible || !mounted) return null;

  const overlayJSX = (
    <AnimatePresence>
      {!isClosing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6 overflow-hidden"
          style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a1200 0%, #0a0800 100%)' }}
        >
          <div ref={confettiRootRef} className="absolute inset-0 z-0 pointer-events-none" />

          {/* Ambient candlelight glow on the background */}
          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[20%] left-1/2 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%)' }}
          />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.92, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 1.04, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 180, delay: 0.1 }}
            className="relative z-10 w-full max-w-sm text-center"
          >
            {/* ── Flame Icon ── */}
            <div className="flex flex-col items-center mb-6">
              {/* Flame glow halo */}
              <motion.div
                animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-28 h-28 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.35) 0%, transparent 70%)', top: '0', left: '50%', transform: 'translateX(-50%)' }}
              />

              {/* Flame SVG with flicker */}
              <motion.div
                animate={{ scaleX: [1, 1.04, 0.97, 1.03, 1], skewX: [0, 1, -1, 0.5, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-16 h-20 relative z-10"
              >
                <SacredFlame />
              </motion.div>
            </div>

            {/* ── Brand Name ── */}
            <div className="mb-1">
              <motion.p
                initial={{ opacity: 0, letterSpacing: '0.4em' }}
                animate={{ opacity: 1, letterSpacing: '0.25em' }}
                transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }}
                className="text-[10px] uppercase text-royal-gold/50 tracking-[0.25em] mb-3 font-medium"
              >
                ✦ &nbsp;Welcome to&nbsp; ✦
              </motion.p>

              <h2 className="text-3xl font-playfair font-bold leading-tight mb-1">
                <AnimatedText
                  text="Shaadi Mantrana"
                  className="text-royal-gold"
                  delay={0.7}
                />
              </h2>
            </div>

            {/* Decorative divider */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.8, ease: 'easeOut' }}
              className="flex items-center justify-center gap-3 my-5"
            >
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-royal-gold/40" />
              <span className="text-royal-gold/60 text-xs">✦</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-royal-gold/40" />
            </motion.div>

            {/* ── Body Text ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.9, duration: 0.7, ease: 'easeOut' }}
              className="space-y-3 text-royal-gold-light/70 text-sm leading-relaxed mb-9 px-3"
            >
              <p>We are honoured to accompany you on this sacred journey of union.</p>
              <p>
                To find your destined match, we invite you to complete your{' '}
                <span className="text-royal-gold font-semibold">Sacred Profile</span>.
              </p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-royal-gold/35 pt-1">
                Refined &nbsp;·&nbsp; Secure &nbsp;·&nbsp; Authentic
              </p>
            </motion.div>

            {/* ── CTA Button ── */}
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.4, duration: 0.6, ease: 'easeOut' }}
              onClick={handleStart}
              className="w-full group relative overflow-hidden rounded-xl font-bold transition-all duration-500 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #F5D76E 50%, #B8860B 100%)',
                padding: '14px 32px',
                color: '#0a0800',
                boxShadow: '0 0 0 1px rgba(212,175,55,0.3), 0 8px 32px rgba(212,175,55,0.25)',
              }}
              whileHover={{ boxShadow: '0 0 0 1px rgba(212,175,55,0.6), 0 8px 40px rgba(212,175,55,0.45)' }}
            >
              <span className="relative z-10 text-base tracking-wide">Light the Sacred Flame ✦</span>
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(overlayJSX, document.body);
}