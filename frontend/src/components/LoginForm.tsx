'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import OTPInput from './OTPInput';
import logger from '../utils/logger';
import { ConfirmationResult } from 'firebase/auth';
import posthog from 'posthog-js';
import RoyalLoader from './RoyalLoader';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const router = useRouter();
  const { signInWithPhone, confirmPhoneCode, isAuthenticated, isLoading, error, redirectTo } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | { verificationId: string } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Check Firebase config on mount
  const isFirebaseConfigured = !!(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && redirectTo) {
      logger.debug('LoginForm: already authenticated, redirecting', { redirectTo });
      router.push(redirectTo);
    }
  }, [isAuthenticated, redirectTo, router]);

  // Handle OTP resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendOTP = async () => {
    setLocalError(null);
    if (!phoneNumber.trim()) {
      return;
    }

    // ─── Playwright Test-Mode Bypass ───────────────────────────────────────────
    // When __PLAYWRIGHT_TEST__ is set via page.addInitScript(), skip Firebase
    // entirely and transition directly to the OTP screen with a mock result.
    // This flag is NEVER set in production builds.
    if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_TEST__) {
      logger.debug('LoginForm: Playwright test mode — bypassing Firebase');
      setConfirmationResult({ 
        confirm: async (code: string) => {
          // Validate the test code requested by the user
          if (code === '123456') {
            return { user: { mock: true, uid: 'test-user-id' } };
          }
          throw new Error('Invalid verification code');
        }
      } as any);
      setStep('otp');
      setResendCooldown(60);
      return;
    }
    // ───────────────────────────────────────────────────────────────────────────

    // Guard: Firebase not configured
    if (!isFirebaseConfigured) {
      setLocalError('Authentication service is not configured. Please contact support.');
      logger.error('LoginForm: Firebase env vars missing — cannot send OTP');
      return;
    }

    // Basic phone number validation (simple check, Firebase handles real validation)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.trim() : `+91${phoneNumber.trim()}`;

    setIsSendingOTP(true);
    
    // Safety timeout: reset loading state if it takes too long (e.g., hanging recaptcha)
    const safetyTimeout = setTimeout(() => {
      if (isSendingOTP) {
        setIsSendingOTP(false);
        logger.warn('LoginForm: Send OTP request timed out after 15s');
      }
    }, 15000);

    try {
      logger.debug('LoginForm: sending Firebase Phone OTP', { phoneNumber: formattedPhone });
      const result = await signInWithPhone(formattedPhone);
      
      if (result) {
        setConfirmationResult(result);
        setStep('otp');
        setResendCooldown(60); // 60 second cooldown for phone auth
        logger.info('LoginForm: Phone OTP sent successfully');
        posthog.capture('otp_requested');
      } else {
        logger.warn('LoginForm: Phone OTP send failed');
      }
    } catch (err: any) {
      logger.error('LoginForm: Phone OTP send error', err);
      setLocalError(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      clearTimeout(safetyTimeout);
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6 || !confirmationResult) {
      if (!confirmationResult) {
        logger.error('LoginForm: No confirmation result found for verification');
        setLocalError('Session expired. Please request a new OTP.');
      }
      return;
    }

    setIsVerifyingOTP(true);

    try {
      logger.debug('LoginForm: verifying Firebase Code');
      const success = await confirmPhoneCode(confirmationResult, otp.trim());
      
      if (success) {
        logger.info('LoginForm: login successful');
        posthog.capture('user_logged_in', { method: 'phone_otp' });
        onLoginSuccess?.();
      } else {
        logger.warn('LoginForm: login failed');
        posthog.capture('login_failed', { method: 'phone_otp' });
      }
    } catch (err) {
      logger.error('LoginForm: login error', err);
      posthog.captureException(err);
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setConfirmationResult(null);
  };
  if (step === 'phone') {
    return (
      <div className="relative w-full flex items-center justify-center py-4">
        <div className="w-full max-w-md mx-auto relative z-10">
          <div className={`rounded-2xl shadow-2xl p-8 border border-royal-glass-border ${isMounted ? 'bg-royal-glass backdrop-blur-xl' : 'bg-royal-obsidian'}`}>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-royal-gold/60 mb-2 uppercase tracking-widest font-inter">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-royal-gold font-medium">+91</span>
                <input
                  type="tel"
                  id="phone-input"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10 digit number"
                  maxLength={10}
                  aria-label="Mobile Number"
                  className="w-full pl-14 pr-4 py-3 bg-royal-obsidian/50 border border-royal-glass-border rounded-xl text-royal-gold-light placeholder:text-royal-gold-light/30 focus:ring-2 focus:ring-royal-gold focus:border-transparent transition-all duration-300"
                  disabled={isSendingOTP}
                />
              </div>
              <p className="text-xs text-royal-gold-light/50 mt-2 italic">We&apos;ll send an OTP for verification</p>
            </div>

            <button
              onClick={handleSendOTP}
              id="get-otp-btn"
              disabled={phoneNumber.length < 10 || isSendingOTP}
              className={`w-full bg-royal-gold text-royal-obsidian py-3 rounded-xl font-bold hover:bg-royal-gold-light transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(212,175,55,0.3)] relative overflow-hidden focus:ring-2 focus:ring-offset-2 focus:ring-royal-gold focus:outline-none ${isSendingOTP ? 'shimmer-button' : ''}`}
            >
              <div className="flex items-center justify-center">
                {isSendingOTP ? (
                  <span className="font-bold">Sending OTP...</span>
                ) : (
                  <span>Get OTP</span>
                )}
              </div>
            </button>

            {/* Hidden reCAPTCHA container for Firebase */}
            <div id="recaptcha-container"></div>

            {(localError || error) && (
              <div
                id="login-error-message"
                role="alert"
                className="text-royal-crimson text-xs text-center bg-royal-crimson/10 p-3 rounded-xl border border-royal-crimson/20 font-inter"
              >
                {localError || error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    );
  }

  return (
    <div className="relative w-full flex items-center justify-center py-4">
      <div className="w-full max-w-md mx-auto relative z-10">
        <div className={`rounded-2xl shadow-2xl p-8 border border-royal-glass-border ${isMounted ? 'bg-royal-glass backdrop-blur-xl' : 'bg-royal-obsidian'}`}>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-playfair font-bold text-royal-gold mb-2">Verify Mobile</h2>
          </div>

          <div className="space-y-6">
            <div>
              <div className="royal-otp-wrapper">
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  disabled={isVerifyingOTP}
                />
              </div>
              <p className="text-sm text-royal-gold-light/60 mt-4 text-center font-inter">
                OTP sent to <span className="font-bold text-royal-gold">+91 {phoneNumber}</span>
              </p>
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={otp.length !== 6 || isVerifyingOTP}
              className={`w-full bg-royal-gold text-royal-obsidian py-3 rounded-xl font-bold hover:bg-royal-gold-light transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(212,175,55,0.3)] ${isVerifyingOTP ? 'shimmer-button' : ''}`}
            >
              {isVerifyingOTP ? (
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-5 h-5 border-2 border-royal-obsidian border-t-transparent rounded-full animate-spin"></span>
                  <span>Verifying...</span>
                </div>
              ) : (
                'Verify OTP'
              )}
            </button>

            <div className="text-center">
              <button
                onClick={handleSendOTP}
                disabled={resendCooldown > 0 || isSendingOTP}
                className="text-royal-gold hover:text-royal-gold-light font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-inter"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={handleBackToPhone}
                className="text-royal-gold-light/60 hover:text-royal-gold-light font-medium transition-colors font-inter"
              >
                Change Phone Number
              </button>
            </div>

            {error && (
              <div className="text-royal-crimson text-sm text-center bg-royal-crimson/10 p-2 rounded-lg border border-royal-crimson/20">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


