"use client";

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Lazy initialization — only runs on client, never during SSR/static export
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    // Debug log to check if env vars are reaching the mobile build
    console.log('Firebase: Initializing with API Key starting with:', firebaseConfig.apiKey?.substring(0, 10));
    console.log('Firebase: App ID:', firebaseConfig.appId);
    
    if (!firebaseConfig.apiKey) {
      console.error('Firebase: API Key is MISSING! Check your .env.production file.');
    }
    
    _app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) {
    const app = getFirebaseApp();
    _auth = getAuth(app);
    _auth.useDeviceLanguage();
    
    // Enable phone auth testing in non-production environments
    if (process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true' || process.env.NODE_ENV === 'development') {
      _auth.settings.appVerificationDisabledForTesting = true;
      console.log('Firebase: Phone Auth verification disabled for testing');
    }
  }
  return _auth;
}

// Keep backward-compatible named exports as getters
export const app = new Proxy({} as FirebaseApp, {
  get: (_, prop) => {
    const instance = getFirebaseApp();
    const value = instance[prop as keyof FirebaseApp];
    if (typeof value === 'function') {
      return (value as any).bind(instance);
    }
    return value;
  },
});
export const auth = new Proxy({} as Auth, {
  get: (_, prop) => {
    const instance = getFirebaseAuth();
    const value = instance[prop as keyof Auth];
    if (typeof value === 'function') {
      return (value as any).bind(instance);
    }
    return value;
  },
});
