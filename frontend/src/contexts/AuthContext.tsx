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
import authStorage from '../services/auth-storage-service';
import { clearAuthStatusCache } from '../services/auth-utils';

// IMPORTANT: On Capacitor (Android/iOS), window.location.hostname is 'localhost'
// because the webview is served from capacitor://localhost or http://localhost.
// We must NOT use hostname-based detection — it gives false positives on native.
// Instead, rely entirely on the build-time env var NEXT_PUBLIC_API_BASE_URL.
// For local web dev only (not native), we fall back to localhost:4000.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 
  (!Capacitor.isNativePlatform() && typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:4000' 
    : '');

export interface User {
  userId: string;
  userUuid?: string;
  email: string;
  name?: string;
  role: string;
  verified: boolean;
  profileCompleteness?: number;
  isFirstLogin?: boolean;
  isApprovedByAdmin?: boolean;
  hasSeenOnboardingMessage?: boolean;
  hasCompletedWizard?: boolean;
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
  updateUser: (updates: Partial<User>) => void;
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
  const [isLoading, setIsLoading] = useState(true); // Default to true to prevent premature redirects
  const [error, setError] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthContextType['authState']>('unknown');
  const [isExpired, setIsExpired] = useState(false);



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
        if (response.status === 429) {
          console.warn('⚠️ AuthContext: Auth status check rate limited (429). Keeping current session.');
          // Do not log out the user on rate limit, just return
          setAuthState(user ? 'authenticated' : 'unauthenticated');
          return;
        }
        console.warn('❌ AuthContext: Auth status check failed:', response.status);
        setUser(null);
        setRedirectTo('/login');
        setIsExpired(response.status === 401);
        setAuthState('unauthenticated');
        return;
      }
      
      const data = await response.json();
      console.log('🔍 AuthContext: Auth status data:', data);
      
      if (data.authenticated && data.user) {
        const userData = {
          userId: data.user.userId || data.user._id || '',
          userUuid: data.user.userUuid || data.user.uuid || data.user.userId || data.user._id || '',
          email: data.user.email || '',
          name: data.user.name || data.user.profile?.name || '',
          role: data.user.role || 'user',
          verified: true,
          profileCompleteness: data.user.profileCompleteness || 0,
          isFirstLogin: data.user.isFirstLogin || false,
          isApprovedByAdmin: data.user.isApprovedByAdmin || false,
          hasSeenOnboardingMessage: data.user.hasSeenOnboardingMessage || false,
          hasCompletedWizard: data.user.hasCompletedWizard || false,
        };
        
        console.log('✅ AuthContext: User authenticated:', userData);
        setUser(userData);
        // posthog.identify(userData.userId, { role: userData.role });
        
        if (userData.role === 'admin') {
          setRedirectTo('/admin/dashboard');
        } else if (userData.isFirstLogin && !userData.hasCompletedWizard) {
          setRedirectTo('/profile');
        } else {
          setRedirectTo('/dashboard');
        }
        setIsExpired(false);
        setAuthState('authenticated');
      } else {
        console.log('❌ AuthContext: User not authenticated');
        setUser(null);
        setRedirectTo('/login');
        setIsExpired(false);
        setAuthState('unauthenticated');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.error('❌ AuthContext: Auth check timed out after 5s');
      } else {
        console.error('❌ AuthContext: Auth check error:', err);
      }
      setUser(null);
      setRedirectTo('/login');
      setAuthState('error');
      setIsLoading(false); // Immediate unlock on error
    } finally {
      setIsLoading(false);
      // logger.debug('🔍 AuthContext: isLoading set to false');
    }
  }, []);

  const forceRefresh = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  useEffect(() => {
    if (!initialUser) {
      checkAuth();
    } else {
      setIsLoading(false);
      if (initialUser.role === 'admin') {
        setRedirectTo('/admin/dashboard');
      } else if (initialUser.isFirstLogin && !initialUser.hasCompletedWizard) {
        setRedirectTo('/profile');
      } else {
        setRedirectTo('/dashboard');
      }
    }
  }, [initialUser, checkAuth]);

  const sendOtp = async (email: string) => {
    logger.warn('AuthContext: Attempted legacy email sendOtp (deprecated)', { email });
    setError('Legacy email OTP authentication is deprecated. Please use Firebase Phone OTP.');
    return false;
  };

  const login = async (email: string, otp: string) => {
    +  logger.warn('AuthContext: Attempted legacy email sendOtp (deprecated)');
    setError('Legacy email OTP authentication is deprecated. Please use Firebase Phone OTP.');
    return false;
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
      
      // Clear any existing recaptcha widgets properly to prevent MALFORMED errors
      if (typeof window !== 'undefined') {
        const win = window as any;
        if (win.recaptchaVerifier) {
          try {
            win.recaptchaVerifier.clear();
          } catch (e) {
            logger.warn('AuthContext: Error clearing previous recaptcha verifier', e);
          }
          win.recaptchaVerifier = null;
        }
        
        // Also clean up the DOM container just in case
        const container = document.getElementById('recaptcha-container');
        if (container) container.innerHTML = '';
        
        win.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
        
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, win.recaptchaVerifier);
        return confirmationResult;
      }
      return null;
    } catch (err: any) {
      // --- Playwright/E2E Test Bypass ---
      if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_TEST__) {
        logger.info('AuthContext: Bypassing real Phone Auth for E2E test');
        return {
          confirm: async (code: string) => ({ user: { uid: 'playwright-test-user', mock: true } })
        } as any;
      }
      
      setError(err.message || 'Verification failed. Please check your number.');

      logger.error('Phone Sign-In Error:', err);
      
      // Reset container on failure to allow retry
      if (!Capacitor.isNativePlatform() && typeof window !== 'undefined') {
        const win = window as any;
        if (win.recaptchaVerifier) {
          try {
            win.recaptchaVerifier.clear();
          } catch (e) {}
          win.recaptchaVerifier = null;
        }
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
        // Use mock token in playwright test mode
        if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_TEST__) {
          logger.info('AuthContext: Using mock-token for Playwright test');
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

      // Persist JWT for Capacitor/cross-origin API calls where HttpOnly cookies are unreliable
      const accessToken = data.accessToken || data.session?.accessToken;
      if (accessToken && typeof accessToken === 'string') {
        try {
          localStorage.setItem('accessToken', accessToken);
          authStorage.set('tokenInfo', {
            token: accessToken,
            expiresAt: data.session?.expiresIn
              ? Date.now() + data.session.expiresIn * 1000
              : Date.now() + 60 * 60 * 1000,
            lastRefreshed: Date.now(),
          });
        } catch (storageErr) {
          logger.warn('AuthContext: Could not persist access token locally', storageErr);
        }
      }

      clearAuthStatusCache();
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
      
      try {
        localStorage.removeItem('accessToken');
        authStorage.remove('tokenInfo');
        clearAuthStatusCache();
      } catch {
        // ignore storage errors
      }
      
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
    forceRefresh,
    updateUser
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
