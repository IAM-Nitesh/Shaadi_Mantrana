"use client";

import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  getIdToken,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '../config/firebase';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import logger from '../utils/logger';
import posthog from 'posthog-js';
import { Capacitor } from '@capacitor/core';
import { NativeAuthService } from '../services/NativeAuthService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export interface User {
  userId: string;
  userUuid?: string;
  email: string;
  role: string;
  verified: boolean;
  profileCompleteness?: number;
  isFirstLogin?: boolean;
  isApprovedByAdmin?: boolean;
  hasSeenOnboardingMessage?: boolean;
  phoneNumber?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  redirectTo: string | null;
  authState: 'unknown' | 'authenticated' | 'unauthenticated' | 'checking' | 'error';
  isExpired: boolean;
  login: (email: string, otp: string) => Promise<boolean>;
  sendOtp: (email: string) => Promise<boolean>;
  signInWithPhone: (phoneNumber: string) => Promise<ConfirmationResult | { verificationId: string } | null>;
  confirmPhoneCode: (confirmation: ConfirmationResult | { verificationId: string }, code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ 
  children, 
  initialUser = null 
}: { 
  children: React.ReactNode; 
  initialUser?: User | null; 
}) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthContextType['authState']>('unknown');
  const [isExpired, setIsExpired] = useState(false);

  // Guaranteed unblock timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setAuthState('checking');
      // logger.debug('🔍 AuthContext: Checking authentication status...');
      
      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      // logger.debug('🔍 AuthContext: Starting auth status check...', { API_BASE_URL });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/api/auth/status`, {
        credentials: 'include',
        cache: 'no-store',
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // logger.debug('🔍 AuthContext: Auth status response:', {
      //   status: response.status,
      //   ok: response.ok
      // });
      
      if (!response.ok) {
        // logger.warn('❌ AuthContext: Auth status check failed:', response.status);
        setUser(null);
        setRedirectTo('/login');
        setIsExpired(response.status === 401);
        setAuthState('unauthenticated');
        return;
      }
      
      const data = await response.json();
      // logger.debug('🔍 AuthContext: Auth status data:', data);
      
      if (data.authenticated && data.user) {
        const userData = {
          userId: data.user.userId || data.user._id || '',
          userUuid: data.user.userUuid || data.user.uuid || data.user.userId || data.user._id || '',
          email: data.user.email || '',
          role: data.user.role || 'user',
          verified: true,
          profileCompleteness: data.user.profileCompleteness || 0,
          isFirstLogin: data.user.isFirstLogin || false,
          isApprovedByAdmin: data.user.isApprovedByAdmin || false,
          hasSeenOnboardingMessage: data.user.hasSeenOnboardingMessage || false,
        };
        
        // logger.info('✅ AuthContext: User authenticated:', userData);
        setUser(userData);
        // posthog.identify(userData.userId, { role: userData.role });
        
        if (userData.role === 'admin') {
          setRedirectTo('/admin/dashboard');
        } else if (userData.profileCompleteness < 100 || userData.isFirstLogin) {
          setRedirectTo('/profile');
        } else {
          setRedirectTo('/dashboard');
        }
        setIsExpired(false);
        setAuthState('authenticated');
      } else {
        // logger.debug('❌ AuthContext: User not authenticated');
        setUser(null);
        setRedirectTo('/login');
        setIsExpired(false);
        setAuthState('unauthenticated');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // logger.error('❌ AuthContext: Auth check timed out after 5s');
      } else {
        // logger.error('❌ AuthContext: Auth check error:', err);
      }
      setUser(null);
      setRedirectTo('/login');
      setAuthState('error');
    } finally {
      setIsLoading(false);
      // logger.debug('🔍 AuthContext: isLoading set to false');
    }
  }, []);

  const forceRefresh = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!initialUser) {
      checkAuth();
    } else {
      setIsLoading(false);
      if (initialUser.role === 'admin') {
        setRedirectTo('/admin/dashboard');
      } else if ((initialUser.profileCompleteness || 0) < 100) {
        setRedirectTo('/profile');
      } else {
        setRedirectTo('/dashboard');
      }
    }
  }, [initialUser, checkAuth]);

  const sendOtp = async (email: string) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, otp: string) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      await checkAuth();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithPhone = async (phoneNumber: string): Promise<ConfirmationResult | { verificationId: string } | null> => {
    try {
      setError(null);
      
      // --- Native Path ---
      if (Capacitor.isNativePlatform()) {
        logger.info('AuthContext: Using Native Firebase Phone Auth');
        const nativeResult = await NativeAuthService.signInWithPhone(phoneNumber);
        return nativeResult;
      }
      
      // --- Web Path ---
      // Safety check for recaptcha container
      if (!document.getElementById('recaptcha-container')) {
        logger.error('AuthContext: recaptcha-container not found in DOM');
        setError('Verification system initialization failed. Please refresh.');
        return null;
      }
      
      // Clear any existing recaptcha widgets to prevent 'already rendered' errors
      const container = document.getElementById('recaptcha-container');
      if (container) container.innerHTML = '';
      
      const appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
      
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      return confirmationResult;
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check your number.');
      logger.error('Phone Sign-In Error:', err);
      
      // Reset container on failure to allow retry
      if (!Capacitor.isNativePlatform()) {
        const container = document.getElementById('recaptcha-container');
        if (container) container.innerHTML = '';
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPhoneCode = async (confirmation: ConfirmationResult | { verificationId: string }, code: string) => {
    try {
      setError(null);
      
      let finalIdToken: string | null = null;

      // --- Native Path ---
      if (Capacitor.isNativePlatform() && 'verificationId' in confirmation) {
        logger.info('AuthContext: Confirming Code via Native SDK');
        await NativeAuthService.confirmCode(confirmation.verificationId, code);
        
        // Get the token directly from the native SDK
        finalIdToken = await NativeAuthService.getIdToken();
        if (!finalIdToken) throw new Error('Native login succeeded but failed to get ID token');
      } 
      // --- Web Path ---
      else if ('confirm' in confirmation) {
        const result = await confirmation.confirm(code);
        // Use mock token in playwright test mode if user is marked as mock
        if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_TEST__ && (result as any).user?.mock) {
          finalIdToken = 'mock-token';
        } else {
          finalIdToken = await getIdToken(result.user);
        }
      } else {
        throw new Error('Invalid confirmation object');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/auth/firebase-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: finalIdToken }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Backend authentication failed');
      }
      
      await checkAuth();
      return true;
    } catch (err: any) {
      setError(err.message);
      logger.error('Phone Confirmation Error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      setUser(null);
      setRedirectTo('/login');
      setAuthState('unauthenticated');
      posthog.reset();
    } catch (err) {
      logger.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    redirectTo,
    authState,
    isExpired,
    login,
    sendOtp,
    signInWithPhone,
    confirmPhoneCode,
    logout,
    checkAuth,
    forceRefresh
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
