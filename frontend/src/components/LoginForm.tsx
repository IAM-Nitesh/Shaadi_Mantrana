'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import OTPInput from './OTPInput';
import logger from '../utils/logger';
import { ConfirmationResult } from 'firebase/auth';

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
        onLoginSuccess?.();
      } else {
        logger.warn('LoginForm: login failed');
      }
    } catch (err) {
      logger.error('LoginForm: login error', err);
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
      <div className="w-full max-w-md mx-auto">
        <div className={`rounded-2xl shadow-xl p-8 ${isMounted ? 'bg-white/80 backdrop-blur-md' : 'bg-white'}`}>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome</h2>
            <p className="text-gray-600">Enter your mobile number to continue</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">+91</span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10 digit number"
                  className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-300"
                  disabled={isSendingOTP}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 italic">We'll send a code for verification</p>
            </div>

            <button
              onClick={handleSendOTP}
              disabled={phoneNumber.length < 10 || isSendingOTP}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-rose-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
    <div className="w-full max-w-md mx-auto">
      <div className={`rounded-2xl shadow-xl p-8 ${isMounted ? 'bg-white/80 backdrop-blur-md' : 'bg-white'}`}>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Mobile</h2>
          <p className="text-gray-600">Enter the 6-digit code sent to your phone</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
              Verification Code
            </label>
            <OTPInput
              value={otp}
              onChange={setOtp}
              disabled={isVerifyingOTP}
            />
            <p className="text-sm text-gray-500 mt-4 text-center">
              Code sent to <span className="font-medium">+91 {phoneNumber}</span>
            </p>
          </div>

          <button
            onClick={handleVerifyOTP}
            disabled={otp.length !== 6 || isVerifyingOTP}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-rose-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isVerifyingOTP ? 'Verifying...' : 'Verify Code'}
          </button>

          <div className="text-center">
            <button
              onClick={handleSendOTP}
              disabled={resendCooldown > 0 || isSendingOTP}
              className="text-rose-500 hover:text-rose-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={handleBackToPhone}
              className="text-gray-500 hover:text-gray-600 font-medium"
            >
              ← Change Phone Number
            </button>
          </div>

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


