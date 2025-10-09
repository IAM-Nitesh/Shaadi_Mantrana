'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

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

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && redirectTo) {
      console.log('🔍 LoginForm: User already authenticated, redirecting to', redirectTo);
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
      console.log('🔍 LoginForm: Sending OTP to:', email);
      const success = await sendOtp(email.trim());
      
      if (success) {
        setOtpSent(true);
        setStep('otp');
        setResendCooldown(30); // 30 second cooldown
        console.log('✅ LoginForm: OTP sent successfully');
      } else {
        console.error('❌ LoginForm: OTP send failed');
      }
    } catch (error) {
      console.error('❌ LoginForm: OTP send error:', error);
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
      console.log('🔍 LoginForm: Verifying OTP for:', email);
      const success = await login(email.trim(), otp.trim());
      
      if (success) {
        console.log('✅ LoginForm: Login successful');
        onLoginSuccess?.();
        // AuthContext will handle redirect via redirectTo
      } else {
        console.error('❌ LoginForm: Login failed');
      }
    } catch (error) {
      console.error('❌ LoginForm: Login error:', error);
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    
    setIsSendingOTP(true);

    try {
      console.log('🔍 LoginForm: Resending OTP to:', email);
      const success = await sendOtp(email.trim());
      
      if (success) {
        setResendCooldown(30); // 30 second cooldown
        console.log('✅ LoginForm: OTP resent successfully');
      } else {
        console.error('❌ LoginForm: OTP resend failed');
      }
    } catch (error) {
      console.error('❌ LoginForm: OTP resend error:', error);
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
        <div className="bg-white rounded-2xl shadow-xl p-8">
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
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
          <p className="text-gray-600">Enter the 6-digit code sent to your email</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-300 text-center text-lg tracking-widest"
              disabled={isVerifyingOTP}
              maxLength={6}
            />
            <p className="text-sm text-gray-500 mt-2">
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


