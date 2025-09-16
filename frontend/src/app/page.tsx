'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { config as configService } from '../services/configService';
import { safeGsap } from '../components/SafeGsap';
import HeartbeatLoader from '../components/HeartbeatLoader';
import ToastService from '../services/toastService';
import logger from '../utils/logger';
import { apiClient } from '../utils/api-client';

export default function Home() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState(''); // Track last error to prevent duplicates
  const [disabledAfterFailure, setDisabledAfterFailure] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [isRouterReady, setIsRouterReady] = useState(false);
  const router = useRouter();

  // GSAP refs for animations
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const heartsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  const isApprovedEmail = async (email: string) => {
    try {
      const response = await apiClient.get(`/api/auth/preapproved/check?email=${encodeURIComponent(email.trim().toLowerCase())}`, {
        timeout: 10000
      });
      return response.data.preapproved;
    } catch (error) {
      logger.error('Error checking email approval:', error);
      return false;
    }
  };

  // Helper function to set error with unique ID to prevent duplicates
  const setErrorWithId = (message: string) => {
    // Only show toast if it's different from the last error to prevent duplicates
    if (message !== lastError) {
      ToastService.error(message);
      setLastError(message);
    }
  };

  // Helper function to clear error
  const clearError = () => {
    setLastError('');
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsRouterReady(true), 100);
    
    // Check for error parameter in URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      if (error === 'not_approved') {
        setErrorWithId('Your account has been paused. Please contact the admin for re-approval.');
        // Clear the error parameter from URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
    
    return () => clearTimeout(timer);
  }, []);



  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // GSAP animations on component mount
  useEffect(() => {
  if (typeof window !== 'undefined') {
     try {
       // Clear any existing animations (guarded)
       try {
         safeGsap.killTweensOf?.("*");
       } catch (e) {
         logger.debug('safeGsap.killTweensOf failed:', e);
       }
        
        // Initial setup - hide elements
        safeGsap.set?.([logoRef.current, cardRef.current, featuresRef.current], { 
          opacity: 0, 
          y: 30,
          scale: 0.95
        });
        
        // Simple entrance animation
  const tl = safeGsap.timeline?.({ delay: 0.3 });
        
        // Background entrance
  tl?.fromTo?.(backgroundRef.current, {
          opacity: 0
        }, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out"
        })
        // Logo entrance
  .to?.(logoRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.2)",
        }, "-=0.2")
        // Card entrance
  .to?.(cardRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.2)",
        }, "-=0.4")
        // Features entrance
  .to?.(featuresRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: "back.out(1.2)",
        }, "-=0.6");

        // Simple background hearts (reduced complexity)
        const heartsContainer = heartsRef.current;
        if (heartsContainer && heartsContainer.children) {
          Array.from(heartsContainer.children).forEach((heart, index) => {
            const heartElement = heart as HTMLElement;
            safeGsap.set?.(heartElement, { 
              y: window.innerHeight + 50, 
              opacity: 0, 
              scale: 0.5
            });
            
            // Simple floating animation
            safeGsap.to?.(heartElement, {
              y: -100,
              opacity: 0.6,
              scale: 1,
              duration: 8,
              delay: index * 2,
              ease: "none",
              repeat: -1,
              repeatDelay: 5,
              onRepeat: () => {
                safeGsap.set?.(heartElement, { 
                  y: window.innerHeight + 50, 
                  opacity: 0, 
                  scale: 0.5
                });
              }
            });
          });
        }
      } catch (error) {
        logger.warn('GSAP animation error or targets missing:', error);
        // Fallback: show elements without animation
        safeGsap.set?.([logoRef.current, cardRef.current, featuresRef.current], { 
          opacity: 1, 
          y: 0,
          scale: 1
        });
      }
    }
  }, []);

  // Check if user is already authenticated - removed for server-side auth
  // Authentication will be handled by ServerAuthGuard components

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Safely stringify a value for diagnostics without throwing on circular refs
  const safeStringify = (v: unknown) => {
    try {
      if (typeof v === 'string') return v;
      if (v === undefined) return '';
      return JSON.stringify(v);
    } catch (e) {
      try { return String(v); } catch (e2) { return '' + v; }
    }
  };

  const sendOtpToBackend = async (email: string) => {
    try {
      const response = await apiClient.post('/api/auth/send-otp', { email }, {
        timeout: 25000
      });

      if (!response.ok) {
        throw new Error(response.data?.error || 'Failed to send OTP');
      }

      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(error.message || 'Failed to send OTP');
      }
      throw new Error('Failed to send OTP');
    }
  };

  const handleSendOtp = async () => {
    clearError();
    const cleanEmail = email.trim().toLowerCase();
    if (!validateEmail(cleanEmail)) {
      setErrorWithId('Please enter a valid email address');
      return;
    }
    
    // Check if email is approved by admin
    const isApproved = await isApprovedEmail(cleanEmail);
    if (!isApproved) {
      setErrorWithId('This email is not approved by admin. Please contact support.');
      return;
    }
    setIsLoading(true);
    
    // GSAP loading animation (safe)
    const button = document.querySelector('.send-otp-button');
    safeGsap.to?.(button, {
      scale: 0.95,
      duration: 0.1,
      ease: "power2.out",
      yoyo: true,
      repeat: 1
    });
    
    try {
      await sendOtpToBackend(cleanEmail);
      
      // Set basic OTP state first (but DO NOT hide the email form yet)
      setCountdown(60);
      setCanResend(false);

      // Enhanced GSAP animation sequence for full-screen OTP transition
      try {
        const emailFormEl = document.querySelector('.email-form');

        // Animate email form out first, then flip the ui to show OTP using safe timeline
        const tl = safeGsap.timeline?.();

        if (tl) {
          if (emailFormEl) {
            tl.to?.(emailFormEl, {
              x: -100,
              opacity: 0,
              scale: 0.95,
              rotation: -2,
              duration: 0.6,
              ease: "power2.in"
            });
          }

          // After email form is hidden, set showOtp to true so OTP DOM is mounted
          tl.call?.(() => {
            setShowOtp(true);
          });

          // Small delay to allow React to mount OTP elements, then animate them if present
          tl.call?.(() => {
            setTimeout(() => {
              const otpScreenEl = document.querySelector('.otp-screen');
              if (otpScreenEl) {
                const tl2 = safeGsap.timeline?.();
                if (tl2) {
                  tl2.fromTo?.(otpScreenEl, {
                    x: 100,
                    opacity: 0,
                    scale: 0.9,
                    rotation: 2
                  }, {
                    x: 0,
                    opacity: 1,
                    scale: 1,
                    rotation: 0,
                    duration: 0.7,
                    ease: "back.out(1.4)"
                  });

                  // Safely animate other OTP elements only if they exist
                  const backBtn = document.querySelector('.back-button');
                  if (backBtn) {
                    tl2.fromTo?.(backBtn, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, '-=0.4');
                  }

                  const title = document.querySelector('.otp-title');
                  if (title) {
                    tl2.fromTo?.(title, { y: 40, opacity: 0, scale: 0.8 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }, '-=0.3');
                  }

                  const subtitle = document.querySelector('.otp-subtitle');
                  if (subtitle) {
                    tl2.fromTo?.(subtitle, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, '-=0.2');
                  }

                  const successMsg = document.querySelector('.success-message');
                  if (successMsg) {
                    tl2.set?.(successMsg, { opacity: 0, scale: 0.8, y: -10 });
                    tl2.to?.(successMsg, { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'back.out(1.5)' }, '-=0.1');
                  }

                  const countdownEl = document.querySelector('.countdown-timer');
                  if (countdownEl) {
                    tl2.fromTo?.(countdownEl, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' }, '-=0.1');
                  }
                  const firstInput = document.getElementById('otp-0');
                  if (firstInput) {
                    firstInput.focus();
                    safeGsap.to?.(firstInput, { scale: 1.1, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.inOut' });
                  }
                }
              }
            }, 50);
          });
        } else {
          // No timeline available: ensure UI still updates
          setShowOtp(true);
          setTimeout(() => {
            const firstInput = document.getElementById('otp-0');
            if (firstInput) {
              firstInput.focus();
              safeGsap.to?.(firstInput, { scale: 1.1, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.inOut' });
            }
          }, 50);
        }
      } catch (animErr) {
        logger.warn('GSAP OTP transition failed or target missing:', animErr);
        // Ensure UI state still updates even if animations fail
        setShowOtp(true);
      }
      
    } catch (error: unknown) {
      // Clear any existing error first
      clearError();
      
      let message = 'Failed to send OTP';
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.toLowerCase().includes('too many')) {
          message = 'Too many OTP requests. Please try again later.';
        } else if (error.message.toLowerCase().includes('network')) {
          message = 'Network error. Please check your connection and try again.';
        } else {
          message = error.message;
        }
      }
      setErrorWithId(message);
      // Error shake animation
      if (cardRef.current) {
        safeGsap.to?.(cardRef.current, {
          keyframes: {
            "0%": { x: 0 },
            "10%": { x: -10 },
            "20%": { x: 10 },
            "30%": { x: -8 },
            "40%": { x: 8 },
            "50%": { x: -6 },
            "60%": { x: 6 },
            "70%": { x: -4 },
            "80%": { x: 4 },
            "90%": { x: -2 },
            "100%": { x: 0 }
          },
          duration: 0.6,
          ease: "power2.out"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    clearError();
    // Clear OTP text box first
    setOtp('');
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      await sendOtpToBackend(cleanEmail);
      setCountdown(60);
      setCanResend(false);
    } catch (error: unknown) {
      // Clear any existing error first
      clearError();
      
      let message = 'Failed to resend OTP';
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.toLowerCase().includes('too many')) {
          message = 'Too many OTP requests. Please try again later.';
        } else if (error.message.toLowerCase().includes('network')) {
          message = 'Network error. Please check your connection and try again.';
        } else {
          message = error.message;
        }
      }
      setErrorWithId(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Call the backend API directly from the client to avoid importing
  // server-only service code into a client component (prevents bundler/runtime errors).
  const verifyOtpWithBackend = async (email: string, otpCode: string) => {
    try {
      const response = await fetch(`${configService.apiBaseUrl}/api/auth/verify-otp`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email, otp: otpCode }),
         credentials: 'include',
       });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(err.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      // Normalize error to match previous ServerAuthService shape
      const message = error instanceof Error ? error.message : String(error ?? 'Verification failed');
      return { success: false, redirectTo: '/', error: message };
    }
  };

  const handleVerifyOtp = async () => {
    // Prevent multiple rapid submissions
    if (isLoading) return;
    
    clearError();
    if (otp.length < 6) {
      setErrorWithId('Please enter complete 6-digit OTP');
      return;
    }
  // Strong guard: prevent double submissions immediately
  if (disabledAfterFailure) return;
  setDisabledAfterFailure(true);
  setIsLoading(true);
    
    // GSAP loading animation for verify button
    const button = document.querySelector('.verify-otp-button');
    safeGsap.to?.(button, {
      scale: 0.95,
      duration: 0.1,
      ease: "power2.out",
      yoyo: true,
      repeat: 1
    });
    
    try {
  const cleanEmail = email.trim().toLowerCase();
  const result = await verifyOtpWithBackend(cleanEmail, otp);

  // Debug raw result (temporary): helps diagnose intermittent failures
  logger.debug('🔍 handleVerifyOtp - raw result (pre-normalize):', result);

  // Normalize result to a safe object so downstream code never sees undefined
  const resultObj: any = (result && typeof result === 'object') ? result : { success: !!result };
  logger.debug('🔍 handleVerifyOtp - normalized result:', safeStringify(resultObj));

  // debug logging intentionally removed (kept only essential error/warn logs)

      // Defensive: ensure we have a result
      if (!resultObj || Object.keys(resultObj).length === 0) {
            logger.error('❌ OTP verification failed: empty/invalid response from backend', resultObj);
            setErrorWithId('Invalid OTP. Please try again.');
            // allow user to retry after a short cooldown
            setTimeout(() => setDisabledAfterFailure(false), 3000);
            return;
          }

      // If backend explicitly returned an error message, surface it
      if (resultObj.error) {
        const errString = String(resultObj.error || 'Authentication failed');
        logger.error('❌ OTP verification failed (backend error):', errString, 'rawResult:', safeStringify(resultObj));
        setErrorWithId(errString);
        setOtp('');
        setDisabledAfterFailure(true);
        setTimeout(() => setDisabledAfterFailure(false), 3000);
        return;
      }

  // Check if OTP verification was successful.
  // Be defensive: accept boolean true, string 'true', or presence of user/session.
  const successFlag = Boolean(result && (
    result.success === true ||
    String(result.success) === 'true' ||
    (result as any).user !== undefined ||
    (result as any).session !== undefined
  ));

  logger.debug('🔁 handleVerifyOtp - interpreted successFlag:', successFlag, 'rawResult:', safeStringify(result));
  if (successFlag) {
        // Success animation before redirect (guard cardRef)
        try {
          const tl = safeGsap.timeline?.();
          if (tl && cardRef?.current) {
            tl.to?.(cardRef.current, {
              scale: 1.05,
              duration: 0.3,
              ease: "power2.out"
            }).to?.(cardRef.current, {
              scale: 1,
              duration: 0.2,
              ease: "power2.out"
            });
          }
        } catch (animErr) {
          logger.warn('GSAP animation failed or target missing:', animErr);
        }
        // Start background token refresh to keep user logged in
        try {
          const { ServerAuthService } = await import('../services/server-auth-service');
          ServerAuthService.initializeTokenRefresh();
        } catch (e) {
          logger.warn('Token refresh service init failed (non-fatal):', e);
        }
        // Handle redirection
  // If server provided a redirect path (non-null, non-empty), use it.
  // Otherwise default to dashboard.
  const redirectPath = (result && typeof (result as any).redirectTo === 'string' && (result as any).redirectTo) ? (result as any).redirectTo : '/dashboard';
  logger.debug('🚀 Redirecting to:', redirectPath);
  window.location.href = redirectPath;
        return;
      }
      // Handle OTP verification failure (only when success is falsey)
      if (!successFlag) {
        // Prefer explicit error from backend, otherwise dump the whole response for diagnosis
        let errMsgRaw = '';
        try {
          if (result && (result as any).error !== undefined && (result as any).error !== null) {
            errMsgRaw = String((result as any).error);
          } else if (result && typeof result === 'object') {
            errMsgRaw = safeStringify(result);
          } else {
            errMsgRaw = String(result ?? 'Invalid OTP. Please try again.');
          }
        } catch (e) {
          errMsgRaw = 'Invalid OTP. Please try again.';
        }

        // Normalize common placeholder strings that are unhelpful
        if (errMsgRaw === 'undefined' || errMsgRaw.trim() === '{}' || errMsgRaw.trim() === 'null') {
          errMsgRaw = '';
        }

        const isExpired = /expired|not found|not_found|notfound/i.test(errMsgRaw);
        const displayMsg = isExpired ? 'OTP expired or already used — request a new code.' : (errMsgRaw || 'Invalid OTP. Please try again.');
        // Log full raw result for debugging (safeStringify will avoid throws)
        logger.error('❌ OTP verification failed:', displayMsg, 'rawResult:', safeStringify(result));
  // Clear OTP input to encourage requesting/entering a fresh code
  setOtp('');
  setErrorWithId(displayMsg);
  // Disable verify button briefly to prevent rapid retries
  setDisabledAfterFailure(true);
  setTimeout(() => setDisabledAfterFailure(false), 3000);
      } else {
        // Unexpected: success was truthy but we reached failure branch
        logger.warn('⚠️ handleVerifyOtp: unexpected control flow. result:', result);
      }
    } catch (error: unknown) {
      // Convert unknown error types into a safe string for display/logging
      let rawErrorString = 'Failed to verify OTP';
      try {
        rawErrorString = error instanceof Error ? error.message : String(error ?? 'Failed to verify OTP');
      } catch (e) {
        rawErrorString = 'Failed to verify OTP';
      }

      logger.error('❌ OTP verification error:', rawErrorString, 'exceptionObj:', error);
      
      let message = rawErrorString;
      if (rawErrorString.includes('403')) {
        if (rawErrorString.includes('paused') || rawErrorString.includes('not approved')) {
          message = 'Your account has been paused. Please contact the admin for re-approval.';
        }
      } else if (rawErrorString.includes('429')) {
        message = 'Too many verification attempts. Please try again later.';
      } else if (rawErrorString.toLowerCase().includes('network')) {
        message = 'Network error. Please check your connection and try again.';
      } else if (!rawErrorString || rawErrorString === 'Failed to verify OTP') {
        message = 'Failed to verify OTP. Please try again.';
      }

      setErrorWithId(message);
  // disable briefly on unexpected error as well
  setDisabledAfterFailure(true);
  setTimeout(() => setDisabledAfterFailure(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={backgroundRef} className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 relative overflow-hidden">
      {/* Enhanced Background Elements with Cute Hearts Animation */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:6rem_4rem] opacity-20"></div>
      
      {/* Animated Hearts - Now powered by GSAP */}
      <div ref={heartsRef} className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Heart 1 */}
        <div className="absolute" style={{ left: '10%' }}>
          <div className="w-6 h-6 text-red-400 opacity-80">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        </div>
        {/* Heart 2 */}
        <div className="absolute" style={{ left: '25%' }}>
          <div className="w-5 h-5 text-pink-400 opacity-70">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        </div>
        {/* Heart 3 */}
        <div className="absolute" style={{ left: '50%' }}>
          <div className="w-4 h-4 text-rose-400 opacity-90">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        </div>
        {/* Heart 4 */}
        <div className="absolute" style={{ left: '75%' }}>
          <div className="w-5 h-5 text-red-500 opacity-60">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        </div>
        {/* Heart 5 */}
        <div className="absolute" style={{ left: '85%' }}>
          <div className="w-6 h-6 text-pink-500 opacity-75">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        </div>
        {/* Heart 6 */}
        <div className="absolute" style={{ left: '35%' }}>
          <div className="w-4 h-4 text-rose-500 opacity-80">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Subtle Background Orbs */}
      <div className="absolute top-20 -left-20 w-48 h-48 bg-gradient-to-br from-rose-200/10 to-pink-200/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-20 -right-20 w-52 h-52 bg-gradient-to-br from-purple-200/10 to-rose-200/10 rounded-full blur-2xl"></div>
      
      {/* Main Content Container */}
      <div ref={containerRef} className="flex flex-col items-center justify-center min-h-screen px-4 py-8 relative z-10">
        {/* Logo Section */}
        <div ref={logoRef} className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ fontFamily: "'Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif" }}>
            <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
              Shaadi
            </span>
            <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent ml-2">
              Mantrana
            </span>
          </h1>
          <p className="text-slate-600 text-base md:text-lg">
            Your journey to forever starts here
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-sm">
          <div ref={cardRef} className="bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
            {/* Card Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 via-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                  {showOtp ? (
                    <span>Verify Your Email</span>
                  ) : (
                    <span>Welcome</span>
                  )}
                </h2>
                <p className="text-slate-600 text-sm">
                  {showOtp ? (
                    <>Enter the 6-digit code sent to your email</>
                  ) : (
                    <>Sign in to your account to continue</>
                  )}
                </p>
              </div>

              {!showOtp ? (
                <div className="email-form space-y-4">
                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-700 mb-2 transition-colors duration-200 group-focus-within:text-rose-600">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50/80 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all duration-300 hover:border-slate-300 text-sm"
                        onFocus={() => {
                          safeGsap.to?.('.email-form input', {
                            scale: 1.02,
                            duration: 0.2,
                            ease: "power2.out"
                          });
                        }}
                        onBlur={() => {
                          safeGsap.to?.('.email-form input', {
                            scale: 1,
                            duration: 0.2,
                            ease: "power2.out"
                          });
                        }}
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-rose-500/5 to-pink-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>
                  <button
                    onClick={handleSendOtp}
                    disabled={isLoading}
                    className="send-otp-button w-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-bold py-4 px-6 rounded-xl hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl relative overflow-hidden group min-h-[56px] flex items-center justify-center"
                  >
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <HeartbeatLoader size="md" showText={false} className="mr-2" />
                        <span>Sending code...</span>
                      </div>
                    ) : (
                      <span className="relative z-10">Send Verification Code</span>
                    )}
                  </button>
                </div>
              ) : (
                // OTP Entry Screen - match email form sizing
                <div className="email-form otp-screen space-y-4">
                  
                  {/* Back Button */}
                  <div className="mb-6">
                    <button
                      onClick={() => {
                        // Enhanced back animation with multiple phases
                        const tl = safeGsap.timeline?.();

                        // Phase 1: Animate out OTP elements in reverse order (safe-chained)
                        tl?.to?.('.otp-buttons button', {
                          y: 20,
                          opacity: 0,
                          scale: 0.9,
                          duration: 0.3,
                          ease: 'power2.in',
                          stagger: 0.05
                        })

                        tl?.to?.('.countdown-timer', {
                          scale: 0,
                          opacity: 0,
                          duration: 0.2,
                          ease: 'power2.in'
                        }, '-=0.2')

                        tl?.to?.('.otp-inputs input', {
                          scale: 0,
                          y: -20,
                          opacity: 0,
                          rotation: -90,
                          duration: 0.3,
                          ease: 'power2.in',
                          stagger: 0.05
                        }, '-=0.2')

                        tl?.to?.('.otp-subtitle, .otp-title', {
                          y: -30,
                          opacity: 0,
                          duration: 0.3,
                          ease: 'power2.in',
                          stagger: 0.05
                        }, '-=0.2')

                        tl?.to?.('.back-button', {
                          x: -30,
                          opacity: 0,
                          duration: 0.2,
                          ease: "power2.in"
                        }, "-=0.2")
                        
                        // Phase 2: Slide out OTP screen
                        .to('.otp-screen', {
                          x: 100,
                          opacity: 0,
                          scale: 0.9,
                          rotation: 2,
                          duration: 0.4,
                          ease: "power2.in"
                        }, "-=0.1")
                        
                        // Phase 3: Reset state and show email form
                        .call(() => {
                          setShowOtp(false);
                          setCountdown(0);
                          setCanResend(true);
                          setOtp('');

                        })
                        
                        // Phase 4: Animate in email form
                        .fromTo('.email-form', {
                          x: -100,
                          opacity: 0,
                          scale: 0.95,
                          rotation: -2
                        }, {
                          x: 0,
                          opacity: 1,
                          scale: 1,
                          rotation: 0,
                          duration: 0.6,
                          ease: "back.out(1.4)"
                        });
                      }}
                      className="back-button flex items-center text-slate-600 hover:text-slate-800 font-medium transition-all duration-200 hover:scale-105"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0L2.586 11H16a1 1 0 110 2H2.586l3.707 3.707a1 1 0 01-1.414 1.414l-5.414-5.414a1 1 0 010-1.414l5.414-5.414a1 1 0 111.414 1.414L2.586 9H16a1 1 0 110 2H2.586l3.707 3.707z" clipRule="evenodd" />
                      </svg>
                      Back
                    </button>

                    {/* Extra content below Resend OTP button */}
                    <div className="otp-extra mt-3 text-center text-sm text-slate-600">
                      <p>Didn't receive the code? Check your spam folder or try again. For help, <a href="/support" className="text-rose-600 font-medium">contact support</a>.</p>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-center">
                    <h3 className="otp-title text-2xl font-bold text-slate-800 mb-3">Enter Verification Code</h3>
                    
                    {/* Success Message - Only show once with single checkmark */}
                    <div className="success-message mb-4 p-3 bg-green-50 border border-green-200 rounded-xl opacity-0" style={{ pointerEvents: 'none' }}>
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-700 text-sm font-medium">Code sent successfully</span>
                      </div>
                    </div>
                    
                    <p className="otp-subtitle text-slate-600 text-sm">
                      Enter the 6-digit code sent to<br />
                      <span className="font-semibold text-slate-800">{email}</span>
                    </p>
                  </div>



                  {/* Six Individual OTP Input Boxes */}
                  <div className="otp-inputs">
                    <div className="flex justify-center space-x-3">{[0, 1, 2, 3, 4, 5].map((index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          maxLength={1}
                          value={otp[index] || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 1) {
                              const newOtp = otp.split('');
                              newOtp[index] = value;
                              const updatedOtp = newOtp.join('');
                              setOtp(updatedOtp);
                              clearError(); // Clear error when user starts typing
                              
                              // Auto-focus next input with animation
                              if (value && index < 5) {
                                const nextInput = document.getElementById(`otp-${index + 1}`);
                                if (nextInput) {
                                  nextInput.focus();
                                  safeGsap.fromTo?.(nextInput, 
                                    { scale: 1.3, borderColor: '#10b981' },
                                    { scale: 1, borderColor: '#ef4444', duration: 0.3, ease: "back.out(1.5)" }
                                  );
                                }
                              }
                            }
                          }}
                          onKeyDown={(e) => {
                            // Handle backspace to focus previous input
                            if (e.key === 'Backspace' && !otp[index] && index > 0) {
                              const prevInput = document.getElementById(`otp-${index - 1}`);
                              if (prevInput) {
                                prevInput.focus();
                                safeGsap.to?.(prevInput, {
                                  scale: 1.1,
                                  duration: 0.2,
                                  yoyo: true,
                                  repeat: 1,
                                  ease: "power2.inOut"
                                });
                              }
                            }
                          }}
                          onFocus={() => {
                            safeGsap.to?.(`#otp-${index}`, {
                              scale: 1.15,
                              borderColor: '#ef4444',
                              boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
                              duration: 0.2,
                              ease: "power2.out"
                            });
                          }}
                          onBlur={() => {
                            safeGsap.to?.(`#otp-${index}`, {
                              scale: 1,
                              borderColor: '#cbd5e1',
                              boxShadow: '0 0 0 0px rgba(239, 68, 68, 0)',
                              duration: 0.2,
                              ease: "power2.out"
                            });
                          }}
                          className="w-12 h-12 border-2 border-slate-300 rounded-lg text-center text-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-500 transition-all duration-200 bg-slate-50/80 hover:border-slate-400"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Inline error message near OTP inputs (more visible than toast) */}
                  {lastError && (
                    <div className="text-center text-sm text-red-600 mt-3 px-4" role="alert">
                      {lastError}
                    </div>
                  )}

                  {/* Countdown Timer */}
                  {countdown > 0 && (
                    <div className="countdown-timer text-center">
                      <div className="inline-flex items-center bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                        <span className="text-amber-700 text-sm font-medium">
                          Resend in <span className="font-bold">{countdown}s</span>
                        </span>
                      </div>
                    </div>
                  )}



                  {/* Action Buttons */}
                  <div className="otp-buttons space-y-4">
                    {/* Submit Button - Always visible but disabled until 6 digits */}
                    <button
                      onClick={handleVerifyOtp}
                      disabled={isLoading || otp.length !== 6 || disabledAfterFailure}
                      className="verify-button w-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-bold py-4 px-6 rounded-xl hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl relative overflow-hidden group"
                      onMouseEnter={() => {
                        if (!isLoading && otp.length === 6) {
                          safeGsap.to?.('.verify-button', {
                            scale: 1.02,
                            boxShadow: '0 10px 25px rgba(244, 63, 94, 0.3)',
                            duration: 0.3,
                            ease: "power2.out"
                          });
                        }
                      }}
                      onMouseLeave={() => {
                        safeGsap.to?.('.verify-button', {
                          scale: 1,
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          duration: 0.3,
                          ease: "power2.out"
                        });
                      }}
                    >
                      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <HeartbeatLoader size="md" showText={false} className="mr-2" />
                          <span>Verifying...</span>
                        </div>
                      ) : (
                        <span className="relative z-10">Verify Verification Code</span>
                      )}
                    </button>

                    {/* Resend Button - Only enabled when countdown is 0 */}
                    <button
                      onClick={handleResendOtp}
                      disabled={countdown > 0 || isLoading}
                      className="resend-button w-full bg-slate-100 text-slate-700 font-medium py-4 px-6 rounded-xl hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      onMouseEnter={() => {
                        if (countdown === 0 && !isLoading) {
                          safeGsap.to?.('.resend-button', {
                            scale: 1.02,
                            backgroundColor: '#e2e8f0',
                            duration: 0.3,
                            ease: "power2.out"
                          });
                        }
                      }}
                      onMouseLeave={() => {
                        safeGsap.to?.('.resend-button', {
                          scale: 1,
                          backgroundColor: '#f1f5f9',
                          duration: 0.3,
                          ease: "power2.out"
                        });
                      }}
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ultra Compact Features Grid (hidden on OTP screen) */}
          {!showOtp && (
            <>
              <div ref={featuresRef} className="mt-4 space-y-2">
            {/* Top Row - Main Features */}
            <div className="grid grid-cols-2 gap-2">
              <div className="feature-card group relative overflow-hidden border border-slate-200/50 rounded-lg p-3 hover:shadow-lg transition-all duration-500">
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                
                {/* Floating Icon Container */}
                <div className="relative z-10 flex items-center space-x-2">
                  <div className="w-8 h-8 flex items-center justify-center group-hover:scale-110 transition-all duration-500">
                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors duration-300">100% Free</h3>
                    <p className="text-xs text-slate-600 group-hover:text-emerald-600 transition-colors duration-300">No charges</p>
                  </div>
                </div>
              </div>

              <div className="feature-card group relative overflow-hidden border border-slate-200/50 rounded-lg p-3 hover:shadow-lg transition-all duration-500">
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                
                {/* Floating Icon Container */}
                <div className="relative z-10 flex items-center space-x-2">
                  <div className="w-8 h-8 flex items-center justify-center group-hover:scale-110 transition-all duration-500">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors duration-300">Secure</h3>
                    <p className="text-xs text-slate-600 group-hover:text-blue-600 transition-colors duration-300">Data safe</p>
                  </div>
                </div>
              </div>
            </div>
              </div>

              {/* Very Compact Quality Indicators */}
              <div className="highlight-section mt-2 relative overflow-hidden border border-slate-200/60 rounded-lg p-3 shadow-md hover:shadow-lg transition-all duration-500 group">
            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-2">
                <h4 className="text-sm font-bold text-slate-800">Why Choose Us</h4>
                <div className="w-6 h-px bg-gradient-to-r from-rose-400 to-pink-500 mx-auto rounded-full"></div>
              </div>
              
              {/* Very Compact Quality Indicators */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center group/item">
                  <div className="w-6 h-6 flex items-center justify-center mx-auto mb-1 group-hover/item:scale-110 group-hover/item:-rotate-6 transition-all duration-500">
                    <span className="text-lg">💝</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-800 group-hover/item:text-amber-700 transition-colors duration-300">Smart Matching</h5>
                  <p className="text-xs text-slate-600 group-hover/item:text-amber-600 transition-colors duration-300">Quality Matches</p>
                </div>
                
                <div className="text-center group/item">
                  <div className="w-6 h-6 flex items-center justify-center mx-auto mb-1 group-hover/item:scale-110 group-hover:item:rotate-6 transition-all duration-500">
                    <span className="text-lg">✨</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-800 group-hover/item:text-purple-700 transition-colors duration-300">Quality Profiles</h5>
                  <p className="text-xs text-slate-600 group-hover/item:text-purple-600 transition-colors duration-300">Verified Users</p>
                </div>
                
                <div className="text-center group/item">
                  <div className="w-6 h-6 flex items-center justify-center mx-auto mb-1 group-hover:item:scale-110 group-hover:item:-rotate-3 transition-all duration-500">
                    <span className="text-lg">🎯</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-800 group-hover/item:text-emerald-700 transition-colors duration-300">Easy to Use</h5>
                  <p className="text-xs text-slate-600 group-hover/item:text-emerald-600 transition-colors duration-300">Simple Interface</p>
                </div>
              </div>
            </div>
            
            {/* Floating Decoration */}
            <div className="absolute top-1 right-1 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
              <div className="w-4 h-4 border border-rose-300 rounded-full animate-spin-slow"></div>
            </div>
              </div>

              {/* Minimal Terms Section */}
              <div className="terms-section mt-4 text-center">
                <p className="text-xs text-slate-500">
                  By continuing, you agree to our{' '}
                  <Link href="/terms" className="text-rose-600 hover:text-rose-700 font-semibold transition-all duration-200 hover:underline">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-rose-600 hover:text-rose-700 font-semibold transition-all duration-200 hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
