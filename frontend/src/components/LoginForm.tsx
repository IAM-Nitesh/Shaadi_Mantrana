'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import OTPInput from './OTPInput';
import logger from '../utils/logger';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const router = useRouter();
  const { login, sendOtp, isAuthenticated, isLoading, error, redirectTo } = useAuth();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
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
    if (!email.trim()) {
      return;
    }

    setIsSendingOTP(true);

    try {
      logger.debug('LoginForm: sending OTP');
      const success = await sendOtp(email.trim());
      
      if (success) {
        setOtpSent(true);
        setStep('otp');
        setResendCooldown(30); // 30 second cooldown
        logger.info('LoginForm: OTP sent successfully');
      } else {
        logger.warn('LoginForm: OTP send failed');
      }
    } catch (error) {
      logger.error('LoginForm: OTP send error', error);
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      return;
    }

    setIsVerifyingOTP(true);

    try {
      logger.debug('LoginForm: verifying OTP');
      const success = await login(email.trim(), otp.trim());
      
      if (success) {
        logger.info('LoginForm: login successful');
        onLoginSuccess?.();
        // AuthContext will handle redirect via redirectTo
      } else {
        logger.warn('LoginForm: login failed');
      }
    } catch (error) {
      logger.error('LoginForm: login error', error);
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    
    setIsSendingOTP(true);

    try {
      logger.debug('LoginForm: resending OTP');
      const success = await sendOtp(email.trim());
      
      if (success) {
        setResendCooldown(30); // 30 second cooldown
        logger.info('LoginForm: OTP resent successfully');
      } else {
        logger.warn('LoginForm: OTP resend failed');
      }
    } catch (error) {
      logger.error('LoginForm: OTP resend error', error);
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setOtpSent(false);
  };

  if (step === 'email') {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className={`rounded-2xl shadow-xl p-8 ${isMounted ? 'bg-white/80 backdrop-blur-md' : 'bg-white'}`}>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome</h2>
            <p className="text-gray-600">Sign in to your account to continue</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-300"
                disabled={isSendingOTP}
              />
            </div>

            <button
              onClick={handleSendOTP}
              disabled={!email.trim() || isSendingOTP}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-rose-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingOTP ? 'Sending...' : 'Send Verification Code'}
            </button>

            {error && (
              <div className="text-red-500 text-sm text-center">
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
          <p className="text-gray-600">Enter the 6-digit code sent to your email</p>
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
              Code sent to <span className="font-medium">{email}</span>
            </p>
          </div>

          <button
            onClick={handleVerifyOTP}
            disabled={!otp.trim() || otp.length !== 6 || isVerifyingOTP}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-rose-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifyingOTP ? 'Verifying...' : 'Verify Code'}
          </button>

          <div className="text-center">
            <button
              onClick={handleResendOTP}
              disabled={resendCooldown > 0 || isSendingOTP}
              className="text-rose-500 hover:text-rose-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={handleBackToEmail}
              className="text-gray-500 hover:text-gray-600 font-medium"
            >
              ← Back to Email
            </button>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


