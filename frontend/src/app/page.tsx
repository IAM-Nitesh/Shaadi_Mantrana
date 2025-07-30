'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { AuthService } from '../services/auth-service';
import configService from '../services/configService';
import { gsap } from 'gsap';
import HeartbeatLoader from '../components/HeartbeatLoader';

export default function Home() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorId, setErrorId] = useState(0); // Add unique ID for error messages to prevent duplicates
  const [lastError, setLastError] = useState(''); // Track last error to prevent duplicates
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null); // Timeout for auto-clearing errors
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
      // Use the backend URL directly since this is a client-side call
      const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4500';
      const response = await fetch(`${backendUrl}/api/auth/preapproved/check?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      const data = await response.json();
      return data.preapproved;
    } catch (error) {
      console.error('Error checking email approval:', error);
      return false;
    }
  };

  // Helper function to set error with unique ID to prevent duplicates
  const setErrorWithId = (message: string) => {
    // Clear any existing timeout
    if (errorTimeout) {
      clearTimeout(errorTimeout);
    }
    
    // Only set error if it's different from the last error to prevent duplicates
    if (message !== lastError) {
      const newErrorId = errorId + 1;
      setErrorId(newErrorId);
      setError(message);
      setLastError(message);
      
      // Auto-clear error after 5 seconds
      const timeout = setTimeout(() => {
        clearError();
      }, 5000);
      setErrorTimeout(timeout);
    }
  };

  // Helper function to clear error
  const clearError = () => {
    // Clear any existing timeout
    if (errorTimeout) {
      clearTimeout(errorTimeout);
      setErrorTimeout(null);
    }
    setError('');
    setErrorId(0);
    setLastError('');
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsRouterReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup error timeout on unmount
  useEffect(() => {
    return () => {
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }
    };
  }, [errorTimeout]);

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
    if (typeof window !== 'undefined' && typeof gsap !== 'undefined') {
      // Clear any existing animations
      gsap.killTweensOf("*");
      
      // Initial setup - hide elements
      gsap.set([logoRef.current, cardRef.current, featuresRef.current], { 
        opacity: 0, 
        y: 30,
        scale: 0.95
      });
      
      // Background hearts floating animation
      const heartsContainer = heartsRef.current;
      if (heartsContainer && heartsContainer.children) {
        Array.from(heartsContainer.children).forEach((heart, index) => {
          const heartElement = heart as HTMLElement;
          gsap.set(heartElement, { 
            y: window.innerHeight + 50, 
            opacity: 0, 
            rotation: 0, 
            scale: 0.5,
            x: gsap.utils.random(-50, 50)
          });
          
          // Heart floating animation with better performance
          gsap.to(heartElement, {
            y: -100,
            opacity: 0.8,
            rotation: gsap.utils.random(180, 360),
            scale: gsap.utils.random(0.8, 1.2),
            duration: gsap.utils.random(10, 15),
            delay: index * 1.5,
            ease: "none",
            repeat: -1,
            repeatDelay: gsap.utils.random(3, 8),
            onRepeat: () => {
              gsap.set(heartElement, { 
                y: window.innerHeight + 50, 
                opacity: 0, 
                rotation: 0, 
                scale: 0.5,
                x: gsap.utils.random(-50, 50)
              });
            }
          });
          
          // Horizontal floating motion
          gsap.to(heartElement, {
            x: `+=${gsap.utils.random(-40, 40)}`,
            duration: gsap.utils.random(3, 5),
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1
          });
        });
      }

      // Main entrance animation timeline
      const tl = gsap.timeline({ delay: 0.5 });
      
      // Background entrance
      tl.fromTo(backgroundRef.current, {
        opacity: 0
      }, {
        opacity: 1,
        duration: 0.8,
        ease: "power2.out"
      })
      // Logo entrance with smooth bounce
      .to(logoRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1,
        ease: "back.out(1.2)",
      }, "-=0.4")
      // Card entrance with smooth elastic effect
      .to(cardRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "power3.out",
      }, "-=0.6")
      // Features entrance
      .to(featuresRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power2.out",
      }, "-=0.4");

      // Enhanced card hover animations
      const card = cardRef.current;
      if (card) {
        const handleMouseEnter = () => {
          gsap.to(card, {
            scale: 1.02,
            y: -5,
            duration: 0.3,
            ease: "power2.out"
          });
        };
        
        const handleMouseLeave = () => {
          gsap.to(card, {
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out"
          });
        };
        
        card.addEventListener('mouseenter', handleMouseEnter);
        card.addEventListener('mouseleave', handleMouseLeave);
        
        // Cleanup function
        return () => {
          if (card) {
            card.removeEventListener('mouseenter', handleMouseEnter);
            card.removeEventListener('mouseleave', handleMouseLeave);
          }
          gsap.killTweensOf("*");
        };
      }
    }
  }, []);

  // Check if user is already authenticated
  useEffect(() => {
    if (isRouterReady) {
      if (AuthService.isAuthenticated()) {
        // Check if user is admin and redirect accordingly
        if (AuthService.isAdmin()) {
          router.push('/admin/dashboard');
        } else {
          // User is already logged in, redirect to dashboard
          router.push('/dashboard');
        }
      }
    }
  }, [isRouterReady, router]);

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

  const sendOtpToBackend = async (email: string) => {
    try {
      return await AuthService.sendOTP(email);
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
    
    // GSAP loading animation
    const button = document.querySelector('.send-otp-button');
    if (button) {
      gsap.to(button, {
        scale: 0.95,
        duration: 0.1,
        ease: "power2.out",
        yoyo: true,
        repeat: 1
      });
    }
    
    try {
      await sendOtpToBackend(cleanEmail);
      
      // First update the state
      setShowOtp(true);
      setCountdown(60);
      setCanResend(false);
      
      // Enhanced GSAP animation sequence for full-screen OTP transition
      setTimeout(() => {
        const tl = gsap.timeline();
        
        // Phase 1: Fade out email form with elegant slide effect
        tl.to('.email-form', {
          x: -100,
          opacity: 0,
          scale: 0.95,
          rotation: -2,
          duration: 0.6,
          ease: "power2.in"
        })
        
        // Phase 2: Show OTP screen with entrance animation
        .fromTo('.otp-screen', {
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
        })
        
        // Initialize success message (hidden initially)
        .set('.success-message', {
          opacity: 0,
          scale: 0.8,
          y: -10
        })
        
        // Phase 3: Animate back button
        .fromTo('.back-button', {
          x: -30,
          opacity: 0
        }, {
          x: 0,
          opacity: 1,
          duration: 0.4,
          ease: "power2.out"
        }, "-=0.4")
        
        // Phase 4: Animate title with bounce
        .fromTo('.otp-title', {
          y: 40,
          opacity: 0,
          scale: 0.8
        }, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: "back.out(1.5)"
        }, "-=0.3")
        
        // Phase 5: Animate subtitle
        .fromTo('.otp-subtitle', {
          y: 20,
          opacity: 0
        }, {
          y: 0,
          opacity: 1,
          duration: 0.4,
          ease: "power2.out"
        }, "-=0.2")
        
        // Phase 5.5: Animate success message with smooth entrance
        .to('.success-message', {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.7,
          ease: "back.out(1.5)"
        }, "-=0.1")
        
        // Phase 6: Animate OTP input boxes with staggered entrance
        .fromTo('.otp-inputs input', {
          scale: 0,
          y: 30,
          opacity: 0,
          rotation: 180
        }, {
          scale: 1,
          y: 0,
          opacity: 1,
          rotation: 0,
          duration: 0.4,
          ease: "back.out(1.8)",
          stagger: 0.08
        }, "-=0.2")
        
        // Phase 7: Animate countdown timer if visible
        .fromTo('.countdown-timer', {
          scale: 0,
          opacity: 0
        }, {
          scale: 1,
          opacity: 1,
          duration: 0.3,
          ease: "elastic.out(1, 0.5)"
        }, "-=0.1")
        
        // Phase 8: Animate action buttons
        .fromTo('.otp-buttons button', {
          y: 40,
          opacity: 0,
          scale: 0.9
        }, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: "back.out(1.2)",
          stagger: 0.1
        }, "-=0.2")
        
        .call(() => {
          // Auto-focus first input with animation
          const firstInput = document.getElementById('otp-0');
          if (firstInput) {
            firstInput.focus();
            gsap.to(firstInput, {
              scale: 1.1,
              duration: 0.2,
              yoyo: true,
              repeat: 1,
              ease: "power2.inOut"
            });
          }
        });
      }, 50);
      
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
        gsap.to(cardRef.current, {
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

  const verifyOtpWithBackend = async (email: string, otpCode: string) => {
    const data = await AuthService.verifyOTP(email, otpCode);
    // Backend returns token in data.session.accessToken format
    const token = data.session?.accessToken || data.token;
    if (token) {
      localStorage.setItem('authToken', token);
    }
    
    // Store user data including role for role-based routing
    if (data.user) {
      localStorage.setItem('userRole', data.user.role || 'user');
      localStorage.setItem('userEmail', data.user.email);
    }
    
    return data;
  };

  const handleVerifyOtp = async () => {
    // Prevent multiple rapid submissions
    if (isLoading) return;
    
    clearError();
    if (otp.length < 6) {
      setErrorWithId('Please enter complete 6-digit OTP');
      return;
    }
    setIsLoading(true);
    
    // GSAP loading animation for verify button
    const button = document.querySelector('.verify-otp-button');
    if (button) {
      gsap.to(button, {
        scale: 0.95,
        duration: 0.1,
        ease: "power2.out",
        yoyo: true,
        repeat: 1
      });
    }
    
    try {
      const cleanEmail = email.trim().toLowerCase();
      const result = await verifyOtpWithBackend(cleanEmail, otp);
      
      // Success animation before redirect
      gsap.timeline()
        .to(cardRef.current, {
          scale: 1.05,
          duration: 0.3,
          ease: "power2.out"
        })
        .to(cardRef.current, {
          scale: 1,
          duration: 0.2,
          ease: "power2.out"
        })
        .to('.success-checkmark', {
          scale: 1.2,
          rotation: 360,
          duration: 0.5,
          ease: "back.out(1.7)"
        }, "-=0.3");
      
      // Check user role from backend response and redirect accordingly
      if (isRouterReady && router) {
        if (result.user?.role === 'admin') {
          await router.push('/admin/dashboard');
        } else {
          // Check if user is first-time user and redirect to profile instead of dashboard
          const isFirstLogin = result.user?.isFirstLogin || false;
          if (isFirstLogin) {
            console.log('🎯 First-time user detected, redirecting to /profile');
            await router.push('/profile');
          } else {
            await router.push('/dashboard');
          }
        }
      } else {
        if (result.user?.role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else {
          // Check if user is first-time user and redirect to profile instead of dashboard
          const isFirstLogin = result.user?.isFirstLogin || false;
          if (isFirstLogin) {
            console.log('🎯 First-time user detected, redirecting to /profile');
            window.location.href = '/profile';
          } else {
            window.location.href = '/dashboard';
          }
        }
      }
    } catch (error: unknown) {
      console.log('🔍 Error caught in handleVerifyOtp:', error);
      
      let errorMessage = 'Invalid OTP';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setErrorWithId(errorMessage);
      // Error shake animation
      if (cardRef.current) {
        gsap.to(cardRef.current, {
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
              Mantra
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

              {error && (
                <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-xl p-3">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0 animate-pulse">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

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
                          gsap.to('.email-form input', {
                            scale: 1.02,
                            duration: 0.2,
                            ease: "power2.out"
                          });
                        }}
                        onBlur={() => {
                          gsap.to('.email-form input', {
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
                    className="send-otp-button w-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-bold py-3 px-6 rounded-xl hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl relative overflow-hidden group text-sm"
                  >
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <HeartbeatLoader size="sm" showText={false} className="mr-2" />
                        <span>Sending code...</span>
                      </div>
                    ) : (
                      <span className="relative z-10">Send Verification Code</span>
                    )}
                  </button>
                </div>
              ) : (
                // OTP Entry Screen - Full Screen Navigation
                <div className="otp-screen space-y-8">
                  
                  {/* Back Button */}
                  <div className="mb-6">
                    <button
                      onClick={() => {
                        // Enhanced back animation with multiple phases
                        const tl = gsap.timeline();
                        
                        // Phase 1: Animate out OTP elements in reverse order
                        tl.to('.otp-buttons button', {
                          y: 20,
                          opacity: 0,
                          scale: 0.9,
                          duration: 0.3,
                          ease: "power2.in",
                          stagger: 0.05
                        })
                        
                        .to('.countdown-timer', {
                          scale: 0,
                          opacity: 0,
                          duration: 0.2,
                          ease: "power2.in"
                        }, "-=0.2")
                        
                        .to('.otp-inputs input', {
                          scale: 0,
                          y: -20,
                          opacity: 0,
                          rotation: -90,
                          duration: 0.3,
                          ease: "power2.in",
                          stagger: 0.05
                        }, "-=0.2")
                        
                        .to('.otp-subtitle, .otp-title', {
                          y: -30,
                          opacity: 0,
                          duration: 0.3,
                          ease: "power2.in",
                          stagger: 0.05
                        }, "-=0.2")
                        
                        .to('.back-button', {
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
                          setError('');
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

                  {/* Error Display - Above OTP inputs */}
                  {error && (
                    <div className="error-message bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-fade-in mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <p className="text-red-700 text-sm font-medium">{error}</p>
                        </div>
                        {/* Auto-clear indicator */}
                        <div className="flex items-center text-red-500 text-xs">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
                          <span>Auto-clear in 5s</span>
                        </div>
                      </div>
                    </div>
                  )}

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
                                  gsap.fromTo(nextInput, 
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
                                gsap.to(prevInput, {
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
                            gsap.to(`#otp-${index}`, {
                              scale: 1.15,
                              borderColor: '#ef4444',
                              boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
                              duration: 0.2,
                              ease: "power2.out"
                            });
                          }}
                          onBlur={() => {
                            gsap.to(`#otp-${index}`, {
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

                  {/* Countdown Timer */}
                  {countdown > 0 && (
                    <div className="countdown-timer text-center">
                      <div className="inline-flex items-center bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse mr-2"></div>
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
                      disabled={isLoading || otp.length !== 6}
                      className="verify-button w-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-bold py-4 px-6 rounded-xl hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl relative overflow-hidden group"
                      onMouseEnter={() => {
                        if (!isLoading && otp.length === 6) {
                          gsap.to('.verify-button', {
                            scale: 1.02,
                            boxShadow: '0 10px 25px rgba(244, 63, 94, 0.3)',
                            duration: 0.3,
                            ease: "power2.out"
                          });
                        }
                      }}
                      onMouseLeave={() => {
                        gsap.to('.verify-button', {
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
                          <HeartbeatLoader size="sm" showText={false} className="mr-2" />
                          <span>Verifying...</span>
                        </div>
                      ) : (
                        <span className="relative z-10">Verify Code</span>
                      )}
                    </button>

                    {/* Resend Button - Only enabled when countdown is 0 */}
                    <button
                      onClick={handleResendOtp}
                      disabled={countdown > 0 || isLoading}
                      className="resend-button w-full bg-slate-100 text-slate-700 font-medium py-4 px-6 rounded-xl hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      onMouseEnter={() => {
                        if (countdown === 0 && !isLoading) {
                          gsap.to('.resend-button', {
                            scale: 1.02,
                            backgroundColor: '#e2e8f0',
                            duration: 0.3,
                            ease: "power2.out"
                          });
                        }
                      }}
                      onMouseLeave={() => {
                        gsap.to('.resend-button', {
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

          {/* Ultra Compact Features Grid */}
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
                  <div className="w-6 h-6 flex items-center justify-center mx-auto mb-1 group-hover/item:scale-110 group-hover/item:rotate-6 transition-all duration-500">
                    <span className="text-lg">✨</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-800 group-hover/item:text-purple-700 transition-colors duration-300">Quality Profiles</h5>
                  <p className="text-xs text-slate-600 group-hover/item:text-purple-600 transition-colors duration-300">Verified Users</p>
                </div>
                
                <div className="text-center group/item">
                  <div className="w-6 h-6 flex items-center justify-center mx-auto mb-1 group-hover/item:scale-110 group-hover/item:-rotate-3 transition-all duration-500">
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
        </div>
      </div>
    </div>
  );
}
