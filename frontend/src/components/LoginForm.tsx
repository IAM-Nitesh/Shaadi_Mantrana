'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import OTPInput from './OTPInput';
import logger from '../utils/logger';
import { ConfirmationResult } from 'firebase/auth';
import posthog from 'posthog-js';
import MandalaBackground from './ui/MandalaBackground';

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
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

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
    if (!phoneNumber.trim()) {
      return;
    }

    // Basic phone number validation (simple check, Firebase handles real validation)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.trim() : `+91${phoneNumber.trim()}`;

    setIsSendingOTP(true);

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
    } catch (err) {
      logger.error('LoginForm: Phone OTP send error', err);
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6 || !confirmationResult) {
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

    return (
      <div className="relative min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <MandalaBackground opacity={0.1} rotationSpeed={120} />
        
        <div className="w-full max-w-md mx-auto relative z-10">
          <div className={`rounded-2xl shadow-2xl p-8 border border-royal-glass-border ${isMounted ? 'bg-royal-glass backdrop-blur-xl' : 'bg-royal-obsidian'}`}>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-playfair font-bold text-royal-gold mb-2">Shaadi Mantrana</h2>
              <p className="text-royal-gold-light/80 font-inter">The Sacred Counsel</p>
            </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-royal-gold font-medium">+91</span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10 digit number"
                  className="w-full pl-14 pr-4 py-3 bg-royal-obsidian/50 border border-royal-glass-border rounded-xl text-royal-gold-light placeholder:text-royal-gold-light/30 focus:ring-2 focus:ring-royal-gold focus:border-transparent transition-all duration-300"
                  disabled={isSendingOTP}
                />
              </div>
              <p className="text-xs text-royal-gold-light/50 mt-2 italic">We'll send a code for verification</p>
            </div>

            <button
              onClick={handleSendOTP}
              disabled={phoneNumber.length < 10 || isSendingOTP}
              className="w-full bg-royal-gold text-royal-obsidian py-3 rounded-xl font-bold hover:bg-royal-gold-light transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(212,175,55,0.3)]"
            >
              {isSendingOTP ? 'Sending OTP...' : 'Get Verification Code'}
            </button>

            {/* Hidden reCAPTCHA container for Firebase */}
            <div id="recaptcha-container"></div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-100">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <MandalaBackground opacity={0.1} rotationSpeed={120} />
      
      <div className="w-full max-w-md mx-auto relative z-10">
        <div className={`rounded-2xl shadow-2xl p-8 border border-royal-glass-border ${isMounted ? 'bg-royal-glass backdrop-blur-xl' : 'bg-royal-obsidian'}`}>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-playfair font-bold text-royal-gold mb-2">Verify Mobile</h2>
            <p className="text-royal-gold-light/80 font-inter">Enter the 6-digit code sent to your phone</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-royal-gold-light/70 mb-4 text-center font-inter">
                Verification Code
              </label>
              <div className="royal-otp-wrapper">
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  disabled={isVerifyingOTP}
                />
              </div>
              <p className="text-sm text-royal-gold-light/60 mt-4 text-center font-inter">
                Code sent to <span className="font-bold text-royal-gold">+91 {phoneNumber}</span>
              </p>
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={otp.length !== 6 || isVerifyingOTP}
              className="w-full bg-royal-gold text-royal-obsidian py-3 rounded-xl font-bold hover:bg-royal-gold-light transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(212,175,55,0.3)]"
            >
              {isVerifyingOTP ? 'Verifying...' : 'Verify Code'}
            </button>

            <div className="text-center">
              <button
                onClick={handleSendOTP}
                disabled={resendCooldown > 0 || isSendingOTP}
                className="text-royal-gold hover:text-royal-gold-light font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-inter"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={handleBackToPhone}
                className="text-royal-gold-light/60 hover:text-royal-gold-light font-medium transition-colors font-inter"
              >
                ← Change Phone Number
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


